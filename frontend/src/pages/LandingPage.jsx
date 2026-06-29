import { useState, useEffect, useRef } from 'react'

// ─── Unsplash image URLs (SEO-friendly, descriptive alt tags) ───
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=80',       // skyline / enterprise
  about: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=80',          // team meeting
  savings: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=700&q=80',     // savings / piggy
  wealth: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&q=80',      // investment charts
  banking: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=700&q=80',        // table banking / community
  rentals: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=700&q=80',        // real estate
  portfolio1: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80',     // office building
  portfolio2: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',  // modern office
  portfolio3: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',  // city property
  portfolio4: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=600&q=80',  // residential
  news1: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80',       // finance news
  news2: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80',       // investment
  news3: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=500&q=80',       // growth
}

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About Us', href: '#about' },
  { label: 'Divisions', href: '#divisions' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'News', href: '#news' },
  { label: 'Contact', href: '#contact' },
]

const STATS = [
  { value: 'KES 120M+', label: 'Assets Under Management', icon: 'bi-graph-up-arrow' },
  { value: '1,400+', label: 'Active Members & Investors', icon: 'bi-people-fill' },
  { value: '4', label: 'Business Divisions', icon: 'bi-grid-fill' },
  { value: '8 yrs', label: 'Of Trusted Growth', icon: 'bi-shield-check-fill' },
]

const DIVISIONS = [
  {
    id: 'tujijenge',
    icon: 'bi-piggy-bank-fill',
    color: '#2563eb',
    bg: '#eff6ff',
    title: 'Tujijenge Savings Circle',
    tagline: 'Build together, prosper together',
    desc: 'A disciplined monthly savings scheme where members pool resources, earn on contributions, and access multiplied loan facilities. Your consistent KES 2,000/share monthly becomes a financial foundation for life.',
    cta: 'Join as a Member',
    img: IMAGES.savings,
    points: ['Monthly share contributions from KES 2,000', 'Loan eligibility up to 3× your total contributions', 'Annual profit distribution to eligible members', 'Transparent digital tracking of every shilling'],
  },
  {
    id: 'wealth',
    icon: 'bi-bar-chart-line-fill',
    color: '#16a34a',
    bg: '#f0fdf4',
    title: 'Wealth Alliance',
    tagline: 'Invest with vision, grow with discipline',
    desc: 'A curated investment vehicle for capital deployment across diversified asset classes. Watch your portfolio grow through professionally managed investments with full digital reporting.',
    cta: 'Start Investing',
    img: IMAGES.wealth,
    points: ['Diversified portfolio across multiple asset classes', 'ROI = (Net Gain ÷ Capital) × 100 — always visible', 'Dividend declarations proportional to capital', 'Real-time investor portal access'],
  },
  {
    id: 'tablebanking',
    icon: 'bi-cash-stack',
    color: '#d97706',
    bg: '#fffbeb',
    title: 'Table Banking',
    tagline: 'Simple savings. Instant community credit.',
    desc: 'A nimble, community-driven lending model where monthly contributions build a shared lending fund. Borrow at fair rates, repay on schedule, and watch the fund multiply for everyone.',
    cta: 'Join the Circle',
    img: IMAGES.banking,
    points: ['Monthly contributions due by the 15th', 'Available fund = Contributions + Interest − Loans', 'Straightforward loan process within the group', 'Transparent ledger visible to all members'],
  },
  {
    id: 'rentals',
    icon: 'bi-building-fill',
    color: '#7c3aed',
    bg: '#f5f3ff',
    title: 'Kilele Rentals',
    tagline: 'Premium property. Passive income.',
    desc: 'A growing portfolio of residential and commercial properties managed end-to-end — from tenant onboarding through rent collection to maintenance. Invest in bricks that work for you.',
    cta: 'View Properties',
    img: IMAGES.rentals,
    points: ['Property → Unit → Tenant → Lease chain, fully digital', 'Auto-generated monthly billing & M-Pesa collection', 'Real-time profitability dashboard per property', 'Professional maintenance management'],
  },
]

const PORTFOLIO = [
  { img: IMAGES.portfolio1, title: 'Kilele Plaza', location: 'Westlands, Nairobi', type: 'Commercial', units: '24 units', status: 'Fully Occupied' },
  { img: IMAGES.portfolio2, title: 'Ridge Office Park', location: 'Karen, Nairobi', type: 'Office Block', units: '12 offices', status: 'Active' },
  { img: IMAGES.portfolio3, title: 'Summit Apartments', location: 'Kileleshwa, Nairobi', type: 'Residential', units: '36 units', status: 'Fully Occupied' },
  { img: IMAGES.portfolio4, title: 'Horizon Villas', location: 'Kitisuru, Nairobi', type: 'Residential', units: '8 villas', status: 'Active' },
]

