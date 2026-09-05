import "../main.css";
import "../components/AnimeInfo/AnimeInfo.css";
import Nav from "../Layouts/Nav";
import logo from "../media/ryovia-logo.png";

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
  // Browser extensions can inject crxlauncher attributes before React hydrates.
  // Limit suppression to <html>; keep hydration checks for the app below it.
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Nav>{children}</Nav>
      </body>
    </html>
  );
}
