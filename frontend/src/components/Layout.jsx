import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Info, Upload } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/map', label: 'Map View', icon: Map },
  { to: '/about', label: 'About', icon: Info },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Readability Gradient */}
      <div className="readability-gradient z-0"></div>

      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-brand-500 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95"
          >
            <div>
              <span className="brand-logo text-brand-dark">
                INFRA<span className="text-brand-accent">XRAY</span>
              </span>
            </div>
          </NavLink>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                aria-label={label}
                title={label}
                className={({ isActive }) => `nav-link ${isActive ? 'opacity-55' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-brand-muted relative z-10 font-sans font-medium">
        INFRA-XRAY — AI-Powered Infrastructure Evidence Verification
      </footer>
    </div>
  );
}
