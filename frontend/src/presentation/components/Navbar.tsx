import "./Navbar.css";

export function Navbar() {
  return (
    <header className="navbar">
      <a className="navbar__brand" href="#top">
        <img src="/favicon.svg" alt="" width={28} height={28} />
        WINDCAST
      </a>
      <span className="navbar__source">National wind · Elexon BMRS</span>
      <a className="pill pill--dark" href="#controls">
        Open the desk →
      </a>
    </header>
  );
}
