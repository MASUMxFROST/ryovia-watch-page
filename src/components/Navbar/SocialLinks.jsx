import React from "react";
import {
  FaDiscord,
  FaRedditAlien,
  FaTelegramPlane,
  FaTwitter,
} from "react-icons/fa";

export default function SocialLinks() {
  const socials = [
    [FaDiscord, "#6f85d5"],
    [FaRedditAlien, "#ff3c1f"],
    [FaTelegramPlane, "#08c"],
    [FaTwitter, "#1d9bf0"],
  ];

  return (
    <div className="social-links-wrapper" aria-hidden="true">
      {socials.map(([Icon, color], index) => (
        <span
          style={{ backgroundColor: color }}
          className="d-flex a-center j-center"
          key={index}
        >
          <Icon size={22} />
        </span>
      ))}
    </div>
  );
}
