import React from "react";
import "./mouse-over-card.css";

export default function MouseOverCard({ anime }) {
  return (
    <div className="mouse-over-card-wrapper">
      <strong>{anime.title_english || anime.title}</strong>
      <p>{anime.synopsis}</p>
      <span>{anime.status}</span>
    </div>
  );
}
