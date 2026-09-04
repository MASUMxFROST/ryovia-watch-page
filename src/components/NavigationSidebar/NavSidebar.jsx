import React from "react";
import { FaChevronLeft, FaComments } from "react-icons/fa";
import "./nav-sidebar.css";
import Actions from "../Navbar/Actions";
export default function NavSidebar(props) {
  function scrollToTop() {
    window.scrollTo({ top: 0 });
  }
  return (
    <div
      className="navigation-sidebar f-poppins"
      style={{ zIndex: props.sidebarIsOpen ? 100 : -1 }}
      onClick={() => props.setSidebarIsOpen(false)}
    >
      <div
        className="navigation-list d-flex"
        style={{
          transform: props.sidebarIsOpen
            ? "translateX(250px)"
            : "translateX(-250px)",
        }}
      >
        <div className="button-group d-flex-fd-column">
          <div
            className="d-flex a-center j-center close-menu"
            style={{ width: "60%" }}
            onClick={() => props.setSidebarIsOpen()}
          >
            <FaChevronLeft size={12} />
            Close Menu
          </div>
          <Actions isInSidebar={true} />
          <button type="button" className="community-item d-flex a-center j-center">
            <FaComments size={14} />
            Community
          </button>
        </div>

        <div className="navigation-link-list">
          <ul>
            <li>
              <a onClick={() => scrollToTop()} href="#watch">
                Home
              </a>
            </li>
            <li>
              <a href="#recommendations">
                Most Popular
              </a>
            </li>
            <li>
              <a
                onClick={() => scrollToTop()}
                href="#recommendations"
              >
                Movies
              </a>
            </li>
            <li>
              <a
                onClick={() => scrollToTop()}
                href="#recommendations"
              >
                TV Series
              </a>
            </li>
            <li>
              <a
                onClick={() => scrollToTop()}
                href="#recommendations"
              >
                OVAs
              </a>
            </li>
            <li>
              <a
                onClick={() => scrollToTop()}
                href="#recommendations"
              >
                ONAs
              </a>
            </li>
            <li>
              <a
                onClick={() => scrollToTop()}
                href="#recommendations"
              >
                Specials
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
