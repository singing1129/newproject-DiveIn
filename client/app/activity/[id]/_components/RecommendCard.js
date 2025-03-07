"use client";
import {
    FaRegHeart,
    FaMapMarkerAlt,
    FaRegClock,
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaRegCheckCircle,
} from "react-icons/fa";
import Image from "next/image";
import styles from "../detail.module.css"
import Link from "next/link";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import useFavorite from "@/hooks/useFavorite";

export default function RecommendCard({ activity }) {
    // 收藏
    const { isFavorite, toggleFavorite, loading } = useFavorite(
        activity.id,
        "activity"
    );
    return (
        <Link className={styles.recommendCardA} href={`/activity/${activity.id}`}>
            <div className={`${styles.recommendCard}`}>
                <div className={`${styles.cardImgContainer}`}>
                    <Image
                        className={`${styles.img}`}
                        src={`/image/activity/${activity.id}/${activity.img_url}`}

                        alt=""
                        layout="fill"  // 使用 layout="fill"
                        objectFit="cover" // 確保圖片保持填滿但不會變形
                    />
                    <div className={`${styles.mapMarker}`}>
                        <FaMapMarkerAlt />
                        {activity?.recommedCity ? activity.recommedCity : "屏東"}
                    </div>
                    <div>
                        <button
                            className={styles.heart}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite();
                            }}
                            disabled={loading}
                            style={{ border: "none", background: "none" }}
                        >
                            {isFavorite ? (
                                <AiFillHeart color="red" size={24} />
                            ) : (
                                <AiOutlineHeart size={24} />
                            )}
                        </button>
                    </div>
                </div>
                <div className={`${styles.recommendCardText}`}>
                    {activity?.name ? activity.name : "【春節旅遊特惠】小琉球浮潛|美人洞 & 花瓶岩 & 龍蝦洞與海龜共遊|指定套餐贈好禮|含拍照|寵物友善|小海龜水上活動"}
                </div>
                <div className={`${styles.count}`}>1天前可免費取消</div>
                <div>
                    <FaStar />
                    4.8(999) | 9K+個已訂購
                </div>
                <div className={`fw-bold`}>{activity?.price ? "NT." + activity.price : "NT$360起"}</div>
            </div>
        </Link>
    );
}
