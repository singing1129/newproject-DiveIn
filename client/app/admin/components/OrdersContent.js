import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Orders.module.css";
import { useAuth } from "@/hooks/useAuth";

export default function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [reviewWindows, setReviewWindows] = useState({});
  const [reviewTexts, setReviewTexts] = useState({});
  const [reviewRatings, setReviewRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, getToken } = useAuth();
  const token = getToken();
  const userId = user?.id;

  // 監控展開的訂單ID變化
  useEffect(() => {
    console.log('當前展開的訂單ID:', expandedOrderId);
  }, [expandedOrderId]);

  useEffect(() => {
    if (userId) {
      fetchUserOrders();
    }
  }, [userId]);

  // 處理評分變更
  const handleRatingChange = (key, rating) => {
    setReviewRatings(prev => ({ ...prev, [key]: rating }));
  };

  // 取得用戶所有訂單基本資訊
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3005/api/order/user/${userId}`
      );
      if (response.data.success) {
        setOrders(response.data.data);
      } else {
        throw new Error(response.data.message || "取得訂單失敗");
      }
      setLoading(false);
    } catch (err) {
      console.error("取得訂單資料失敗:", err);
      setError(err.message || "取得訂單資料時發生錯誤");
      setLoading(false);
    }
  };

  // 取得特定訂單詳情
  const fetchOrderDetails = async (orderId) => {
    // 如果已經展開，則收合
    if (expandedOrderId === orderId) {
      console.log('收合訂單:', orderId);
      setExpandedOrderId(null);
      return;
    }
    
    try {
      console.log('開始獲取訂單:', orderId);
      setExpandedOrderId(orderId); // 先設置展開狀態，避免閃爍
      
      const response = await axios.get(
        `http://localhost:3005/api/order/${orderId}`
      );
      
      console.log('訂單詳情 API 響應:', response.data);
      
      if (response.data.success) {
        console.log('訂單數據獲取成功:', orderId);
        // 使用函數式更新以確保基於最新狀態
        setOrders(prevOrders => {
          return prevOrders.map(order => 
            order.id === orderId
              ? { ...order, details: response.data.data }
              : order
          );
        });
        
        // 獲取評價狀態
        fetchOrderReviewStatus(orderId);
      } else {
        throw new Error(response.data.message || "取得訂單詳情失敗");
      }
    } catch (err) {
      console.error("取得訂單詳情失敗:", err);
      alert("取得訂單詳情時發生錯誤: " + (err.message || "未知錯誤"));
    }
  };

  // 獲取訂單評價狀態
  const fetchOrderReviewStatus = async (orderId) => {
    try {
      console.log('開始獲取評價狀態:', orderId);
      
      // 使用 try-catch 包裝 API 調用，避免未授權錯誤導致整個組件崩潰
      let reviewData = null;
      try {
        const response = await axios.get(
          `http://localhost:3005/api/reviews/${orderId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('評價狀態 API 響應:', response.data);
        if (response.data.success) {
          reviewData = response.data.data;
        }
      } catch (apiError) {
        console.error("API 請求失敗:", apiError.message);
        console.log("繼續處理訂單顯示，但不包含評價狀態");
      }
      
      // 使用函數式更新
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.id === orderId && order.details) {
            // 準備新的訂單詳情
            const newDetails = { ...order.details };
            
            // 如果有評價數據，則更新商品評價狀態
            if (reviewData) {
              // 更新商品評價狀態
              if (newDetails.items.products && newDetails.items.products.length > 0) {
                newDetails.items.products = newDetails.items.products.map(product => {
                  const itemStatus = reviewData.items.find(
                    item => item.type === "product" && item.id.toString() === product.id.toString()
                  );
                  return {
                    ...product,
                    isReviewed: itemStatus ? itemStatus.isReviewed : false
                  };
                });
              }
              
              // 更新活動評價狀態
              if (newDetails.items.activities && newDetails.items.activities.length > 0) {
                newDetails.items.activities = newDetails.items.activities.map(activity => {
                  const itemStatus = reviewData.items.find(
                    item => item.type === "activity" && item.id.toString() === activity.id.toString()
                  );
                  return {
                    ...activity,
                    isReviewed: itemStatus ? itemStatus.isReviewed : false
                  };
                });
              }
              
              // 更新租借評價狀態
              if (newDetails.items.rentals && newDetails.items.rentals.length > 0) {
                newDetails.items.rentals = newDetails.items.rentals.map(rental => {
                  const itemStatus = reviewData.items.find(
                    item => item.type === "rental" && item.id.toString() === rental.id.toString()
                  );
                  return {
                    ...rental,
                    isReviewed: itemStatus ? itemStatus.isReviewed : false
                  };
                });
              }
              
              // 更新套裝評價狀態
              if (newDetails.items.bundles && newDetails.items.bundles.length > 0) {
                newDetails.items.bundles = newDetails.items.bundles.map(bundle => {
                  const itemStatus = reviewData.items.find(
                    item => item.type === "bundle" && item.id.toString() === bundle.id.toString()
                  );
                  return {
                    ...bundle,
                    isReviewed: itemStatus ? itemStatus.isReviewed : false
                  };
                });
              }
            }
            
            return {
              ...order,
              details: newDetails,
              reviewStatus: reviewData
            };
          }
          return order;
        });
      });
    } catch (err) {
      console.error("處理評價狀態失敗:", err);
    }
  };

  // 取得類型標籤
  const getTypeLabel = (type) => {
    switch (type) {
      case "product":
        return "商品";
      case "rental":
        return "租借";
      case "activity":
        return "活動";
      default:
        return "";
    }
  };

  // 取得評價窗口的唯一key
  const getReviewKey = (orderId, itemId, type) => {
    return `${orderId}-${itemId}-${type}`;
  };

  // 切換評價窗口的顯示狀態
  const toggleReviewWindow = (orderId, itemId, type) => {
    const key = getReviewKey(orderId, itemId, type);
    console.log('切換評價窗口:', key);
    setReviewWindows(prev => {
      // 建立一個新物件，避免直接修改原狀態
      const newState = { ...prev };
      newState[key] = !prev[key];
      console.log('新的評價窗口狀態:', newState);
      return newState;
    });
  };

  // 處理評價文字輸入
  const handleReviewTextChange = (key, value) => {
    setReviewTexts(prev => ({ ...prev, [key]: value }));
  };

  // 提交評價
  const handleReviewSubmit = async (orderId, itemId, type) => {
    const key = getReviewKey(orderId, itemId, type);
    const reviewText = reviewTexts[key] || "";
    const starRating = reviewRatings[key] || 5;

    console.log('提交評價:', { orderId, itemId, type, rating: starRating, comment: reviewText });

    if (!reviewText.trim()) {
      alert("請輸入評論內容");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3005/api/reviews",
        {
          orderId,
          itemId,
          type,
          rating: starRating,
          comment: reviewText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('評價提交響應:', response.data);

      if (response.data.success) {
        alert("評價提交成功！");
        
        // 清除評價窗口狀態
        setReviewWindows(prev => ({ ...prev, [key]: false }));
        setReviewTexts(prev => ({ ...prev, [key]: "" }));
        
        // 重新取得訂單詳情和評價狀態
        fetchOrderDetails(orderId);
      } else {
        alert(response.data.message || "評價提交失敗");
      }
    } catch (error) {
      console.error("評價提交錯誤:", error);
      alert(
        "評價提交失敗: " +
        (error.response?.data?.message || error.message || "未知錯誤")
      );
    }
  };

  if (loading) {
    return <div className="text-center p-4">載入中...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-3">{error}</div>;
  }

  return (
    <div className={styles.ordersContent}>
      <div className={styles.orderList}>
        {orders.length === 0 ? (
          <div className="text-center p-4">目前沒有訂單記錄</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              {/* 訂單標題與基本資訊 */}
              <div className={styles.orderHeader}>
                <h3 className={styles.orderId}>
                  訂單 #{order.orderNumber || order.id}
                </h3>
                <p className={styles.orderStatus}>
                  {order.payment_status === "paid"
                    ? "已付款"
                    : order.status === "pending"
                    ? "已付款"
                    : "已取消"}
                </p>
              </div>
              <div className={styles.orderHeader}>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                <p>NT$ {order.total_price}</p>
              </div>

              {/* 當未展開時，顯示預覽摘要 */}
              {expandedOrderId !== order.id && (
                <div className={styles.orderSummary}>
                  <div className={styles.orderItem}>
                    {order.firstItem ? (
                      <img
                        src={order.firstItem.image_url || "/placeholder.jpg"}
                        alt="訂單預覽"
                        className={styles.orderImage}
                      />
                    ) : (
                      <div className={styles.placeholderImage}>無預覽圖</div>
                    )}
                    <div className={styles.orderDetails}>
                      <h4 className={styles.orderTitle}>
                        {order.firstItem ? order.firstItem.name : "訂單項目"}
                      </h4>
                      {order.totalItems > 0 && (
                        <p className={styles.orderDescription}>
                          共 {order.totalItems} 項商品
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 當展開時，顯示詳細內容 */}
              {expandedOrderId === order.id && (
                <div className={styles.orderExpanded}>
                  {/* 調試信息 */}
                  <div style={{ fontSize: '12px', color: 'gray', margin: '10px 0' }}>
                    訂單ID: {order.id} | 詳情狀態: {order.details ? '已加載' : '加載中...'}
                  </div>
                  
                  {/* 加載中指示器 */}
                  {!order.details && <div className="text-center p-3">載入訂單詳情中...</div>}
                  
                  {/* 只有在詳情存在時才渲染內容 */}
                  {order.details && (
                    <>
                      {/* 完成所有評價獲得積分獎勵提示 */}
                      {order.reviewStatus?.isFullyReviewed &&
                        order.reviewStatus?.hasReceivedPoints && (
                          <div
                            className="alert alert-success mt-3 mb-3"
                            role="alert"
                          >
                            <i className="fa-solid fa-trophy me-2"></i>
                            恭喜！您已完成所有評價並獲得 10 積分獎勵！
                          </div>
                        )}

                      {/* 商品區塊 */}
                      {order.details.items.products &&
                        order.details.items.products.length > 0 && (
                          <div className={styles.orderSection}>
                            <div
                              className={`${styles.orderType} ${styles.products}`}
                            >
                              {getTypeLabel("product")}
                            </div>
                            <div className={styles.orderItems}>
                              {order.details.items.products.map((product) => (
                                <div
                                  key={`product-${product.id}`}
                                  className={styles.orderItem}
                                >
                                  <img
                                    src={product.image || "/placeholder.jpg"}
                                    alt={product.name}
                                    className={styles.orderImage}
                                  />
                                  <div className={styles.orderDetails}>
                                    <h4 className={styles.orderTitle}>
                                      {product.name}
                                    </h4>
                                    <p className={styles.orderDescription}>
                                      {product.color && product.size
                                        ? `${product.color} / ${product.size}`
                                        : "標準款式"}
                                    </p>
                                    <p className={styles.orderDescription}>
                                      數量: {product.quantity} | 單價: NT${product.price}
                                    </p>
                                    
                                    {/* 評價按鈕 */}
                                    <button
                                      className={`${styles.orderButton} ${
                                        product.isReviewed ? styles.disabledButton : ""
                                      }`}
                                      onClick={() => {
                                        console.log('點擊評價按鈕:', product.id);
                                        if (!product.isReviewed) {
                                          toggleReviewWindow(order.id, product.id, "product");
                                        }
                                      }}
                                      disabled={product.isReviewed}
                                    >
                                      {product.isReviewed
                                        ? "已評價"
                                        : "評價"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                      {/* 套裝區塊 */}
                      {order.details.items.bundles &&
                        order.details.items.bundles.length > 0 && (
                          <div className={styles.orderSection}>
                            <div
                              className={`${styles.orderType} ${styles.products}`}
                              style={{ backgroundColor: '#FF8C00' }}
                            >
                              套裝商品
                            </div>
                            <div className={styles.orderItems}>
                              {order.details.items.bundles.map((bundle) => (
                                <div
                                  key={`bundle-${bundle.id}`}
                                  className={styles.orderItem}
                                  style={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    marginBottom: '15px'
                                  }}
                                >
                                  <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                                    <i className="fa-solid fa-box-open" style={{ fontSize: '36px', color: '#FF8C00' }}></i>
                                  </div>
                                  
                                  <div className={styles.orderDetails}>
                                    <h4 className={styles.orderTitle} style={{ color: '#FF8C00' }}>
                                      {bundle.name}
                                    </h4>
                                    <p className={styles.orderDescription}>
                                      {bundle.description}
                                    </p>
                                    <p className={styles.orderDescription}>
                                      數量: {bundle.quantity} | 原價: NT${bundle.original_total} | 優惠價: NT${bundle.discount_price}
                                    </p>
                                    
                                    {/* 捆綁商品列表 */}
                                    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                                      <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>套裝內容:</p>
                                      <ul style={{ paddingLeft: '20px', marginBottom: '10px', fontSize: '14px' }}>
                                        {bundle.items.map((item, index) => (
                                          <li key={index} style={{ marginBottom: '5px' }}>
                                            {item.name} {item.color ? `(${item.color})` : ''}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    
                                    {/* 評價按鈕 */}
                                    <button
                                      className={`${styles.orderButton} ${
                                        bundle.isReviewed ? styles.disabledButton : ""
                                      }`}
                                      onClick={() => {
                                        console.log('點擊評價按鈕:', bundle.id);
                                        if (!bundle.isReviewed) {
                                          toggleReviewWindow(order.id, bundle.id, "bundle");
                                        }
                                      }}
                                      disabled={bundle.isReviewed}
                                      style={{ backgroundColor: bundle.isReviewed ? '#e0e0e0' : '#FF8C00', color: 'white' }}
                                    >
                                      {bundle.isReviewed
                                        ? "已評價"
                                        : "評價"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* 活動區塊 */}
                      {order.details.items.activities &&
                        order.details.items.activities.length > 0 && (
                          <div className={styles.orderSection}>
                            <div className={`${styles.orderType} ${styles.events}`}>
                              {getTypeLabel("activity")}
                            </div>
                            <div className={styles.orderItems}>
                              {order.details.items.activities.map((activity) => (
                                <div
                                  key={`activity-${activity.id}`}
                                  className={styles.orderItem}
                                >
                                  <img
                                    src={activity.image || "/placeholder.jpg"}
                                    alt={activity.name}
                                    className={styles.orderImage}
                                  />
                                  <div className={styles.orderDetails}>
                                    <h4 className={styles.orderTitle}>
                                      {activity.name}
                                    </h4>
                                    <p className={styles.orderDescription}>
                                      {activity.projectName}
                                    </p>
                                    <p className={styles.orderDescription}>
                                      日期: {activity.date} | 時間: {activity.time} | 人數: {activity.quantity}
                                    </p>
                                    
                                    {/* 評價按鈕 */}
                                    <button
                                      className={`${styles.orderButton} ${
                                        activity.isReviewed ? styles.disabledButton : ""
                                      }`}
                                      onClick={() => {
                                        console.log('點擊評價按鈕:', activity.id);
                                        if (!activity.isReviewed) {
                                          toggleReviewWindow(order.id, activity.id, "activity");
                                        }
                                      }}
                                      disabled={activity.isReviewed}
                                    >
                                      {activity.isReviewed
                                        ? "已評價"
                                        : "評價"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* 租借區塊 */}
                      {order.details.items.rentals &&
                        order.details.items.rentals.length > 0 && (
                          <div className={styles.orderSection}>
                            <div
                              className={`${styles.orderType} ${styles.rentals}`}
                            >
                              {getTypeLabel("rental")}
                            </div>
                            <div className={styles.orderItems}>
                              {order.details.items.rentals.map((rental) => (
                                <div
                                  key={`rental-${rental.id}`}
                                  className={styles.orderItem}
                                >
                                  <img
                                    src={rental.image || "/placeholder.jpg"}
                                    alt={rental.name}
                                    className={styles.orderImage}
                                  />
                                  <div className={styles.orderDetails}>
                                    <h4 className={styles.orderTitle}>
                                      {rental.name}
                                    </h4>
                                    <p className={styles.orderDescription}>
                                      租借期間: {rental.startDate} 至 {rental.endDate}
                                    </p>
                                    <p className={styles.orderDescription}>
                                      數量: {rental.quantity} | 租金: NT$ {rental.rentalFee} | 押金: NT$ {rental.deposit}
                                    </p>
                                    
                                    {/* 評價按鈕 */}
                                    <button
                                      className={`${styles.orderButton} ${
                                        rental.isReviewed ? styles.disabledButton : ""
                                      }`}
                                      onClick={() => {
                                        console.log('點擊評價按鈕:', rental.id);
                                        if (!rental.isReviewed) {
                                          toggleReviewWindow(order.id, rental.id, "rental");
                                        }
                                      }}
                                      disabled={rental.isReviewed}
                                    >
                                      {rental.isReviewed
                                        ? "已評價"
                                        : "評價"}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}

              {/* 切換展開/收合 */}
              <div className={styles.buttonGroup}>
                <button
                  className={styles.orderButton}
                  onClick={() => fetchOrderDetails(order.id)}
                >
                  {expandedOrderId === order.id ? "收合" : "查看詳情"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 評價視窗 - 使用固定定位的模態框 */}
      {Object.entries(reviewWindows).map(([key, isOpen]) => {
        if (!isOpen) return null;
        
        const [orderId, itemId, type] = key.split('-');
        // 找出要評價的項目
        const order = orders.find(o => o.id.toString() === orderId);
        if (!order || !order.details) return null;
        
        let item;
        if (type === 'product') {
          item = order.details.items.products?.find(p => p.id.toString() === itemId);
        } else if (type === 'activity') {
          item = order.details.items.activities?.find(a => a.id.toString() === itemId);
        } else if (type === 'rental') {
          item = order.details.items.rentals?.find(r => r.id.toString() === itemId);
        } else if (type === 'bundle') {
          item = order.details.items.bundles?.find(b => b.id.toString() === itemId);
        }
        
        if (!item) return null;
        
        return (
          <div key={key} style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>評價: {item.name}</h3>
            
            <div style={{ display: 'flex', marginBottom: '15px' }}>
              {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                  <i
                    key={index}
                    className={`fa-${
                      ratingValue <= (reviewRatings[key] || 5) ? "solid" : "regular"
                    } fa-star text-warning`}
                    style={{ fontSize: '24px', marginRight: '8px', cursor: 'pointer' }}
                    onClick={() => handleRatingChange(key, ratingValue)}
                  />
                );
              })}
            </div>
            
            <textarea
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                minHeight: '120px',
                marginBottom: '15px',
                fontSize: '16px'
              }}
              placeholder="請輸入您的評價..."
              value={reviewTexts[key] || ""}
              onChange={(e) => handleReviewTextChange(key, e.target.value)}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f5f5f5',
                  cursor: 'pointer'
                }}
                onClick={() => toggleReviewWindow(orderId, itemId, type)}
              >
                取消
              </button>
              
              <button
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#219ebc',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onClick={() => handleReviewSubmit(orderId, itemId, type)}
              >
                提交評價
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}