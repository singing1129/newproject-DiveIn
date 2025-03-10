import React from 'react';
import styles from './comment.module.css'; 

const CommentSortSelect = ({ onSortChange, defaultValue = 'new' }) => {
  const handleChange = (event) => {
    onSortChange(event.target.value); // 當選擇改變時，傳回選中的值
  };

  return (
    <select
      className={`${styles.scoreSort} form-select`}
      name="score-sort"
      defaultValue={defaultValue}
      onChange={handleChange}
    >
      <option value="new">最新</option>
      <option value="highToLow">評分由高到低</option>
      <option value="lowToHigh">評分由低到高</option>
    </select>
  );
};

export default CommentSortSelect;