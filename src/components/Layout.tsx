import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { House, Compass, Library, Settings, ChevronsLeft, ChevronsRight, UserRound } from 'lucide-react';
import { KinomaLogo } from './ui/KinomaLogo';

const ITEMS = [
  { href: '/home', label: 'Home', Icon: House },
  { href: '/search', label: 'Explore', Icon: Compass },
  { href: '/library', label: 'Library', Icon: Library },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(() => {
    try { return localStorage.getItem('kinoma_sidebar_expanded') !== 'false'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('kinoma_sidebar_expanded', String(expanded)); } catch {}
  }, [expanded]);

  return (
    <div className="kinoma-app-shell" style={{ '--sidebar-width': expanded ? '236px' : '76px' } as React.CSSProperties}>
      <aside className={`kinoma-sidebar ${expanded ? 'is-expanded' : 'is-collapsed'}`} aria-label="Primary navigation">
        <div className="kinoma-sidebar__top">
          <Link href="/home" className="kinoma-sidebar__brand kinoma-focus" aria-label="Kinoma home">
            <KinomaLogo size={expanded ? 'md' : 'sm'} variant={expanded ? 'full' : 'mark'} className="kinoma-sidebar__logo" />
          </Link>
          <button type="button" className="kinoma-sidebar__toggle kinoma-focus" onClick={() => setExpanded(v => !v)} aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={expanded}>
            {expanded ? <ChevronsLeft size={17} /> : <ChevronsRight size={17} />}
          </button>
        </div>
        <nav className="kinoma-sidebar__nav">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = location === href || (href === '/search' && (location === '/explore' || location === '/whats-new'));
            return (
              <Link key={href} href={href} className={`kinoma-sidebar__item ${active ? 'is-active' : ''}`} title={!expanded ? label : undefined}>
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="kinoma-sidebar__profile">
          <div className="kinoma-sidebar__avatar" aria-hidden="true"><UserRound size={18} strokeWidth={1.7} /></div>
          <span>Profile</span>
        </div>
      </aside>
      <main className="kinoma-app-main">{children}</main>
    </div>
  );
}
