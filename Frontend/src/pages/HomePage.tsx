import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Logo, MachineIcon } from '../components/Icons';
import { EquipmentCard } from '../components/EquipmentCard';
import { categories, money, today } from '../data';
import type { Equipment } from '../data';
import { useMarketplace } from '../state/Marketplace';
import { servicePath } from '../components/PageElements';

export default function HomePage() {
 const navigate = useNavigate();
 const { catalog, saved, toggleSave } = useMarketplace();
 const [query, setQuery] = useState('');
 const [search, setSearch] = useState('');
 const [location, setLocation] = useState('All locations');
 const [activeLocation, setActiveLocation] = useState('All locations');
 const [startDate, setStartDate] = useState('');
 const [category, setCategory] = useState('All equipment');
 const [sort, setSort] = useState('recommended');
 const [showAll, setShowAll] = useState(false);
 const [filtersOpen, setFiltersOpen] = useState(false);
 const [operatorOnly, setOperatorOnly] = useState(false);
 const [maxPrice, setMaxPrice] = useState(0);
 const resultsRef = useRef<HTMLElement>(null);
 const priceRangeMax = Math.ceil(Math.max(300000,...catalog.map(item => item.rate))/5000)*5000;
 const openModal = (action: { type: string; item?: Equipment; service?: string }) => {
   if(action.type === 'details' && action.item) navigate(`/equipment/${action.item.id}`);
   else if(action.service) navigate(servicePath(action.service));
   else navigate(({quote:'/request-quote',list:'/list-equipment',help:'/about',saved:'/saved',requests:'/requests'} as Record<string,string>)[action.type] || '/equipment');
 };
 const browse = (value = 'All equipment') => navigate(value === 'All equipment' ? '/equipment' : `/equipment?category=${encodeURIComponent(value)}`);
 const handleSearch = (event: FormEvent) => { event.preventDefault(); const params = new URLSearchParams(); if(query.trim()) params.set('q',query.trim()); if(location !== 'All locations') params.set('location',location); if(startDate) params.set('date',startDate); navigate(`/equipment?${params}`); };
 const resetFilters = () => {setSearch('');setQuery('');setLocation('All locations');setActiveLocation('All locations');setCategory('All equipment');setOperatorOnly(false);setMaxPrice(0);};
 const filtered = catalog.filter(item => (category === 'All equipment' || item.category === category) && (activeLocation === 'All locations' || item.location.includes(activeLocation)) && (!operatorOnly || item.operator) && (!maxPrice || item.rate <= maxPrice) && `${item.name} ${item.category} ${item.location}`.toLowerCase().includes(search.toLowerCase())).sort((a,b) => sort === 'low' ? a.rate-b.rate : sort === 'high' ? b.rate-a.rate : a.id-b.id);
 const visible = showAll ? filtered : filtered.slice(0,4);
 const hasFilters = search || activeLocation !== 'All locations' || category !== 'All equipment' || operatorOnly || maxPrice > 0;
 return (
      <main id="main" tabIndex={-1}>
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
                    onClick={() => navigate(`/equipment?q=${encodeURIComponent(term)}`)}
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
                  browse();
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
 );
}
