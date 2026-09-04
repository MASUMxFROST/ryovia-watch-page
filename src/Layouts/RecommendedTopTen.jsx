"use client";

import React from "react";
import TopTenAnime from "../components/TopTen/TopTenAnime";
import AnimeCollection from "../components/MainContainer/AnimeCollection";
import Genre from "../components/Genre/Genre";
import { easeOut, motion } from "framer-motion";
import { recommendedAnime } from "../data/watch-page";
export default function RecommendedTopTen({ children }) {
  return (
    <>
      {children}

      <motion.div
        id="recommendations"
        className=" main-container d-flex"
        initial={{ opacity: 0 }}
        animate={{ x: [0, 0], opacity: 1 }}
        transition={{ duration: 0.7, ease: easeOut }}
      >
        <div className="sidebar-wrapper d-flex-fd-column">
          <Genre />
          <TopTenAnime data={recommendedAnime} />
        </div>
        <div
          className=" collections-wrapper d-flex  "
        >
          <AnimeCollection
            collectionName="Recommended for you"
            data={recommendedAnime}
          />
        </div>
      </motion.div>
    </>
  );
}
