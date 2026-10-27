import { joinWaitlist } from './api';
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import gsap from "gsap";
import "./App.css";

const rentItems = [
  { label: "Excavators", icon: "excavator" },
  { label: "Cranes", icon: "crane" },
  { label: "Generators", icon: "bolt" },
  { label: "Concrete mixers", icon: "mixer" },
  { label: "Scaffolding", icon: "scaffold" },
  { label: "Tipper trucks", icon: "truck" },
  { label: "Backhoe loaders", icon: "loader" },
  { label: "Compactors", icon: "compact" },
];

const listItems = [
  { label: "Heavy machinery", icon: "excavator" },
  { label: "Lifting equipment", icon: "crane" },
  { label: "Power equipment", icon: "bolt" },
  { label: "Transport vehicles", icon: "truck" },
  { label: "Site tools", icon: "scaffold" },
  { label: "Concrete equipment", icon: "mixer" },
];

function SvgIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    excavator: <path d="M3 17h4l2-4h6l2 4h4M7 13V9h10v4M5 21h14" />,
    crane: <path d="M5 21V5l7-3v6M5 8h12l3 13M12 8v13" />,
    bolt: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
    mixer: <path d="M4 15a8 8 0 1116 0M4 15h16M12 7V3M8 9l-2-3M16 9l2-3" />,
    scaffold: <path d="M3 21V3h18v18M3 12h18M9 3v18M15 3v18" />,
    truck: <path d="M1 14h14V3H1zM15 14h4l2 3v4h-6zM5 21a2 2 0 100-4 2 2 0 000 4zM19 21a2 2 0 100-4 2 2 0 000 4z" />,
    loader: <path d="M5 17V7h6l4 5v5M5 12h10M3 21h4M17 21h4M7 17a2 2 0 100 4 2 2 0 000-4zM17 17a2 2 0 100 4 2 2 0 000-4z" />,
    compact: <path d="M4 19h16M4 15h16M8 15V5h8v10M10 8h4" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
    file: <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />,
    check: <path d="M20 6L9 17l-5-5" />,
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    arrow: <path d="M5 12h14M12 5l7 7-7 7" />,
    heart: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
    star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || icons.check}
    </svg>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="brand">
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke={light ? "#c5d9a5" : "#2d5234"} strokeWidth="2" />
        <path d="M12 20a8 8 0 0116 0" stroke={light ? "#e3955f" : "#e98142"} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="20" cy="20" r="3" fill={light ? "#c5d9a5" : "#2d5234"} />
      </svg>
      <span style={{ color: light ? "#e8f0d8" : "#203b30" }}>Service Loop</span>
    </div>
  );
}

