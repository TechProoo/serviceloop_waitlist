import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Icon, Logo, MachineIcon } from "./components/Icons";
import {
  categories,
  equipment,
  money,
  readStorage,
  today,
  writeStorage,
} from "./data";
import type { Equipment } from "./data";
import "./App.css";

type RentalRequest = {
  id: string;
  title: string;
  location: string;
  start: string;
  days: number;
  name: string;
  email: string;
  notes: string;
  estimate?: number;
};
type ModalState =
  | { type: "details"; item: Equipment }
  | { type: "quote"; item?: Equipment; service?: string }
  | { type: "saved" | "requests" | "list" | "help" }
  | null;

function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}

function EquipmentVisual({ item }: { item: Equipment }) {
  const [failed, setFailed] = useState(false);
  return item.image && !failed ? (
    <img
      src={item.image}
      alt={item.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={
        item.category === "Power & generators" ||
        item.category === "Concrete equipment"
          ? "product-cutout"
          : ""
      }
    />
  ) : (
    <div className="equipment-illustration">
      <MachineIcon type={item.category} />
      <span>{item.category}</span>
    </div>
  );
}

function EquipmentCard({
  item,
  saved,
  toggleSave,
  open,
}: {
  item: Equipment;
  saved: boolean;
  toggleSave: () => void;
  open: () => void;
}) {
  return (
    <article className="equipment-card">
      <div className="equipment-image">
        <button
          className="image-link"
          onClick={open}
          aria-label={`View ${item.name}`}
        >
          <EquipmentVisual item={item} />
        </button>
        <span
          className={`availability ${item.available ? "" : "availability-muted"}`}
        >
          <span />
          {item.available ? "Available to request" : "Check availability"}
        </span>
        <button
          className={`save-button ${saved ? "is-saved" : ""}`}
          onClick={toggleSave}
          aria-label={`${saved ? "Unsave" : "Save"} ${item.name}`}
          aria-pressed={saved}
        >
          <Icon name="heart" />
        </button>
      </div>
      <div className="equipment-info">
        <div className="equipment-category">
          {item.category}
          <span className="sample-label">Sample</span>
        </div>
        <button className="card-title" onClick={open}>
          <h3>{item.name}</h3>
        </button>
        <p className="equipment-location">
          <Icon name="pin" />
          {item.location}
        </p>
        <div className="equipment-specs">
          <span>{item.capacity}</span>
          <span>
            <Icon name={item.operator ? "user" : "truck"} />
            {item.operator ? "Operator included" : "Delivery on request"}
          </span>
        </div>
        <div className="equipment-price">
          <p>
            <strong>{money(item.rate)}</strong>
            <span> / day</span>
          </p>
          <button
            className="card-arrow"
            onClick={open}
            aria-label={`View ${item.name} details`}
          >
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </article>
  );
}

function App() {
  const [modal, setModal] = useState<ModalState>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All locations");
  const [activeLocation, setActiveLocation] = useState("All locations");
  const [startDate, setStartDate] = useState("");
  const [category, setCategory] = useState("All equipment");
  const [sort, setSort] = useState("recommended");
  const [showAll, setShowAll] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [operatorOnly, setOperatorOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [saved, setSaved] = useState<number[]>(() =>
    readStorage("sl-saved", []),
  );
  const [requests, setRequests] = useState<RentalRequest[]>(() =>
    readStorage("sl-requests", []),
  );
  const [ownEquipment, setOwnEquipment] = useState<Equipment[]>(() =>
    readStorage("sl-equipment", []),
  );
  const [toast, setToast] = useState("");
  const [success, setSuccess] = useState(false);
  const [requestDays, setRequestDays] = useState(1);
  const [requestDate, setRequestDate] = useState(today());
  const resultsRef = useRef<HTMLElement>(null);
  const catalog = [...equipment, ...ownEquipment];
  const priceRangeMax =
    Math.ceil(Math.max(300000, ...catalog.map((item) => item.rate)) / 5000) *
    5000;
  useEffect(() => {
    writeStorage("sl-saved", saved);
  }, [saved]);
  useEffect(() => {
    writeStorage("sl-requests", requests);
  }, [requests]);
  useEffect(() => {
    writeStorage("sl-equipment", ownEquipment);
  }, [ownEquipment]);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);
  const openModal = (value: ModalState) => {
    setSuccess(false);
    setModal(value);
    setMenuOpen(false);
    setRequestDays(1);
    setRequestDate(startDate || today());
  };
  const toggleSave = (id: number) => {
    setSaved((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id],
    );
  };
  const browse = (nextCategory = "All equipment") => {
    resetFilters();
    setCategory(nextCategory);
    setShowAll(true);
    setMenuOpen(false);
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(query.trim());
    setActiveLocation(location);
    setShowAll(true);
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setLocation("All locations");
    setActiveLocation("All locations");
    setCategory("All equipment");
    setOperatorOnly(false);
    setMaxPrice(0);
  };
  const filtered = catalog
    .filter(
      (item) =>
        (category === "All equipment" || item.category === category) &&
        (activeLocation === "All locations" ||
          item.location.includes(activeLocation)) &&
        (!operatorOnly || item.operator) &&
        (!maxPrice || item.rate <= maxPrice) &&
        `${item.name} ${item.category} ${item.location}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.rate - b.rate
        : sort === "high"
          ? b.rate - a.rate
          : a.id - b.id,
    );
  const visible = showAll ? filtered : filtered.slice(0, 4);
  const hasFilters =
    search ||
    activeLocation !== "All locations" ||
    category !== "All equipment" ||
    operatorOnly ||
    maxPrice > 0;
  const submitRequest = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const item = modal?.type === "quote" ? modal.item : undefined;
    const request: RentalRequest = {
      id: `SL-${Date.now().toString(36).toUpperCase()}`,
      title: item?.name || String(data.get("project")),
      location: String(data.get("site")),
      start: requestDate,
      days: requestDays,
      name: String(data.get("name")),
      email: String(data.get("email")),
      notes: String(data.get("notes")),
      estimate: item ? item.rate * requestDays : undefined,
    };
    setRequests((previous) => [request, ...previous]);
    setSuccess(true);
  };
  const submitListing = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const item: Equipment = {
      id: Date.now(),
      name: String(data.get("name")),
      category: String(data.get("category")),
      location: `${data.get("area")}, ${data.get("city")}`,
      rate: Number(data.get("rate")),
      capacity: String(data.get("capacity")),
      operator: data.get("operator") === "on",
      available: true,
      image: "",
      vendor: String(data.get("business")),
      description: String(data.get("description")),
    };
    setOwnEquipment((previous) => [...previous, item]);
    setSuccess(true);
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        <div className="container">
          <span>
            <span className="live-dot" />
            Big projects. Local connections. Endless possibilities.
          </span>
          <span className="announcement-right">
            Made for Nigeria <span className="nigeria-flag" />{" "}
            <span className="announcement-divider" /> NGN ₦
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#" aria-label="Service Loop home">
            <Logo />
          </a>
          <nav
            className={menuOpen ? "main-nav is-open" : "main-nav"}
            aria-label="Main navigation"
          >
            <a href="#equipment" onClick={() => browse()}>
              Find equipment
              <Icon name="chevron" />
            </a>
            <a href="#services" onClick={() => setMenuOpen(false)}>
              Find services
            </a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
              How it works
            </a>
            <button
              className="mobile-nav-action"
              onClick={() => openModal({ type: "requests" })}
            >
              My requests
              <Icon name="file" />
            </button>
            <button
              className="mobile-nav-action"
              onClick={() => openModal({ type: "list" })}
            >
              List your equipment
              <Icon name="plus" />
            </button>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button header-save"
              onClick={() => openModal({ type: "saved" })}
              aria-label={`Saved equipment, ${saved.length} items`}
            >
              <Icon name="heart" />
              {saved.length > 0 && (
                <span className="count-badge">{saved.length}</span>
              )}
            </button>
            <button
              className="requests-link"
              onClick={() => openModal({ type: "requests" })}
            >
              My requests
            </button>
            <button
              className="button button-green header-list"
              onClick={() => openModal({ type: "list" })}
            >
              <Icon name="plus" />
              List equipment
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">
                <span />
                THE RIGHT EQUIPMENT. THE RIGHT CONNECTION.
              </div>
              <h1>
                Big plans.
                <br />
                Right tools.
                <br />
                <span>Let’s get to work.</span>
              </h1>
              <p>
                Rent the equipment. Find the expertise.
                <br className="desktop-break" /> Build your next big thing,
                right here in Nigeria.
              </p>
              <div className="hero-benefits">
                <span>
                  <Icon name="shield" />
                  Trusted connections
                </span>
                <span>
                  <Icon name="tag" />
                  Clear rental terms
                </span>
              </div>
            </div>
            <div className="hero-art">
              <img
                className="hero-photo"
                src="/images/excavator.jpg"
                alt="Yellow excavator digging on an active construction site"
                fetchPriority="high"
              />
              <div className="hero-photo-overlay" />
              <div className="hero-location">
                <Icon name="pin" />
                <span>
                  Local equipment.
                  <br />
                  <strong>Extraordinary possibilities.</strong>
                </span>
              </div>
              <div className="hero-sticker">
                <span>LET’S BUILD</span>
                <svg viewBox="0 0 50 50" aria-hidden="true">
                  <path
                    d="M25 4v42M4 25h42M10 10l30 30M10 40l30-30"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
                <span>SOMETHING BIG</span>
              </div>
              <div className="hero-caption">
                <span className="live-dot" /> BUILT FOR THE WAY NIGERIA BUILDS
              </div>
            </div>
          </div>
          <div className="container search-wrapper">
            <form className="search-panel" onSubmit={handleSearch}>
              <label className="search-field search-keyword">
                <Icon name="search" />
                <span>
                  <span className="field-heading">
                    What are you looking for?
                  </span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Excavator, generator, crane…"
                    aria-label="Search equipment"
                  />
                </span>
              </label>
              <label className="search-field">
                <Icon name="pin" />
                <span>
                  <span className="field-heading">Where’s your project?</span>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    aria-label="Project location"
                  >
                    <option>All locations</option>
                    <option>Lagos</option>
                    <option>Abuja</option>
                    <option>Port Harcourt</option>
                    <option>Ibadan</option>
                  </select>
                </span>
              </label>
              <label className="search-field search-date">
                <Icon name="calendar" />
                <span>
                  <span className="field-heading">When do you need it?</span>
                  <input
                    type="date"
                    min={today()}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="Preferred rental date"
                  />
                </span>
              </label>
              <button
                className="button button-green search-submit"
                type="submit"
              >
                <Icon name="search" />
                Find equipment
              </button>
            </form>
            <div className="popular-searches">
              <span>Popular searches:</span>
              {["Excavator", "Generator", "Crane", "Scaffolding"].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setSearch(term);
                      setCategory("All equipment");
                      setShowAll(true);
                      resultsRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                  >
                    {term}
                    <Icon name="diagonal" />
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="categories-section container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EVERY JOB STARTS SOMEWHERE</span>
              <h2>What’s on your project list?</h2>
            </div>
            <button className="text-link" onClick={() => browse()}>
              Explore all equipment
              <Icon name="arrow" />
            </button>
          </div>
          <div className="categories-grid">
            {categories.map((item, i) => (
              <button
                className={`category-card ${category === item ? "active" : ""}`}
                key={item}
                onClick={() => browse(item)}
              >
                <div className={`category-art category-art-${i}`}>
                  <MachineIcon type={item} />
                </div>
                <h3>{item}</h3>
                <span>
                  {
                    [
                      "Dig, move & build",
                      "Reach new heights",
                      "Keep things running",
                      "Lay strong foundations",
                      "Support every level",
                      "Keep your project moving",
                    ][i]
                  }
                  <Icon name="arrow" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="equipment-section" id="equipment" ref={resultsRef}>
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  GOOD EQUIPMENT. GREAT POSSIBILITIES.
                </span>
                <h2>
                  {hasFilters
                    ? "Find your perfect workmate."
                    : "Ready for your next project."}
                </h2>
                <p>Explore equipment from independent owners near you.</p>
              </div>
              <button
                className="text-link"
                onClick={() => {
                  setShowAll(!showAll);
                  if (showAll) resetFilters();
                }}
              >
                {showAll ? "Show featured" : "View all equipment"}
                <Icon name="arrow" />
              </button>
            </div>
            <div className="equipment-toolbar">
              <div className="filter-tabs" aria-label="Equipment categories">
                {[
                  "All equipment",
                  "Heavy machinery",
                  "Power & generators",
                  "Lifting equipment",
                ].map((item) => (
                  <button
                    key={item}
                    className={category === item ? "active" : ""}
                    onClick={() => {
                      setCategory(item);
                      setShowAll(true);
                    }}
                  >
                    {item === "Power & generators" ? "Power & support" : item}
                  </button>
                ))}
              </div>
              <button
                className={`filter-button ${filtersOpen ? "active" : ""}`}
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
              >
                <Icon name="filter" />
                Filters
                {(operatorOnly || maxPrice > 0) && (
                  <span className="filter-dot" />
                )}
              </button>
            </div>
            {filtersOpen && (
              <div className="filters-panel">
                <label>
                  Sort by
                  <select
                    aria-label="Sort by"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="recommended">Recommended</option>
                    <option value="low">Price: low to high</option>
                    <option value="high">Price: high to low</option>
                  </select>
                </label>
                <label>
                  Maximum daily rate: {maxPrice ? money(maxPrice) : "Any price"}
                  <input
                    type="range"
                    min="15000"
                    max={priceRangeMax}
                    step="5000"
                    value={maxPrice || priceRangeMax}
                    onChange={(e) => {
                      const price = Number(e.target.value);
                      setMaxPrice(price === priceRangeMax ? 0 : price);
                      setShowAll(true);
                    }}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={operatorOnly}
                    onChange={(e) => {
                      setOperatorOnly(e.target.checked);
                      setShowAll(true);
                    }}
                  />
                  Operator included
                </label>
                <button className="text-link" onClick={resetFilters}>
                  Reset filters
                </button>
              </div>
            )}
            {hasFilters && (
              <div className="results-summary">
                <span>
                  {filtered.length}{" "}
                  {filtered.length === 1 ? "match" : "matches"}
                  {search && ` for “${search}”`}
                  {activeLocation !== "All locations" &&
                    ` in ${activeLocation}`}
                  {category !== "All equipment" && ` · ${category}`}
                </span>
                <button onClick={resetFilters}>
                  Clear search
                  <Icon name="close" />
                </button>
              </div>
            )}
            {visible.length > 0 ? (
              <div className="equipment-grid">
                {visible.map((item) => (
                  <EquipmentCard
                    key={item.id}
                    item={item}
                    saved={saved.includes(item.id)}
                    toggleSave={() => toggleSave(item.id)}
                    open={() => openModal({ type: "details", item })}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Icon name="search" />
                <h3>No equipment matches just yet.</h3>
                <p>
                  Try another location or a broader search. You can also
                  describe what you need in a quote request.
                </p>
                <div>
                  <button
                    className="button button-green"
                    onClick={resetFilters}
                  >
                    Clear filters
                  </button>
                  <button
                    className="button button-outline"
                    onClick={() => openModal({ type: "quote" })}
                  >
                    Request a quote
                  </button>
                </div>
              </div>
            )}
            <div className="catalog-note">
              <Icon name="help" />
              <span>
                Explore sample listings. Final availability and costs are
                confirmed with the owner.
              </span>
            </div>
          </div>
        </section>

        <section className="quote-strip container">
          <div className="quote-icon">
            <Icon name="file" />
          </div>
          <div>
            <h3>A big project or a specific requirement?</h3>
            <p>
              Tell us what you’re building. Start with a tailored quote request.
            </p>
          </div>
          <button
            className="button button-outline"
            onClick={() => openModal({ type: "quote" })}
          >
            Request a quote
            <Icon name="arrow" />
          </button>
        </section>

        <section className="how-section container" id="how-it-works">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                LESS RUNNING AROUND. MORE GETTING IT DONE.
              </span>
              <h2>From “I need” to on site.</h2>
            </div>
            <p className="section-aside">
              One simple place to connect the dots
              <br />
              between your project and the right people.
            </p>
          </div>
          <div className="steps-grid">
            {[
              {
                number: "01",
                icon: "search",
                title: "Find your fit",
                copy: "Search by equipment and location. Compare specifications and daily rates in one place.",
              },
              {
                number: "02",
                icon: "file",
                title: "Get the details right",
                copy: "Share your dates and site requirements. Agree on operator, fuel and delivery costs.",
              },
              {
                number: "03",
                icon: "truck",
                title: "Get your project moving",
                copy: "Confirm the rental with your provider and coordinate delivery to your project site.",
              },
            ].map((step) => (
              <div className="step" key={step.number}>
                <div className="step-top">
                  <span className="step-icon">
                    <Icon name={step.icon} />
                  </span>
                  <span className="step-number">{step.number}</span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="container services-inner">
            <div className="services-copy">
              <span className="eyebrow">GREAT EQUIPMENT MEETS GOOD PEOPLE</span>
              <h2>
                More than machines.
                <br />
                <span>The hands behind them.</span>
              </h2>
              <p>
                Bring the right skills to your site. From the first dig to the
                final delivery, find the support your project needs.
              </p>
              <button
                className="button button-green"
                onClick={() =>
                  openModal({ type: "quote", service: "Site services" })
                }
              >
                Find a service
                <Icon name="arrow" />
              </button>
            </div>
            <div className="service-list">
              {[
                {
                  icon: "user",
                  title: "Equipment operators",
                  text: "Experienced hands for the heavy work.",
                },
                {
                  icon: "truck",
                  title: "Haulage & mobilisation",
                  text: "From the equipment yard to your site.",
                },
                {
                  icon: "grid",
                  title: "Site clearing & preparation",
                  text: "Make room for what’s coming next.",
                },
              ].map((service) => (
                <button
                  key={service.title}
                  className="service-row"
                  onClick={() =>
                    openModal({ type: "quote", service: service.title })
                  }
                >
                  <span className="service-icon">
                    <Icon name={service.icon} />
                  </span>
                  <span>
                    <strong>{service.title}</strong>
                    <span>{service.text}</span>
                  </span>
                  <Icon name="diagonal" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="owner-section container">
          <div className="owner-banner">
            <div className="owner-copy">
              <span className="eyebrow">FOR EQUIPMENT OWNERS</span>
              <h2>
                Your equipment.
                <br />
                Someone’s next big move.
              </h2>
              <p>
                Turn idle equipment into new opportunities.
                <br />
                Put your fleet in front of people ready to build.
              </p>
              <button
                className="button button-orange"
                onClick={() => openModal({ type: "list" })}
              >
                List your equipment
                <Icon name="arrow" />
              </button>
              <span className="owner-footnote">
                Your equipment. Your rates. Your terms.
              </span>
            </div>
            <div className="owner-graphic" aria-hidden="true">
              <div className="orbit orbit-1" />
              <div className="orbit orbit-2" />
              <div className="orbit orbit-3" />
              <div className="owner-logo">
                <Logo light />
              </div>
              <span className="orbit-label orbit-label-1">
                <Icon name="truck" />
                Your fleet
              </span>
              <span className="orbit-label orbit-label-2">
                <Icon name="user" />
                New connections
              </span>
              <span className="orbit-label orbit-label-3">
                <Icon name="bolt" />
                More possibilities
              </span>
              <span className="orbit-star">✳</span>
            </div>
          </div>
        </section>

        <section className="faq-section container">
          <div>
            <span className="eyebrow">A FEW THINGS, CLEARED UP.</span>
            <h2>
              Good questions.
              <br />
              Straight answers.
            </h2>
            <button
              className="text-link"
              onClick={() => openModal({ type: "help" })}
            >
              More about Service Loop
              <Icon name="arrow" />
            </button>
          </div>
          <div className="faq-list">
            {[
              {
                q: "What can I rent on Service Loop?",
                a: "Explore heavy machinery, lifting equipment, generators, concrete equipment, scaffolding and transport. You can also prepare requests for operators, haulage and site preparation services.",
              },
              {
                q: "What’s included in the rental price?",
                a: "The displayed rate covers the equipment for one day. An operator is included only where indicated. Delivery, mobilisation, fuel, deposits and any applicable taxes are confirmed separately in the owner’s final quote.",
              },
              {
                q: "Can I request equipment for a longer project?",
                a: "Yes. Add your start date, number of rental days and project requirements to a quote request. Weekly or monthly rates can then be discussed with the provider.",
              },
              {
                q: "Can I make a real booking here?",
                a: "This is an interactive frontend preview. Listings are examples, and requests and equipment you add are saved only in this browser. No payments are collected, and no request is sent to a provider yet.",
              },
            ].map((faq) => (
              <details key={faq.q}>
                <summary>
                  {faq.q}
                  <Icon name="plus" />
                </summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand">
            <a href="#" aria-label="Service Loop home">
              <Logo />
            </a>
            <p>
              Connecting equipment, expertise,
              <br />
              and the people building what’s next.
            </p>
            <span className="made-in">
              Made for Nigeria. Built for possibility.
              <span className="nigeria-flag" />
            </span>
          </div>
          <div className="footer-column">
            <h3>For your project</h3>
            <a href="#equipment" onClick={() => browse()}>
              Find equipment
            </a>
            <a href="#services">Find services</a>
            <button onClick={() => openModal({ type: "quote" })}>
              Request a quote
            </button>
            <button onClick={() => openModal({ type: "saved" })}>
              Saved equipment
            </button>
          </div>
          <div className="footer-column">
            <h3>For equipment owners</h3>
            <button onClick={() => openModal({ type: "list" })}>
              List your equipment
            </button>
            <a href="#how-it-works">How it works</a>
            <button onClick={() => openModal({ type: "requests" })}>
              My requests
            </button>
          </div>
          <div className="footer-column footer-connect">
            <h3>Let’s build something.</h3>
            <p>
              Got the plans?
              <br />
              We’ll help you find the tools.
            </p>
            <button
              className="text-link"
              onClick={() => openModal({ type: "quote" })}
            >
              Get started
              <Icon name="diagonal" />
            </button>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} Service Loop. All rights reserved.
          </span>
          <span>Frontend preview · Sample inventory</span>
          <button onClick={() => openModal({ type: "help" })}>
            Privacy & demo information
          </button>
        </div>
      </footer>

      {toast && (
        <div className="toast" role="status">
          <Icon name="check" />
          {toast}
        </div>
      )}
      {modal?.type === "details" && (
        <Modal
          title="Meet your next workmate."
          close={() => setModal(null)}
          wide
        >
          <div className="detail-layout">
            <div>
              <div className="detail-image">
                <EquipmentVisual item={modal.item} />
              </div>
              <span className="eyebrow detail-category">
                {modal.item.category} · SAMPLE LISTING
              </span>
              <h3 className="detail-title">{modal.item.name}</h3>
              <p className="equipment-location">
                <Icon name="pin" />
                {modal.item.location}
              </p>
              <p className="detail-description">{modal.item.description}</p>
              <div className="detail-specs">
                <span>
                  <Icon name="grid" />
                  {modal.item.capacity}
                </span>
                <span>
                  <Icon name="user" />
                  {modal.item.operator ? "Operator included" : "Equipment only"}
                </span>
              </div>
              <p className="vendor-line">
                Listed by <strong>{modal.item.vendor}</strong>
                <span>Illustrative provider</span>
              </p>
            </div>
            <div className="booking-panel">
              <p className="booking-price">
                <strong>{money(modal.item.rate)}</strong> / day
              </p>
              <p className="muted">Plan your rental</p>
              <label>
                Preferred start date
                <input
                  type="date"
                  min={today()}
                  required
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                />
              </label>
              <label>
                Rental duration
                <select
                  aria-label="Rental duration"
                  value={requestDays}
                  onChange={(e) => setRequestDays(Number(e.target.value))}
                >
                  {[1, 2, 3, 5, 7, 14, 30].map((day) => (
                    <option key={day} value={day}>
                      {day} {day === 1 ? "day" : "days"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="cost-line">
                <span>
                  Equipment × {requestDays} {requestDays === 1 ? "day" : "days"}
                </span>
                <strong>{money(modal.item.rate * requestDays)}</strong>
              </div>
              <div className="cost-line">
                <span>Operator</span>
                <span>{modal.item.operator ? "Included" : "Not included"}</span>
              </div>
              <div className="cost-line">
                <span>Delivery & fuel</span>
                <span>To be quoted</span>
              </div>
              <div className="cost-line cost-total">
                <span>Equipment subtotal</span>
                <strong>{money(modal.item.rate * requestDays)}</strong>
              </div>
              <button
                className="button button-green"
                disabled={!requestDate || requestDate < today()}
                onClick={() => {
                  setSuccess(false);
                  setModal({ type: "quote", item: modal.item });
                }}
              >
                Request this equipment
                <Icon name="arrow" />
              </button>
              <button
                className="detail-save"
                onClick={() => toggleSave(modal.item.id)}
              >
                <Icon name="heart" />
                {saved.includes(modal.item.id)
                  ? "Saved to your list"
                  : "Save for later"}
              </button>
              <p className="booking-note">
                A request is not a confirmed booking. Final availability,
                mobilisation, fuel and other charges require owner confirmation.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {modal?.type === "quote" && (
        <Modal
          title={
            success
              ? "Your project is taking shape."
              : modal.item
                ? "Request this equipment"
                : "Let’s talk about your project."
          }
          close={() => setModal(null)}
        >
          {success ? (
            <div className="success-state">
              <span className="success-icon">
                <Icon name="check" />
              </span>
              <h3>Request saved.</h3>
              <p>
                You’ll find it in My requests. This preview saves your request
                in this browser; it hasn’t been sent to a provider.
              </p>
              <button
                className="button button-green"
                onClick={() => openModal({ type: "requests" })}
              >
                View my requests
                <Icon name="arrow" />
              </button>
            </div>
          ) : (
            <form className="form-stack" onSubmit={submitRequest}>
              <p className="form-intro">
                {modal.item
                  ? `${modal.item.name} · ${money(modal.item.rate)} / day`
                  : "A few details now. A better fit for your project later."}
              </p>
              {!modal.item && (
                <label>
                  What do you need?
                  <input
                    name="project"
                    defaultValue={modal.service || ""}
                    placeholder="e.g. An excavator for a foundation project"
                    required
                    maxLength={150}
                  />
                </label>
              )}
              <div className="form-row">
                <label>
                  Your name
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Full name"
                    required
                    maxLength={100}
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    required
                  />
                </label>
              </div>
              <label>
                Project location
                <input
                  name="site"
                  placeholder="Area and city, e.g. Lekki, Lagos"
                  defaultValue={
                    activeLocation === "All locations" ? "" : activeLocation
                  }
                  required
                  maxLength={150}
                />
              </label>
              <div className="form-row">
                <label>
                  Start date
                  <input
                    type="date"
                    min={today()}
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Number of days
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={requestDays || ""}
                    onChange={(e) => setRequestDays(Number(e.target.value))}
                    required
                  />
                </label>
              </div>
              <label>
                Anything we should know?
                <textarea
                  name="notes"
                  placeholder="Site access, required capacity, delivery or operator needs…"
                  rows={3}
                  maxLength={2000}
                />
              </label>
              {modal.item && (
                <div className="estimate-box">
                  <span>Equipment estimate · {requestDays} days</span>
                  <strong>{money(modal.item.rate * requestDays)}</strong>
                  <small>
                    Delivery, fuel and any additional charges to be confirmed.
                  </small>
                </div>
              )}
              <p className="form-disclaimer">
                <Icon name="help" />
                Frontend preview: your request stays in this browser. No payment
                or provider notification is made.
              </p>
              <button type="submit" className="button button-green">
                Save quote request
                <Icon name="arrow" />
              </button>
            </form>
          )}
        </Modal>
      )}
      {modal?.type === "saved" && (
        <Modal
          title={`Your saved equipment (${saved.length})`}
          close={() => setModal(null)}
          wide
        >
          {saved.length ? (
            <div className="saved-grid">
              {catalog
                .filter((item) => saved.includes(item.id))
                .map((item) => (
                  <EquipmentCard
                    key={item.id}
                    item={item}
                    saved
                    toggleSave={() => toggleSave(item.id)}
                    open={() => openModal({ type: "details", item })}
                  />
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="heart" />
              <h3>Keep the good finds close.</h3>
              <p>
                Tap the heart on any equipment to save it here for your next
                project.
              </p>
              <button
                className="button button-green"
                onClick={() => {
                  setModal(null);
                  browse();
                }}
              >
                Explore equipment
                <Icon name="arrow" />
              </button>
            </div>
          )}
        </Modal>
      )}
      {modal?.type === "requests" && (
        <Modal title="Your project requests" close={() => setModal(null)}>
          {requests.length ? (
            <div className="request-list">
              <p className="form-intro">
                Local drafts saved in this browser. These have not been sent to
                providers.
              </p>
              {requests.map((request) => (
                <article className="request-card" key={request.id}>
                  <div>
                    <span className="request-id">{request.id}</span>
                    <span className="draft-badge">Local draft</span>
                  </div>
                  <h3>{request.title}</h3>
                  <p>
                    <Icon name="pin" />
                    {request.location}
                  </p>
                  <p>
                    <Icon name="calendar" />
                    {new Date(`${request.start}T12:00:00`).toLocaleDateString(
                      "en-NG",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}{" "}
                    · {request.days} {request.days === 1 ? "day" : "days"}
                  </p>
                  {request.estimate && (
                    <strong className="request-estimate">
                      Equipment estimate: {money(request.estimate)}
                    </strong>
                  )}
                  {request.notes && (
                    <p className="request-notes">{request.notes}</p>
                  )}
                  <button
                    className="remove-request"
                    onClick={() => {
                      setRequests((previous) =>
                        previous.filter((item) => item.id !== request.id),
                      );
                      setToast("Request removed");
                    }}
                  >
                    Remove draft
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="file" />
              <h3>Your next project starts here.</h3>
              <p>
                Create a quote request and keep your project details together.
              </p>
              <button
                className="button button-green"
                onClick={() => openModal({ type: "quote" })}
              >
                Start a request
                <Icon name="arrow" />
              </button>
            </div>
          )}
        </Modal>
      )}
      {modal?.type === "list" && (
        <Modal
          title={
            success
              ? "Your fleet has a new home."
              : "Put your equipment to work."
          }
          close={() => setModal(null)}
        >
          {success ? (
            <div className="success-state">
              <span className="success-icon">
                <Icon name="check" />
              </span>
              <h3>Your sample listing is ready.</h3>
              <p>
                It’s now in this browser’s marketplace. A live platform would
                verify your business and equipment before publishing.
              </p>
              <button
                className="button button-green"
                onClick={() => {
                  setModal(null);
                  resetFilters();
                  browse();
                }}
              >
                View the marketplace
                <Icon name="arrow" />
              </button>
            </div>
          ) : (
            <form className="form-stack" onSubmit={submitListing}>
              <p className="form-intro">
                Start with the essentials. Your equipment, your rates.
              </p>
              <label>
                Equipment name
                <input
                  name="name"
                  placeholder="e.g. JCB 3CX Backhoe Loader"
                  required
                  maxLength={100}
                />
              </label>
              <div className="form-row">
                <label>
                  Category
                  <select name="category" aria-label="Category">
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Capacity / specification
                  <input
                    name="capacity"
                    placeholder="e.g. 20 tonnes"
                    required
                    maxLength={50}
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Daily rate (₦)
                  <input
                    type="number"
                    name="rate"
                    min="1000"
                    max="10000000"
                    step="500"
                    placeholder="150000"
                    required
                  />
                </label>
                <label>
                  City
                  <select name="city" aria-label="City">
                    <option>Lagos</option>
                    <option>Abuja</option>
                    <option>Port Harcourt</option>
                    <option>Ibadan</option>
                  </select>
                </label>
              </div>
              <label>
                Area / neighbourhood
                <input
                  name="area"
                  placeholder="e.g. Lekki"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Business name
                <input
                  name="business"
                  placeholder="Your business name"
                  required
                  maxLength={100}
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Condition, specifications, and what’s included…"
                  required
                  maxLength={2000}
                />
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="operator" />
                Operator included in daily rate
              </label>
              <p className="form-disclaimer">
                <Icon name="help" />
                Creates a sample listing in this browser only.
              </p>
              <button type="submit" className="button button-green">
                Create sample listing
                <Icon name="arrow" />
              </button>
            </form>
          )}
        </Modal>
      )}
      {modal?.type === "help" && (
        <Modal
          title="Building better connections."
          close={() => setModal(null)}
        >
          <div className="about-content">
            <Logo />
            <p>
              Service Loop is a concept for connecting Nigeria’s builders with
              equipment owners and site service providers.
            </p>
            <h3>About this preview</h3>
            <p>
              Equipment, providers, rates and availability shown here are
              illustrative. Photos represent equipment types and may differ from
              the sample specifications. Quotes and listings are local
              demonstrations, not live transactions.
            </p>
            <h3>Your data stays here</h3>
            <p>
              Saved equipment, quote requests and sample listings are stored in
              this browser. Your details are not sent to a provider. Clearing
              this browser’s site data removes them.
            </p>
            <button
              className="button button-outline"
              onClick={() => {
                setSaved([]);
                setRequests([]);
                setOwnEquipment([]);
                setToast("Your local demo data has been cleared");
              }}
            >
              Clear my demo data
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export default App;
