import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'

// ─── Imagery ───
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80',
  about: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=80',
  savings: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=700&q=80',
  wealth: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&q=80',
  banking: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=700&q=80',
  rentals: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=700&q=80',
  portfolio1: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80',
  portfolio2: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
  portfolio3: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
  portfolio4: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=600&q=80',
  news1: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80',
  news2: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80',
  news3: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=500&q=80',
}

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Divisions', href: '#divisions' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'News', href: '#news' },
  { label: 'Contact', href: '#contact' },
]

const STATS = [
  { value: 'KES 120M+', label: 'Assets under management', icon: 'bi-graph-up-arrow' },
  { value: '1,400+', label: 'Active members & investors', icon: 'bi-people-fill' },
  { value: '4', label: 'Business divisions', icon: 'bi-grid-fill' },
  { value: '8', suffix: ' yrs', label: 'Of disciplined growth', icon: 'bi-shield-check-fill' },
]

const DIVISIONS = [
  {
    id: 'tujijenge',
    icon: 'bi-piggy-bank-fill',
    color: '#1F6B42',
    bg: '#E7EEE7',
    title: 'Tujijenge Savings Circle',
    tagline: 'Build together, prosper together',
    desc: 'A disciplined monthly savings scheme where members pool resources, earn on contributions, and access multiplied loan facilities. Your consistent KES 2,000 monthly share becomes a financial foundation for life.',
    cta: 'Join as a member',
    img: IMAGES.savings,
    points: ['Monthly share contributions from KES 2,000', 'Loan eligibility up to 3× total contributions', 'Annual profit distribution to eligible members', 'Transparent digital tracking of every shilling'],
  },
  {
    id: 'wealth',
    icon: 'bi-bar-chart-line-fill',
    color: '#A9793C',
    bg: '#F4ECDE',
    title: 'Wealth Alliance',
    tagline: 'Invest with vision, grow with discipline',
    desc: 'A curated investment vehicle for capital deployment across diversified asset classes — professionally managed, with full digital reporting on every position.',
    cta: 'Start investing',
    img: IMAGES.wealth,
    points: ['Diversified portfolio across multiple asset classes', 'Return shown as (Net gain ÷ Capital) × 100', 'Dividend declarations proportional to capital', 'Real-time investor portal access'],
  },
  {
    id: 'tablebanking',
    icon: 'bi-cash-stack',
    color: '#3D6B8C',
    bg: '#E6EDF1',
    title: 'Table Banking',
    tagline: 'Simple savings, instant community credit',
    desc: 'A nimble, community-driven lending model where monthly contributions build a shared fund. Borrow at fair rates, repay on schedule, watch the fund multiply for everyone.',
    cta: 'Join a circle',
    img: IMAGES.banking,
    points: ['Monthly contributions due by the 15th', 'Available fund = contributions + interest − loans', 'Straightforward loan process within the group', 'Ledger visible to every member, always'],
  },
  {
    id: 'rentals',
    icon: 'bi-building-fill',
    color: '#8C4A3D',
    bg: '#F1E7E4',
    title: 'Kilele Rentals',
    tagline: 'Premium property, passive income',
    desc: 'A growing portfolio of residential and commercial properties managed end to end — tenant onboarding, rent collection, maintenance. Invest in bricks that work for you.',
    cta: 'View properties',
    img: IMAGES.rentals,
    points: ['Property → unit → tenant → lease, fully digital', 'Auto-generated billing & M-Pesa collection', 'Real-time profitability dashboard per property', 'Professional maintenance management'],
  },
]

const PORTFOLIO = [
  { img: IMAGES.portfolio1, title: 'Kilele Plaza', location: 'Westlands, Nairobi', type: 'Commercial', units: '24 units', status: 'Fully occupied' },
  { img: IMAGES.portfolio2, title: 'Ridge Office Park', location: 'Karen, Nairobi', type: 'Office block', units: '12 offices', status: 'Active' },
  { img: IMAGES.portfolio3, title: 'Summit Apartments', location: 'Kileleshwa, Nairobi', type: 'Residential', units: '36 units', status: 'Fully occupied' },
  { img: IMAGES.portfolio4, title: 'Horizon Villas', location: 'Kitisuru, Nairobi', type: 'Residential', units: '8 villas', status: 'Active' },
]

const NEWS = [
  { img: IMAGES.news1, category: 'Announcement', date: 'June 2025', title: 'Tujijenge Circle completes its 8th annual distribution', excerpt: 'Members celebrated a record dividend payout as the savings circle closed its most profitable year to date, with contributions exceeding KES 28 million.' },
  { img: IMAGES.news2, category: 'Investment', date: 'May 2025', title: 'Wealth Alliance expands into treasury bills & fixed income', excerpt: 'Following strong demand from investors, the Wealth Alliance portfolio now includes government securities alongside equity and real estate instruments.' },
  { img: IMAGES.news3, category: 'Platform', date: 'April 2025', title: 'Kilele platform goes live — one dashboard for every division', excerpt: 'The new enterprise platform unifies all four business units under one digital roof, giving every member, investor and tenant real-time visibility.' },
]

const JOIN_STEPS = [
  { num: '01', title: 'Express interest', desc: 'Fill out the contact form or call us directly. Tell us which division interests you most.' },
  { num: '02', title: 'Attend onboarding', desc: 'Join our monthly member session where we walk through rules, obligations and benefits.' },
  { num: '03', title: 'Register & contribute', desc: 'Complete your KES 2,000 registration fee and first monthly contribution or capital deposit.' },
  { num: '04', title: 'Access your portal', desc: 'Track contributions, loans, dividends and statements in real time from your member portal.' },
]

// ─── Scroll-reveal hook ───
function useReveal(threshold = 0.18) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.unobserve(el) }
    }, { threshold, rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, visible]
}

function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const [ref, visible] = useReveal()
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'reveal--visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms', ...style }} {...rest}>
      {children}
    </Tag>
  )
}

// ─── Ledger-style count-up for stat figures ───
function StatFigure({ value, suffix = '' }) {
  const [ref, visible] = useReveal(0.5)
  const [display, setDisplay] = useState(value.replace(/[\d,]+/, m => m.replace(/\d/g, '0')))
  useEffect(() => {
    if (!visible) return
    const match = value.match(/^(\D*)([\d,]+)(.*)$/)
    if (!match) { setDisplay(value); return }
    const [, prefix, numStr, tail] = match
    const target = parseInt(numStr.replace(/,/g, ''), 10)
    const hasComma = numStr.includes(',')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setDisplay(value); return }
    const duration = 1200
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const current = Math.round(target * eased)
      const formatted = hasComma ? current.toLocaleString('en-US') : String(current)
      setDisplay(`${prefix}${formatted}${tail}`)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, value])
  return <span ref={ref} className="stat-item__value">{display}{suffix}</span>
}

