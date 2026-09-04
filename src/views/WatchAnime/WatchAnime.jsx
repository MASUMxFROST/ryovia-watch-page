"use client";

import { useState } from "react";
import { easeOut, motion } from "framer-motion";
import {
  FaClosedCaptioning,
  FaCog,
  FaExpand,
  FaPlay,
  FaVolumeMute,
} from "react-icons/fa";
import "../../main.css";
import "./watch-anime.css";
import RecommendedTopTen from "../../Layouts/RecommendedTopTen";
import Share from "../../components/Share/Share";
import { watchPageAnime } from "../../data/watch-page";

export default function WatchAnime() {
  const [descIsCollapsed, setDescIsCollapsed] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [language, setLanguage] = useState("sub");
  const [server, setServer] = useState("1");
  const episodeNumbers = Array.from(
    { length: watchPageAnime.episodeCount },
    (_, index) => index + 1
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: easeOut }}
    >
      <section id="watch" className="watch-container d-flex" aria-label="Watch anime">
        <img
          className="watch-container-background"
          src={watchPageAnime.poster}
          alt=""
        />

        <div className="media-center d-flex">
          <aside className="episode-container" aria-label="Episode list">
            <p>List of Episodes:</p>
            <div className="episode-tiles-wrapper d-flex a-center">
              {episodeNumbers.map((episode) => (
                <button
                  type="button"
                  className={`episode-tile ${
                    episode === selectedEpisode ? "selected" : ""
                  }`}
                  key={episode}
                  onClick={() => setSelectedEpisode(episode)}
                  aria-pressed={episode === selectedEpisode}
                  aria-label={`Episode ${episode}`}
                >
                  {episode}
                </button>
              ))}
            </div>
          </aside>

          <div className="video-player">
            <div
              className="player-preview"
              style={{ backgroundImage: `url(${watchPageAnime.poster})` }}
              aria-label={`Episode ${selectedEpisode} player preview`}
            >
              <div className="player-preview-shade" />
              <span className="player-play" aria-hidden="true">
                <FaPlay />
              </span>
              <div className="player-control-bar" aria-hidden="true">
                <div className="player-progress"><span /></div>
                <div className="player-control-row">
                  <FaPlay />
                  <FaVolumeMute />
                  <span className="player-time">00:00 / 24:00</span>
                  <span className="player-spacer" />
                  <FaClosedCaptioning />
                  <FaCog />
                  <FaExpand />
                </div>
              </div>
            </div>

            <div className="server-container d-flex-fd-column">
              <div className="server-tile-wrapper d-flex-fd-column">
                <div>
                  Server:{" "}
                  {["1", "2"].map((item) => (
                    <button
                      type="button"
                      className={`server-tile ${server === item ? "selected" : ""}`}
                      onClick={() => setServer(item)}
                      aria-pressed={server === item}
                      key={item}
                    >
                      HD-{item}
                    </button>
                  ))}
                </div>
                <div>
                  Language Preference:{" "}
                  {["dub", "sub"].map((item) => (
                    <button
                      type="button"
                      className={`server-tile ${language === item ? "selected" : ""}`}
                      onClick={() => setLanguage(item)}
                      aria-pressed={language === item}
                      key={item}
                    >
                      {item === "dub" ? "Dub" : "Sub"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="current-anime-details">
          <div className="anime-details d-flex-fd-column">
            <img
              className="anime-details-poster"
              src={watchPageAnime.poster}
              alt={`${watchPageAnime.title} poster`}
            />
            <div className="anime-details-content d-flex-fd-column">
              <h1 className="title-large">{watchPageAnime.title}</h1>
              <p>
                {descIsCollapsed
                  ? `${watchPageAnime.description.slice(0, 150)}...`
                  : watchPageAnime.description}
                <button
                  type="button"
                  className="description-toggle"
                  onClick={() => setDescIsCollapsed((value) => !value)}
                >
                  [ {descIsCollapsed ? "More" : "Less"} ]
                </button>
              </p>
            </div>
          </div>
        </aside>
      </section>

      <Share style={{ paddingInline: 20 }} />
      <RecommendedTopTen />
    </motion.main>
  );
}
