import React, { useState } from "react";
import "./navbar.css";
import logo from "../../media/logo.png";
import { FaSearch, FaBars } from "react-icons/fa";

import Actions from "./Actions";
import SocialLinks from "./SocialLinks";

export default function NavBar(props) {
  const [searchForm, setSearchForm] = useState({ name: "" });
  const [floatSearchIsVisible, setFloatSearchIsVisible] = useState(false);
  const setSidebarIsOpen = props.setSidebarIsOpen;
  const pageIsScrolled = props.isScrolled;
  function handleSearchForm(event) {
    const { name, value } = event.target;
    setSearchForm((prev) => ({ ...prev, [name]: value }));
  }
  function submitSearch(event) {
    event.preventDefault();
    setSearchForm({ name: "" });
    setFloatSearchIsVisible(false);
  }
  return (
    <>
      <nav
        className={`navigation-bar a-center d-flex ${
          pageIsScrolled ? "dark" : "transparent"
        } trans-03`}
      >
        <div className="menu-group a-center d-flex">
          <FaBars
            size={20}
            className="burger-icon trans-05"
            onClick={() => setSidebarIsOpen(true)}
          />
          <div className="logo-wrapper a-center d-flex">
            <button
              type="button"
              className="logo-button"
              aria-label="Back to top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <img
                src={logo.src}
                className="logo"
                alt="Ryovia"
              />
            </button>
          </div>
        </div>
        <form className="search-wrapper" onSubmit={submitSearch}>
          <input
            style={
              pageIsScrolled
                ? { backgroundColor: "var(--grey-dark)", color: "var(--theme)" }
                : { backgroundColor: "white", color: "black" }
            }
            type="text"
            className="search-text f-poppins  trans-03"
            placeholder="Search anime..."
            name="name"
            value={searchForm?.name}
            onChange={(e) => handleSearchForm(e)}
          />
          <button type="submit" className="search-submit" aria-label="Search anime">
            <FaSearch
              className="search-icon search-icons trans-03"
              size={20}
              style={
                pageIsScrolled
                  ? {
                      color: "var(--theme)",
                    }
                  : { color: "black" }
              }
            />
          </button>

          {/* <FaFilter className="filter-icon search-icons" size={20} color="grey" /> */}
        </form>
        <SocialLinks />
        <Actions isInSidebar={false} />
        <div className="user-profile-nots a-center j-center d-flex trans-c-03">
          <FaSearch
            onClick={() => {
              setFloatSearchIsVisible((prev) => !prev);
            }}
          />
        </div>
      </nav>
      {floatSearchIsVisible && (
        <form className="floating-search-wrapper" onSubmit={submitSearch}>
          <input
            type="text"
            className="search-text f-poppins"
            placeholder="Search anime..."
            name="name"
            value={searchForm?.name}
            onChange={(e) => handleSearchForm(e)}
          />
          <button type="submit" className="search-submit" aria-label="Search anime">
            <FaSearch
              className="search-icon search-icons"
              size={20}
              color="black"
            />
          </button>
        </form>
      )}
    </>
  );
}
