import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon, Logo } from './Icons';
import { useMarketplace } from '../state/Marketplace';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { saved } = useMarketplace();
  const close = () => setMenuOpen(false);
  return <><a className="skip-link" href="#main">Skip to content</a><div className="announcement"><div className="container"><span><span className="live-dot" />Big projects. Local connections. Endless possibilities.</span><span className="announcement-right">Made for Nigeria <span className="nigeria-flag" /><span className="announcement-divider" />NGN ₦</span></div></div><header className="site-header"><div className="container header-inner"><Link to="/" aria-label="Service Loop home" onClick={close}><Logo /></Link><nav className={menuOpen ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation"><NavLink to="/equipment" onClick={close}>Find equipment<Icon name="chevron" /></NavLink><NavLink to="/services" onClick={close}>Find services</NavLink><NavLink to="/how-it-works" onClick={close}>How it works</NavLink><Link className="mobile-nav-action" to="/requests" onClick={close}>My requests<Icon name="file" /></Link><Link className="mobile-nav-action" to="/list-equipment" onClick={close}>List your equipment<Icon name="plus" /></Link></nav><div className="header-actions"><NavLink className="icon-button header-save" to="/saved" aria-label={`Saved equipment, ${saved.length} items`} onClick={close}><Icon name="heart" />{saved.length > 0 && <span className="count-badge">{saved.length}</span>}</NavLink><NavLink className="requests-link" to="/requests">My requests</NavLink><Link className="button button-green header-list" to="/list-equipment"><Icon name="plus" />List equipment</Link><button className="icon-button mobile-menu" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button></div></div></header></>;
}
function Footer() { return <footer className="site-footer"><div className="container footer-main"><div className="footer-brand"><Link to="/" aria-label="Service Loop home"><Logo /></Link><p>Connecting equipment, expertise,<br />and the people building what’s next.</p><span className="made-in">Made for Nigeria. Built for possibility.<span className="nigeria-flag" /></span></div><div className="footer-column"><h3>For your project</h3><Link to="/equipment">Find equipment</Link><Link to="/services">Find services</Link><Link to="/request-quote">Request a quote</Link><Link to="/saved">Saved equipment</Link></div><div className="footer-column"><h3>For equipment owners</h3><Link to="/list-equipment">List your equipment</Link><Link to="/how-it-works">How it works</Link><Link to="/requests">My requests</Link></div><div className="footer-column footer-connect"><h3>Let’s build something.</h3><p>Got the plans?<br />We’ll help you find the tools.</p><Link className="text-link" to="/request-quote">Get started<Icon name="diagonal" /></Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Service Loop. All rights reserved.</span><span>Frontend preview · Sample inventory</span><Link to="/about">Privacy & demo information</Link></div></footer>; }
export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles: Record<string,string> = { '/':'Big plans. Right tools.', '/equipment':'Find your next workmate', '/services':'The people behind your progress', '/how-it-works':'From a plan to progress', '/saved':'Your equipment shortlist', '/requests':'Your project workspace', '/request-quote':'Start your next big thing', '/list-equipment':'Put your equipment to work', '/about':'Built for possibility' };
    document.title = `${titles[pathname] || (pathname.startsWith('/equipment/') ? 'Equipment details' : pathname.startsWith('/services/') ? 'Site services' : 'Page not found')} — Service Loop`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true });
  }, [pathname]);
  return <><Header key={pathname} /><Outlet /><Footer /></>;
}
