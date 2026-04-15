import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export default function PublicHeader() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href.includes('#')) return false;
    return location.pathname === href;
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all ${
        scrolled ? 'bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <Logo variant="dark" size="sm" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'text-campus-800 bg-campus-50 font-semibold'
                  : 'text-gray-500 hover:text-campus-700 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="h-10 px-4 inline-flex items-center justify-center rounded-lg bg-campus-800 text-white text-sm font-semibold hover:bg-campus-700 transition-colors"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="h-10 px-4 inline-flex items-center justify-center rounded-lg text-sm font-medium text-campus-800 hover:bg-campus-50 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="h-10 px-4 inline-flex items-center justify-center rounded-lg bg-campus-800 text-white text-sm font-semibold hover:bg-campus-700 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-campus-800 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-6 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-campus-800 hover:bg-campus-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="h-10 inline-flex items-center justify-center rounded-lg bg-campus-800 text-white text-sm font-semibold"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="h-10 inline-flex items-center justify-center rounded-lg border border-gray-200 text-sm font-medium text-campus-800"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="h-10 inline-flex items-center justify-center rounded-lg bg-campus-800 text-white text-sm font-semibold"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