export default function App() {
  const heroRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wantToRent, setWantToRent] = useState<string[]>([]);
  const [wantToList, setWantToList] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');


  const toggleRent = (item: string) =>
    setWantToRent((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  const toggleList = (item: string) =>
    setWantToList((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set([".hero-eyebrow", ".hero-text h1", ".hero-subtitle", ".hero-badges"], { opacity: 0, y: 40 });
      gsap.set(".floating-card", { opacity: 0, scale: 0.8, y: 30 });
      gsap.set([".orbit-ring", ".orbit-center"], { opacity: 0, scale: 0.5 });
      gsap.set(".spark", { opacity: 0, scale: 0, rotation: -180 });
      gsap.set(".bg-circle", { scale: 0.6, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(".bg-circle", { scale: 1, opacity: 1, duration: 1.5, stagger: 0.2 }, 0)
        .to(".hero-eyebrow", { opacity: 1, y: 0, duration: 0.8 }, 0.2)
        .to(".hero-text h1", { opacity: 1, y: 0, duration: 1 }, 0.4)
        .to(".hero-subtitle", { opacity: 1, y: 0, duration: 0.8 }, 0.7)
        .to(".hero-badges", { opacity: 1, y: 0, duration: 0.8 }, 0.9)
        .to(".orbit-center", { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" }, 0.5)
        .to(".orbit-ring", { opacity: 1, scale: 1, duration: 0.8, stagger: 0.15, ease: "power2.out" }, 0.6)
        .to(".floating-card", { opacity: 1, scale: 1, y: 0, duration: 0.7, stagger: 0.2, ease: "back.out(1.4)" }, 1)
        .to(".spark", { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: "back.out(2)" }, 1.3);

      gsap.to(".orbit-ring-1", { rotation: 360, duration: 60, repeat: -1, ease: "none", transformOrigin: "center center" });
      gsap.to(".orbit-ring-2", { rotation: -360, duration: 45, repeat: -1, ease: "none", transformOrigin: "center center" });

      gsap.to(".floating-card", {
        y: "+=8", duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut",
        stagger: { each: 0.4, from: "random" },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!formRef.current) return;
    const ctx = gsap.context(() => {
      gsap.set(".waitlist-card", { opacity: 0, y: 60 });
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            gsap.to(".waitlist-card", { opacity: 1, y: 0, duration: 1, ease: "power3.out" });
            observer.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      observer.observe(formRef.current!);
      return () => observer.disconnect();
    }, formRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!statsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.set(".stat-card", { opacity: 0, y: 30 });
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            gsap.to(".stat-card", { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" });
            observer.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(statsRef.current!);
      return () => observer.disconnect();
    }, statsRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!benefitsRef.current) return;
    const ctx = gsap.context(() => {
      gsap.set(".benefit-card", { opacity: 0, y: 40 });
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            gsap.to(".benefit-card", { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" });
            observer.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      observer.observe(benefitsRef.current!);
      return () => observer.disconnect();
    }, benefitsRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); if (submitting) return;
    setSubmitting(true); setSubmitError('');
    try { await joinWaitlist({ name: name.trim(), phone: phone.trim(), wantToRent, wantToList }); setSubmitted(true); }
    catch (error) { setSubmitError(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <>
      <div className="topbar">
        <span>
          <span className="live-dot" />
          Something big is coming.
        </span>
        <span>
          Made for Nigeria <span className="nigeria-flag" />
        </span>
      </div>

      <section className="hero-section" ref={heroRef}>
        <div className="hero-bg-shapes">
          <div className="bg-circle bg-circle-1" />
          <div className="bg-circle bg-circle-2" />
          <div className="bg-circle bg-circle-3" />
          <div className="bg-grain" />
        </div>
        <div className="hero-inner">
          <nav className="hero-nav">
            <Logo light />
            <a href="#waitlist" style={{ color: "#c5d9a5", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              Join the waitlist <SvgIcon name="arrow" />
            </a>
          </nav>
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-eyebrow">THE FUTURE OF EQUIPMENT RENTAL IN NIGERIA</div>
              <h1>
                Big plans.
                <br />
                Right tools.
                <br />
                <em>Get early access.</em>
              </h1>
              <p className="hero-subtitle">
                Service Loop is building the marketplace that connects Nigeria's builders with
                the equipment and expertise they need. Be the first to know when we launch.
              </p>
              <div className="hero-badges">
                <span className="hero-badge">
                  <SvgIcon name="shield" />
                  Trusted connections
                </span>
                <span className="hero-badge">
                  <SvgIcon name="search" />
                  Find anything
                </span>
                <span className="hero-badge">
                  <SvgIcon name="bolt" />
                  Early access
                </span>
              </div>
            </div>
            <div className="hero-visual" ref={cardsRef}>
              <div className="orbit-ring orbit-ring-1" />
              <div className="orbit-ring orbit-ring-2" />
              <div className="orbit-ring orbit-ring-3" />
              <div className="orbit-center">
                <svg viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="15" stroke="#c5d9a5" strokeWidth="1.5" />
                  <path d="M12 20a8 8 0 0116 0" stroke="#e3955f" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="20" cy="20" r="2.5" fill="#c5d9a5" />
                </svg>
              </div>
              <div className="floating-card card-1">
                <span className="floating-card-number">01</span>
                <SvgIcon name="search" />
                <strong>Find your fit</strong>
                <small>The right equipment, near you.</small>
              </div>
              <div className="floating-card card-2">
                <span className="floating-card-number">02</span>
                <SvgIcon name="file" />
                <strong>Connect the dots</strong>
                <small>Good details. Better beginnings.</small>
              </div>
              <div className="floating-card card-3">
                <span className="floating-card-number">03</span>
                <SvgIcon name="check" />
                <strong>Make it happen</strong>
                <small>Your next big thing starts here.</small>
              </div>
              <i className="spark">✳</i>
            </div>
          </div>
        </div>
      </section>

      <div className="waitlist-section" id="waitlist" ref={formRef}>
        <div className="waitlist-card">
          <div className="waitlist-header">
            <div className="waitlist-header-bg" />
            <div className="hero-eyebrow">BE FIRST IN LINE</div>
            <h2>
              Join the waitlist.
              <br />
              <em>Shape what's next.</em>
            </h2>
            <p>
              Enter your name and phone number to join.
              Early members get priority access and a say in what we build.
            </p>
          </div>
          <div className="waitlist-body">
            <form className="form-area" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your name</label>
                <input id="name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required maxLength={100} />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone number</label>
                <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0801 234 5678" required maxLength={20} />
              </div>
              {submitError && <p role="alert" style={{color:"#a63224",marginBottom:12}}>{submitError}</p>}<button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? "Joining..." : "Join the waitlist"}
                <SvgIcon name="arrow" />
              </button>
              <p className="form-note">
                <SvgIcon name="shield" />
                Only ServiceLoop launch updates. Your interest helps us build a better marketplace.
              </p>
            </form>
            <div className="interest-area">
              <div className="interest-section">
                <h3>What would you love to rent?</h3>
                <p>Optional — choose anything you need.</p>
                <div className="interest-grid">
                  {rentItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`interest-chip ${wantToRent.includes(item.label) ? "selected" : ""}`}
                      onClick={() => toggleRent(item.label)}
                    >
                      <span className="chip-icon"><SvgIcon name={item.icon} /></span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="interest-section">
                <h3>What would you put out for rent?</h3>
                <p>Optional — choose equipment you own.</p>
                <div className="interest-grid">
                  {listItems.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`interest-chip ${wantToList.includes(item.label) ? "selected" : ""}`}
                      onClick={() => toggleList(item.label)}
                    >
                      <span className="chip-icon"><SvgIcon name={item.icon} /></span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-strip" ref={statsRef}>
        <div className="stats-inner">
          {[
            { num: "Early access", label: "Be part of the launch", icon: "users" },
            { num: "4", label: "Cities at launch", icon: "globe" },
            { num: "6", label: "Equipment categories", icon: "star" },
            { num: "∞", label: "Possibilities ahead", icon: "bolt" },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <span className="stat-icon"><SvgIcon name={s.icon} /></span>
              <div className="stat-number">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="benefits-section" ref={benefitsRef}>
        <div className="benefits-header">
          <div className="hero-eyebrow">WHY JOIN EARLY?</div>
          <h2>
            First in line.
            <br />
            <em>First to build.</em>
          </h2>
        </div>
        <div className="benefits-grid">
          {[
            { icon: "bolt", title: "Priority access", desc: "Be the first to browse equipment, list your fleet, and connect with builders when we go live.", stamp: "✳" },
            { icon: "heart", title: "Shape the platform", desc: "Your feedback decides what we build. Tell us what matters — we'll make it happen.", stamp: "✳" },
            { icon: "shield", title: "Verified from day one", desc: "Early members get priority verification. Start with trust already built into your profile.", stamp: "✳" },
            { icon: "star", title: "Exclusive launch rates", desc: "No listing fees, no commissions for early adopters. Your equipment, your rates, your terms.", stamp: "✳" },
            { icon: "users", title: "A community that builds", desc: "Join a network of builders, owners and operators who are shaping Nigeria's next big projects.", stamp: "✳" },
            { icon: "globe", title: "Lagos, Abuja & beyond", desc: "Launching in four cities. Growing everywhere. Help us bring Service Loop to your project site.", stamp: "✳" },
          ].map((b) => (
            <div className="benefit-card" key={b.title}>
              <span className="benefit-stamp">{b.stamp}</span>
              <div className="benefit-icon"><SvgIcon name={b.icon} /></div>
              <h3>{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <Logo light />
            <p style={{ marginTop: 14 }}>
              Connecting equipment, expertise,
              <br />
              and the people building what's next.
            </p>
          </div>
          <div className="footer-right">
            <p>
              Made for Nigeria. Built for possibility.
              <span className="nigeria-flag" style={{ marginLeft: 8, verticalAlign: "middle" }} />
            </p>
            <span>© {new Date().getFullYear()} Service Loop. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {submitted && (
        <div className="success-overlay" onClick={() => setSubmitted(false)}>
          <div className="success-card" onClick={(e) => e.stopPropagation()}>
            <div className="success-orbit">
              <SvgIcon name="check" />
            </div>
            <h2>
              You're in.
              <br />
              <em>Let's build this.</em>
            </h2>
            <p>
              You're on the waitlist. We'll reach out with updates,
              early access and a chance to shape what Service Loop becomes.
            </p>
            <div className="success-number">
              <small>SIGNUP RECEIVED</small>
              <strong>Your interest has been recorded.</strong>
            </div>
            <button className="success-btn" onClick={() => setSubmitted(false)}>
              Back to the page
              <SvgIcon name="arrow" />
            </button>
            <p className="success-note">
              <SvgIcon name="shield" />
              Launch updates will follow when they are available.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
