import React, { useState } from "react";
import Link from "next/link";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import "./genre.css";

export const genres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller", "Horror", "Mecha", "Music", "Psychological", "Mahou Shoujo", "Ecchi"];

export default function Genre() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const list = isCollapsed ? genres.slice(0, 8) : genres;

  return (
    <section className="genre-wrapper" aria-labelledby="genre-heading">
      <h2 id="genre-heading">Browse genres</h2>
      <div className="genre-list">
        {list.map((genre) => (
          <Link key={genre} href={`/?${new URLSearchParams({ genre })}`}>{genre}</Link>
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
