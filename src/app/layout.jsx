import "../main.css";
import "../components/AnimeInfo/AnimeInfo.css";
import Nav from "../Layouts/Nav";
import logo from "../media/logo.png";

export const metadata = {
  title: {
    default: "Ryovia",
    template: "%s | Ryovia",
  },
  description:
    "Discover anime, explore series details, and find your next show on Ryovia.",
  icons: { icon: logo.src },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav>{children}</Nav>
      </body>
    </html>
  );
}
