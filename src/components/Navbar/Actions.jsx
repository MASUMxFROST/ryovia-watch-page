import React from "react";
import { FaBroadcastTower, FaComments, FaRandom } from "react-icons/fa";

export default function Actions({ isInSidebar }) {
  return (
    <div
      className="nav-actions f-poppins text-light trans-c-03"
      style={
        isInSidebar
          ? {
              display: "flex",
              background: "var(--dark)",
              marginInline: "0px",
              borderRadius: "0px",
            }
          : {}
      }
      aria-hidden="true"
    >
      <span>
        <button type="button" tabIndex={-1}>
          <FaBroadcastTower size={20} />
          <p>Watch Togather</p>
        </button>
      </span>
      <span>
        <button type="button" tabIndex={-1}>
          <FaRandom size={20} />
          <p>Random</p>
        </button>
      </span>
      {!isInSidebar && (
        <span>
          <button type="button" tabIndex={-1}>
            <FaComments size={20} />
            <p>Community</p>
          </button>
        </span>
      )}
    </div>
  );
}
