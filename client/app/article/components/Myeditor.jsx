class MyUploadAdapter {
  constructor(loader, articleId) {
    this.loader = loader;
    this.articleId = articleId; // 傳遞文章 ID
  }

  upload() {
    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append("articleImage", file);
          formData.append("article_id", this.articleId); // 傳遞文章 ID

          fetch("http://localhost:3005/api/upload-ckeditor-image", {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((result) => {
              if (result.success) {
                resolve({ default: result.url }); // CKEditor 需要的返回格式
              } else {
                reject(result.message);
              }
            })
            .catch(reject);
        })
    );
  }
}

function MyCustomUploadAdapterPlugin(editor, articleId) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new MyUploadAdapter(loader, articleId);
  };
}

const Myeditor = ({ onChange, name, value, articleId }) => {
  const editorRef = useRef();
  const { CKEditor, ClassicEditor } = editorRef.current || {};

  React.useEffect(() => {
    editorRef.current = {
      CKEditor: require("@ckeditor/ckeditor5-react").CKEditor,
      ClassicEditor: require("@ckeditor/ckeditor5-build-classic"),
    };
  }, []);

  return (
    <>
      {CKEditor && ClassicEditor ? (
        <CKEditor
          name={name}
          editor={ClassicEditor}
          data={value}
          onChange={(event, editor) => onChange(editor.getData())}
          config={{
            extraPlugins: [
              (editor) => MyCustomUploadAdapterPlugin(editor, articleId),
            ],
          }}
        />
      ) : (
        <div>Editor loading...</div>
      )}
    </>
  );
};

export default Myeditor;
