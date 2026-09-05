"use client";

import { useState } from "react";
import { FaArrowLeft, FaArrowRight, FaChevronRight, FaClosedCaptioning, FaCog, FaExpand, FaPlay, FaVolumeMute } from "react-icons/fa";
import "./watch-anime.css";
import RecommendedTopTen from "../../Layouts/RecommendedTopTen";
import { watchPageAnime } from "../../data/watch-page";

const episodeNumbers = Array.from({ length: watchPageAnime.episodeCount }, (_, index) => index + 1);

export default function WatchAnime() {
  const [descIsCollapsed, setDescIsCollapsed] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [language, setLanguage] = useState("sub");
  const [server, setServer] = useState("1");
  const episodeLabel = String(selectedEpisode).padStart(2, "0");

  return (
    <main className="watch-page">
      <section id="watch" className="watch-container" aria-labelledby="watch-title">
        <nav className="watch-breadcrumbs" aria-label="Breadcrumb">
          <a href="#recommendations">Discover</a>
          <FaChevronRight aria-hidden="true" />
          <span>Watch</span>
          <FaChevronRight aria-hidden="true" />
          <span aria-current="page">Frieren</span>
        </nav>
        <header className="watch-heading">
          <div>
            <p className="watch-eyebrow">Your next adventure</p>
            <h1 id="watch-title">{watchPageAnime.title}</h1>
          </div>
          <span className="watch-episode-badge">Episode {episodeLabel}</span>
        </header>
        <div className="watch-layout">
          <div className="video-player">
            <div
              className="player-preview"
              style={{ backgroundImage: `url(${watchPageAnime.poster})` }}
              role="img"
              aria-label={`Episode ${selectedEpisode} player preview. Video playback is not available in this demo.`}
            >
              <div className="player-preview-shade" />
              <div className="player-topline" aria-hidden="true">
                <span>EPISODE {episodeLabel}</span>
                <span className="player-preview-label">Preview</span>
              </div>
              <span className="player-play" aria-hidden="true"><FaPlay /></span>
              <div className="player-control-bar" aria-hidden="true">
                <div className="player-progress"><span /></div>
                <div className="player-control-row">
                  <FaPlay /><FaVolumeMute />
                  <span className="player-time">00:00 / 24:00</span>
                  <span className="player-spacer" />
                  <FaClosedCaptioning /><FaCog /><FaExpand />
                </div>
              </div>
            </div>
            <div className="player-settings">
              <div className="player-setting-group" role="group" aria-label="Server selection">
                <span className="player-setting-label">Server</span>
                {["1", "2"].map((item) => (
                  <button type="button" className={`server-tile ${server === item ? "selected" : ""}`} onClick={() => setServer(item)} aria-pressed={server === item} key={item}>HD-{item}</button>
                ))}
              </div>
              <div className="player-setting-group" role="group" aria-label="Audio language preference">
                <span className="player-setting-label">Language</span>
                {["sub", "dub"].map((item) => (
                  <button type="button" className={`server-tile ${language === item ? "selected" : ""}`} onClick={() => setLanguage(item)} aria-pressed={language === item} key={item}>{item === "dub" ? "Dub" : "Sub"}</button>
                ))}
              </div>
            </div>
          </div>
          <aside className="watch-sidebar" aria-label="Episodes and series details">
            <section className="episode-panel" aria-labelledby="episodes-heading">
              <div className="watch-panel-heading">
                <h2 id="episodes-heading">Episodes</h2>
                <span>{watchPageAnime.episodeCount} episodes</span>
              </div>
              <p className="episode-selection-status" aria-live="polite"><span className="episode-status-dot" /> Selected: Episode {episodeLabel}</p>
              <div className="episode-tiles-wrapper">
                {episodeNumbers.map((episode) => (
                  <button type="button" className={`episode-tile ${episode === selectedEpisode ? "selected" : ""}`} key={episode} onClick={() => setSelectedEpisode(episode)} aria-pressed={episode === selectedEpisode} aria-label={`Episode ${episode}`}>{String(episode).padStart(2, "0")}</button>
                ))}
              </div>
              <div className="episode-navigation">
                <button type="button" disabled={selectedEpisode === 1} onClick={() => setSelectedEpisode((episode) => Math.max(1, episode - 1))} aria-label="Previous episode"><FaArrowLeft aria-hidden="true" /> Previous</button>
                <button type="button" disabled={selectedEpisode === watchPageAnime.episodeCount} onClick={() => setSelectedEpisode((episode) => Math.min(watchPageAnime.episodeCount, episode + 1))} aria-label="Next episode">Next episode <FaArrowRight aria-hidden="true" /></button>
              </div>
            </section>
            <section className="series-panel" aria-labelledby="series-heading">
              <div className="series-summary">
                <img className="series-poster" src={watchPageAnime.poster} alt="Frieren: Beyond Journey's End poster" width="72" height="102" />
                <div>
                  <p className="watch-eyebrow">About the series</p>
                  <h2 id="series-heading">{watchPageAnime.title}</h2>
                  <p className="series-meta">{watchPageAnime.episodeCount} episodes <span>·</span> 24 min</p>
                </div>
              </div>
              <p id="series-description" className="series-description">{descIsCollapsed ? `${watchPageAnime.description.slice(0, 150).trim()}…` : watchPageAnime.description}</p>
              <button type="button" className="description-toggle" aria-expanded={!descIsCollapsed} aria-controls="series-description" onClick={() => setDescIsCollapsed((value) => !value)}>{descIsCollapsed ? "Read more" : "Show less"}</button>
            </section>
          </aside>
        </div>
      </section>
      <RecommendedTopTen />
    </main>
  );
}
