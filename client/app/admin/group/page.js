"use client";
import styles from "./group.module.css";
import GroupCard from "@/group/_components/GroupCard";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { ReactSVG } from "react-svg";


export default function MemberGroupPage() {
  // 揪團資料
  const [mygroups, setMyGroups] = useState([]);
  const [originMyGroups, setOriginMyGroups] = useState([]);
  const [status, setStatus] = useState(0); // status 0:揪團中 1:已成團 2:已取消
  const [condition, setCondition] = useState({});
  const [modalGroup, setModalGroup] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [description, setDescription] = useState([]);


  // 獲取會員
  const { user } = useAuth();
  console.log(user);
  useEffect(() => {
    console.log("user更新了" + user.id);
  }, [user]);

  // 設定地點選項
  const selectOption = {
    0: [],
    1: ["屏東", "台東", "澎湖", "綠島", "蘭嶼", "小琉球", "其他"],
    2: ["沖繩", "石垣島", "其他"],
    3: ["長灘島", "宿霧", "薄荷島", "其他"],
    4: ["其他"],
  };

  const [countrySelect, setCountrySelect] = useState(0);
  const [city, setCity] = useState("");
  const [citySelect, setCitySelect] = useState(selectOption[countrySelect]);

  // 設定預覽圖片
  const [uploadImg, setUploadImg] = useState(null)
  const doImagePreview = (e) => {
    const selectedFile = e.target.files[0];
    console.log(selectedFile)
    if (selectedFile) {
      setUploadImg(URL.createObjectURL(selectedFile)); // 產生預覽圖片
    }
  };

  useEffect(() => {
    setCitySelect(selectOption[countrySelect]);
  }, [countrySelect]);

  const doCountrySelect = (e) => {
    const newCountry = Number(e.target.value);
    setCountrySelect(newCountry);
    setCity("");
  };

  const doCitySelect = (e) => {
    setCity(e.target.value);
  };

  function doSetModal(data) {
    setModalGroup(data);
    setCountrySelect(Number(data.country_id));
    setCity(data.city_name || "");
    setCitySelect(selectOption[Number(data.country_id)]);
  }

  const api = "http://localhost:3005/api";

  useEffect(() => {
    if (user && user.id) {
      const userId = user.id;
      setCondition({ ...condition, user: userId });
    }
  }, [user]);

  useEffect(() => {
    if (modalGroup) {
      setEndDate(modalGroup.sign_end_date.split(" ")[0]);
      setEndTime(modalGroup.sign_end_date.split(" ")[1]);
      setDescription(modalGroup.description.split("\n"));
    }
  }, [modalGroup]);

  useEffect(() => {
    if (!condition.user) return;
    const getList = async () => {
      await axios
        .post(api + "/admin/myGroup", condition)
        .then((res) => {
          setOriginMyGroups(res.data.data);
          setMyGroups(res.data.data.filter((item) => item.user_id != user.id));
        })
        .catch((error) => {
          console.log(error);
        });
    };
    getList();
  }, [condition]);

  const doUpload = async (e) => {
    try {
      // e.preventDefault();
      const formData = new FormData(e.target);
      formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      const res = await axios.put(api + "/group/update", formData);
      console.log(res.data.status);
      if (res.data.status == "success") {
        alert("成功修改揪團");
      } else {
        alert(res.data.message || "修改失敗");
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function doCancel(myGroupId) {
    alert("是否確認要取消此揪團？此操作無法復原！");
    try {
      await axios.put(api + "/admin/myGroup/" + myGroupId).then((res) => {
        if (res.status == "success") {
          alert("已取消此項揪團！");
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function doQuitGroup(myGroupId) {
    alert("是否確認要退出此揪團？此操作無法復原！");
    try {
      await axios
        .delete(`${api}/member/myGroup/${myGroupId}?userId=${user.id}`)
        .then((res) => {
          if (res.status == "success") {
            alert("已退出此項揪團！");
          }
        });
    } catch (error) {
      console.log(error);
    }
  }

  function doFilterHosted(isHost) {
    switch (isHost) {
      case 1:
        setMyGroups(originMyGroups.filter((item) => item.user_id == user.id));
        break;
      case 2:
        setMyGroups(originMyGroups.filter((item) => item.user_id != user.id));
        break;
      case 3:
        setMyGroups(originMyGroups);
        break;
    }
  }

  const checkStatus = (e) => {
    switch (e) {
      case 1:
        setMyGroups(originMyGroups.filter((item) => item.status == 1));
        break;
      case 2:
        setMyGroups(originMyGroups.filter((item) => item.status == 2));
        break;
    }
  };

  return (
    <div className={`${styles.content} container`}>
      {/* <div className={`${styles.aside} d-none d-sm-flex`}>
        <div className={styles.listBox}>
          <div className={styles.asideTitle}>
            <h5 style={{ margin: 0 }}>會員中心</h5>
          </div>
          <div className={styles.asideContent}>
            <div className={styles.ASother}>
              <h6 style={{ margin: 0 }}>我的帳戶</h6>
            </div>
            <div className={styles.ASother}>
              <h6 style={{ margin: 0 }}>我的訂單</h6>
            </div>
            <div className={styles.ASpoint}>
              <h6 style={{ margin: 0 }}>我的揪團</h6>
            </div>
            <div className={styles.ASother}>
              <h6 style={{ margin: 0 }}>我的最愛</h6>
            </div>
            <div className={styles.ASother}>
              <Link href="/coupon">
                <h6 style={{ margin: 0 }}>我的優惠券</h6>
              </Link>
            </div>
          </div>
        </div>
      </div> */}
      <div className={styles.main}>
        <div className={styles.mainTitle}>
          <h4 style={{ fontWeight: 700, margin: 0 }}>我的揪團</h4>
        </div>
        <div className={styles.sectionTop}>
          <div
            className={`${styles.STdefault} ${styles.active}`}
            onClick={(e) => {
              const btns = document.querySelectorAll(`.${styles.STdefault}`);
              btns.forEach((btn) => btn.classList.remove(`${styles.active}`));
              e.target.classList.add(`${styles.active}`);
              doFilterHosted(2);
            }}
          >
            參加的揪團
          </div>
          <div
            className={styles.STdefault}
            onClick={(e) => {
              const btns = document.querySelectorAll(`.${styles.STdefault}`);
              btns.forEach((btn) => btn.classList.remove(`${styles.active}`));
              e.target.classList.add(`${styles.active}`);
              doFilterHosted(1);
            }}
          >
            發起的揪團
          </div>
          <div
            className={styles.STdefault}
            onClick={(e) => {
              const btns = document.querySelectorAll(`.${styles.STdefault}`);
              btns.forEach((btn) => btn.classList.remove(`${styles.active}`));
              e.target.classList.add(`${styles.active}`);
              checkStatus(1);
            }}
          >
            已成團
          </div>
          <div
            className={styles.STdefault}
            onClick={(e) => {
              const btns = document.querySelectorAll(`.${styles.STdefault}`);
              btns.forEach((btn) => btn.classList.remove(`${styles.active}`));
              e.target.classList.add(`${styles.active}`);
              checkStatus(2);
            }}
          >
            已取消
          </div>
        </div>
        <div className="w-100 d-flex flex-column gap-3" id="groupCards">
          {mygroups && mygroups.length > 0 ? (
            mygroups.map((mygroup, i) => (
              <div key={i} className="d-flex gap-3">
                <a
                  className="w-100 text-decoration-none text-reset"
                  data-bs-toggle="collapse"
                  href={`#collapseExample${i}`}
                  role="button"
                  aria-expanded="false"
                  aria-controls="collapseExample"
                  onClick={() => doSetModal(mygroup)}
                >
                  <GroupCard group={mygroup} />
                </a>
                <div
                  className={`collapse collapse-horizontal`}
                  id={`collapseExample${i}`}
                  data-bs-parent="#groupCards"
                >
                  <div
                    className={`d-flex gap-2 h-100 flex-column justify-content-between ${styles.collapseSection}`}
                  >
                    <button
                      className={`btn text-nowrap h-100 ${styles.primaryBtn} ${styles.operateBtn}`}
                      data-bs-toggle="modal"
                      data-bs-target="#checkGroupModal"
                    >
                      查看揪團詳情
                    </button>
                    {mygroup.user_id === user.id ? (
                      <>
                        <button
                          className={`btn text-nowrap h-100 ${styles.primaryBtn}`}
                          data-bs-toggle="modal"
                          data-bs-target="#groupModal"
                        >
                          修改揪團資訊
                        </button>
                        <button
                          className={`btn text-nowrap h-100 ${styles.cancelBtn} btn-danger`}
                          onClick={() => doCancel(mygroup.id)}
                        >
                          取消揪團
                        </button>
                      </>
                    ) : (
                      <button
                        className={`btn text-nowrap h-100 ${styles.cancelBtn} btn-danger`}
                        onClick={() => doQuitGroup(mygroup.id)}
                      >
                        退出揪團
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center">目前沒有揪團</div>
          )}
        </div>

        {/* 修改揪團資料的 Modal */}
        <div
          className="modal fade"
          id="groupModal"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
          key={modalGroup ? modalGroup.id + modalGroup.id : "default1"}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  揪團詳情
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <form
                className="group-create d-flex flex-column w-100"
                onSubmit={(e) => doUpload(e)}
              >
                <div className="modal-body">
                  {modalGroup ? (
                    <>
                      <input
                        type="hidden"
                        name="groupId"
                        id=""
                        value={modalGroup.id}
                      />
                      <input
                        type="hidden"
                        name="userId"
                        id=""
                        value={user.id}
                      />
                      <div className="fs-22px">揪團首圖</div>
                      <div className={styles.imgContainer}>
                        {uploadImg ? (
                          <img className={styles.img} src={uploadImg} alt="" />
                        ) : (
                          <img className={styles.img}
                            src={`/image/group/${modalGroup.group_img}`}
                            alt=""
                          />
                        )}

                      </div>
                      <input type="file" name="file" onChange={(e)=>{doImagePreview(e)}} />
                      <div>
                        <div className="fs-22px mb-15px">揪團標題</div>
                        <input
                          defaultValue={modalGroup.name}
                          className="form-control"
                          type="text"
                          name="title"
                          id=""
                        />
                      </div>
                      <div>
                        <div className="fs-22px mb-15px">揪團性別</div>
                        <select
                          className="form-select"
                          name="gender"
                          id=""
                          defaultValue={modalGroup.gender}
                        >
                          <option value="default" disabled>
                            請選擇揪團性別
                          </option>
                          <option value={1}>不限性別</option>
                          <option value={2}>限男性</option>
                          <option value={3}>限女性</option>
                        </select>
                      </div>
                      <div>
                        <div className="fs-22px mb-15px">揪團人數</div>
                        <input
                          className="form-control"
                          type="number"
                          name="maxNumber"
                          defaultValue={modalGroup.max_number}
                          id=""
                        />
                      </div>
                      <div>
                        <div className="fs-22px mb-15px">揪團分類</div>
                        <select
                          className="form-select"
                          name="type"
                          id=""
                          defaultValue={modalGroup.type}
                        >
                          <option value="default" disabled>
                            請選擇揪團分類
                          </option>
                          <option value={1}>浮潛</option>
                          <option value={2}>自由潛水</option>
                          <option value={3}>水肺潛水</option>
                          <option value={4}>其他</option>
                        </select>
                      </div>
                      <div>
                        <div className="fs-22px mb-15px">證照資格</div>
                        <select
                          className="form-select"
                          name="certificates"
                          id=""
                          defaultValue={modalGroup.certificates}
                        >
                          <option value="default" disabled>
                            請選擇是否需要證照
                          </option>
                          <option value="1">無須證照</option>
                          <option value="2">需OWD證照</option>
                          <option value="3">需AOWD證照</option>
                        </select>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        <div className="fs-22px mb-15px">揪團地點</div>
                        <select
                          name="country"
                          className="form-select mb-15px"
                          id=""
                          defaultValue={modalGroup.country_id}
                          onChange={doCountrySelect}
                        >
                          <option value="default" disabled>
                            請選擇揪團國家
                          </option>
                          <option value={1}>台灣</option>
                          <option value={2}>日本</option>
                          <option value={3}>菲律賓</option>
                          <option value={4}>其他</option>
                        </select>
                        <select
                          className="form-select"
                          name="city"
                          id=""
                          defaultValue={modalGroup.city_name}
                        >
                          {citySelect.length > 0 ? (
                            citySelect.map((v, i) => (
                              <option key={`${v}-${i}`} value={v}>
                                {v}
                              </option>
                            ))
                          ) : (
                            <option value="" disabled>
                              請先選擇國家
                            </option>
                          )}
                        </select>
                      </div>
                      <div className="row">
                        <div className="col-12 col-sm-6 d-flex flex-column gap-3 row-first">
                          <div className="fs-22px">活動日期</div>
                          <input
                            className="form-control"
                            type="date"
                            name="date"
                            defaultValue={modalGroup.date}
                          />
                        </div>
                        <div className="col-12 col-sm-6 d-flex flex-column gap-3">
                          <div className="fs-22px">活動時間</div>
                          <input
                            className="form-control"
                            type="time"
                            name="time"
                            defaultValue={modalGroup.time}
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-12 col-sm-6 d-flex flex-column gap-3 row-first">
                          <div className="fs-22px">揪團截止日期</div>
                          <input
                            className="form-control"
                            type="date"
                            name="signEndDate"
                            value={endDate || ""}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                        <div className="col-12 col-sm-6 d-flex flex-column gap-3">
                          <div className="fs-22px">揪團截止時間</div>
                          <input
                            className="form-control"
                            type="time"
                            name="signEndTime"
                            value={endTime || ""}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="fs-22px mb-15px">揪團資訊</div>
                        <textarea
                          className="form-control"
                          name="description"
                          id=""
                          rows={5}
                          defaultValue={modalGroup.description}
                        />
                      </div>
                    </>
                  ) : (
                    <div>載入中</div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    取消修改
                  </button>
                  <button type="submit" className="btn btn-primary">
                    儲存修改
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* 檢視揪團資料的 Modal */}
        <div
          className="modal fade"
          id="checkGroupModal"
          tabIndex="-1"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
          key={modalGroup ? modalGroup.id : "default2"}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">
                  揪團詳情
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              {/* <form className="group-create d-flex flex-column w-100"> */}
                <div className="modal-body">
                  {modalGroup ? <div>
                  <div className={`d-flex flex-column ${styles.middleSection}`}>
                            <div className={`${styles.imgContainera}`}>
                              <img
                                className={styles.img}
                                src={`/image/group/${modalGroup.group_img}`}
                                alt=""
                              />
                            </div>
                            <h4 className="text-center fs-26px fw-bold m-0">{modalGroup.name}</h4>
                            <div className={`d-flex justify-content-between align-items-center ${styles.stateSection}`}>
                              <div className={styles.groupState}>
                                {(() => {
                                  switch (modalGroup.status) {
                                    case 0:
                                      return "揪團中";
                                    case 1:
                                      return "已成團";
                                    case 2:
                                      return "已取消";
                                  }
                                })()}
                              </div>
                              <div>
                                <i className="bi bi-geo-alt-fill color-primary icon-bigger" />{" "}
                                {modalGroup.country_name} {modalGroup.city_name}
                              </div>
                              <div>
                                <i className="bi bi-person color-primary icon-bigger" />{" "}
                                {(() => {
                                  switch (modalGroup.gender) {
                                    case 1:
                                      return "不限性別";
                                    case 2:
                                      return "限男性";
                                    case 3:
                                      return "限女性";
                                  }
                                })()}
                              </div>
                            </div>
                            <div className={styles.groupInfo}>
                              {/* FIXME:浮潛面鏡icon */}
                              {(() => {
                                switch (modalGroup.type) {
                                  case 1:
                                    return (
                                      <div className="text-center fw-bold fs-20px">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="20"
                                          height="15"
                                          viewBox="0 0 20 15"
                                          fill="none"
                                        >
                                          <path
                                            d="M15.983 1.80092C15.8648 1.68269 15.7045 1.61631 15.5374 1.61631H1.59744C1.43028 1.61631 1.26994 1.68269 1.15176 1.80092L0.184603 2.76802C0.0663758 2.88625 0 3.04654 0 3.21376V8.97877C0 9.14599 0.0664279 9.30628 0.184603 9.4245L1.15176 10.3916C1.26999 10.5098 1.43028 10.5762 1.59744 10.5762H6.26499C6.46022 10.5762 6.64435 10.4858 6.76372 10.3313L7.9537 8.79157H9.1811L10.3711 10.3313C10.4905 10.4858 10.6746 10.5762 10.8698 10.5762H15.5374C15.7045 10.5762 15.8649 10.5098 15.983 10.3916L16.9502 9.4245C17.0684 9.30628 17.1348 9.14599 17.1348 8.97877V3.21376C17.1348 3.04659 17.0684 2.88625 16.9502 2.76802L15.983 1.80092ZM15.8742 8.71775L15.2763 9.3156H11.1793L9.98933 7.77583C9.86995 7.62137 9.68577 7.53095 9.4906 7.53095H7.6442C7.44898 7.53095 7.26485 7.62137 7.14547 7.77583L5.9555 9.3156H1.85852L1.26057 8.71775V3.47484L1.85852 2.87693H15.2763L15.8742 3.47484V8.71775ZM11.0661 10.9671H6.06862C5.7205 10.9671 5.43834 11.2493 5.43834 11.5974V13.8499C5.43834 14.1981 5.7205 14.4802 6.06862 14.4802H11.0661C11.4142 14.4802 11.6964 14.198 11.6964 13.8499V13.387H17.4208C17.6109 13.387 17.7908 13.3012 17.9105 13.1535L19.8594 10.7481C19.9503 10.6359 19.9999 10.4957 19.9999 10.3513V1.15012C19.9999 0.801999 19.7178 0.519836 19.3697 0.519836C19.0215 0.519836 18.7394 0.801999 18.7394 1.15012V10.128L17.1203 12.1264H11.6964V11.5975C11.6964 11.2492 11.4142 10.9671 11.0661 10.9671ZM10.4358 13.2196H6.69901V12.2277H10.4358V13.2196Z"
                                            fill="black"
                                          />
                                        </svg>
                                        <span className="ms-2">浮潛</span>
                                      </div>
                                    );
                                  case 2:
                                    return (
                                      <div className="justify-content-center fw-bold fs-20px d-flex">
                                        <ReactSVG src="/image/group/free.svg" />
                                        <span className="ms-1">自由潛水</span>
                                      </div>
                                    );
                                  case 3:
                                    return (
                                      <div className="justify-content-center d-flex fw-bold fs-20px">
                                        <ReactSVG src="/image/group/aqualung-diving-svgrepo-com.svg" />
                                        <span className="ms-1">水肺潛水</span>
                                      </div>
                                    );
                                  case 4:
                                    return (
                                      <div className="text-center fw-bold fs-20px">
                                        <i className="icon bi bi-people-fill" />
                                        <span className="ms-1">其他</span>
                                      </div>
                                    );
                                }
                              })() || <div className="text-center fw-bold fs-20px">載入中</div>}
                  
                              <div className="d-flex justify-content-around">
                                <div className="fs-20px">
                                  <i className="bi bi-calendar" /> {modalGroup.date}
                                </div>
                                <div className="fs-20px">
                                  <i className="bi bi-clock" /> {modalGroup.time}
                                </div>
                              </div>
                            </div>
                            <div className={`group-detail text-center d-flex flex-column ${styles.middleSection}`}>
                              <div className="fs-20px">揪團主：{modalGroup.user_name}</div>
                              <div className="fs-20px">揪團上架：{modalGroup.created_at}</div>
                              <div className="fs-20px">揪團截止：{modalGroup.sign_end_date}</div>
                              <div className="fs-20px fw-bold d-flex align-items-center justify-content-center gap-2">
                                <div>
                                  <i className="bi bi-person-check-fill color-primary fs-26px" />
                                </div>
                                已揪 {modalGroup.participant_number} / {modalGroup.max_number}
                              </div>
                  
                            </div>
                          </div>
                          <hr />
                          <div className="p-sm-0">
                            <div className={styles.groupDescription}>
                              <div className={`fs-20px fw-bold ${styles.title} text-center`}>揪團資訊</div>
                              <div className="m-0">
                                {description && description.length > 0
                                  ? description.map((v, i) => {
                                    return <p className="text-center" key={i}>{v}</p>;
                                  })
                                  : "載入中"}
                              </div>
                            </div>
                          </div>
                          </div> : <div>載入中</div>}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    關閉
                  </button>
                </div>
              {/* </form> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}