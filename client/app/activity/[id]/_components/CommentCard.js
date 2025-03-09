"use client";
import { FaStar } from "react-icons/fa";
import styles from "./comment.module.css"

export default function CommentCard({ comment }) {

    return (
        <div
            className={`d-flex ${styles.commentCard} gap-3 activity-score ${styles.activityDescriptionBorder} py-5`}
        >
            <div className={`${styles.imgContainer} rounded-circle`}>
                <img src={`http://localhost:3005/public/upload/avartars/${comment.avatar}` || `/image/images.jpg`} alt="" />
            </div>
            <div className={`d-flex flex-column gap-2`}>
                <h6 className={`m-0`}>{comment.name || "Shu Hui"}</h6>
                <div className={`${styles.star}`}>
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <FaStar />
                    <span className={`${styles.text}`}>{comment.created_at || "2021/10/23"}</span>
                </div>
                <div className={`${styles.commentText} `}>
                    <h6 className={`fw-bold`}>{comment.title || "很開心"}</h6>
                    <p className={`m-0`}>
                        {comment.content || "接待人員態度很親切，仔細解說、氣氛融洽、服務100分，浮潛裝備很齊全，裝口罩的防水罐很棒，有海龜在身邊共游，讓人回味無窮"}
                    </p>
                </div>
            </div>
        </div>
    );
}
