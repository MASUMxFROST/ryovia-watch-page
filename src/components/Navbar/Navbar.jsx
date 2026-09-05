import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaBars, FaChevronRight, FaSearch, FaTimes } from "react-icons/fa";
import logo from "../../media/ryovia-logo.png";
import "./navbar.css";

export default function Navbar({ sidebarIsOpen, setSidebarIsOpen }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const searchToggleRef = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    const search = query.trim().slice(0, 100);
    setMatches([]);
    setError("");
    setIsLoading(Boolean(search));
    if (!search) return () => controller.abort();

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/anime?${new URLSearchParams({ search, perPage: "5" })}`, {
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "Search is unavailable. Please try again.");
        if (!controller.signal.aborted) setMatches(body.data || []);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message || "Search is unavailable. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, attempt]);

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
          <Link className="brand-logo-window" href="/" aria-label="Ryovia home">
            <img src={logo.src} alt="Ryovia" className="brand-logo-image" />
          </Link>
        </div>

        <div className="navigation-page-links">
          <Link href="/watch" className={pathname.startsWith("/watch") ? "is-current" : ""} aria-current={pathname.startsWith("/watch") ? "page" : undefined}>Watch</Link>
          <Link href="/" className={pathname === "/" ? "is-current" : ""} aria-current={pathname === "/" ? "page" : undefined}>Discover</Link>
        </div>

        <form
          ref={searchRef}
          className={`nav-search ${mobileSearchOpen ? "is-mobile-open" : ""}`}
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            closeSearch();
            router.push(query.trim() ? `/?${new URLSearchParams({ search: query.trim() })}` : "/");
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
            aria-label="Search anime"
            aria-controls="anime-search-results"
            placeholder="Search anime..."
            maxLength={100}
            value={query}
            onFocus={() => setResultsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value.slice(0, 100));
              setResultsOpen(true);
            }}
          />
          <button type="submit" className="nav-search-submit" aria-label="Search anime">
            <FaSearch aria-hidden="true" />
          </button>
          {resultsOpen && query.trim() && (
            <div id="anime-search-results" className="nav-search-results" aria-busy={isLoading}>
              <p className="search-results-label" role="status">
                {isLoading ? "Searching AniList…" : error || (matches.length ? "Anime on AniList" : "No anime found. Try another title.")}
              </p>
              {error && <button type="button" className="nav-search-retry" onClick={() => setAttempt((value) => value + 1)}>Try again</button>}
              {matches.map((anime) => (
                <Link key={anime.id} href={`/watch/${anime.id}`} onClick={closeSearch}>
                  {anime.poster ? <img src={anime.poster} alt="" /> : <span className="search-poster-placeholder" aria-hidden="true" />}
                  <span><strong>{anime.title}</strong><small>{[anime.format?.replaceAll("_", " "), anime.year, anime.episodes ? `${anime.episodes} episodes` : null].filter(Boolean).join(" · ")}</small></span>
                  <FaChevronRight aria-hidden="true" />
                </Link>
              ))}
              {!isLoading && !error && matches.length > 0 && <Link className="nav-search-view-all" href={`/?${new URLSearchParams({ search: query.trim() })}`} onClick={closeSearch}>View all results <FaChevronRight aria-hidden="true" /></Link>}
            </div>
          )}
        </form>

        <span className="navigation-preview"><span aria-hidden="true" />Anime catalog</span>
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
