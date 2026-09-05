import React, { useEffect, useRef } from "react";
import { FaArrowLeft, FaCompass, FaPlay, FaTimes } from "react-icons/fa";
import logo from "../../media/ryovia-logo.png";
import "./nav-sidebar.css";

export default function NavSidebar({ sidebarIsOpen, setSidebarIsOpen }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!sidebarIsOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector("button")?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") setSidebarIsOpen(false);
      if (event.key !== "Tab") return;
      const focusable = drawerRef.current?.querySelectorAll("a[href], button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [sidebarIsOpen, setSidebarIsOpen]);

  if (!sidebarIsOpen) return null;

  return (
    <div
      className="navigation-sidebar"
      onClick={(event) => {
        if (event.target === event.currentTarget) setSidebarIsOpen(false);
      }}
    >
      <div
        ref={drawerRef}
        id="navigation-drawer"
        className="navigation-list"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="navigation-drawer-header">
          <a className="brand-logo-window" href="/watch" aria-label="Ryovia home" onClick={() => setSidebarIsOpen(false)}>
            <img className="brand-logo-image" src={logo.src} alt="Ryovia" />
          </a>
          <button type="button" className="nav-icon-button" aria-label="Close navigation menu" onClick={() => setSidebarIsOpen(false)}>
            <FaTimes aria-hidden="true" />
          </button>
        </div>
        <p className="navigation-drawer-label">YOUR NEXT ADVENTURE</p>
        <nav className="navigation-link-list" aria-label="Explore Ryovia">
          <a href="#watch" onClick={() => setSidebarIsOpen(false)}><FaPlay aria-hidden="true" /><span>Watch anime<small>Continue the journey</small></span></a>
          <a href="#recommendations" onClick={() => setSidebarIsOpen(false)}><FaCompass aria-hidden="true" /><span>Discover<small>Explore this collection</small></span></a>
        </nav>
        <div className="navigation-drawer-note">
          <span>Ryovia preview</span>
          <p>A little closer to your next favorite anime.</p>
          <button type="button" onClick={() => setSidebarIsOpen(false)}><FaArrowLeft aria-hidden="true" /> Back to watching</button>
        </div>
      </div>
    </div>
  );
}
