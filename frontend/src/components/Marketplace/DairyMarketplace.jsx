import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Minus,
  Milk,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  X,
} from "lucide-react";
import "./dairy-marketplace.css";

export default function DairyMarketplace() {
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState("");
  const [area, setArea] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [frequency, setFrequency] = useState("Daily");
  const [message, setMessage] = useState("");

  async function loadStores(params = {}) {
    try {
      setStoresLoading(true);
      setStoresError("");
      const response = await api.get("/dairy/stores", { params });
      const data = response.data;
      const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      setStores(list);
      if (!list.length && (params.city || params.state || params.postalCode)) {
        setLocationMessage("No registered dairy stores found for this location. Try another city or PIN code.");
      } else {
        setLocationMessage("");
      }
    } catch (error) {
      setStoresError(error.response?.status === 403
        ? "You don't have permission to view dairy stores."
        : "Unable to load dairy stores. Please try again.");
    } finally {
      setStoresLoading(false);
    }
  }

  useEffect(() => {
    loadStores();
  }, []);

  function requestLocation() {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Your browser doesn't support automatic location. Enter your city or PIN code instead.");
      return;
    }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setLocationBusy(false);
      // Current API supports city/state and PIN code, not GPS coordinates.
      // Keep coordinates for future distance-search integration; ask for city/PIN now.
      setLocationMessage(`Location detected (${latitude.toFixed(3)}, ${longitude.toFixed(3)}). Enter your city or PIN code to find stores nearby.`);
    }, (error) => {
      setLocationBusy(false);
      setLocationMessage(error.code === error.PERMISSION_DENIED
        ? "Location permission was declined. Enter your city or PIN code to search manually."
        : "Couldn't detect your location. Enter your city or PIN code to search manually.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  }

  async function searchLocation(event) {
    event.preventDefault();
    const value = area.trim();
    if (!value) {
      await loadStores();
      return;
    }
    if (/^\d{6}$/.test(value)) {
      await loadStores({ postalCode: value });
    } else {
      await loadStores({ city: value });
    }
  }

  const visibleStores = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return stores;
    return stores.filter((store) => [store.storeName, store.description, store.city, store.state, store.addressLine, store.postalCode]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [stores, search]);

  function closeSubscription() {
    setSubscriptionOpen(false);
    setMessage("");
  }

  function requestSubscription(event) {
    event.preventDefault();
    if (!area.trim()) {
      setMessage("Please enter your delivery area.");
      return;
    }
    setMessage("Your preferences are ready. Subscription activation requires a connected ordering backend.");
  }

  return (
    <div className="dairy-page">
      <div className="dairy-topbar">
        <Link to="/" className="dairy-back-link"><ArrowLeft size={17} /> Back to KisanDirect</Link>
        <Link to="/dairy/register-store" className="dairy-primary-button"><Store size={17} /> Register Your Dairy Store <ArrowRight size={17} /></Link>
      </div>

      <section className="dairy-hero">
        <div className="dairy-hero-copy">
          <span className="dairy-eyebrow"><Milk size={15} /> KISANDIRECT DAIRY</span>
          <h1>Dairy essentials,<br /><span>closer to home.</span></h1>
          <p>Find registered local dairy stores, connect with nearby producers, and explore fresh dairy options in your area.</p>
          <div className="dairy-hero-actions">
            <a href="#dairy-products" className="dairy-primary-button">Find dairy stores <ArrowRight size={17} /></a>
            <button type="button" className="dairy-secondary-button" onClick={() => setSubscriptionOpen(true)}><CalendarDays size={17} /> Milk subscription</button>
          </div>
          <div className="dairy-trust-row"><span><ShieldCheck size={16} /> Registered store listings</span><span><Truck size={16} /> Local delivery information</span></div>
        </div>
        <div className="dairy-hero-art" aria-label="Fresh milk from local dairy producers"><div className="dairy-art-circle"><span>🥛</span></div><div className="dairy-art-note dairy-art-note-one"><span>🐄</span> Local dairies</div><div className="dairy-art-note dairy-art-note-two"><span>🌿</span> Fresh from nearby</div></div>
      </section>

      <section className="dairy-benefits">
        <div><Store size={21} /><span><strong>Registered stores</strong><small>Real store information</small></span></div>
        <div><MapPinIcon /><span><strong>Location search</strong><small>Search by city or PIN code</small></span></div>
        <div><CalendarDays size={21} /><span><strong>Milk subscriptions</strong><small>Explore delivery preferences</small></span></div>
      </section>

      <section className="dairy-products-section" id="dairy-products">
        <div className="dairy-section-heading"><div><span className="dairy-section-kicker">LOCAL DAIRY NETWORK</span><h2>Dairy stores near you</h2><p>Only stores registered with KisanDirect appear here. Product listings will appear when real product data is connected.</p></div><Link to="/dairy/register-store" className="dairy-secondary-button"><Plus size={17} /> Register a store</Link></div>

        <div className="dairy-location-panel">
          <div className="dairy-location-copy"><strong>Find stores in your area</strong><p>Allow location access or enter a city name or 6-digit PIN code.</p></div>
          <button type="button" className="dairy-secondary-button" onClick={requestLocation} disabled={locationBusy}>{locationBusy ? "Detecting location…" : "Use my location"}</button>
          <form className="dairy-location-search" onSubmit={searchLocation}><input value={area} onChange={(e) => setArea(e.target.value)} placeholder="City or PIN code (e.g. Bhopal / 462001)" aria-label="Search stores by city or PIN code"/><button type="submit" className="dairy-primary-button">Search</button><button type="button" className="dairy-secondary-button" onClick={() => {setArea(""); loadStores();}}>Show all</button></form>
          {locationMessage && <p className="dairy-location-message" role="status">{locationMessage}</p>}
        </div>

        <div className="dairy-search"><Search size={19}/><input type="search" placeholder="Search store name, city, or address…" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search registered dairy stores"/>{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={17}/></button>}</div>

        {storesLoading ? <div className="dairy-empty-state"><Milk size={30}/><h3>Finding local dairy stores…</h3><p>Loading registered stores from KisanDirect.</p></div> : storesError ? <div className="dairy-empty-state" role="alert"><h3>Unable to load dairy stores</h3><p>{storesError}</p><button type="button" className="dairy-primary-button" onClick={() => loadStores()}>Try again</button></div> : visibleStores.length === 0 ? <div className="dairy-empty-state"><Store size={35}/><h3>{stores.length === 0 ? "No dairy stores registered yet" : "No stores match your search"}</h3><p>{stores.length === 0 ? "Be the first to register a dairy store and help local customers discover you." : "Try another store name, city, or address."}</p><Link to="/dairy/register-store" className="dairy-primary-button"><Plus size={17}/> Register Your Dairy Store</Link></div> : <div className="dairy-store-grid">{visibleStores.map((store) => <article className="dairy-store-card" key={store.id ?? store.storeId ?? `${store.storeName}-${store.postalCode}`}><div className="dairy-store-card-art"><span>🏡</span><small><Store size={13}/> Registered dairy store</small></div><div className="dairy-store-card-content"><h3>{store.storeName || "Local dairy store"}</h3>{store.description && <p>{store.description}</p>}<p className="dairy-store-address">{[store.addressLine, store.city, store.state, store.postalCode].filter(Boolean).join(", ") || "Address not provided"}</p>{store.phone && <p className="dairy-store-phone">Contact: {store.phone}</p>}<span className="dairy-store-delivery">Delivery radius: {store.deliveryRadiusKm ?? "—"} km</span></div></article>)}</div>}
      </section>

      <section className="dairy-subscription-banner"><div className="dairy-subscription-icon"><CalendarDays size={29}/></div><div><span className="dairy-section-kicker">YOUR DAILY ROUTINE</span><h2>Need milk regularly?</h2><p>Explore daily and weekly delivery preferences for your household.</p></div><button type="button" onClick={() => setSubscriptionOpen(true)}>Explore subscriptions <ArrowRight size={17}/></button></section>

      {subscriptionOpen && <div className="dairy-modal-overlay" onClick={closeSubscription}><section className="dairy-modal" role="dialog" aria-modal="true" aria-labelledby="dairy-subscription-title" onClick={(event) => event.stopPropagation()}><div className="dairy-modal-header"><div><span className="dairy-section-kicker">RECURRING DELIVERY</span><h2 id="dairy-subscription-title">Milk subscription preferences</h2></div><button type="button" className="dairy-close-button" onClick={closeSubscription} aria-label="Close subscription form"><X size={20}/></button></div><form className="dairy-subscription-form" onSubmit={requestSubscription}><label>Milk quantity per delivery<select value={quantity} onChange={(event) => setQuantity(event.target.value)}><option value="0.5">500 ml</option><option value="1">1 litre</option><option value="1.5">1.5 litres</option><option value="2">2 litres</option></select></label><label>Delivery frequency<select value={frequency} onChange={(event) => setFrequency(event.target.value)}><option value="Daily">Daily</option><option value="Alternate days">Alternate days</option><option value="Weekly">Selected weekly schedule</option></select></label><label>Your delivery area<input value={area} onChange={(event) => setArea(event.target.value)} placeholder="e.g. Kolar Road, Bhopal" required/></label><div className="dairy-subscription-summary"><CalendarDays size={19}/><span><strong>{quantity} litre(s) per delivery</strong><small>{frequency} · {area || "Area not entered"}</small></span></div>{message && <div className="dairy-form-message" role="status">{message}</div>}<button type="submit" className="dairy-primary-button dairy-submit-button">Save preferences <Check size={17}/></button><p className="dairy-prototype-note">Saving preferences does not create a paid subscription. Seller availability, scheduled orders, and billing require backend integration.</p></form></section></div>}
    </div>
  );
}

function MapPinIcon() {
  return <span aria-hidden="true" style={{fontSize: 21, lineHeight: 1}}>📍</span>;
}





