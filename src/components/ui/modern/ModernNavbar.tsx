import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronDown } from 'lucide-react';
import { KinomaLogo } from '../KinomaLogo';
import { SearchBar } from '../SearchBar';

const NAV = [
  { href: '/search', label: 'Explore', items: [{ href: '/search', label: 'Browse Anime' }, { href: '/whats-new', label: "What's New" }] },
  { href: '/library', label: 'Library', items: [{ href: '/library', label: 'My List' }, { href: '/history', label: 'History' }] },
  { href: '/about', label: 'About', items: [{ href: '/about', label: 'Kinoma' }, { href: '/terms', label: 'Terms' }] },
];

export function ModernNavbar() {
  const [location] = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="kinoma-header sticky top-0 z-[var(--z-header)] w-full">
      <div className="kinoma-header__inner kinoma-shell">
        <Link href="/home" aria-label="Kinoma home" className="kinoma-header__brand kinoma-focus">
          <KinomaLogo size="lg" variant="full" className="kinoma-header__logo" />
        </Link>

        <div className="kinoma-header__search" aria-label="Search Kinoma">
          <SearchBar />
        </div>

        <nav className="kinoma-header__nav" aria-label="Primary navigation">
          {NAV.map((item) => {
            const active = location === item.href || (item.href === '/search' && location === '/explore');
            const isOpen = openMenu === item.label;

            return (
              <div
                key={item.label}
                className="kinoma-header__dropdown"
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  type="button"
                  className={`kinoma-header__link kinoma-header__dropdown-trigger ${active ? 'is-active' : ''}`}
                  aria-expanded={isOpen}
                  onClick={() => setOpenMenu(isOpen ? null : item.label)}
                >
                  {item.label}
                  {item.label === 'About' && <ChevronDown aria-hidden="true" />}
                </button>

                <div className={`kinoma-header__menu ${isOpen ? 'is-open' : ''}`}>
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className="kinoma-header__menu-item"
                      onClick={() => setOpenMenu(null)}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
