import React, { useState } from "react";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import "./top-ten.css";
import LazyImage from "../../utils/LazyImage";

const sortOptions = [
  { value: "trending", label: "Featured" },
  { value: "popular", label: "Popular" },
  { value: "score", label: "Rating" },
];

export default function TopTenAnime({ data = [] }) {
  const [period, setPeriod] = useState("trending");
  const sortedList = [...data].sort((a, b) => {
    if (period === "score") return (b.score || 0) - (a.score || 0);
    if (period === "popular") return (b.popularity || 0) - (a.popularity || 0);
    return 0;
  }).slice(0, 10);

  return (
    <section className="top-ten-wrapper" aria-labelledby="popular-anime-heading">
      <div className="top-ten-header">
        <h2 id="popular-anime-heading">From these recommendations</h2>
        <div className="top-ten-tabs" aria-label="Sort recommendations">
          {sortOptions.map(({ value, label }) => (
            <button
              type="button"
              key={value}
              onClick={() => setPeriod(value)}
              className={`period-selector ${period === value ? "selected" : ""}`}
              aria-pressed={period === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ol className="popular-anime-list">
        {sortedList.map((anime, index) => {
          const title = anime.title;
          return (
            <li key={anime.id}>
              <span className={`rank ${index < 3 ? "top-three" : ""}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link href={`/watch/${anime.id}`} className="top-10-item">
                {anime.poster ? <LazyImage
                  src={anime.poster}
                  alt={`${title} poster`}
                  isAnimated={false}
                /> : <span className="top-ten-poster-placeholder" aria-hidden="true" />}
                <div className="popular-anime-details">
                  <span className="popular-anime-title">{title}</span>
                  <div className="episode-info">
                    <span>{anime.format?.replaceAll("_", " ") || "Anime"}</span>
                    <span>·</span>
                    <span>{anime.episodes ? `${anime.episodes} eps` : "TBA"}</span>
                    {anime.score != null && (
                      <span className="popular-anime-score">
                        <FaStar aria-hidden="true" />{anime.score.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
