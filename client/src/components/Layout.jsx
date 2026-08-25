import { Link, Outlet, useLocation } from 'react-router-dom';

function WaypointLogo() {
  return (
    <svg className="brand-mark" width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wp-grad" x1="10" y1="4" x2="38" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <path d="M24 3.5C15.44 3.5 8.5 10.44 8.5 19c0 6.02 4.55 13.02 8.37 17.87A78.6 78.6 0 0 0 24 44.5c1.6-1.6 4.02-4.16 6.13-7.16C34.16 31.6 39.5 24.4 39.5 19 39.5 10.44 32.56 3.5 24 3.5Z" fill="url(#wp-grad)" />
      <path d="M24 10.5 32.5 19 24 27.5 15.5 19Z" fill="#fff" />
      <circle cx="24" cy="19" r="3" fill="url(#wp-grad)" />
    </svg>
  );
}

export default function Layout() {
  const loc = useLocation();
  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          <WaypointLogo />
          <span className="brand-name">Waypoint</span>
        </Link>
        <nav className="topnav">
          <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>Dashboard</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer">Docs</a>
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
