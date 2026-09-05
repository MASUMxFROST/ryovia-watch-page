import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import "./card.css";
import MouseOverCard from "./MouseOverCard";
import LazyImage from "../../utils/LazyImage";

export default function Card({ data: anime }) {
  const [isHovered, setIsHovered] = useState(false);
  const title = anime.title_english || anime.title;

  return (
    <article
      id={`anime-${anime.id}`}
      className="anime-card-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <a href="#recommendations" className="anime-card" aria-label={title}>
        <div className="anime-card-img-wrapper">
          <LazyImage
            src={anime.images.webp.large_image_url}
            alt={`${title} poster`}
            isAnimated={false}
          />
          {anime.score != null && (
            <span className="card-score" aria-label={`Score ${anime.score}`}>
              <FaStar aria-hidden="true" /> {anime.score.toFixed(2)}
            </span>
          )}
          <div className="tick-item">
            <span className="episode-count">{anime.episodes} episodes</span>
            <span className="rating">{anime.rating}</span>
          </div>
        </div>
        <div className="card-details">
          <h3 className="card-title" title={title}>{title}</h3>
          <div className="card-statistics">
            <span>{anime.type}</span>
            <span className="card-statistics-dot" aria-hidden="true">·</span>
            <span>{anime.duration}</span>
          </div>
        </div>
      </a>
      {isHovered && <MouseOverCard anime={anime} />}
    </article>
  );
}
