import React from "react";
import "./footer.css";
import logo from "../../media/logo.png";
import SocialLinks from "../Navbar/SocialLinks";
export default function Footer() {
  function getAlphabets() {
    const alphabets = [];
    const startChar = "A".charCodeAt(0);
    const endChar = "Z".charCodeAt(0);
    for (let i = startChar; i <= endChar; i++) {
      alphabets.push(String.fromCharCode(i));
    }
    const links = alphabets.map((el) => {
      return (
        <a
          href="#recommendations"
          key={el}
          className="alphabet-tile"
        >
          {el}
        </a>
      );
    });
    return [...links];
  }
  const links = getAlphabets();

  return (
    <div className="footer-container d-flex-fd-column j-center">
      <div className="logo-social-links d-flex">
        <a
          className="main-element"
          href="#watch"
          onClick={() => window.scrollTo({ top: 0 })}
        >
          <img src={logo.src} className="logo" alt="Ryovia" />
        </a>
        <SocialLinks />
      </div>
      <div className="help-text d-flex">
        <h2 className="main-element">A-Z List</h2>
        <span>Searching anime order by alphabet name A to Z.</span>
      </div>
      <div className="alphabet-list d-flex">{links}</div>
      <div className="copyright-text">
        <p>
          Kaido does not store any files on our server; we only link to the
          media which is hosted on 3rd party services.
        </p>
        <p>&copy; Kaido All rights reserved.</p>
      </div>
    </div>
  );
}
