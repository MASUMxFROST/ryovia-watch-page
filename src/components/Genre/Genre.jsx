import React, { useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import "./genre.css";
import { genreList as genres } from "../../data/watch-page";

export default function Genre() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const list = isCollapsed ? genres.slice(0, 8) : genres;

  return (
    <section className="genre-wrapper" aria-labelledby="genre-heading">
      <h2 id="genre-heading">Browse genres</h2>
      <div className="genre-list">
        {list.map((genre) => (
          <a key={genre} href="#recommendations">{genre}</a>
        ))}
      </div>
      <button
        type="button"
        className="genre-toggle"
        onClick={() => setIsCollapsed((previous) => !previous)}
        aria-expanded={!isCollapsed}
      >
        {isCollapsed ? "All genres" : "Fewer genres"}
        {isCollapsed ? <FiChevronDown aria-hidden="true" /> : <FiChevronUp aria-hidden="true" />}
      </button>
    </section>
  );
}
