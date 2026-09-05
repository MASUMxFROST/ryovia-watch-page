import React from "react";
import { FaArrowUp } from "react-icons/fa";
import logo from "../../media/ryovia-logo.png";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <a className="brand-logo-window footer-logo" href="/" aria-label="Ryovia home">
          <img src={logo.src} className="brand-logo-image" alt="Ryovia" />
        </a>
        <div className="footer-copy">
          <p>Your next adventure starts here.</p>
          <span>Ryovia · Discover anime with AniList</span>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="/">Discover anime</a>
          <a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Back to top <FaArrowUp aria-hidden="true" /></a>
        </nav>
      </div>
    </footer>
  );
}
