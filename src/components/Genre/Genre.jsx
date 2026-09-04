import React, { useRef, useState } from "react";
import "./genre.css";
import { easeOut, motion } from "framer-motion";
import useAnimationOnce from "../../hooks/useAnimationOnce";
import { genreList as genres } from "../../data/watch-page";
export default function Genre() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const containerRef = useRef(null);
  const containerInView = useAnimationOnce(containerRef);
  const list = isCollapsed ? genres.slice(0, 18) : genres;

  const genreLinks = list.map((el) => {
    return (
      <a
        key={el}
        href="#recommendations"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={containerInView && { opacity: 1, x: ["100%", "-10%", "0%"] }}
          transition={{ duration: 0.5 }}
        >
          {el}
        </motion.div>
      </a>
    );
  });

  return (
    <motion.div
      ref={containerRef}
      className="genre-wrapper "
      initial={{ opacity: 0 }}
      animate={containerInView && { x: ["50%", "-10%", "0%"], opacity: 1 }}
      transition={{ ease: easeOut, duration: 0.4 }}
    >
      <h2>Genre</h2>
        <div className="genre-list d-flex a-center j-center">
          {genreLinks}

          <button
            className="f-poppins trans-03"
            onClick={() => setIsCollapsed((prev) => !prev)}
          >
            {isCollapsed ? "Show More" : "Show Less"}
          </button>
        </div>
    </motion.div>
  );
}
