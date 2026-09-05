import React, { useEffect, useRef, useState } from "react";
import { FaBars, FaChevronRight, FaSearch, FaTimes } from "react-icons/fa";
import logo from "../../media/ryovia-logo.png";
import { recommendedAnime, watchPageAnime } from "../../data/watch-page";
import "./navbar.css";

const catalog = [
  { title: watchPageAnime.title, poster: watchPageAnime.poster, href: "#watch", detail: "28 episodes" },
  ...recommendedAnime.map((anime) => ({
    title: anime.title,
    poster: anime.images.webp.image_url,
    href: `#anime-${anime.id}`,
    detail: `${anime.type} · ${anime.episodes} episodes`,
  })),
];

export default function Navbar({ sidebarIsOpen, setSidebarIsOpen }) {
  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const searchToggleRef = useRef(null);
  const matches = catalog.filter((anime) =>
    anime.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    function closeOutside(event) {
      if (!searchRef.current?.contains(event.target) && !searchToggleRef.current?.contains(event.target)) {
        setResultsOpen(false);
        setMobileSearchOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) inputRef.current?.focus();
  }, [mobileSearchOpen]);

  function closeSearch() {
    setResultsOpen(false);
    setMobileSearchOpen(false);
    if (mobileSearchOpen) searchToggleRef.current?.focus();
  }

  return (
    <header className="navigation-bar">
      <nav className="navigation-inner" aria-label="Main navigation">
        <div className="menu-group">
          <button
            type="button"
            className="nav-icon-button"
            aria-label="Open navigation menu"
            aria-controls="navigation-drawer"
            aria-expanded={sidebarIsOpen}
            onClick={() => setSidebarIsOpen(true)}
          >
            <FaBars aria-hidden="true" />
          </button>
          <a className="brand-logo-window" href="/watch" aria-label="Ryovia home">
            <img src={logo.src} alt="Ryovia" className="brand-logo-image" />
          </a>
        </div>

        <div className="navigation-page-links">
          <a href="#watch" className="is-current" aria-current="page">Watch</a>
          <a href="#recommendations">Discover</a>
        </div>

        <form
          ref={searchRef}
          className={`nav-search ${mobileSearchOpen ? "is-mobile-open" : ""}`}
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            setResultsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              closeSearch();
            }
          }}
        >
          <input
            ref={inputRef}
            id="anime-search"
            type="search"
            autoComplete="off"
            aria-label="Search anime in this collection"
            aria-controls="anime-search-results"
            placeholder="Search anime..."
            value={query}
            onFocus={() => setResultsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setResultsOpen(true);
            }}
          />
          <button type="submit" className="nav-search-submit" aria-label="Search anime">
            <FaSearch aria-hidden="true" />
          </button>
          {resultsOpen && query.trim() && (
            <div id="anime-search-results" className="nav-search-results">
              <p className="search-results-label" role="status">
                {matches.length ? `${matches.length} in this collection` : "No matches in this collection"}
              </p>
              {matches.map((anime) => (
                <a key={anime.title} href={anime.href} onClick={closeSearch}>
                  <img src={anime.poster} alt="" />
                  <span><strong>{anime.title}</strong><small>{anime.detail}</small></span>
                  <FaChevronRight aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </form>

        <span className="navigation-preview"><span aria-hidden="true" />Preview</span>
        <button
          ref={searchToggleRef}
          type="button"
          className="nav-icon-button mobile-search-toggle"
          aria-label={mobileSearchOpen ? "Close search" : "Open search"}
          aria-controls="anime-search"
          aria-expanded={mobileSearchOpen}
          onClick={() => setMobileSearchOpen((open) => !open)}
        >
          {mobileSearchOpen ? <FaTimes aria-hidden="true" /> : <FaSearch aria-hidden="true" />}
        </button>
      </nav>
    </header>
  );
}
