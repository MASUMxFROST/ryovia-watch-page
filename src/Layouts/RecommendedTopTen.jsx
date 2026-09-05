"use client";

import React from "react";
import TopTenAnime from "../components/TopTen/TopTenAnime";
import AnimeCollection from "../components/MainContainer/AnimeCollection";
import Genre from "../components/Genre/Genre";
export default function RecommendedTopTen({ children, data = [] }) {
  return (
    <>
      {children}

      <section
        id="recommendations"
        className="main-container"
        aria-label="Discover more anime"
      >
        <div className="collections-wrapper">
          {data.length ? <AnimeCollection collectionName="More to discover" data={data} /> : <div className="recommendations-empty"><h2>Find your next anime</h2><p>No recommendations are available for this title yet.</p><a href="/">Explore the anime catalog →</a></div>}
          <p className="recommendation-attribution">Recommendations and ratings from <a href="https://anilist.co" target="_blank" rel="noreferrer">AniList</a>.</p>
        </div>
        <aside className="sidebar-wrapper" aria-label="Anime discovery">
          {data.length > 0 && <TopTenAnime data={data} />}
          <Genre />
        </aside>
      </section>
    </>
  );
}
