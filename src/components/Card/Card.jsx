import React, { useState } from "react";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import "./card.css";
import MouseOverCard from "./MouseOverCard";
import LazyImage from "../../utils/LazyImage";

export default function Card({ data: anime }) {
  const [isHovered, setIsHovered] = useState(false);
  const title = anime.title;

  return (
    <article
      id={`anime-${anime.id}`}
      className="anime-card-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <Link href={`/watch/${anime.id}`} className="anime-card" aria-label={title}>
        <div className="anime-card-img-wrapper">
          {anime.poster ? <LazyImage
            src={anime.poster}
            alt={`${title} poster`}
            isAnimated={false}
          /> : <span className="card-poster-placeholder">{title}</span>}
          {anime.score != null && (
            <span className="card-score" aria-label={`Score ${anime.score}`}>
              <FaStar aria-hidden="true" /> {anime.score.toFixed(1)}
            </span>
          )}
          <div className="tick-item">
            <span className="episode-count">{anime.episodes ? `${anime.episodes} episodes` : "Episodes TBA"}</span>
            {anime.year && <span className="rating">{anime.year}</span>}
          </div>
        </div>
        <div className="card-details">
          <h3 className="card-title" title={title}>{title}</h3>
          <div className="card-statistics">
            <span>{anime.format?.replaceAll("_", " ") || "Anime"}</span>
            {anime.durationMinutes && <><span className="card-statistics-dot" aria-hidden="true">·</span><span>{anime.durationMinutes} min</span></>}
          </div>
        </div>
      </Link>
      {isHovered && <MouseOverCard anime={anime} />}
    </article>
  );
}
