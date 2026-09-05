import React from "react";
import "./mouse-over-card.css";

export default function MouseOverCard({ anime }) {
  return (
    <div className="mouse-over-card-wrapper">
      <strong>{anime.title}</strong>
      <p>{anime.description || "Open this anime to explore its details."}</p>
      <span>{anime.status?.replaceAll("_", " ")}</span>
    </div>
  );
}
