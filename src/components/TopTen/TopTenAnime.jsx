import React, { useRef, useState } from "react";
import "./top-ten.css";
import { FaStar } from "react-icons/fa";
import { easeOut, motion } from "framer-motion";
import useAnimationOnce from "../../hooks/useAnimationOnce";
import LazyImage from "../../utils/LazyImage";
export default function TopTenAnime({ data = [] }) {
  const ref = useRef(null);
  const containerInView = useAnimationOnce(ref);

  const [period, setPeriod] = useState("trending");
  const animeList = [...data];
  const sortedList = animeList.sort((a, b) => {
    if (period === "score") return (b.score || 0) - (a.score || 0);
    if (period === "popular") return (b.popularity || 0) - (a.popularity || 0);
    return 0;
  }).slice(0, 10);
  const list = sortedList?.map((el, idx) => {
    const title = el.title_english || el.title;
    return (
      <motion.li
        key={title}
        className="d-flex a-center"
        initial={{ opacity: 0 }}
        animate={containerInView && { opacity: 1, x: ["100%", "-3%", "0%"] }}
        transition={{ duration: 0.1 * idx }}
      >
        <span
          className={`rank ${0 < idx + 1 && idx + 1 <= 3 ? "top-three" : ""}`}
        >
          {idx + 1 > 9 ? idx + 1 : "0" + (idx + 1)}
        </span>
        <div className="top-10-item d-flex a-center">
          <LazyImage
            src={el.images.webp.image_url}
            alt="poster"
            isInView={containerInView}
          />
          <div className="anime-details d-flex-fd-column">
            <span className="title">
              <a
                href="#recommendations"
                className="trans-03"
              >
                {title}
              </a>
            </span>
            <div className="episode-info d-flex ">
              <span className="episode-count">
                EP:
                {el.episodes || "NA"}
              </span>
              <span className="quality d-flex a-center j-center">
                <FaStar />
                {el.score || "?"}
              </span>
              <div className="show-type">{el.type}</div>
            </div>
          </div>
        </div>
      </motion.li>
    );
  });

  return (
    <motion.div
      className="top-ten-wrapper"
      ref={ref}
      initial={{ opacity: 0 }}
      animate={
        containerInView
          ? { opacity: 1, x: ["10%", "-3%", "0%"] }
          : { opacity: 0 }
      }
      transition={{ duration: 0.6, ease: easeOut }}
    >
      <div className="top-ten-header d-flex a-center">
        <h2>Top 10</h2>
        <div className="top-ten-tabs">
          <button
            onClick={() => setPeriod("trending")}
            className={`${
              period === "trending" ? "selected" : ""
            } period-selector f-poppins`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod("popular")}
            className={`${
              period === "popular" ? "selected" : ""
            } period-selector f-poppins`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod("score")}
            className={`${
              period === "score" ? "selected" : ""
            } period-selector f-poppins`}
          >
            Month
          </button>
        </div>
      </div>
      <ul>{list}</ul>
    </motion.div>
  );
}