const NEWS = [
  { img: IMAGES.news1, category: 'Announcement', date: 'June 2025', title: 'Tujijenge Circle Completes Its 8th Annual Distribution', excerpt: 'Members celebrated a record dividend payout as the savings circle closed its most profitable year to date, with contributions exceeding KES 28 million.' },
  { img: IMAGES.news2, category: 'Investment', date: 'May 2025', title: 'Wealth Alliance Expands into Treasury Bills & Fixed Income', excerpt: 'Following strong demand from investors, the Wealth Alliance portfolio now includes government securities alongside equity and real estate instruments.' },
  { img: IMAGES.news3, category: 'Platform', date: 'April 2025', title: 'Kilele Platform Goes Live — Full Digital Management for All Divisions', excerpt: 'The new enterprise platform unifies all four business units under one digital roof, giving every member, investor and tenant real-time visibility.' },
]

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [activeDiv, setActiveDiv] = useState(0)
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [formSent, setFormSent] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      // Active section tracking
      const sections = ['home', 'about', 'divisions', 'portfolio', 'news', 'contact']
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(sections[i])
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (href) => {
    setNavOpen(false)
    const id = href.replace('#', '')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleContact = (e) => {
    e.preventDefault()
    setFormSent(true)
    setTimeout(() => setFormSent(false), 4000)
    setContactForm({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --blue-900: #0a1628;
          --blue-800: #0f2247;
          --blue-700: #1a3a6e;
          --blue-600: #1d4ed8;
          --blue-500: #2563eb;
          --blue-400: #3b82f6;
          --blue-300: #60a5fa;
          --blue-100: #dbeafe;
          --blue-50:  #eff6ff;
          --black:    #0a0e1a;
          --gray-900: #111827;
          --gray-800: #1f2937;
          --gray-700: #374151;
          --gray-600: #4b5563;
          --gray-500: #6b7280;
          --gray-400: #9ca3af;
          --gray-300: #d1d5db;
          --gray-200: #e5e7eb;
          --gray-100: #f3f4f6;
          --gray-50:  #f9fafb;
          --white:    #ffffff;
          --primary:  var(--blue-500);
          --success:  #16a34a;
          --warning:  #d97706;
          --danger:   #dc2626;
          --font-sans: 'Inter', system-ui, sans-serif;
          --font-display: 'Plus Jakarta Sans', 'Inter', sans-serif;
          --radius: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --radius-xl: 24px;
          --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
          --shadow:    0 2px 8px rgba(0,0,0,.08);
          --shadow-md: 0 4px 16px rgba(0,0,0,.10);
          --shadow-lg: 0 8px 32px rgba(0,0,0,.13);
          --shadow-xl: 0 16px 48px rgba(0,0,0,.16);
          --transition: 220ms cubic-bezier(.4,0,.2,1);
        }

        html { scroll-behavior: smooth; font-size: 15px; }
        body { font-family: var(--font-sans); color: var(--gray-900); background: var(--white); -webkit-font-smoothing: antialiased; line-height: 1.6; }
        img { display: block; max-width: 100%; }
        a { text-decoration: none; color: inherit; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }

        /* ── NAVBAR ── */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 999;
          height: 68px;
          display: flex; align-items: center;
          padding: 0 5vw;
          transition: background var(--transition), box-shadow var(--transition);
        }
        .lp-nav--scrolled {
          background: rgba(255,255,255,.96);
          backdrop-filter: blur(12px);
          box-shadow: var(--shadow);
        }
        .lp-nav--open { background: var(--blue-900); }
        .lp-nav__inner { max-width: 1200px; width: 100%; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .lp-nav__brand { display: flex; align-items: center; gap: 10px; }
        .lp-nav__logo {
          width: 38px; height: 38px;
          border-radius: var(--radius);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 800; font-size: 13px; letter-spacing: -0.5px;
        }
        .lp-nav__logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .lp-nav__name { font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: -0.3px; }
        .lp-nav--scrolled .lp-nav__name { color: var(--gray-900); }
        .lp-nav:not(.lp-nav--scrolled) .lp-nav__name { color: var(--white); }
        .lp-nav--open .lp-nav__name { color: var(--white); }
        .lp-nav__links { display: flex; align-items: center; gap: 4px; }
        .lp-nav__link {
          padding: 7px 14px; border-radius: 99px; font-size: 14px; font-weight: 500;
          transition: background var(--transition), color var(--transition);
        }
        .lp-nav--scrolled .lp-nav__link { color: var(--gray-700); }
        .lp-nav--scrolled .lp-nav__link:hover { background: var(--gray-100); color: var(--primary); }
        .lp-nav--scrolled .lp-nav__link--active { color: var(--primary); background: var(--blue-50); }
        .lp-nav:not(.lp-nav--scrolled) .lp-nav__link { color: rgba(255,255,255,.75); }
        .lp-nav:not(.lp-nav--scrolled) .lp-nav__link:hover { background: rgba(255,255,255,.1); color: var(--white); }
        .lp-nav:not(.lp-nav--scrolled) .lp-nav__link--active { color: var(--white); background: rgba(255,255,255,.15); }
        .lp-nav__cta {
          padding: 9px 20px; border-radius: 99px; font-size: 14px; font-weight: 600;
          background: var(--primary); color: var(--white);
          transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
        }
        .lp-nav__cta:hover { background: var(--blue-600); box-shadow: 0 4px 12px rgba(37,99,235,.35); transform: translateY(-1px); }
        .lp-nav__hamburger {
          display: none; flex-direction: column; gap: 5px; padding: 6px;
          color: var(--white);
        }
        .lp-nav--scrolled .lp-nav__hamburger { color: var(--gray-800); }
        .lp-nav__hamburger span {
          display: block; width: 22px; height: 2px;
          background: currentColor; border-radius: 2px;
          transition: transform var(--transition), opacity var(--transition);
        }
        .lp-nav__hamburger--open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .lp-nav__hamburger--open span:nth-child(2) { opacity: 0; }
        .lp-nav__hamburger--open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── MOBILE SIDEBAR DRAWER ── */
        .lp-nav__drawer-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 997;
          opacity: 0;
          transition: opacity 300ms ease;
        }
        .lp-nav__drawer-overlay--open {
          display: block;
          opacity: 1;
        }

        .lp-nav__drawer {
          position: fixed;
          top: 0;
          left: -320px;
          bottom: 0;
          width: 300px;
          max-width: 85vw;
          background: var(--blue-900);
          z-index: 998;
          padding: 24px 24px 32px;
          overflow-y: auto;
          transition: left 350ms cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 24px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
        }
        .lp-nav__drawer--open {
          left: 0;
        }

        .lp-nav__drawer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 20px;
        }
        .lp-nav__drawer-brand img {
          width: 38px;
          height: 38px;
          object-fit: contain;
        }
        .lp-nav__drawer-brand span {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 16px;
          color: var(--white);
        }

        .lp-nav__drawer-close {
          margin-left: auto;
          color: rgba(255,255,255,0.6);
          font-size: 24px;
          padding: 4px;
          transition: color var(--transition);
        }
        .lp-nav__drawer-close:hover {
          color: var(--white);
        }

        .lp-nav__drawer-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .lp-nav__drawer-links a {
          padding: 12px 16px;
          color: rgba(255,255,255,0.8);
          font-size: 15px;
          font-weight: 500;
          border-radius: var(--radius);
          transition: background var(--transition), color var(--transition);
        }
        .lp-nav__drawer-links a:hover,
        .lp-nav__drawer-links a.active {
          background: rgba(255,255,255,0.1);
          color: var(--white);
        }

        .lp-nav__drawer-cta {
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .lp-nav__drawer-cta a {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: var(--radius);
          font-size: 14px;
          font-weight: 600;
          background: var(--primary);
          color: var(--white);
          transition: background var(--transition);
        }
        .lp-nav__drawer-cta a:hover {
          background: var(--blue-600);
        }

        /* ── HERO ── */
        .hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          background: linear-gradient(160deg, var(--blue-900) 0%, var(--blue-800) 60%, #1a3a6e 100%);
        }
        .hero__bg {
          position: absolute; inset: 0;
          background-image: url('${IMAGES.hero}');
          background-size: cover; background-position: center;
          opacity: .12; mix-blend-mode: luminosity;
        }
        .hero__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(10,22,40,.3) 0%, rgba(10,22,40,.7) 100%);
        }
        .hero__content {
          position: relative; z-index: 2;
          text-align: center; padding: 100px 24px 80px;
          max-width: 800px; margin: 0 auto;
        }
        .hero__eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
          color: var(--blue-300); font-size: 12px; font-weight: 600;
          padding: 6px 16px; border-radius: 99px; letter-spacing: 1px; text-transform: uppercase;
          margin-bottom: 24px;
          backdrop-filter: blur(8px);
        }
        .hero__eyebrow i { font-size: 13px; }
        .hero__title {
          font-family: var(--font-display);
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 900; color: var(--white);
          line-height: 1.1; letter-spacing: -1.5px;
          margin-bottom: 20px;
        }
        .hero__title span { color: var(--blue-300); }
        .hero__sub {
          font-size: clamp(15px, 2vw, 18px); color: rgba(255,255,255,.72);
          max-width: 580px; margin: 0 auto 36px; line-height: 1.65;
        }
        .hero__actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
        .hero__btn {
          padding: 14px 28px; border-radius: 99px; font-size: 15px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all var(--transition);
        }
        .hero__btn--primary {
          background: var(--primary); color: var(--white);
          box-shadow: 0 4px 24px rgba(37,99,235,.5);
        }
        .hero__btn--primary:hover { background: var(--blue-600); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(37,99,235,.55); }
        .hero__btn--outline {
          background: rgba(255,255,255,.08); color: var(--white);
          border: 1.5px solid rgba(255,255,255,.3);
          backdrop-filter: blur(8px);
        }
        .hero__btn--outline:hover { background: rgba(255,255,255,.15); transform: translateY(-2px); }
        .hero__scroll {
          position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          color: rgba(255,255,255,.4); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;
          animation: bounce 2s infinite;
        }
        .hero__scroll i { font-size: 20px; }

        /* ── STATS STRIP ── */
        .stats-strip { background: var(--white); border-bottom: 1px solid var(--gray-100); }
        .stats-strip__inner {
          max-width: 1200px; margin: 0 auto; padding: 0 5vw;
          display: grid; grid-template-columns: repeat(4, 1fr);
        }
        .stat-item {
          display: flex; align-items: center; gap: 14px;
          padding: 28px 20px; border-right: 1px solid var(--gray-100);
        }
        .stat-item:last-child { border-right: none; }
        .stat-item__icon {
          width: 44px; height: 44px; border-radius: var(--radius);
          background: var(--blue-50); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .stat-item__value {
          font-family: var(--font-display); font-size: 22px; font-weight: 800;
          color: var(--gray-900); letter-spacing: -0.5px; line-height: 1.1;
        }
        .stat-item__label { font-size: 12px; color: var(--gray-500); font-weight: 500; margin-top: 2px; }

        /* ── SECTIONS SHARED ── */
        .section { padding: 96px 5vw; }
        .section--alt { background: var(--gray-50); }
        .section--dark { background: var(--blue-900); }
        .section__inner { max-width: 1200px; margin: 0 auto; }
        .section__eyebrow {
          font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          color: var(--primary); margin-bottom: 12px;
        }
        .section--dark .section__eyebrow { color: var(--blue-300); }
        .section__title {
          font-family: var(--font-display); font-size: clamp(26px, 4vw, 40px);
          font-weight: 800; color: var(--gray-900); letter-spacing: -0.8px;
          line-height: 1.15; margin-bottom: 16px; max-width: 600px;
        }
        .section--dark .section__title { color: var(--white); }
        .section__sub { font-size: 16px; color: var(--gray-500); max-width: 540px; line-height: 1.65; }
        .section--dark .section__sub { color: rgba(255,255,255,.6); }
        .section__header { margin-bottom: 56px; }
        .section__header--center { text-align: center; }
        .section__header--center .section__title,
        .section__header--center .section__sub { max-width: 100%; }

        /* ── ABOUT ── */
        .about-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 64px; align-items: center;
        }
        .about__img-wrap {
          position: relative; border-radius: var(--radius-xl); overflow: hidden;
          box-shadow: var(--shadow-xl);
          aspect-ratio: 4/3;
        }
        .about__img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .about__badge {
          position: absolute; bottom: 20px; left: 20px;
          background: var(--white); border-radius: var(--radius-lg);
          padding: 14px 18px; box-shadow: var(--shadow-lg);
          display: flex; align-items: center; gap: 12px;
        }
        .about__badge-icon {
          width: 40px; height: 40px; background: var(--blue-50); border-radius: var(--radius);
          color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .about__badge-value { font-family: var(--font-display); font-size: 22px; font-weight: 800; color: var(--gray-900); line-height: 1; }
        .about__badge-label { font-size: 12px; color: var(--gray-500); margin-top: 2px; }
        .about__pillars { display: flex; flex-direction: column; gap: 18px; margin-top: 32px; }
        .about__pillar { display: flex; gap: 14px; align-items: flex-start; }
        .about__pillar-icon {
          width: 36px; height: 36px; border-radius: var(--radius);
          background: var(--blue-50); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0; margin-top: 2px;
        }
        .about__pillar-title { font-size: 14px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px; }
        .about__pillar-desc { font-size: 13px; color: var(--gray-500); line-height: 1.5; }

        /* ── DIVISIONS ── */
        .div-tabs { display: flex; gap: 8px; margin-bottom: 40px; flex-wrap: wrap; }
        .div-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 99px;
          font-size: 13px; font-weight: 600; border: 1.5px solid var(--gray-200);
          color: var(--gray-600); transition: all var(--transition);
        }
        .div-tab i { font-size: 15px; }
        .div-tab:hover { border-color: var(--primary); color: var(--primary); background: var(--blue-50); }
        .div-tab--active { background: var(--primary); color: var(--white); border-color: var(--primary); }
        .div-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
        .div-panel__img-wrap { border-radius: var(--radius-xl); overflow: hidden; aspect-ratio: 5/4; box-shadow: var(--shadow-xl); }
        .div-panel__img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
        .div-panel__img-wrap:hover img { transform: scale(1.04); }
        .div-panel__eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          padding: 5px 12px; border-radius: 99px; margin-bottom: 20px;
        }
        .div-panel__title { font-family: var(--font-display); font-size: 30px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.5px; margin-bottom: 8px; line-height: 1.15; }
        .div-panel__tagline { font-size: 15px; color: var(--gray-500); margin-bottom: 18px; font-style: italic; }
        .div-panel__desc { font-size: 14px; color: var(--gray-600); line-height: 1.7; margin-bottom: 24px; }
        .div-panel__points { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .div-panel__point { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--gray-700); }
        .div-panel__point i { font-size: 15px; color: var(--primary); flex-shrink: 0; }
        .div-panel__cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 99px; font-size: 14px; font-weight: 600;
          background: var(--primary); color: var(--white);
          transition: all var(--transition); width: fit-content;
        }
        .div-panel__cta:hover { background: var(--blue-600); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(37,99,235,.3); }

        /* ── PORTFOLIO ── */
        .portfolio-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
        }
        .portfolio-card {
          border-radius: var(--radius-lg); overflow: hidden;
          box-shadow: var(--shadow); transition: transform var(--transition), box-shadow var(--transition);
          position: relative; aspect-ratio: 4/3;
        }
        .portfolio-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-xl); }
        .portfolio-card img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
        .portfolio-card:hover img { transform: scale(1.05); }
        .portfolio-card__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(10,22,40,.88) 0%, transparent 55%);
        }
        .portfolio-card__body {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 20px; color: var(--white);
        }
        .portfolio-card__type {
          font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
          color: var(--blue-300); margin-bottom: 6px;
        }
        .portfolio-card__name { font-family: var(--font-display); font-size: 18px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 4px; }
        .portfolio-card__location { font-size: 12px; color: rgba(255,255,255,.65); display: flex; align-items: center; gap: 4px; }
        .portfolio-card__status {
          position: absolute; top: 14px; right: 14px;
          background: rgba(22,163,74,.9); color: var(--white);
          font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 99px;
          backdrop-filter: blur(6px);
        }

        /* ── HOW TO JOIN ── */
        .join-steps {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
        }
        .join-step { position: relative; }
        .join-step::after {
          content: ''; position: absolute;
          top: 24px; left: calc(100% - 12px); right: 0;
          height: 1.5px; background: var(--gray-200); z-index: 0;
          width: 50%;
        }
        .join-step:last-child::after { display: none; }
        .join-step__num {
          width: 48px; height: 48px; border-radius: 50%;
          background: var(--primary); color: var(--white);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-size: 18px; font-weight: 800;
          margin-bottom: 18px; position: relative; z-index: 1;
        }
        .join-step__title { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--gray-900); margin-bottom: 8px; }
        .join-step__desc { font-size: 13px; color: var(--gray-500); line-height: 1.6; }

        /* ── NEWS ── */
        .news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .news-card {
          border-radius: var(--radius-lg); overflow: hidden; background: var(--white);
          border: 1px solid var(--gray-100); box-shadow: var(--shadow-sm);
          transition: transform var(--transition), box-shadow var(--transition);
          cursor: pointer;
        }
        .news-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .news-card__img-wrap { aspect-ratio: 16/9; overflow: hidden; }
        .news-card__img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s ease; }
        .news-card:hover .news-card__img-wrap img { transform: scale(1.04); }
        .news-card__body { padding: 20px; }
        .news-card__meta { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .news-card__cat {
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
          color: var(--primary); background: var(--blue-50);
          padding: 3px 10px; border-radius: 99px;
        }
        .news-card__date { font-size: 12px; color: var(--gray-400); }
        .news-card__title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--gray-900); line-height: 1.3; margin-bottom: 10px; letter-spacing: -0.2px; }
        .news-card__excerpt { font-size: 13px; color: var(--gray-500); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .news-card__link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--primary); margin-top: 14px; transition: gap var(--transition); }
        .news-card:hover .news-card__link { gap: 10px; }

        /* ── CTA BANNER ── */
        .cta-banner {
          background: linear-gradient(135deg, var(--blue-900) 0%, var(--blue-700) 100%);
          padding: 80px 5vw; text-align: center; position: relative; overflow: hidden;
        }
        .cta-banner::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse at 60% 50%, rgba(59,130,246,.25), transparent 70%);
          pointer-events: none;
        }
        .cta-banner__inner { max-width: 640px; margin: 0 auto; position: relative; z-index: 1; }
        .cta-banner__title { font-family: var(--font-display); font-size: clamp(26px, 4vw, 40px); font-weight: 800; color: var(--white); letter-spacing: -0.8px; margin-bottom: 14px; line-height: 1.15; }
        .cta-banner__sub { font-size: 16px; color: rgba(255,255,255,.7); margin-bottom: 32px; line-height: 1.6; }
        .cta-banner__actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

        /* ── CONTACT ── */
        .contact-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 64px; align-items: start; }
        .contact-info { display: flex; flex-direction: column; gap: 28px; }
        .contact-info-item { display: flex; gap: 14px; align-items: flex-start; }
        .contact-info-item__icon {
          width: 44px; height: 44px; border-radius: var(--radius);
          background: var(--blue-50); color: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .contact-info-item__label { font-size: 12px; font-weight: 600; color: var(--gray-400); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
        .contact-info-item__value { font-size: 14px; font-weight: 600; color: var(--gray-900); }
        .contact-form { background: var(--white); border: 1px solid var(--gray-100); border-radius: var(--radius-xl); padding: 36px; box-shadow: var(--shadow-md); }
        .form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cf-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
        .cf-label { font-size: 13px; font-weight: 600; color: var(--gray-700); }
        .cf-input {
          padding: 10px 14px; border: 1.5px solid var(--gray-200); border-radius: var(--radius);
          font-size: 14px; color: var(--gray-900); background: var(--gray-50);
          transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
          outline: none; font-family: var(--font-sans);
        }
        .cf-input:focus { border-color: var(--primary); background: var(--white); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
        .cf-textarea { min-height: 110px; resize: vertical; }
        .cf-submit {
          width: 100%; padding: 13px; border-radius: var(--radius); font-size: 15px; font-weight: 600;
          background: var(--primary); color: var(--white);
          transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .cf-submit:hover { background: var(--blue-600); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,.3); }
        .cf-success {
          display: flex; align-items: center; gap: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius);
          padding: 14px 18px; color: #15803d; font-size: 14px; font-weight: 600;
          margin-bottom: 16px;
        }

        /* ── FOOTER ── */
        .footer { background: var(--black); color: rgba(255,255,255,.6); }
        .footer__main { max-width: 1200px; margin: 0 auto; padding: 64px 5vw 40px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
        .footer__brand-name { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--white); margin-bottom: 10px; }
        .footer__brand-desc { font-size: 13px; line-height: 1.65; max-width: 280px; margin-bottom: 20px; }
        .footer__social { display: flex; gap: 10px; }
        .footer__social-btn {
          width: 36px; height: 36px; border-radius: var(--radius); border: 1px solid rgba(255,255,255,.1);
          display: flex; align-items: center; justify-content: center; font-size: 16px;
          color: rgba(255,255,255,.5); transition: all var(--transition);
        }
        .footer__social-btn:hover { background: var(--primary); border-color: var(--primary); color: var(--white); }
        .footer__col-title { font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--white); margin-bottom: 18px; }
        .footer__links { display: flex; flex-direction: column; gap: 10px; }
        .footer__links a { font-size: 13px; color: rgba(255,255,255,.5); transition: color var(--transition); }
        .footer__links a:hover { color: var(--white); }
        .footer__bottom { border-top: 1px solid rgba(255,255,255,.06); padding: 20px 5vw; max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .footer__copy { font-size: 12px; color: rgba(255,255,255,.3); }
        .footer__legal { display: flex; gap: 20px; }
        .footer__legal a { font-size: 12px; color: rgba(255,255,255,.3); transition: color var(--transition); }
        .footer__legal a:hover { color: var(--white); }

        /* ── KEYFRAMES ── */
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(8px); }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .about-grid { grid-template-columns: 1fr; gap: 40px; }
          .about-grid > :first-child { order: 2; }
          .div-panel { grid-template-columns: 1fr; gap: 32px; }
          .portfolio-grid { grid-template-columns: 1fr 1fr; }
          .contact-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer__main { grid-template-columns: 1fr 1fr; gap: 36px; }
        }
        @media (max-width: 768px) {
          .section { padding: 64px 5vw; }
          .lp-nav__links, .lp-nav__cta { display: none; }
          .lp-nav__hamburger { display: flex; }
          .stats-strip__inner { grid-template-columns: repeat(2, 1fr); }
          .stat-item { border-right: none; border-bottom: 1px solid var(--gray-100); }
          .stat-item:nth-child(odd) { border-right: 1px solid var(--gray-100); }
          .news-grid { grid-template-columns: 1fr; }
          .join-steps { grid-template-columns: 1fr 1fr; }
          .join-step::after { display: none; }
          .portfolio-grid { grid-template-columns: 1fr; }
          .footer__main { grid-template-columns: 1fr 1fr; }
          .form-row2 { grid-template-columns: 1fr; }
          .footer__bottom { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .hero__title { letter-spacing: -0.8px; }
          .stats-strip__inner { grid-template-columns: 1fr; }
          .stat-item { border-right: none; }
          .join-steps { grid-template-columns: 1fr; }
          .footer__main { grid-template-columns: 1fr; }
          .div-tabs { gap: 6px; }
          .div-tab { padding: 8px 14px; font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
      `}</style>

      {/* ─────── NAVBAR ─────── */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''} ${navOpen ? 'lp-nav--open' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="lp-nav__inner">
          <a className="lp-nav__brand" href="#home" onClick={(e) => { e.preventDefault(); scrollTo('#home') }} aria-label="Kilele Ridge Group home">
            <div className="lp-nav__logo" aria-hidden="true">
              <img src="/assets/kilele_logo.png" alt="Kilele Ridge Group logo" />
            </div>
            <span className="lp-nav__name">Kilele Ridge Group</span>
          </a>
          <div className="lp-nav__links" role="menubar">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} role="menuitem"
                className={`lp-nav__link ${activeSection === l.href.replace('#', '') ? 'lp-nav__link--active' : ''}`}
                onClick={(e) => { e.preventDefault(); scrollTo(l.href) }}>{l.label}</a>
            ))}
          </div>
          <a href="/login" className="lp-nav__cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }} aria-label="Login to member portal">
            <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
            Login Portal
          </a>
          <button className={`lp-nav__hamburger ${navOpen ? 'lp-nav__hamburger--open' : ''}`}
            onClick={() => setNavOpen(p => !p)} aria-label={navOpen ? 'Close menu' : 'Open menu'} aria-expanded={navOpen}>
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ─────── MOBILE SIDEBAR DRAWER ─────── */}
      <div className={`lp-nav__drawer-overlay ${navOpen ? 'lp-nav__drawer-overlay--open' : ''}`} onClick={() => setNavOpen(false)} aria-hidden="true" />

      <div className={`lp-nav__drawer ${navOpen ? 'lp-nav__drawer--open' : ''}`} role="dialog" aria-label="Mobile navigation">
        <div className="lp-nav__drawer-brand">
          <img src="/assets/kilele_logo.png" alt="Kilele Ridge Group logo" />
          <span>Kilele Ridge Group</span>
          <button className="lp-nav__drawer-close" onClick={() => setNavOpen(false)} aria-label="Close menu">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="lp-nav__drawer-links">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href}
              className={activeSection === l.href.replace('#', '') ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); scrollTo(l.href) }}>{l.label}</a>
          ))}
        </div>
        <div className="lp-nav__drawer-cta">
          <a href="/login" aria-label="Login to member portal">
            <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Login Portal
          </a>
        </div>
      </div>

      {/* ─────── HERO ─────── */}
      <section id="home" className="hero" ref={heroRef} aria-label="Hero — Kilele Ridge Group enterprise platform">
        <div className="hero__bg" role="img" aria-label="Nairobi business district skyline representing Kilele Ridge Group's enterprise presence" />
        <div className="hero__overlay" aria-hidden="true" />
        <div className="hero__content">
          
          <h1 className="hero__title">
            One Group.<br />
            <span>Four Paths</span> to Wealth.
          </h1>
          <p className="hero__sub">
            Kilele Ridge Group unites savings, investment, table banking, and property under one disciplined ecosystem — built for members who take their financial future seriously.
          </p>
          <div className="hero__actions">
            <a href="#divisions" className="hero__btn hero__btn--primary"
              onClick={(e) => { e.preventDefault(); scrollTo('#divisions') }}>
              <i className="bi bi-grid-fill" aria-hidden="true" />
              Explore Our Divisions
            </a>
            <a href="#contact" className="hero__btn hero__btn--outline"
              onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}>
              <i className="bi bi-envelope-fill" aria-hidden="true" />
              Get in Touch
            </a>
          </div>
        </div>
        <div className="hero__scroll" aria-hidden="true">
          <span>Scroll</span>
          <i className="bi bi-chevron-down" />
        </div>
      </section>

      {/* ─────── STATS ─────── */}
      <div className="stats-strip" role="region" aria-label="Key statistics">
        <div className="stats-strip__inner">
          {STATS.map((s, i) => (
            <div className="stat-item" key={i}>
              <div className="stat-item__icon" aria-hidden="true"><i className={`bi ${s.icon}`} /></div>
              <div>
                <div className="stat-item__value">{s.value}</div>
                <div className="stat-item__label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─────── ABOUT ─────── */}
      <section id="about" className="section" aria-label="About Kilele Ridge Group">
        <div className="section__inner">
          <div className="about-grid">
            <div className="about__img-wrap">
              <img src={IMAGES.about} alt="Kilele Ridge Group leadership team in a strategy meeting, Nairobi" loading="lazy" />
              <div className="about__badge" aria-label="8 years of disciplined financial growth">
                <div className="about__badge-icon" aria-hidden="true"><i className="bi bi-award-fill" /></div>
                <div>
                  <div className="about__badge-value">8 Years</div>
                  <div className="about__badge-label">Trusted Financial Growth</div>
                </div>
              </div>
            </div>
            <div>
              <p className="section__eyebrow">Who We Are</p>
              <h2 className="section__title">A disciplined financial group built on community trust</h2>
              <p className="section__sub" style={{ marginBottom: 0 }}>
                Founded in 2017, Kilele Ridge Group is a Nairobi-based enterprise that pools member capital across four business divisions — combining the accountability of a savings circle with the ambition of an institutional investor.
              </p>
              <div className="about__pillars">
                {[
                  { icon: 'bi-shield-check-fill', title: 'Transparency First', desc: 'Every shilling tracked digitally. Every member can view real-time statements, contribution history, and allocation breakdowns.' },
                  { icon: 'bi-people-fill', title: 'Member-Centric', desc: 'Our rules exist to serve members. Interest rates, loan multipliers, and distribution rules are reviewed annually with the group.' },
                  { icon: 'bi-graph-up-arrow', title: 'Compounding Growth', desc: 'Contributions, reinvestments, and rental income compound across the group — creating wealth that grows faster together.' },
                ].map((p, i) => (
                  <div className="about__pillar" key={i}>
                    <div className="about__pillar-icon" aria-hidden="true"><i className={`bi ${p.icon}`} /></div>
                    <div>
                      <div className="about__pillar-title">{p.title}</div>
                      <div className="about__pillar-desc">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── DIVISIONS ─────── */}
      <section id="divisions" className="section section--alt" aria-label="Our four business divisions">
        <div className="section__inner">
          <div className="section__header">
            <p className="section__eyebrow">Business Divisions</p>
            <h2 className="section__title">Four ways to grow with us</h2>
            <p className="section__sub">Whether you're saving monthly, investing capital, banking with your community, or earning through property — there's a place for you in our ecosystem.</p>
          </div>
          <div className="div-tabs" role="tablist" aria-label="Division tabs">
            {DIVISIONS.map((d, i) => (
              <button key={d.id} role="tab" aria-selected={activeDiv === i} aria-controls={`divpanel-${d.id}`}
                className={`div-tab ${activeDiv === i ? 'div-tab--active' : ''}`}
                onClick={() => setActiveDiv(i)}
                style={activeDiv === i ? {} : {}}>
                <i className={`bi ${d.icon}`} style={{ color: activeDiv === i ? 'inherit' : d.color }} aria-hidden="true" />
                {d.title.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
          {DIVISIONS.map((d, i) => (
            <div key={d.id} id={`divpanel-${d.id}`} role="tabpanel" hidden={activeDiv !== i} aria-labelledby={`tab-${d.id}`}>
              {activeDiv === i && (
                <div className="div-panel">
                  <div className="div-panel__img-wrap">
                    <img src={d.img} alt={`${d.title} — ${d.tagline}`} loading="lazy" />
                  </div>
                  <div>
                    <div className="div-panel__eyebrow" style={{ background: d.bg, color: d.color }}>
                      <i className={`bi ${d.icon}`} aria-hidden="true" /> {d.title}
                    </div>
                    <h3 className="div-panel__title">{d.title}</h3>
                    <p className="div-panel__tagline">{d.tagline}</p>
                    <p className="div-panel__desc">{d.desc}</p>
                    <ul className="div-panel__points" aria-label={`Key features of ${d.title}`}>
                      {d.points.map((pt, j) => (
                        <li key={j} className="div-panel__point" style={{ listStyle: 'none' }}>
                          <i className="bi bi-check-circle-fill" style={{ color: d.color }} aria-hidden="true" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <a href="#contact" className="div-panel__cta"
                      onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}
                      style={{ background: d.color }}
                      aria-label={`${d.cta} — ${d.title}`}>
                      {d.cta} <i className="bi bi-arrow-right" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────── PORTFOLIO ─────── */}
      <section id="portfolio" className="section" aria-label="Property portfolio">
        <div className="section__inner">
          <div className="section__header section__header--center">
            <p className="section__eyebrow">Our Portfolio</p>
            <h2 className="section__title" style={{ maxWidth: '100%' }}>Properties that work harder than a savings account</h2>
            <p className="section__sub" style={{ maxWidth: 520, margin: '0 auto' }}>From Westlands to Karen, our property portfolio generates consistent rental income for the group while appreciating in value year on year.</p>
          </div>
          <div className="portfolio-grid">
            {PORTFOLIO.map((p, i) => (
              <article key={i} className="portfolio-card" aria-label={`${p.title} — ${p.location}`}>
                <img src={p.img} alt={`${p.title}, ${p.type} in ${p.location}`} loading="lazy" />
                <div className="portfolio-card__overlay" aria-hidden="true" />
                <div className="portfolio-card__body">
                  <div className="portfolio-card__type">{p.type} · {p.units}</div>
                  <div className="portfolio-card__name">{p.title}</div>
                  <div className="portfolio-card__location"><i className="bi bi-geo-alt" aria-hidden="true" />{p.location}</div>
                </div>
                <div className="portfolio-card__status" aria-label={`Status: ${p.status}`}>{p.status}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── HOW TO JOIN ─────── */}
      <section className="section section--alt" aria-label="How to join Kilele Ridge Group">
        <div className="section__inner">
          <div className="section__header section__header--center">
            <p className="section__eyebrow">How to Join</p>
            <h2 className="section__title" style={{ maxWidth: '100%' }}>Four steps to start building wealth with us</h2>
          </div>
          <div className="join-steps" role="list">
            {[
              { num: '1', title: 'Express Interest', desc: 'Fill out our contact form or call us directly. Tell us which division interests you most.' },
              { num: '2', title: 'Attend Onboarding', desc: 'Join our monthly member onboarding session where we walk through rules, obligations, and benefits.' },
              { num: '3', title: 'Register & Contribute', desc: 'Complete your KES 2,000 registration fee and your first monthly contribution or capital deposit.' },
              { num: '4', title: 'Access Your Portal', desc: 'Log in to your personal member portal to track contributions, loans, dividends, and statements in real time.' },
            ].map((s, i) => (
              <div key={i} className="join-step" role="listitem">
                <div className="join-step__num" aria-label={`Step ${s.num}`}>{s.num}</div>
                <div className="join-step__title">{s.title}</div>
                <p className="join-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── NEWS ─────── */}
      <section id="news" className="section" aria-label="Latest news and updates">
        <div className="section__inner">
          <div className="section__header section__header--center">
            <p className="section__eyebrow">Latest News</p>
            <h2 className="section__title" style={{ maxWidth: '100%' }}>What's happening at Kilele Ridge</h2>
          </div>
          <div className="news-grid">
            {NEWS.map((n, i) => (
              <article key={i} className="news-card" aria-label={n.title}>
                <div className="news-card__img-wrap">
                  <img src={n.img} alt={`News article image: ${n.title}`} loading="lazy" />
                </div>
                <div className="news-card__body">
                  <div className="news-card__meta">
                    <span className="news-card__cat">{n.category}</span>
                    <span className="news-card__date">{n.date}</span>
                  </div>
                  <h3 className="news-card__title">{n.title}</h3>
                  <p className="news-card__excerpt">{n.excerpt}</p>
                  <div className="news-card__link" role="link" tabIndex={0} aria-label={`Read more: ${n.title}`}>
                    Read More <i className="bi bi-arrow-right" aria-hidden="true" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── CTA BANNER ─────── */}
      <div className="cta-banner" role="complementary" aria-label="Call to action">
        <div className="cta-banner__inner">
          <h2 className="cta-banner__title">Ready to put your money to work?</h2>
          <p className="cta-banner__sub">Join over 1,400 members and investors who are building real, measurable wealth through Kilele Ridge Group's disciplined framework.</p>
          <div className="cta-banner__actions">
            <a href="#contact" className="hero__btn hero__btn--primary"
              onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}
              aria-label="Get started by contacting us">
              <i className="bi bi-send-fill" aria-hidden="true" /> Get Started
            </a>
            <a href="/login" className="hero__btn hero__btn--outline" aria-label="Login to member portal">
              <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Member Login
            </a>
          </div>
        </div>
      </div>

      {/* ─────── CONTACT ─────── */}
      <section id="contact" className="section section--alt" aria-label="Contact Kilele Ridge Group">
        <div className="section__inner">
          <div className="contact-grid">
            <div>
              <p className="section__eyebrow">Get in Touch</p>
              <h2 className="section__title">We'd love to hear from you</h2>
              <p className="section__sub" style={{ marginBottom: 32 }}>Whether you have questions about joining, investing, or our property portfolio — our team responds within 24 hours.</p>
              <div className="contact-info" role="list">
                {[
                  { icon: 'bi-geo-alt-fill', label: 'Address', value: 'Westlands Business Park, Waiyaki Way, Nairobi, Kenya' },
                  { icon: 'bi-telephone-fill', label: 'Phone', value: '+254 700 000 000' },
                  { icon: 'bi-envelope-fill', label: 'Email', value: 'info@kileleridge.co.ke' },
                  { icon: 'bi-clock-fill', label: 'Office Hours', value: 'Mon – Fri: 8 AM – 6 PM EAT' },
                ].map((c, i) => (
                  <div key={i} className="contact-info-item" role="listitem">
                    <div className="contact-info-item__icon" aria-hidden="true"><i className={`bi ${c.icon}`} /></div>
                    <div>
                      <div className="contact-info-item__label">{c.label}</div>
                      <div className="contact-info-item__value">{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="contact-form" role="main" aria-label="Contact form">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 24, color: 'var(--gray-900)' }}>Send us a message</h3>
              {formSent && (
                <div className="cf-success" role="alert" aria-live="polite">
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  Message sent! We'll get back to you within 24 hours.
                </div>
              )}
              <form onSubmit={handleContact} noValidate>
                <div className="form-row2">
                  <div className="cf-group">
                    <label className="cf-label" htmlFor="cf-name">Full Name</label>
                    <input id="cf-name" className="cf-input" type="text" placeholder="John Kamau" required
                      value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} aria-required="true" />
                  </div>
                  <div className="cf-group">
                    <label className="cf-label" htmlFor="cf-email">Email Address</label>
                    <input id="cf-email" className="cf-input" type="email" placeholder="john@email.com" required
                      value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} aria-required="true" />
                  </div>
                </div>
                <div className="cf-group">
                  <label className="cf-label" htmlFor="cf-subject">Subject</label>
                  <select id="cf-subject" className="cf-input" required
                    value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))} aria-required="true">
                    <option value="">Select a topic…</option>
                    <option>Joining Tujijenge Savings Circle</option>
                    <option>Wealth Alliance Investment Inquiry</option>
                    <option>Table Banking Membership</option>
                    <option>Property / Rentals Inquiry</option>
                    <option>Member Portal Support</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
                <div className="cf-group">
                  <label className="cf-label" htmlFor="cf-message">Message</label>
                  <textarea id="cf-message" className="cf-input cf-textarea" placeholder="Tell us more about your interest or question…" required
                    value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} aria-required="true" />
                </div>
                <button type="submit" className="cf-submit" aria-label="Send message">
                  <i className="bi bi-send-fill" aria-hidden="true" /> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─────── FOOTER ─────── */}
      <footer className="footer" role="contentinfo" aria-label="Kilele Ridge Group footer">
        <div className="footer__main">
          <div>
            <div className="footer__brand-name">Kilele Ridge Group</div>
            <p className="footer__brand-desc">A multi-division financial enterprise committed to building generational wealth for its members through savings, investment, table banking, and property.</p>
            <div className="footer__social" role="list" aria-label="Social media links">
              {['twitter', 'facebook', 'linkedin', 'instagram', 'youtube'].map(s => (
                <a key={s} href="#" className="footer__social-btn" role="listitem" aria-label={`Follow us on ${s}`}>
                  <i className={`bi bi-${s}`} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer__col-title">Divisions</div>
            <div className="footer__links">
              {['Tujijenge Savings Circle', 'Wealth Alliance', 'Table Banking', 'Kilele Rentals'].map(d => (
                <a key={d} href="#divisions" onClick={(e) => { e.preventDefault(); scrollTo('#divisions') }}>{d}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer__col-title">Company</div>
            <div className="footer__links">
              {['About Us', 'Our Portfolio', 'News & Updates', 'Contact Us', 'Member Portal'].map(l => (
                <a key={l} href="#about" onClick={(e) => { e.preventDefault(); scrollTo('#about') }}>{l}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer__col-title">Contact</div>
            <div className="footer__links" role="list">
              <a href="tel:+254700000000" aria-label="Call us">+254 700 000 000</a>
              <a href="mailto:info@kileleridge.co.ke" aria-label="Email us">info@kileleridge.co.ke</a>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>Westlands, Nairobi, Kenya</span>
              <a href="/login" aria-label="Login to member portal" style={{ color: 'var(--blue-300)', fontWeight: 600 }}>
                <i className="bi bi-box-arrow-in-right" style={{ marginRight: 6 }} aria-hidden="true" />Login Portal
              </a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <div className="footer__copy">© {new Date().getFullYear()} Kilele Ridge Group. All rights reserved.</div>
          <div className="footer__legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Use</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </>
  )
}