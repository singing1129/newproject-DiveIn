"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import DOMPurify from "dompurify";
import { useAuth } from "../../hooks/useAuth";
import Link from "next/link";
import Sidebar from "./sidebar";
import "./article.css";

const ArticleContent = ({ article }) => {
  const [sanitizedContent, setSanitizedContent] = useState("");

  useEffect(() => {
    if (article.content) {
      const cleanedContent = DOMPurify.sanitize(article.content);
      setSanitizedContent(cleanedContent);
    }
  }, [article.content]);

  return (
    <div className="article-content-area">
      <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </div>
  );
};

export default function ArticleDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [replyInputs, setReplyInputs] = useState({});
  const [showReplyInput, setShowReplyInput] = useState({});
  const [likedReplies, setLikedReplies] = useState({});
  const [sidebarData, setSidebarData] = useState({ sidebar: {} });
  const [currentBigCategory, setCurrentBigCategory] = useState("課程與體驗");

  const backendURL = "http://localhost:3005";
  const defaultImage = `${backendURL}/uploads/article/no_is_main.png`;
  const [imageUrl, setImageUrl] = useState(defaultImage);

  // 獲取文章詳情和相關文章
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/article/${id}`);
        const data = res.data.data;

        const formattedRelatedArticles = data.relatedArticles.map((article) => ({
          ...article,
          tags: article.tags ? article.tags.split(",").map((tag) => tag.trim()) : [],
        }));

        setArticle(data);
        setRelatedArticles(formattedRelatedArticles);
        setImageUrl(
          data.img_url?.startsWith("http")
            ? data.img_url
            : `${backendURL}${data.img_url || defaultImage}`
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  // 獲取 Sidebar 數據
  useEffect(() => {
    const fetchSidebarData = async () => {
      const res = await fetch(`${backendURL}/api/article/sidebar`);
      const data = await res.json();
      setSidebarData(data);
    };
    fetchSidebarData();
  }, []);

  // 獲取留言並初始化用戶點讚/倒讚狀態
  const fetchReplies = async () => {
    try {
      const res = await axios.get(`${backendURL}/api/article/${id}/replies`);
      setReplies(res.data);

      if (user && user.id) {
        const likedStatus = {};
        const fetchUserLikes = res.data.map(async (reply) => {
          const response = await axios.get(
            `${backendURL}/api/article/reply/${reply.id}/user-like`,
            { params: { user_id: user.id } }
          );
          if (response.data.success) {
            likedStatus[reply.id] = response.data.hasLiked
              ? true
              : response.data.hasDisliked
              ? false
              : undefined;
          }
          if (reply.replies && reply.replies.length > 0) {
            for (const subReply of reply.replies) {
              const subResponse = await axios.get(
                `${backendURL}/api/article/reply/${subReply.id}/user-like`,
                { params: { user_id: user.id } }
              );
              if (subResponse.data.success) {
                likedStatus[subReply.id] = subResponse.data.hasLiked
                  ? true
                  : subResponse.data.hasDisliked
                  ? false
                  : undefined;
              }
            }
          }
        });
        await Promise.all(fetchUserLikes);
        setLikedReplies(likedStatus);
      }
    } catch (err) {
      console.error("Failed to fetch replies or user likes", err);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [id, user]);

  // 處理按讚/倒讚
  const handleLike = async (replyId, isLike) => {
    if (!user || !user.id) {
      const choice = window.confirm(
        "您尚未登入！\n[確定] 前往登入\n[取消] 返回當前頁面"
      );
      if (choice) {
        router.push("/admin/login");
      }
      return;
    }

    try {
      await axios.post(`${backendURL}/api/article/reply/${replyId}/like`, {
        user_id: user.id,
        is_like: isLike,
      });
      await fetchReplies();
    } catch (err) {
      console.error("Failed to like/dislike reply", err);
      alert("操作失敗，請稍後再試！");
    }
  };

  // 處理文章留言提交
  const handleArticleReplySubmit = async () => {
    if (!newReply.trim()) return;

    try {
      await axios.post(`${backendURL}/api/article/${id}/replies`, {
        article_id: id,
        user_id: user?.id || 1,
        content: newReply,
        parent_id: null,
      });
      setNewReply("");
      await fetchReplies();
    } catch (err) {
      console.error("Failed to post article reply", err);
    }
  };

  // 處理回覆輸入框顯示
  const handleShowReplyInput = (replyId) => {
    setShowReplyInput((prev) => ({
      ...prev,
      [replyId]: !prev[replyId],
    }));
  };

  // 處理回覆提交
  const handleReplySubmit = async (parentId) => {
    const content = replyInputs[parentId];
    if (!content || !content.trim()) return;

    try {
      await axios.post(`${backendURL}/api/article/${id}/replies`, {
        article_id: id,
        user_id: user?.id || 1,
        content,
        parent_id: parentId,
      });
      setReplyInputs((prev) => ({ ...prev, [parentId]: "" }));
      await fetchReplies();
    } catch (err) {
      console.error("Failed to post reply", err);
    }
  };

  // 大分類切換
  const handleBigCategoryChange = (bigCategory) => {
    setCurrentBigCategory(bigCategory);
    router.push(`/article?category=${bigCategory}`);
  };

  // 小分類點擊
  const handleCategoryClick = (categorySmallName) => {
    router.push(`/article?category=${categorySmallName}`);
  };

  // 根據當前大分類過濾小分類
  const smallCategories = sidebarData.sidebar.categorySmall?.filter(
    (small) =>
      small.category_big_id ===
      sidebarData.sidebar.categoryBig?.find(
        (big) => big.name === currentBigCategory
      )?.id
  ) || [];

  // 渲染留言
  const renderReplies = (replies, level = 1) => {
    return replies.map((reply) => (
      <div key={reply.id} className={`reply-container reply-level-${level}`}>
        <div className="reply-details">
          <div className="reply-area">
            <img
              src="../img/article/reply2.jpg"
              className="reply-avatar"
              alt="avatar"
            />
            <div className="reply-text">
              <div className="reply-header">
                <span className="reply-author">{reply.name || "匿名"}</span>
                <span className="reply-publish-time">
                  {new Date(reply.created_at).toLocaleString()}
                </span>
              </div>
              <div className="reply-content">{reply.content}</div>
            </div>
          </div>
          <div className="others-reply-area">
            <span
              className={`good ${likedReplies[reply.id] === true ? "liked" : ""}`}
              onClick={() => handleLike(reply.id, true)}
            >
              <i className="fa-regular fa-thumbs-up"></i> {reply.likes || 0}
            </span>
            <span
              className={`bad ${likedReplies[reply.id] === false ? "disliked" : ""}`}
              onClick={() => handleLike(reply.id, false)}
            >
              <i className="fa-regular fa-thumbs-down"></i> {reply.dislikes || 0}
            </span>
            {level === 1 && (
              <span
                className="others-reply"
                onClick={() => handleShowReplyInput(reply.id)}
              >
                回覆
              </span>
            )}
          </div>
          {showReplyInput[reply.id] && (
            <div className="more-reply reply-input-area">
              <img src="../img/article/reply3.jpg" className="reply-avatar" alt="" />
              <input
                type="text"
                className="form-control"
                placeholder="輸入回覆..."
                value={replyInputs[reply.id] || ""}
                onChange={(e) =>
                  setReplyInputs((prev) => ({
                    ...prev,
                    [reply.id]: e.target.value,
                  }))
                }
              />
              <button onClick={() => handleReplySubmit(reply.id)}>回覆</button>
            </div>
          )}
        </div>
        {reply.replies?.length > 0 && (
          <div className="reply-children">{renderReplies(reply.replies, 2)}</div>
        )}
      </div>
    ));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!article) return <div>No article found</div>;

  return (
    <div className="row">
      <div className="col-lg-3 col-md-4 sidebar-desktop">
        <Sidebar />
      </div>
      <div className="col-12 sidebar-mobile">
        <div className="mobile-category-bar">
          <div className="big-category-bar">
            <select
              value={currentBigCategory}
              onChange={(e) => handleBigCategoryChange(e.target.value)}
            >
              {sidebarData?.sidebar?.categoryBig?.map((big) => (
                <option key={big.id} value={big.name}>
                  {big.name}
                </option>
              ))}
            </select>
          </div>
          <div className="small-category-bar">
            {smallCategories.slice(0, 3).map((small) => (
              <button
                key={small.id}
                className={`small-category-btn`}
                onClick={() => handleCategoryClick(small.category_small_name)}
              >
                {small.category_small_name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="col-lg-9 col-md-8 article">
        <div className="articleDetail">
          <div className="title">
            <div className="text-area">{article.title}</div>
            <div className="author-area">
              <i className="fa-solid fa-user"></i>
              {article.author_name}
            </div>
            <div className="publish-time-area">
              <i className="fa-solid fa-calendar-days"></i>
              {article.publish_at}
            </div>
          </div>
          <div className="article-content-area">
            <ArticleContent article={article} />
          </div>
          <div className="tag-area">
            {Array.isArray(article.tags) ? (
              article.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag.trim()}
                </span>
              ))
            ) : (
              <span>No tags available</span>
            )}
          </div>
          <div className="replies-section">
            <h3>留言</h3>
            {replies.length > 0 ? renderReplies(replies) : <p>尚無留言</p>}
            <div className="more-reply">
              <img
                src="../img/article/reply3.jpg"
                className="reply-avatar"
                alt=""
              />
              <input
                type="text"
                className="form-control"
                placeholder="對文章留言..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
              />
              <button onClick={handleArticleReplySubmit}>留言</button>
            </div>
          </div>
          <div className="related-article-area-title">相關文章</div>
          <div className="related-article-area row row-cols-1 row-cols-md-2">
            {relatedArticles.map((relatedArticle, index) => {
              const relatedImageUrl = relatedArticle.img_url?.startsWith("http")
                ? relatedArticle.img_url
                : `${backendURL}${relatedArticle.img_url || defaultImage}`;
              const sanitizedContent = DOMPurify.sanitize(relatedArticle.content);

              return (
                <Link href={`/article/${relatedArticle.id}`} key={index} passHref>
                  <div className="related-card">
                    <div className="img-container">
                      <Image
                        className="article-list-card-photo-img"
                        src={relatedImageUrl}
                        alt="Article Thumbnail"
                        width={300}
                        height={200}
                        style={{ objectFit: "cover", objectPosition: "center" }}
                        onError={(e) => {
                          e.currentTarget.src = defaultImage;
                        }}
                      />
                    </div>
                    <div className="card-body">
                      <div className="card-title">{relatedArticle.title}</div>
                      <div
                        className="card-content"
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                      />
                      <div className="related-tag-area">
                        {Array.isArray(relatedArticle.tags) ? (
                          relatedArticle.tags.map((tag, index) => (
                            <span key={index} className="tag">
                              #{tag.trim()}
                            </span>
                          ))
                        ) : (
                          <span>No tags available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}