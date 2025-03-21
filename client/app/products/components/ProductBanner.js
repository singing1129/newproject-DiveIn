"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination, Autoplay } from "swiper/modules";

export default function ProductBanner() {
  return (
    <div className="w-full max-w-screen-lg mx-auto mb-6">
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop={true}
        spaceBetween={10}
        slidesPerView={1}
      >
        <SwiperSlide>
          <img
            src="/image/productBanner1.jpg"
            alt="春季新品特價"
            className="w-100 h-64 object-cover rounded-lg"
          />
        </SwiperSlide>
        <SwiperSlide>
          <img
            src="/image/productBanner2.jpg"
            alt="熱銷商品推薦"
            className="w-100 h-64 object-cover rounded-lg"
          />
        </SwiperSlide>
        <SwiperSlide>
          <img
            src="/image/productBanner3.jpg"
            alt="限時優惠"
            className="w-100 h-64 object-cover rounded-lg"
          />
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
