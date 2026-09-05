"use client";

import React from "react";
import TopTenAnime from "../components/TopTen/TopTenAnime";
import AnimeCollection from "../components/MainContainer/AnimeCollection";
import Genre from "../components/Genre/Genre";
import { recommendedAnime } from "../data/watch-page";
export default function RecommendedTopTen({ children }) {
  return (
    <>
      {children}

      <section
        id="recommendations"
        className="main-container"
        aria-label="Discover more anime"
      >
        <div className="collections-wrapper">
          <AnimeCollection
            collectionName="More to discover"
            data={recommendedAnime}
          />
        </div>
        <aside className="sidebar-wrapper" aria-label="Anime discovery">
          <TopTenAnime data={recommendedAnime} />
          <Genre />
        </aside>
      </section>
    </>
  );
}
