import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  LocateFixed,
  MapPin,
  Milk,
  Pencil,
  Search,
  Store,
  Truck,
  X,
} from "lucide-react";
import api from "../../api";
import {
  RatingLine,
  daysListedLabel,
  detectPosition,
  errorText,
  loadLocation,
  reverseGeocode,
  saveLocation,
  useMyDairyStore,
} from "./DairyShared";
import "./dairy-marketplace.css";
import "./dairy-store.css";

/* ==================================================================
   STEP 1  Ask for location  (automatic or manual)
   STEP 2  Show registered stores near that location, best-reviewed first
   STEP 3  Tap a store -> /dairy/stores/:id  (products, reviews, order)
================================================================== */
export default function DairyMarketplace() {
  const { user, store: myStore, loading: myStoreLoading } = useMyDairyStore();

  const [location, setLocation] = useState(() => loadLocation());
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [manual, setManual] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState("");

  /* ---------- load stores whenever the chosen location changes ---------- */
  const loadStores = useCallback(async (loc) => {
    if (!loc) return;
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (loc.city) params.city = loc.city;
      if (loc.postalCode) params.postalCode = loc.postalCode;
      if (loc.latitude != null && loc.longitude != null) {
        params.lat = loc.latitude;
        params.lng = loc.longitude;
      }
      const { data } = await api.get("/dairy/stores", { params });
      setStores(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(errorText(e, "Unable to load dairy stores. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) loadStores(location);
  }, [location, loadStores]);

  function chooseLocation(loc) {
    saveLocation(loc);
    setLocation(loc);
    setSearch("");
    setLocationError("");
  }

  /* ---------- automatic ---------- */
  async function useMyLocation() {
    setLocationError("");
    setDetecting(true);
    try {
      const { latitude, longitude } = await detectPosition();
      const place = await reverseGeocode(latitude, longitude);
      chooseLocation({
        mode: "auto",
        latitude,
        longitude,
        city: place.city || "",
        postalCode: "",
        label: [place.area, place.city].filter(Boolean).join(", ") || "Your current location",
      });
    } catch (e) {
      setLocationError(e.message);
    } finally {
      setDetecting(false);
    }
  }

  /* ---------- manual ---------- */
  function submitManual(event) {
    event.preventDefault();
    const value = manual.trim();
    if (!value) {
      setLocationError("Enter your city or 6-digit PIN code.");
      return;
    }
    if (/^\d{6}$/.test(value)) {
      chooseLocation({ mode: "manual", postalCode: value, label: `PIN ${value}` });
    } else if (/^\d+$/.test(value)) {
      setLocationError("A PIN code has 6 digits.");
    } else {
      chooseLocation({ mode: "manual", city: value, label: value });
    }
  }

  function changeLocation() {
    saveLocation(null);
    setLocation(null);
    setStores([]);
    setManual("");
  }

  const visibleStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) =>
      [s.storeName, s.description, s.city, s.addressLine, s.postalCode]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [stores, search]);

  /* ---------- top bar: register button disappears once you own a store ---------- */
  const topbar = (
    <div className="dairy-topbar">
      <Link to="/" className="dairy-back-link">
        <ArrowLeft size={17} /> Back to KisanDirect
      </Link>

      <div className="dairy-topbar-actions">
        {user && (
          <Link to="/dairy/orders" className="dairy-secondary-button dairy-small-button">
            <ClipboardList size={16} /> Orders
          </Link>
        )}

        {!myStoreLoading && myStore ? (
          <Link to={`/dairy/stores/${myStore.id}`} className="dairy-primary-button dairy-small-button">
            <Store size={16} /> My Dairy Store
          </Link>
        ) : (
          !myStoreLoading && (
            <Link to="/dairy/register-store" className="dairy-primary-button dairy-small-button">
              <Store size={16} /> Register as Dairy Store
            </Link>
          )
        )}
      </div>
    </div>
  );

  /* ================= STEP 1: location gate ================= */
  if (!location) {
    return (
      <div className="dairy-page">
        {topbar}

        <section className="dairy-gate">
          <div className="dairy-gate-icon">
            <Milk size={34} />
          </div>
          <span className="dairy-section-kicker">KISANDIRECT DAIRY</span>
          <h1>Where should we look for fresh dairy?</h1>
          <p>
            Tell us your location and we'll show registered dairy stores that serve your area,
            with the best-reviewed ones first.
          </p>

          <button
            type="button"
            className="dairy-primary-button dairy-gate-auto"
            onClick={useMyLocation}
            disabled={detecting}
          >
            <LocateFixed size={18} />
            {detecting ? "Detecting your location…" : "Use my current location"}
          </button>

          <div className="dairy-gate-or"><span>or enter it yourself</span></div>

          <form className="dairy-gate-form" onSubmit={submitManual}>
            <MapPin size={18} />
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="City or 6-digit PIN code (e.g. Bhopal / 462001)"
              aria-label="City or PIN code"
            />
            <button type="submit" className="dairy-primary-button dairy-small-button">
              Find stores
            </button>
          </form>

          {locationError && (
            <p className="dairy-inline-error" role="alert">{locationError}</p>
          )}
        </section>
      </div>
    );
  }

  /* ================= STEP 2: store list ================= */
  return (
    <div className="dairy-page">
      {topbar}

      <section className="dairy-list-head">
        <div>
          <span className="dairy-section-kicker">LOCAL DAIRY STORES</span>
          <h1>Dairy stores near you</h1>
          <p className="dairy-location-chip">
            <MapPin size={15} /> {location.label || location.city || location.postalCode}
            <button type="button" onClick={changeLocation}>
              <Pencil size={13} /> Change
            </button>
          </p>
        </div>

        <div className="dairy-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search store name or area…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search dairy stores"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={17} />
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="dairy-empty-state">
          <Milk size={30} />
          <h3>Finding dairy stores…</h3>
        </div>
      ) : error ? (
        <div className="dairy-empty-state" role="alert">
          <h3>Unable to load dairy stores</h3>
          <p>{error}</p>
          <button type="button" className="dairy-primary-button" onClick={() => loadStores(location)}>
            Try again
          </button>
        </div>
      ) : visibleStores.length === 0 ? (
        <div className="dairy-empty-state">
          <Store size={35} />
          <h3>{stores.length === 0 ? "No dairy stores here yet" : "No store matches your search"}</h3>
          <p>
            {stores.length === 0
              ? "No registered store serves this location yet. Try another city or PIN code, or be the first to open one."
              : "Try a different name or area."}
          </p>
          <div className="dairy-empty-actions">
            <button type="button" className="dairy-secondary-button" onClick={changeLocation}>
              Change location
            </button>
            {!myStore && (
              <Link to="/dairy/register-store" className="dairy-primary-button">
                Register as Dairy Store
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="dairy-store-grid">
          {visibleStores.map((s, index) => (
            <Link to={`/dairy/stores/${s.id}`} className="dairy-store-card dairy-store-link" key={s.id}>
              <div className="dairy-store-card-art">
                <span>🏡</span>
                {s.reviewCount > 0 && index < 3 && !search && (
                  <em className="dairy-rank-badge">#{index + 1} top rated</em>
                )}
              </div>

              <div className="dairy-store-card-content">
                <h3>{s.storeName}</h3>
                <RatingLine average={s.averageRating} count={s.reviewCount} />

                <p className="dairy-store-address">
                  {[s.addressLine, s.city].filter(Boolean).join(", ")}
                </p>

                <div className="dairy-store-meta">
                  {s.distanceKm != null && <span><MapPin size={13} /> {s.distanceKm} km away</span>}
                  <span><Truck size={13} /> {s.deliveryRadiusKm ?? "—"} km delivery</span>
                  <span><CalendarDays size={13} /> {daysListedLabel(s.daysListed)}</span>
                </div>

                <span className="dairy-store-open">
                  {s.productCount} product{s.productCount === 1 ? "" : "s"} · View store <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}





