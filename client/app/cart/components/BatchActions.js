"use client";
import React, { useState } from "react";
import { useCart } from "@/hooks/cartContext";
import useFavorite from "@/hooks/useFavorite"; // 匯入 useFavorite
import useToast from "@/hooks/useToast"; // 添加useToast

const BatchActions = ({ type = "products" }) => {
  const {
    cartData,
    selectedItems,
    handleSelectAll,
    isAllSelected,
    removeFromCart,
  } = useCart();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const { showToast } = useToast();

  // 购物车使用复数形式，但收藏功能需要单数形式
  const typeMapping = {
    products: "products", // 购物车类型
    product: "products",
    bundles: "bundles", // 购物车类型
    bundle: "bundles",
    activities: "activities", // 购物车类型
    activity: "activities",
    rentals: "rentals", // 购物车类型
    rental: "rentals",
  };

  // 收藏功能需要单数形式
  const favoriteTypeMapping = {
    products: "product", // 收藏类型
    product: "product",
    bundles: "bundle", // 收藏类型
    bundle: "bundle",
    activities: "activity", // 收藏类型
    activity: "activity",
    rentals: "rental", // 收藏类型
    rental: "rental",
  };

  // 使用映射后的类型
  const mappedType = typeMapping[type] || type;
  // 获取收藏功能需要的类型（单数形式）
  const favoriteType = favoriteTypeMapping[type] || type;

  // 取得 useFavorite 中的批量收藏方法，使用单数类型
  const { batchToggleFavorites } = useFavorite(null, favoriteType);

  const items = cartData[mappedType] || [];

  // 确保selectedItems[mappedType]存在，如果不存在则使用空数组
  const selectedCount =
    selectedItems && selectedItems[mappedType]
      ? selectedItems[mappedType].length
      : 0;

  // 處理批量刪除
  const handleBatchDelete = async () => {
    if (isDeleting || !selectedCount) return;

    if (!confirm("確定要刪除選中的商品嗎？")) return;

    try {
      setIsDeleting(true);
      await removeFromCart(mappedType, selectedItems[mappedType]);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // 處理批量加入收藏
  const handleBatchFavorite = async () => {
    if (isAddingToFavorites || selectedCount === 0) return;

    try {
      setIsAddingToFavorites(true);

      // 确保selectedItems[mappedType]存在
      if (!selectedItems || !selectedItems[mappedType]) {
        showToast("沒有選中的商品", { style: { backgroundColor: "orange" } });
        return;
      }

      // 根据商品类型获取正确的ID
      let itemIds = [];
      let cartItemIds = []; // 存储购物车中的项目ID，用于后续删除

      console.log("选中的商品:", selectedItems[mappedType]);
      console.log("购物车商品:", items);
      console.log("收藏类型:", favoriteType);

      if (mappedType === "products") {
        // 对于普通商品，我们需要获取产品ID而不是变体ID
        selectedItems[mappedType].forEach((id) => {
          const item = items.find((item) => item.id === id);
          if (item) {
            itemIds.push(item.product_id);
            cartItemIds.push(id); // 存储购物车项目ID
          }
        });
      } else if (mappedType === "bundles") {
        // 对于套装商品，直接使用bundle_id
        selectedItems[mappedType].forEach((id) => {
          const item = items.find((item) => item.id === id);
          if (item) {
            itemIds.push(item.id);
            cartItemIds.push(id); // 存储购物车项目ID
          }
        });
      } else if (mappedType === "activities") {
        // 对于活动商品，使用activity_id
        selectedItems[mappedType].forEach((id) => {
          const item = items.find((item) => item.id === id);
          if (item) {
            itemIds.push(item.activity_id);
            cartItemIds.push(id); // 存储购物车项目ID
          }
        });
      } else if (mappedType === "rentals") {
        // 对于租赁商品，使用rental_id
        selectedItems[mappedType].forEach((id) => {
          const item = items.find((item) => item.id === id);
          if (item) {
            itemIds.push(item.rental_id);
            cartItemIds.push(id); // 存储购物车项目ID
          }
        });
      }

      console.log("要加入收藏的商品ID:", itemIds);
      console.log("要从购物车删除的商品ID:", cartItemIds);

      if (itemIds.length === 0) {
        showToast("沒有可移入收藏的商品", {
          style: { backgroundColor: "orange" },
        });
        return;
      }

      // 强制刷新收藏状态，确保获取最新数据
      const success = await batchToggleFavorites(itemIds, "add");

      if (success) {
        showToast("已將選中商品移入收藏");

        // 成功加入收藏后，从购物车中删除这些商品
        await removeFromCart(mappedType, cartItemIds);
      }
    } catch (error) {
      console.error("批量移入收藏失敗:", error);
      showToast("批量移入收藏失敗，請稍後再試", "error");
    } finally {
      setIsAddingToFavorites(false);
    }
  };

  return (
    <div className="row g-0 py-2 border-bottom align-items-center">
      <div className="col-1">
        <input
          type="checkbox"
          className="ms-2"
          id={`selectAll-${mappedType}`}
          checked={isAllSelected(mappedType)}
          onChange={(e) => handleSelectAll(mappedType, items, e.target.checked)}
        />
      </div>
      <div className="col">
        <label
          htmlFor={`selectAll-${mappedType}`}
          className="mb-0"
          style={{ fontSize: 14 }}
        >
          全選
        </label>
      </div>
      <div className="col-auto me-3">
        <div className="d-flex gap-3 text-muted" style={{ fontSize: 14 }}>
          <button
            className="btn p-0 text-muted batch-action"
            disabled={selectedCount === 0 || isAddingToFavorites}
            onClick={handleBatchFavorite}
          >
            {isAddingToFavorites
              ? "移入收藏中..."
              : `移入收藏 ${selectedCount > 0 ? `(${selectedCount})` : ""}`}
          </button>
          <button
            className="btn p-0 text-muted batch-action"
            disabled={selectedCount === 0 || isDeleting}
            onClick={handleBatchDelete}
          >
            {isDeleting
              ? "刪除中..."
              : `刪除 ${selectedCount > 0 ? `(${selectedCount})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchActions;