// ─── Animated ridge/contour SVG for the hero ───
function RidgeContours() {
  const paths = [
    'M-50,420 C150,360 300,440 480,380 C660,320 820,400 1000,340 C1150,290 1300,350 1450,300',
    'M-50,480 C180,430 340,500 520,440 C700,380 860,460 1040,400 C1190,350 1330,410 1450,365',
    'M-50,540 C200,500 360,560 540,510 C720,460 880,530 1060,470 C1200,425 1330,470 1450,430',
  ]
  return (
    <svg className="ridge-contours" viewBox="0 0 1400 600" preserveAspectRatio="none" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} className="ridge-contours__path" style={{ animationDelay: `${300 + i * 260}ms`, opacity: 0.5 - i * 0.12 }} />
      ))}
    </svg>
  )
}

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [activeDiv, setActiveDiv] = useState(0)
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [formSent, setFormSent] = useState(false)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const tabRefs = useRef([])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 48)
      const sections = ['home', 'about', 'divisions', 'portfolio', 'news', 'contact']
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && window.scrollY >= el.offsetTop - 140) { setActiveSection(sections[i]); break }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const measureIndicator = useCallback(() => {
    const el = tabRefs.current[activeDiv]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
  }, [activeDiv])

  useLayoutEffect(() => { measureIndicator() }, [measureIndicator])
  useEffect(() => {
    window.addEventListener('resize', measureIndicator)
    return () => window.removeEventListener('resize', measureIndicator)
  }, [measureIndicator])

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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          /* ── Color: highland ridge palette ── */
          --ridge-950: #0B1F16;
          --ridge-900: #0F2B1F;
          --ridge-800: #14432A;
          --ridge-700: #1B5636;
          --ridge-600: #1F6B42;
          --ridge-500: #2F8455;
          --ridge-400: #4C9469;
          --ridge-100: #DCE8DF;
          --ridge-50:  #EEF3EE;
          --brass-700: #8A5F2C;
          --brass-600: #A9793C;
          --brass-500: #C79A5E;
          --brass-100: #F4ECDE;
          --cream:     #F7F5EF;
          --cream-100: #FBFAF6;
          --charcoal:  #1B1B17;
          --stone-700: #423F37;
          --stone-600: #5B5850;
          --stone-400: #8C8A80;
          --stone-200: #DDDACF;
          --stone-100: #EAE7DC;
          --white:     #FFFFFF;
          --primary:   var(--ridge-600);
          --danger:    #A3372B;

          --font-display: 'Fraunces', Georgia, serif;
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
          --font-mono: 'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace;

          --radius-sm: 5px;
          --radius: 6px;
          --radius-md: 8px;

          --shadow-sm: 0 1px 2px rgba(20,25,15,.06);
          --shadow:    0 3px 12px rgba(20,25,15,.08);
          --shadow-md: 0 8px 24px rgba(20,25,15,.10);
          --shadow-lg: 0 16px 40px rgba(20,25,15,.14);
          --ease: cubic-bezier(.4,0,.2,1);
        }

        html { scroll-behavior: smooth; font-size: 15px; }
        body { font-family: var(--font-sans); color: var(--charcoal); background: var(--cream-100); -webkit-font-smoothing: antialiased; line-height: 1.6; }
        img { display: block; max-width: 100%; }
        a { text-decoration: none; color: inherit; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        ::selection { background: var(--ridge-400); color: var(--white); }

        /* ── Typography scale ── */
        .eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--font-mono); font-size: 11px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--ridge-600);
        }
        .section--dark .eyebrow { color: var(--brass-500); }
        h1, h2, h3, .display { font-family: var(--font-display); color: var(--charcoal); letter-spacing: -0.01em; font-weight: 600; }
        .section--dark h2 { color: var(--white); }
        .num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }

        /* ── TOP UTILITY BAR ── */
        .topbar {
          position: relative; z-index: 3;
          background: var(--ridge-950); color: rgba(255,255,255,.68);
          overflow: hidden;
          max-height: 38px; transition: max-height 420ms var(--ease), opacity 420ms var(--ease);
        }
        .topbar--collapsed { max-height: 0; opacity: 0; }
        .topbar__inner {
          max-width: 1200px; margin: 0 auto; padding: 0 5vw; height: 38px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12.5px;
        }
        .topbar__left { display: flex; align-items: center; gap: 22px; }
        .topbar__item { display: flex; align-items: center; gap: 7px; }
        .topbar__item i { font-size: 12px; color: var(--brass-500); }
        .topbar__right { display: flex; align-items: center; gap: 18px; }
        .topbar__social { display: flex; align-items: center; gap: 12px; }
        .topbar__social a { font-size: 13px; color: rgba(255,255,255,.5); transition: color 200ms var(--ease); }
        .topbar__social a:hover { color: var(--brass-500); }
        .topbar__portal { display: flex; align-items: center; gap: 6px; font-weight: 500; color: rgba(255,255,255,.8); transition: color 200ms var(--ease); }
        .topbar__portal:hover { color: var(--white); }
        .topbar__divider { width: 1px; height: 14px; background: rgba(255,255,255,.15); }

        /* ── HEADER WRAPPER ── */
        .site-header { position: fixed; top: 0; left: 0; right: 0; z-index: 999; }

        /* ── MAIN NAV ── */
        .lp-nav {
          height: 64px; display: flex; align-items: center; padding: 0 5vw;
          transition: background 320ms var(--ease), box-shadow 320ms var(--ease), border-color 320ms var(--ease);
          border-bottom: 1px solid transparent;
        }
        .lp-nav--scrolled { background: rgba(251,250,246,.94); backdrop-filter: blur(14px); border-bottom-color: var(--stone-200); box-shadow: var(--shadow-sm); }
        .lp-nav--open { background: var(--ridge-950); }
        .lp-nav__inner { max-width: 1200px; width: 100%; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
        .lp-nav__brand { display: flex; align-items: center; gap: 10px; }
        .lp-nav__logo { width: 34px; height: 34px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .lp-nav__logo img { width: 100%; height: 100%; object-fit: contain; }
        .lp-nav__name { font-family: var(--font-display); font-weight: 600; font-size: 17px; letter-spacing: -0.01em; }
        .lp-nav--scrolled .lp-nav__name { color: var(--charcoal); }
        .lp-nav:not(.lp-nav--scrolled) .lp-nav__name { color: var(--white); }
        .lp-nav--open .lp-nav__name { color: var(--white); }

        .lp-nav__links { display: flex; align-items: center; gap: 2px; }
        .lp-nav__link { position: relative; padding: 8px 14px; font-size: 13.5px; font-weight: 500; transition: color 200ms var(--ease); }
        .lp-nav__link::after {
          content: ''; position: absolute; left: 14px; right: 14px; bottom: 4px; height: 2px;
          background: var(--brass-600); transform: scaleX(0); transform-origin: left;
          transition: transform 240ms var(--ease);
        }
        .lp-nav__link--active::after, .lp-nav__link:hover::after { transform: scaleX(1); }
        .lp-nav--scrolled .lp-nav__link { color: var(--stone-700); }
        .lp-nav--scrolled .lp-nav__link--active, .lp-nav--scrolled .lp-nav__link:hover { color: var(--ridge-700); }
        .lp-nav:not(.lp-nav--scrolled) .lp-nav__link { color: rgba(255,255,255,.78); }
        .lp-nav:not(.lp-nav--scrolled) .lp-nav__link--active, .lp-nav:not(.lp-nav--scrolled) .lp-nav__link:hover { color: var(--white); }

        .lp-nav__cta {
          padding: 9px 19px; border-radius: var(--radius); font-size: 13.5px; font-weight: 600;
          background: var(--ridge-600); color: var(--white);
          transition: background 200ms var(--ease), transform 200ms var(--ease), box-shadow 200ms var(--ease);
        }
        .lp-nav__cta:hover { background: var(--ridge-700); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(31,107,66,.32); }
        .lp-nav__hamburger { display: none; flex-direction: column; gap: 5px; padding: 6px; color: var(--white); }
        .lp-nav--scrolled .lp-nav__hamburger { color: var(--charcoal); }
        .lp-nav__hamburger span { display: block; width: 21px; height: 2px; background: currentColor; border-radius: 2px; transition: transform 240ms var(--ease), opacity 240ms var(--ease); }
        .lp-nav__hamburger--open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
        .lp-nav__hamburger--open span:nth-child(2) { opacity: 0; }
        .lp-nav__hamburger--open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

        /* ── MOBILE DRAWER ── */
        .lp-nav__drawer-overlay { display: none; position: fixed; inset: 0; background: rgba(11,31,22,.55); z-index: 997; opacity: 0; transition: opacity 300ms var(--ease); }
        .lp-nav__drawer-overlay--open { display: block; opacity: 1; }
        .lp-nav__drawer {
          position: fixed; top: 0; left: -300px; bottom: 0; width: 288px; max-width: 85vw;
          background: var(--ridge-950); z-index: 998; padding: 22px 22px 30px; overflow-y: auto;
          transition: left 380ms var(--ease); box-shadow: 4px 0 24px rgba(0,0,0,.3);
          display: flex; flex-direction: column;
        }
        .lp-nav__drawer--open { left: 0; }
        .lp-nav__drawer-brand { display: flex; align-items: center; gap: 10px; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: 18px; }
        .lp-nav__drawer-brand img { width: 34px; height: 34px; object-fit: contain; }
        .lp-nav__drawer-brand span { font-family: var(--font-display); font-weight: 600; font-size: 16px; color: var(--white); }
        .lp-nav__drawer-close { margin-left: auto; color: rgba(255,255,255,.6); font-size: 22px; padding: 4px; transition: color 200ms var(--ease); }
        .lp-nav__drawer-close:hover { color: var(--white); }
        .lp-nav__drawer-links { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .lp-nav__drawer-links a { padding: 12px 14px; color: rgba(255,255,255,.78); font-size: 14.5px; font-weight: 500; border-radius: var(--radius); transition: background 200ms var(--ease), color 200ms var(--ease); }
        .lp-nav__drawer-links a:hover, .lp-nav__drawer-links a.active { background: rgba(255,255,255,.08); color: var(--white); }
        .lp-nav__drawer-cta { margin-top: auto; padding-top: 18px; border-top: 1px solid rgba(255,255,255,.08); }
        .lp-nav__drawer-cta a { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: var(--radius); font-size: 13.5px; font-weight: 600; background: var(--ridge-600); color: var(--white); transition: background 200ms var(--ease); }
        .lp-nav__drawer-cta a:hover { background: var(--ridge-700); }

        /* ── HERO ── */
        .hero {
          position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center;
          overflow: hidden; background: linear-gradient(165deg, var(--ridge-950) 0%, var(--ridge-800) 62%, var(--ridge-700) 100%);
        }
        .hero__bg { position: absolute; inset: 0; background-image: url('${IMAGES.hero}'); background-size: cover; background-position: center; opacity: .10; mix-blend-mode: luminosity; }
        .ridge-contours { position: absolute; left: 0; right: 0; bottom: -20px; width: 100%; height: 46%; }
        .ridge-contours__path { fill: none; stroke: var(--brass-500); stroke-width: 1.4; stroke-dasharray: 2200; stroke-dashoffset: 2200; animation: drawLine 1.8s var(--ease) forwards; }
        @keyframes drawLine { to { stroke-dashoffset: 0; } }
        .hero__overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(11,31,22,.25) 0%, rgba(11,31,22,.68) 100%); }
        .hero__content { position: relative; z-index: 2; text-align: center; padding: 128px 24px 96px; max-width: 780px; margin: 0 auto; }
        .hero__eyebrow {
          display: inline-flex; align-items: center; gap: 9px; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.14);
          color: var(--brass-500); padding: 6px 15px; border-radius: var(--radius-md); margin-bottom: 26px; backdrop-filter: blur(6px);
          opacity: 0; animation: fadeUp 700ms var(--ease) 150ms forwards;
        }
        .hero__title {
          font-family: var(--font-display); font-weight: 600; font-size: clamp(2.5rem, 6vw, 4.25rem); color: var(--white);
          line-height: 1.06; letter-spacing: -0.02em; margin-bottom: 22px;
          opacity: 0; animation: fadeUp 800ms var(--ease) 300ms forwards;
        }
        .hero__title em { font-style: italic; font-weight: 500; color: var(--brass-500); }
        .hero__sub {
          font-size: clamp(15px, 1.7vw, 17.5px); color: rgba(255,255,255,.72); max-width: 560px; margin: 0 auto 38px; line-height: 1.7;
          opacity: 0; animation: fadeUp 800ms var(--ease) 480ms forwards;
        }
        .hero__actions {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
          opacity: 0; animation: fadeUp 800ms var(--ease) 640ms forwards;
        }
        .hero__btn {
          padding: 13px 24px; border-radius: var(--radius-md); font-size: 14.5px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 9px; transition: transform 220ms var(--ease), box-shadow 220ms var(--ease), background 220ms var(--ease);
        }
        .hero__btn--primary { background: var(--ridge-600); color: var(--white); box-shadow: 0 6px 24px rgba(31,107,66,.45); }
        .hero__btn--primary:hover { background: var(--ridge-500); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(31,107,66,.5); }
        .hero__btn--outline { background: rgba(255,255,255,.06); color: var(--white); border: 1.5px solid rgba(255,255,255,.28); backdrop-filter: blur(6px); }
        .hero__btn--outline:hover { background: rgba(255,255,255,.13); transform: translateY(-2px); }
        .hero__scroll {
          position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 7px;
          color: rgba(255,255,255,.4); font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          animation: bounce 2.2s infinite;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(7px); } }

        /* ── STATS STRIP ── */
        .stats-strip { background: var(--cream-100); border-bottom: 1px solid var(--stone-200); }
        .stats-strip__inner { max-width: 1200px; margin: 0 auto; padding: 0 5vw; display: grid; grid-template-columns: repeat(4, 1fr); }
        .stat-item { display: flex; align-items: center; gap: 14px; padding: 26px 20px; border-right: 1px solid var(--stone-200); }
        .stat-item:last-child { border-right: none; }
        .stat-item__icon { width: 40px; height: 40px; border-radius: var(--radius); background: var(--ridge-50); color: var(--ridge-600); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .stat-item__value { font-family: var(--font-mono); font-size: 21px; font-weight: 600; color: var(--charcoal); letter-spacing: -0.01em; line-height: 1.1; }
        .stat-item__label { font-size: 12px; color: var(--stone-600); font-weight: 500; margin-top: 3px; }

        /* ── REVEAL ── */
        .reveal { opacity: 0; transform: translateY(22px); transition: opacity 640ms var(--ease), transform 640ms var(--ease); }
        .reveal--visible { opacity: 1; transform: translateY(0); }

        /* ── SECTIONS ── */
        .section { padding: 104px 5vw; }
        .section--alt { background: var(--stone-100); }
        .section--dark { background: var(--ridge-950); }
        .section__inner { max-width: 1200px; margin: 0 auto; }
        .section__title { font-size: clamp(1.7rem, 3.4vw, 2.5rem); font-weight: 600; line-height: 1.14; margin: 12px 0 16px; max-width: 600px; }
        .section__sub { font-size: 15.5px; color: var(--stone-600); max-width: 540px; line-height: 1.7; }
        .section--dark .section__sub { color: rgba(255,255,255,.6); }
        .section__header { margin-bottom: 56px; }
        .section__header--center { text-align: center; }
        .section__header--center .section__title, .section__header--center .section__sub { max-width: 100%; }

        /* ── ABOUT ── */
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 68px; align-items: center; }
        .about__img-wrap { position: relative; border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-lg); aspect-ratio: 4/3; }
        .about__img-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .about__badge { position: absolute; bottom: 18px; left: 18px; background: var(--white); border-radius: var(--radius); padding: 13px 17px; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 12px; }
        .about__badge-icon { width: 38px; height: 38px; background: var(--ridge-50); border-radius: var(--radius-sm); color: var(--ridge-600); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .about__badge-value { font-family: var(--font-mono); font-size: 19px; font-weight: 600; color: var(--charcoal); line-height: 1; }
        .about__badge-label { font-size: 11.5px; color: var(--stone-600); margin-top: 3px; }
        .about__pillars { display: flex; flex-direction: column; gap: 20px; margin-top: 30px; }
        .about__pillar { display: flex; gap: 14px; align-items: flex-start; transition: transform 260ms var(--ease); }
        .about__pillar:hover { transform: translateX(4px); }
        .about__pillar-icon { width: 34px; height: 34px; border-radius: var(--radius-sm); background: var(--ridge-50); color: var(--ridge-600); display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; margin-top: 2px; }
        .about__pillar-title { font-family: var(--font-display); font-weight: 600; font-size: 15px; color: var(--charcoal); margin-bottom: 4px; }
        .about__pillar-desc { font-size: 13px; color: var(--stone-600); line-height: 1.6; }

        /* ── DIVISIONS ── */
        .div-tabs { position: relative; display: flex; gap: 4px; margin-bottom: 44px; flex-wrap: wrap; border-bottom: 1px solid var(--stone-200); }
        .div-tab { display: flex; align-items: center; gap: 8px; padding: 12px 18px; font-size: 13.5px; font-weight: 600; color: var(--stone-600); transition: color 220ms var(--ease); }
        .div-tab i { font-size: 15px; }
        .div-tab:hover { color: var(--ridge-700); }
        .div-tab--active { color: var(--charcoal); }
        .div-tabs__indicator { position: absolute; bottom: -1px; height: 2px; background: var(--brass-600); transition: left 320ms var(--ease), width 320ms var(--ease); }
        .div-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 58px; align-items: center; }
        .div-panel__img-wrap { border-radius: var(--radius-md); overflow: hidden; aspect-ratio: 5/4; box-shadow: var(--shadow-lg); }
        .div-panel__img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--ease); }
        .div-panel__img-wrap:hover img { transform: scale(1.045); }
        .div-panel__eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; padding: 6px 13px; border-radius: var(--radius-sm); margin-bottom: 20px; }
        .div-panel__title { font-family: var(--font-display); font-weight: 600; font-size: 28px; color: var(--charcoal); letter-spacing: -0.01em; margin-bottom: 8px; line-height: 1.15; }
        .div-panel__tagline { font-family: var(--font-display); font-style: italic; font-weight: 400; font-size: 15.5px; color: var(--stone-600); margin-bottom: 18px; }
        .div-panel__desc { font-size: 14px; color: var(--stone-700); line-height: 1.75; margin-bottom: 24px; }
        .div-panel__points { display: flex; flex-direction: column; gap: 11px; margin-bottom: 30px; }
        .div-panel__point { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--stone-700); list-style: none; }
        .div-panel__point i { font-size: 15px; flex-shrink: 0; }
        .div-panel__cta { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: var(--radius); font-size: 13.5px; font-weight: 600; color: var(--white); transition: transform 220ms var(--ease), box-shadow 220ms var(--ease), filter 220ms var(--ease); width: fit-content; }
        .div-panel__cta:hover { transform: translateY(-2px); filter: brightness(1.08); box-shadow: var(--shadow-md); }
        .div-panel__cta i { transition: transform 220ms var(--ease); }
        .div-panel__cta:hover i { transform: translateX(3px); }

        /* ── PORTFOLIO ── */
        .portfolio-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .portfolio-card { border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow); transition: transform 300ms var(--ease), box-shadow 300ms var(--ease); position: relative; aspect-ratio: 4/3; }
        .portfolio-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .portfolio-card img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--ease); }
        .portfolio-card:hover img { transform: scale(1.06); }
        .portfolio-card__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(11,31,22,.9) 0%, transparent 55%); }
        .portfolio-card__body { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; color: var(--white); }
        .portfolio-card__type { font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--brass-500); margin-bottom: 6px; }
        .portfolio-card__name { font-family: var(--font-display); font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 4px; }
        .portfolio-card__location { font-size: 12px; color: rgba(255,255,255,.65); display: flex; align-items: center; gap: 4px; }
        .portfolio-card__status { position: absolute; top: 14px; right: 14px; background: rgba(31,107,66,.92); color: var(--white); font-size: 10.5px; font-weight: 600; padding: 4px 10px; border-radius: var(--radius-sm); backdrop-filter: blur(6px); }

        /* ── JOIN STEPS ── */
        .join-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .join-step { position: relative; padding-top: 6px; }
        .join-step::before { content: ''; position: absolute; top: 24px; left: calc(100% - 10px); width: calc(50% + 10px); height: 1px; background: var(--stone-200); }
        .join-step:last-child::before { display: none; }
        .join-step__num { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--brass-600); margin-bottom: 14px; }
        .join-step__title { font-family: var(--font-display); font-weight: 600; font-size: 15.5px; color: var(--charcoal); margin-bottom: 8px; }
        .join-step__desc { font-size: 13px; color: var(--stone-600); line-height: 1.65; }

        /* ── NEWS ── */
        .news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .news-card { border-radius: var(--radius-md); overflow: hidden; background: var(--white); border: 1px solid var(--stone-200); box-shadow: var(--shadow-sm); transition: transform 280ms var(--ease), box-shadow 280ms var(--ease); cursor: pointer; }
        .news-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .news-card__img-wrap { aspect-ratio: 16/9; overflow: hidden; }
        .news-card__img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s var(--ease); }
        .news-card:hover .news-card__img-wrap img { transform: scale(1.045); }
        .news-card__body { padding: 20px; }
        .news-card__meta { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .news-card__cat { font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: var(--ridge-700); background: var(--ridge-50); padding: 3px 9px; border-radius: var(--radius-sm); }
        .news-card__date { font-family: var(--font-mono); font-size: 11px; color: var(--stone-400); }
        .news-card__title { font-family: var(--font-display); font-size: 16px; font-weight: 600; color: var(--charcoal); line-height: 1.32; margin-bottom: 10px; letter-spacing: -0.005em; }
        .news-card__excerpt { font-size: 13px; color: var(--stone-600); line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .news-card__link { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--ridge-700); margin-top: 14px; transition: gap 220ms var(--ease); }
        .news-card:hover .news-card__link { gap: 10px; }

        /* ── CTA BANNER ── */
        .cta-banner { background: linear-gradient(135deg, var(--ridge-950) 0%, var(--ridge-700) 100%); padding: 88px 5vw; text-align: center; position: relative; overflow: hidden; }
        .cta-banner::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 60% 40%, rgba(199,154,94,.14), transparent 65%); pointer-events: none; }
        .cta-banner__inner { max-width: 620px; margin: 0 auto; position: relative; z-index: 1; }
        .cta-banner__title { font-family: var(--font-display); font-weight: 600; font-size: clamp(1.7rem, 3.6vw, 2.4rem); color: var(--white); letter-spacing: -0.015em; margin-bottom: 14px; line-height: 1.18; }
        .cta-banner__sub { font-size: 15.5px; color: rgba(255,255,255,.68); margin-bottom: 34px; line-height: 1.7; }
        .cta-banner__actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* ── CONTACT ── */
        .contact-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 64px; align-items: start; }
        .contact-info { display: flex; flex-direction: column; gap: 26px; }
        .contact-info-item { display: flex; gap: 14px; align-items: flex-start; }
        .contact-info-item__icon { width: 40px; height: 40px; border-radius: var(--radius); background: var(--ridge-50); color: var(--ridge-600); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .contact-info-item__label { font-family: var(--font-mono); font-size: 10.5px; font-weight: 500; color: var(--stone-400); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px; }
        .contact-info-item__value { font-size: 13.5px; font-weight: 600; color: var(--charcoal); }
        .contact-form { background: var(--white); border: 1px solid var(--stone-200); border-radius: var(--radius-md); padding: 34px; box-shadow: var(--shadow-md); }
        .contact-form__heading { font-family: var(--font-display); font-size: 18px; font-weight: 600; margin-bottom: 22px; color: var(--charcoal); }
        .form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .cf-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; }
        .cf-label { font-size: 12.5px; font-weight: 600; color: var(--stone-700); }
        .cf-input { padding: 10px 13px; border: 1.5px solid var(--stone-200); border-radius: var(--radius); font-size: 13.5px; color: var(--charcoal); background: var(--cream-100); transition: border-color 200ms var(--ease), box-shadow 200ms var(--ease), background 200ms var(--ease); outline: none; font-family: var(--font-sans); }
        .cf-input:focus { border-color: var(--ridge-500); background: var(--white); box-shadow: 0 0 0 3px rgba(47,132,85,.12); }
        .cf-textarea { min-height: 108px; resize: vertical; }
        .cf-submit { width: 100%; padding: 13px; border-radius: var(--radius); font-size: 14.5px; font-weight: 600; background: var(--ridge-600); color: var(--white); transition: background 220ms var(--ease), transform 220ms var(--ease), box-shadow 220ms var(--ease); display: flex; align-items: center; justify-content: center; gap: 8px; }
        .cf-submit:hover { background: var(--ridge-700); transform: translateY(-1px); box-shadow: 0 6px 18px rgba(31,107,66,.3); }
        .cf-success { display: flex; align-items: center; gap: 10px; background: var(--ridge-50); border: 1px solid var(--ridge-100); border-radius: var(--radius); padding: 13px 17px; color: var(--ridge-800); font-size: 13.5px; font-weight: 600; margin-bottom: 16px; animation: fadeUp 400ms var(--ease); }

        /* ── FOOTER ── */
        .footer { background: var(--ridge-950); color: rgba(255,255,255,.6); }
        .footer__main { max-width: 1200px; margin: 0 auto; padding: 60px 5vw 40px; display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
        .footer__brand-name { font-family: var(--font-display); font-weight: 600; font-size: 18px; color: var(--white); margin-bottom: 10px; }
        .footer__brand-desc { font-size: 13px; line-height: 1.7; max-width: 280px; margin-bottom: 20px; }
        .footer__social { display: flex; gap: 8px; }
        .footer__social-btn { width: 34px; height: 34px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,.1); display: flex; align-items: center; justify-content: center; font-size: 15px; color: rgba(255,255,255,.5); transition: all 220ms var(--ease); }
        .footer__social-btn:hover { background: var(--ridge-600); border-color: var(--ridge-600); color: var(--white); transform: translateY(-2px); }
        .footer__col-title { font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: var(--white); margin-bottom: 18px; }
        .footer__links { display: flex; flex-direction: column; gap: 10px; }
        .footer__links a { font-size: 13px; color: rgba(255,255,255,.5); transition: color 200ms var(--ease); }
        .footer__links a:hover { color: var(--white); }
        .footer__bottom { border-top: 1px solid rgba(255,255,255,.06); padding: 20px 5vw; max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .footer__copy { font-size: 12px; color: rgba(255,255,255,.3); }
        .footer__legal { display: flex; gap: 20px; }
        .footer__legal a { font-size: 12px; color: rgba(255,255,255,.3); transition: color 200ms var(--ease); }
        .footer__legal a:hover { color: var(--white); }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .about-grid { grid-template-columns: 1fr; gap: 40px; }
          .about-grid > :first-child { order: 2; }
          .div-panel { grid-template-columns: 1fr; gap: 32px; }
          .contact-grid { grid-template-columns: 1fr; gap: 40px; }
          .footer__main { grid-template-columns: 1fr 1fr; gap: 36px; }
        }
        @media (max-width: 768px) {
          .topbar { display: none; }
          .section { padding: 64px 5vw; }
          .lp-nav__links, .lp-nav__cta { display: none; }
          .lp-nav__hamburger { display: flex; }
          .stats-strip__inner { grid-template-columns: repeat(2, 1fr); }
          .stat-item { border-right: none; border-bottom: 1px solid var(--stone-200); }
          .stat-item:nth-child(odd) { border-right: 1px solid var(--stone-200); }
          .news-grid { grid-template-columns: 1fr; }
          .join-steps { grid-template-columns: 1fr 1fr; }
          .join-step::before { display: none; }
          .portfolio-grid { grid-template-columns: 1fr; }
          .footer__main { grid-template-columns: 1fr 1fr; }
          .form-row2 { grid-template-columns: 1fr; }
          .footer__bottom { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .stats-strip__inner { grid-template-columns: 1fr; }
          .stat-item { border-right: none; }
          .join-steps { grid-template-columns: 1fr; }
          .footer__main { grid-template-columns: 1fr; }
          .div-tabs { gap: 2px; }
          .div-tab { padding: 10px 12px; font-size: 12.5px; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; animation-delay: 0ms !important; transition-duration: .01ms !important; }
          .hero__eyebrow, .hero__title, .hero__sub, .hero__actions { opacity: 1; }
        }
      `}</style>

      {/* ─────── HEADER (top utility bar + main nav) ─────── */}
      <div className="site-header">
        <div className={`topbar ${scrolled ? 'topbar--collapsed' : ''}`} aria-hidden={scrolled}>
          <div className="topbar__inner">
            <div className="topbar__left">
              <a className="topbar__item" href="tel:+254700000000"><i className="bi bi-telephone-fill" />+254 700 000 000</a>
              <a className="topbar__item" href="mailto:info@kileleridge.co.ke"><i className="bi bi-envelope-fill" />info@kileleridge.co.ke</a>
              <span className="topbar__item"><i className="bi bi-clock-fill" />Mon–Fri, 8am–6pm EAT</span>
            </div>
            <div className="topbar__right">
              <div className="topbar__social" aria-label="Social media">
                {['twitter-x', 'facebook', 'linkedin', 'instagram'].map(s => (
                  <a key={s} href="#" aria-label={`Follow us on ${s}`}><i className={`bi bi-${s}`} /></a>
                ))}
              </div>
              <div className="topbar__divider" />
              <a href="/login" className="topbar__portal"><i className="bi bi-box-arrow-in-right" />Member Login</a>
            </div>
          </div>
        </div>

        <nav className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''} ${navOpen ? 'lp-nav--open' : ''}`} role="navigation" aria-label="Main navigation">
          <div className="lp-nav__inner">
            <a className="lp-nav__brand" href="#home" onClick={(e) => { e.preventDefault(); scrollTo('#home') }} aria-label="Kilele Ridge Group home">
              <div className="lp-nav__logo" aria-hidden="true"><img src="/assets/kilele_logo.png" alt="Kilele Ridge Group logo" /></div>
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
              <i className="bi bi-box-arrow-in-right" aria-hidden="true" />Login
            </a>
            <button className={`lp-nav__hamburger ${navOpen ? 'lp-nav__hamburger--open' : ''}`}
              onClick={() => setNavOpen(p => !p)} aria-label={navOpen ? 'Close menu' : 'Open menu'} aria-expanded={navOpen}>
              <span /><span /><span />
            </button>
          </div>
        </nav>
      </div>

      <div className={`lp-nav__drawer-overlay ${navOpen ? 'lp-nav__drawer-overlay--open' : ''}`} onClick={() => setNavOpen(false)} aria-hidden="true" />
      <div className={`lp-nav__drawer ${navOpen ? 'lp-nav__drawer--open' : ''}`} role="dialog" aria-label="Mobile navigation">
        <div className="lp-nav__drawer-brand">
          <img src="/assets/kilele_logo.png" alt="Kilele Ridge Group logo" />
          <span>Kilele Ridge Group</span>
          <button className="lp-nav__drawer-close" onClick={() => setNavOpen(false)} aria-label="Close menu"><i className="bi bi-x-lg" /></button>
        </div>
        <div className="lp-nav__drawer-links">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className={activeSection === l.href.replace('#', '') ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); scrollTo(l.href) }}>{l.label}</a>
          ))}
        </div>
        <div className="lp-nav__drawer-cta">
          <a href="/login" aria-label="Login to member portal"><i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Login Portal</a>
        </div>
      </div>

      {/* ─────── HERO ─────── */}
      <section id="home" className="hero" aria-label="Hero — Kilele Ridge Group enterprise platform">
        <div className="hero__bg" role="img" aria-label="Nairobi business district skyline representing Kilele Ridge Group's enterprise presence" />
        <RidgeContours />
        <div className="hero__overlay" aria-hidden="true" />
        <div className="hero__content">
          <span className="hero__eyebrow"><i className="bi bi-triangle-fill" aria-hidden="true" style={{ fontSize: 9 }} />Est. 2017 · Nairobi</span>
          <h1 className="hero__title">One group.<br /><em>Four paths</em> to the summit.</h1>
          <p className="hero__sub">Kilele Ridge Group unites savings, investment, table banking and property under one disciplined ecosystem — built for members who take their financial future seriously.</p>
          <div className="hero__actions">
            <a href="#divisions" className="hero__btn hero__btn--primary" onClick={(e) => { e.preventDefault(); scrollTo('#divisions') }}>
              <i className="bi bi-grid-fill" aria-hidden="true" />Explore our divisions
            </a>
            <a href="#contact" className="hero__btn hero__btn--outline" onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}>
              <i className="bi bi-envelope-fill" aria-hidden="true" />Get in touch
            </a>
          </div>
        </div>
        <div className="hero__scroll" aria-hidden="true"><span>Scroll</span><i className="bi bi-chevron-down" /></div>
      </section>

      {/* ─────── STATS ─────── */}
      <div className="stats-strip" role="region" aria-label="Key statistics">
        <div className="stats-strip__inner">
          {STATS.map((s, i) => (
            <Reveal as="div" delay={i * 80} className="stat-item" key={i}>
              <div className="stat-item__icon" aria-hidden="true"><i className={`bi ${s.icon}`} /></div>
              <div>
                <StatFigure value={s.value} suffix={s.suffix} />
                <div className="stat-item__label">{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ─────── ABOUT ─────── */}
      <section id="about" className="section" aria-label="About Kilele Ridge Group">
        <div className="section__inner">
          <div className="about-grid">
            <Reveal className="about__img-wrap">
              <img src={IMAGES.about} alt="Kilele Ridge Group leadership team in a strategy meeting, Nairobi" loading="lazy" />
              <div className="about__badge" aria-label="8 years of disciplined financial growth">
                <div className="about__badge-icon" aria-hidden="true"><i className="bi bi-award-fill" /></div>
                <div>
                  <div className="about__badge-value">8 years</div>
                  <div className="about__badge-label">Trusted financial growth</div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <p className="eyebrow">Who we are</p>
              <h2 className="section__title">A disciplined financial group built on community trust</h2>
              <p className="section__sub" style={{ marginBottom: 0 }}>
                Founded in 2017, Kilele Ridge Group is a Nairobi-based enterprise that pools member capital across four business divisions — combining the accountability of a savings circle with the ambition of an institutional investor.
              </p>
              <div className="about__pillars">
                {[
                  { icon: 'bi-shield-check-fill', title: 'Transparency first', desc: 'Every shilling tracked digitally. Every member can view real-time statements, contribution history and allocation breakdowns.' },
                  { icon: 'bi-people-fill', title: 'Member-centric', desc: 'Our rules exist to serve members. Interest rates, loan multipliers and distribution rules are reviewed annually with the group.' },
                  { icon: 'bi-graph-up-arrow', title: 'Compounding growth', desc: 'Contributions, reinvestments and rental income compound across the group — creating wealth that grows faster together.' },
                ].map((p, i) => (
                  <div className="about__pillar" key={i}>
                    <div className="about__pillar-icon" aria-hidden="true"><i className={`bi ${p.icon}`} /></div>
                    <div><div className="about__pillar-title">{p.title}</div><div className="about__pillar-desc">{p.desc}</div></div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────── DIVISIONS ─────── */}
      <section id="divisions" className="section section--alt" aria-label="Our four business divisions">
        <div className="section__inner">
          <Reveal className="section__header">
            <p className="eyebrow">Business divisions</p>
            <h2 className="section__title">Four ways to grow with us</h2>
            <p className="section__sub">Whether you're saving monthly, investing capital, banking with your community, or earning through property — there's a place for you in our ecosystem.</p>
          </Reveal>

          <div className="div-tabs" role="tablist" aria-label="Division tabs">
            {DIVISIONS.map((d, i) => (
              <button key={d.id} ref={el => (tabRefs.current[i] = el)} role="tab" aria-selected={activeDiv === i}
                aria-controls={`divpanel-${d.id}`} className={`div-tab ${activeDiv === i ? 'div-tab--active' : ''}`}
                onClick={() => setActiveDiv(i)}>
                <i className={`bi ${d.icon}`} style={{ color: activeDiv === i ? d.color : 'inherit' }} aria-hidden="true" />
                {d.title.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
            <span className="div-tabs__indicator" style={{ left: indicator.left, width: indicator.width }} />
          </div>

          {DIVISIONS.map((d, i) => (
            <div key={d.id} id={`divpanel-${d.id}`} role="tabpanel" hidden={activeDiv !== i} aria-labelledby={`tab-${d.id}`}>
              {activeDiv === i && (
                <div className="div-panel">
                  <Reveal className="div-panel__img-wrap"><img src={d.img} alt={`${d.title} — ${d.tagline}`} loading="lazy" /></Reveal>
                  <Reveal delay={100}>
                    <div className="div-panel__eyebrow" style={{ background: d.bg, color: d.color }}>
                      <i className={`bi ${d.icon}`} aria-hidden="true" /> {d.title}
                    </div>
                    <h3 className="div-panel__title">{d.title}</h3>
                    <p className="div-panel__tagline">{d.tagline}</p>
                    <p className="div-panel__desc">{d.desc}</p>
                    <ul className="div-panel__points" aria-label={`Key features of ${d.title}`}>
                      {d.points.map((pt, j) => (
                        <li key={j} className="div-panel__point"><i className="bi bi-check-circle-fill" style={{ color: d.color }} aria-hidden="true" />{pt}</li>
                      ))}
                    </ul>
                    <a href="#contact" className="div-panel__cta" onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}
                      style={{ background: d.color }} aria-label={`${d.cta} — ${d.title}`}>
                      {d.cta} <i className="bi bi-arrow-right" aria-hidden="true" />
                    </a>
                  </Reveal>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────── PORTFOLIO ─────── */}
      <section id="portfolio" className="section" aria-label="Property portfolio">
        <div className="section__inner">
          <Reveal className="section__header section__header--center">
            <p className="eyebrow">Our portfolio</p>
            <h2 className="section__title" style={{ maxWidth: '100%' }}>Properties that work harder than a savings account</h2>
            <p className="section__sub" style={{ maxWidth: 520, margin: '0 auto' }}>From Westlands to Karen, our property portfolio generates consistent rental income for the group while appreciating in value year on year.</p>
          </Reveal>
          <div className="portfolio-grid">
            {PORTFOLIO.map((p, i) => (
              <Reveal as="article" delay={i * 90} className="portfolio-card" key={i} aria-label={`${p.title} — ${p.location}`}>
                <img src={p.img} alt={`${p.title}, ${p.type} in ${p.location}`} loading="lazy" />
                <div className="portfolio-card__overlay" aria-hidden="true" />
                <div className="portfolio-card__body">
                  <div className="portfolio-card__type">{p.type} · {p.units}</div>
                  <div className="portfolio-card__name">{p.title}</div>
                  <div className="portfolio-card__location"><i className="bi bi-geo-alt" aria-hidden="true" />{p.location}</div>
                </div>
                <div className="portfolio-card__status" aria-label={`Status: ${p.status}`}>{p.status}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── HOW TO JOIN ─────── */}
      <section className="section section--alt" aria-label="How to join Kilele Ridge Group">
        <div className="section__inner">
          <Reveal className="section__header section__header--center">
            <p className="eyebrow">How to join</p>
            <h2 className="section__title" style={{ maxWidth: '100%' }}>Four steps to start building wealth with us</h2>
          </Reveal>
          <div className="join-steps" role="list">
            {JOIN_STEPS.map((s, i) => (
              <Reveal as="div" delay={i * 90} className="join-step" key={i} role="listitem">
                <div className="join-step__num num" aria-label={`Step ${s.num}`}>{s.num}</div>
                <div className="join-step__title">{s.title}</div>
                <p className="join-step__desc">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── NEWS ─────── */}
      <section id="news" className="section" aria-label="Latest news and updates">
        <div className="section__inner">
          <Reveal className="section__header section__header--center">
            <p className="eyebrow">Latest news</p>
            <h2 className="section__title" style={{ maxWidth: '100%' }}>What's happening at Kilele Ridge</h2>
          </Reveal>
          <div className="news-grid">
            {NEWS.map((n, i) => (
              <Reveal as="article" delay={i * 90} className="news-card" key={i} aria-label={n.title}>
                <div className="news-card__img-wrap"><img src={n.img} alt={`News article image: ${n.title}`} loading="lazy" /></div>
                <div className="news-card__body">
                  <div className="news-card__meta"><span className="news-card__cat">{n.category}</span><span className="news-card__date num">{n.date}</span></div>
                  <h3 className="news-card__title">{n.title}</h3>
                  <p className="news-card__excerpt">{n.excerpt}</p>
                  <div className="news-card__link" role="link" tabIndex={0} aria-label={`Read more: ${n.title}`}>Read more <i className="bi bi-arrow-right" aria-hidden="true" /></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── CTA BANNER ─────── */}
      <div className="cta-banner" role="complementary" aria-label="Call to action">
        <Reveal className="cta-banner__inner">
          <h2 className="cta-banner__title">Ready to put your money to work?</h2>
          <p className="cta-banner__sub">Join over 1,400 members and investors who are building real, measurable wealth through Kilele Ridge Group's disciplined framework.</p>
          <div className="cta-banner__actions">
            <a href="#contact" className="hero__btn hero__btn--primary" onClick={(e) => { e.preventDefault(); scrollTo('#contact') }} aria-label="Get started by contacting us">
              <i className="bi bi-send-fill" aria-hidden="true" /> Get started
            </a>
            <a href="/login" className="hero__btn hero__btn--outline" aria-label="Login to member portal">
              <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Member login
            </a>
          </div>
        </Reveal>
      </div>

      {/* ─────── CONTACT ─────── */}
      <section id="contact" className="section section--alt" aria-label="Contact Kilele Ridge Group">
        <div className="section__inner">
          <div className="contact-grid">
            <Reveal>
              <p className="eyebrow">Get in touch</p>
              <h2 className="section__title">We'd love to hear from you</h2>
              <p className="section__sub" style={{ marginBottom: 32 }}>Whether you have questions about joining, investing, or our property portfolio — our team responds within 24 hours.</p>
              <div className="contact-info" role="list">
                {[
                  { icon: 'bi-geo-alt-fill', label: 'Address', value: 'Westlands Business Park, Waiyaki Way, Nairobi, Kenya' },
                  { icon: 'bi-telephone-fill', label: 'Phone', value: '+254 700 000 000' },
                  { icon: 'bi-envelope-fill', label: 'Email', value: 'info@kileleridge.co.ke' },
                  { icon: 'bi-clock-fill', label: 'Office hours', value: 'Mon – Fri: 8am – 6pm EAT' },
                ].map((c, i) => (
                  <div key={i} className="contact-info-item" role="listitem">
                    <div className="contact-info-item__icon" aria-hidden="true"><i className={`bi ${c.icon}`} /></div>
                    <div><div className="contact-info-item__label">{c.label}</div><div className="contact-info-item__value">{c.value}</div></div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={120} className="contact-form" role="main" aria-label="Contact form">
              <h3 className="contact-form__heading">Send us a message</h3>
              {formSent && (
                <div className="cf-success" role="alert" aria-live="polite">
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />Message sent — we'll get back to you within 24 hours.
                </div>
              )}
              <form onSubmit={handleContact} noValidate>
                <div className="form-row2">
                  <div className="cf-group">
                    <label className="cf-label" htmlFor="cf-name">Full name</label>
                    <input id="cf-name" className="cf-input" type="text" placeholder="John Kamau" required
                      value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} aria-required="true" />
                  </div>
                  <div className="cf-group">
                    <label className="cf-label" htmlFor="cf-email">Email address</label>
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
                    <option>Wealth Alliance investment inquiry</option>
                    <option>Table banking membership</option>
                    <option>Property / rentals inquiry</option>
                    <option>Member portal support</option>
                    <option>General inquiry</option>
                  </select>
                </div>
                <div className="cf-group">
                  <label className="cf-label" htmlFor="cf-message">Message</label>
                  <textarea id="cf-message" className="cf-input cf-textarea" placeholder="Tell us more about your interest or question…" required
                    value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} aria-required="true" />
                </div>
                <button type="submit" className="cf-submit" aria-label="Send message"><i className="bi bi-send-fill" aria-hidden="true" /> Send message</button>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────── FOOTER ─────── */}
      <footer className="footer" role="contentinfo" aria-label="Kilele Ridge Group footer">
        <div className="footer__main">
          <div>
            <div className="footer__brand-name">Kilele Ridge Group</div>
            <p className="footer__brand-desc">A multi-division financial enterprise committed to building generational wealth for its members through savings, investment, table banking and property.</p>
            <div className="footer__social" role="list" aria-label="Social media links">
              {['twitter-x', 'facebook', 'linkedin', 'instagram', 'youtube'].map(s => (
                <a key={s} href="#" className="footer__social-btn" role="listitem" aria-label={`Follow us on ${s}`}><i className={`bi bi-${s}`} aria-hidden="true" /></a>
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
              {['About us', 'Our portfolio', 'News & updates', 'Contact us', 'Member portal'].map(l => (
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
              <a href="/login" aria-label="Login to member portal" style={{ color: 'var(--brass-500)', fontWeight: 600 }}>
                <i className="bi bi-box-arrow-in-right" style={{ marginRight: 6 }} aria-hidden="true" />Login portal
              </a>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <div className="footer__copy">© {new Date().getFullYear()} Kilele Ridge Group. All rights reserved.</div>
          <div className="footer__legal"><a href="#">Privacy policy</a><a href="#">Terms of use</a><a href="#">Cookie policy</a></div>
        </div>
      </footer>
    </>
  )
}