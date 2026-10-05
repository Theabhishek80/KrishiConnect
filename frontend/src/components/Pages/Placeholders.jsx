import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Hammer,
  TrendingUp,
  Bell,
  MapPin,
  LineChart,
  RefreshCw,
  Search,
  Wheat,
  CalendarDays,
  IndianRupee,
  Filter,
  Navigation,
  X
} from "lucide-react";

import api from "../../api";

/* =========================================================
   COMING SOON
========================================================= */

export function ComingSoon({ title, text }) {
  return (
    <section className="page-section">
      <div className="empty-state">
        <Hammer size={36} />

        <h3>{title}</h3>

        <p>
          {text ||
            "This section is coming soon. Thanks for your patience!"}
        </p>

        <Link className="primary-btn" to="/">
          Back to marketplace
        </Link>
      </div>
    </section>
  );
}

/* =========================================================
   NOT FOUND
========================================================= */

export function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="empty-state">
        <Compass size={36} />

        <h3>Page not found</h3>

        <p>
          The page you're looking for doesn't exist or has moved.
        </p>

        <Link className="primary-btn" to="/">
          Go to home
        </Link>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------
   LOCATION HELPERS
   State names use the spelling of the government data set
   (data.gov.in), e.g. "Chattisgarh" and "Uttrakhand".
--------------------------------------------------------- */

const LOCATION_KEY = "kd_mandi_location";
const LOCATION_SKIPPED_KEY = "kd_mandi_location_skipped";

const INDIAN_STATES = [
  "Andaman and Nicobar",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "NCT of Delhi",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttrakhand",
  "West Bengal"
];

const STATE_ALIASES = {
  chhattisgarh: "Chattisgarh",
  uttarakhand: "Uttrakhand",
  delhi: "NCT of Delhi",
  "national capital territory of delhi": "NCT of Delhi",
  "andaman and nicobar islands": "Andaman and Nicobar",
  pondicherry: "Puducherry",
  orissa: "Odisha"
};

function normalizeState(name) {
  const clean = String(name || "").trim();

  if (!clean) return "";

  const lower = clean.toLowerCase();

  if (STATE_ALIASES[lower]) return STATE_ALIASES[lower];

  const match = INDIAN_STATES.find(
    state => state.toLowerCase() === lower
  );

  return match || clean;
}

function readSavedLocation() {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return parsed && parsed.state ? parsed : null;
  } catch {
    return null;
  }
}

function wasLocationSkipped() {
  try {
    return localStorage.getItem(LOCATION_SKIPPED_KEY) === "1";
  } catch {
    return false;
  }
}

async function reverseGeocode(latitude, longitude) {
  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    `?format=jsonv2&addressdetails=1&zoom=10&accept-language=en` +
    `&lat=${latitude}&lon=${longitude}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const data = await response.json();
  const address = data.address || {};

  const district = String(
    address.state_district ||
      address.county ||
      address.city_district ||
      address.city ||
      ""
  )
    .replace(/\s+district$/i, "")
    .trim();

  return {
    state: normalizeState(address.state),
    district
  };
}

/* =========================================================
   MANDI RATES
========================================================= */

export function MandiPage() {
  const [initialLocation] = useState(readSavedLocation);

  const [rates, setRates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState({
    state: initialLocation?.state || "",
    district: initialLocation?.district || "",
    market: "",
    commodity: ""
  });

  /* -------------------------------------------------------
     LOCATION STATE
  ------------------------------------------------------- */

  const [location, setLocation] = useState(initialLocation);

  // Ask for location the first time (unless the user skipped before)
  const [showLocationPicker, setShowLocationPicker] = useState(
    () => !initialLocation && !wasLocationSkipped()
  );

  const [pickerMode, setPickerMode] = useState("choose");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [manual, setManual] = useState({
    state: "",
    district: ""
  });

  // Used to ignore slow, outdated responses
  const requestId = useRef(0);

  /* -------------------------------------------------------
     LOAD RATES
  ------------------------------------------------------- */

  const fetchRates = async params => {
    const response = await api.get("/mandi/rates", { params });

    return Array.isArray(response.data) ? response.data : [];
  };

  const loadRates = async (showRefresh = false) => {
    const id = ++requestId.current;

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setNotice("");

      const params = {
        limit: 100
      };

      if (filters.state.trim()) {
        params.state = filters.state.trim();
      }

      if (filters.district.trim()) {
        params.district = filters.district.trim();
      }

      if (filters.market.trim()) {
        params.market = filters.market.trim();
      }

      if (filters.commodity.trim()) {
        params.commodity = filters.commodity.trim();
      }

      let data = await fetchRates(params);

      // District spelling from GPS / typing often differs from the
      // government data. If the district has no rates, fall back to
      // the whole state so the page is never empty for no reason.
      if (!data.length && params.district) {
        const { district, ...withoutDistrict } = params;

        const fallback = await fetchRates(withoutDistrict);

        if (fallback.length) {
          data = fallback;

          setNotice(
            `No rates found for ${district} today. ` +
              (params.state
                ? `Showing other markets in ${params.state}.`
                : "Showing markets from all over India.")
          );
        }
      }

      if (id !== requestId.current) return;

      setRates(data);
    } catch (err) {
      if (id !== requestId.current) return;

      console.error("Mandi rates error:", err);

      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Could not load mandi rates. Please try again.";

      setError(message);
      setRates([]);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  /* -------------------------------------------------------
     INITIAL / FILTER LOAD (debounced while typing)
  ------------------------------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRates();
    }, 400);

    return () => clearTimeout(timer);
  }, [
    filters.state,
    filters.district,
    filters.market,
    filters.commodity
  ]);

  /* -------------------------------------------------------
     FILTER HANDLERS
  ------------------------------------------------------- */

  const updateFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      state: "",
      district: "",
      market: "",
      commodity: ""
    });

    setSearch("");
    setLocation(null);

    try {
      localStorage.removeItem(LOCATION_KEY);
    } catch {
      /* ignore */
    }
  };

  /* -------------------------------------------------------
     LOCATION HANDLERS
  ------------------------------------------------------- */

  const openLocationPicker = () => {
    setPickerMode("choose");
    setLocationError("");
    setShowLocationPicker(true);
  };

  const skipLocation = () => {
    try {
      localStorage.setItem(LOCATION_SKIPPED_KEY, "1");
    } catch {
      /* ignore */
    }

    setShowLocationPicker(false);
  };

  const applyLocation = place => {
    const next = {
      state: place.state || "",
      district: place.district || "",
      source: place.source
    };

    setLocation(next);

    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
      localStorage.removeItem(LOCATION_SKIPPED_KEY);
    } catch {
      /* ignore */
    }

    setFilters(prev => ({
      ...prev,
      state: next.state,
      district: next.district,
      market: ""
    }));

    setLocationError("");
    setShowLocationPicker(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support automatic location. " +
          "Please choose your location manually."
      );
      setPickerMode("manual");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const place = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          );

          if (!place.state) {
            throw new Error("State not found");
          }

          applyLocation({ ...place, source: "auto" });
        } catch {
          setLocationError(
            "We found you, but could not work out your state. " +
              "Please choose it manually."
          );
          setPickerMode("manual");
        } finally {
          setLocating(false);
        }
      },
      geoError => {
        setLocating(false);

        setLocationError(
          geoError.code === 1
            ? "Location permission was denied. Allow it in your " +
                "browser settings, or choose manually."
            : "Could not detect your location. Please choose it manually."
        );

        setPickerMode("manual");
      },
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 600000
      }
    );
  };

  const submitManualLocation = event => {
    event.preventDefault();

    if (!manual.state) {
      setLocationError("Please select your state.");
      return;
    }

    applyLocation({
      state: manual.state,
      district: manual.district.trim(),
      source: "manual"
    });
  };

  /* -------------------------------------------------------
     CLIENT-SIDE SEARCH
  ------------------------------------------------------- */

  const visibleRates = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rates;
    }

    return rates.filter(rate => {
      const text = [
        rate.state,
        rate.district,
        rate.market,
        rate.commodity,
        rate.variety,
        rate.grade
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [rates, search]);

  /* -------------------------------------------------------
     UNIQUE VALUES
  ------------------------------------------------------- */

  const commodities = useMemo(() => {
    return [
      ...new Set(
        rates
          .map(rate => rate.commodity)
          .filter(Boolean)
      )
    ].sort();
  }, [rates]);

  /* -------------------------------------------------------
     FORMAT PRICE
  ------------------------------------------------------- */

  const price = value => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    const number = Number(
      String(value).replace(/,/g, "")
    );

    if (Number.isNaN(number)) {
      return `₹${value}`;
    }

    return `₹${number.toLocaleString("en-IN")}`;
  };

  /* -------------------------------------------------------
     FORMAT DATE
  ------------------------------------------------------- */

  const formatDate = value => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  /* -------------------------------------------------------
     ACTIVE FILTER COUNT
  ------------------------------------------------------- */

  const activeFilterCount = Object.values(filters).filter(
    Boolean
  ).length;

  /* -------------------------------------------------------
     UI
  ------------------------------------------------------- */

  return (
    <section className="page-section kd-mandi-page">

      <style>{`
        .kd-mandi-page {
          padding-bottom: 60px;
        }

        .kd-mandi-hero {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 34px;
          margin-bottom: 24px;
          background:
            linear-gradient(
              135deg,
              rgba(30, 120, 70, 0.10),
              rgba(250, 190, 60, 0.10)
            );
          border: 1px solid rgba(30, 100, 60, 0.12);
        }

        .kd-mandi-hero-content {
          position: relative;
          z-index: 2;
          max-width: 760px;
        }

        .kd-mandi-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 12px;
          border-radius: 999px;
          background: rgba(30, 120, 70, 0.10);
          color: #267047;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .08em;
          margin-bottom: 12px;
        }

        .kd-mandi-hero h1 {
          margin: 0;
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.05;
        }

        .kd-mandi-hero h1 span {
          color: #27804b;
        }

        .kd-mandi-hero p {
          margin: 15px 0 0;
          max-width: 650px;
          color: #647064;
          font-size: 16px;
          line-height: 1.7;
        }

        .kd-mandi-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .kd-mandi-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,.75);
          border: 1px solid rgba(30,100,60,.10);
          font-size: 13px;
          color: #536153;
        }

        .kd-mandi-toolbar {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }

        .kd-mandi-search {
          position: relative;
          flex: 1;
          min-width: 240px;
        }

        .kd-mandi-search svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #7a847a;
        }

        .kd-mandi-search input {
          width: 100%;
          box-sizing: border-box;
          padding: 13px 15px 13px 43px;
          border: 1px solid #dfe5df;
          border-radius: 12px;
          outline: none;
          background: #fff;
          font-size: 14px;
        }

        .kd-mandi-search input:focus {
          border-color: #3b9560;
          box-shadow: 0 0 0 3px rgba(59,149,96,.10);
        }

        .kd-mandi-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .kd-mandi-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #dfe5df;
          background: #fff;
          color: #304130;
          border-radius: 11px;
          padding: 11px 14px;
          cursor: pointer;
          font-weight: 700;
          font-size: 13px;
        }

        .kd-mandi-btn:hover {
          border-color: #4a9966;
        }

        .kd-mandi-btn.primary {
          background: #24794a;
          color: white;
          border-color: #24794a;
        }

        .kd-mandi-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .kd-mandi-filters {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 16px;
          margin-bottom: 20px;
          background: #fff;
          border: 1px solid #e4e9e4;
          border-radius: 16px;
        }

        .kd-mandi-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .kd-mandi-field label {
          font-size: 12px;
          font-weight: 800;
          color: #596459;
        }

        .kd-mandi-field input,
        .kd-mandi-field select {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border: 1px solid #dfe5df;
          border-radius: 10px;
          background: #fff;
          outline: none;
          font-size: 13px;
        }

        .kd-mandi-field input:focus,
        .kd-mandi-field select:focus {
          border-color: #4a9966;
        }

        .kd-mandi-result-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .kd-mandi-result-head strong {
          font-size: 18px;
        }

        .kd-mandi-count {
          font-size: 13px;
          color: #687268;
        }

        .kd-mandi-table-wrap {
          overflow-x: auto;
          border: 1px solid #e4e9e4;
          border-radius: 16px;
          background: white;
        }

        .kd-mandi-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }

        .kd-mandi-table th {
          padding: 13px 15px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #697369;
          background: #f7f9f7;
          border-bottom: 1px solid #e5e9e5;
        }

        .kd-mandi-table td {
          padding: 15px;
          border-bottom: 1px solid #edf0ed;
          font-size: 13px;
          vertical-align: middle;
        }

        .kd-mandi-table tr:last-child td {
          border-bottom: none;
        }

        .kd-mandi-commodity {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .kd-mandi-commodity strong {
          color: #233323;
        }

        .kd-mandi-commodity span {
          font-size: 11px;
          color: #818981;
        }

        .kd-price {
          font-weight: 800;
          white-space: nowrap;
        }

        .kd-modal-price {
          color: #24794a;
          font-weight: 900;
        }

        .kd-mandi-mobile {
          display: none;
        }

        .kd-mandi-card {
          background: #fff;
          border: 1px solid #e3e8e3;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .kd-mandi-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
        }

        .kd-mandi-card-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .kd-mandi-card-price {
          padding: 10px;
          border-radius: 10px;
          background: #f7f9f7;
        }

        .kd-mandi-card-price small {
          display: block;
          font-size: 10px;
          color: #747d74;
          margin-bottom: 3px;
        }

        .kd-mandi-card-price strong {
          font-size: 14px;
        }

        .kd-mandi-empty {
          padding: 50px 20px;
          text-align: center;
          color: #697269;
        }

        .kd-mandi-empty svg {
          margin-bottom: 10px;
        }

        .kd-mandi-error {
          padding: 15px 16px;
          border-radius: 12px;
          background: #fff3f3;
          border: 1px solid #f0cccc;
          color: #a33c3c;
          margin-bottom: 18px;
          font-size: 14px;
        }

        .kd-mandi-source {
          margin-top: 18px;
          font-size: 12px;
          color: #747d74;
          line-height: 1.6;
        }

        .kd-spin {
          animation: kd-spin 1s linear infinite;
        }

        @keyframes kd-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .kd-mandi-filters {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .kd-mandi-hero {
            padding: 24px 18px;
            border-radius: 18px;
          }

          .kd-mandi-toolbar {
            align-items: stretch;
          }

          .kd-mandi-search {
            min-width: 100%;
          }

          .kd-mandi-actions {
            width: 100%;
          }

          .kd-mandi-btn {
            flex: 1;
          }

          .kd-mandi-filters {
            grid-template-columns: 1fr;
            padding: 13px;
          }

          .kd-mandi-table-wrap {
            display: none;
          }

          .kd-mandi-mobile {
            display: block;
          }

          .kd-mandi-result-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .kd-mandi-card-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .kd-mandi-card {
            padding: 13px;
          }

          .kd-mandi-meta-item {
            width: 100%;
          }
        }

        /* ---------- LOCATION BAR ---------- */

        .kd-mandi-location {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          background: #f0f8f3;
          border: 1px solid #cfe5d7;
          border-radius: 14px;
          padding: 12px 16px;
          margin-bottom: 14px;
          color: #24503a;
          font-size: 14px;
        }

        .kd-mandi-location-text {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .kd-mandi-notice {
          background: #fff8e6;
          border: 1px solid #f0dca4;
          color: #7a5b00;
          border-radius: 12px;
          padding: 11px 14px;
          margin-bottom: 14px;
          font-size: 13px;
        }

        /* ---------- LOCATION POPUP ---------- */

        .kd-loc-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(15, 30, 20, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .kd-loc-modal {
          position: relative;
          width: 100%;
          max-width: 440px;
          background: #fff;
          border-radius: 20px;
          padding: 28px 24px 22px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
        }

        .kd-loc-close {
          position: absolute;
          top: 12px;
          right: 12px;
          border: 0;
          background: transparent;
          color: #657065;
          cursor: pointer;
          padding: 6px;
        }

        .kd-loc-icon {
          width: 54px;
          height: 54px;
          margin: 0 auto 12px;
          border-radius: 50%;
          background: #e6f4ec;
          color: #24794a;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kd-loc-modal h3 {
          margin: 0 0 6px;
          font-size: 20px;
          color: #1d2b1f;
        }

        .kd-loc-modal p {
          margin: 0 0 16px;
          color: #657065;
          font-size: 14px;
          line-height: 1.5;
        }

        .kd-loc-error {
          background: #fdecec;
          border: 1px solid #f3c5c5;
          color: #a02525;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          margin-bottom: 14px;
          text-align: left;
        }

        .kd-loc-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .kd-loc-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .kd-loc-form label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #4d5d4d;
          margin-bottom: 5px;
        }

        .kd-loc-form select,
        .kd-loc-form input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dfe5df;
          border-radius: 11px;
          padding: 11px 12px;
          font-size: 14px;
          background: #fff;
        }

        .kd-loc-skip {
          margin-top: 14px;
          border: 0;
          background: transparent;
          color: #657065;
          font-size: 13px;
          text-decoration: underline;
          cursor: pointer;
        }
      `}</style>

      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="kd-mandi-hero">
        <div className="kd-mandi-hero-content">

          <div className="kd-mandi-badge">
            <TrendingUp size={15} />
            LIVE MARKET PRICES
          </div>

          <h1>
            Mandi <span>Rates</span>
          </h1>

          <p>
            Check daily wholesale prices from agricultural
            markets across India. Compare minimum, maximum and
            modal prices for different commodities.
          </p>

          <div className="kd-mandi-meta">

            <span className="kd-mandi-meta-item">
              <CalendarDays size={15} />
              Daily market data
            </span>

            <span className="kd-mandi-meta-item">
              <MapPin size={15} />
              Markets across India
            </span>

            <span className="kd-mandi-meta-item">
              <IndianRupee size={15} />
              Prices in ₹
            </span>

          </div>
        </div>
      </div>

      {/* =====================================================
          LOCATION BAR
      ===================================================== */}

      <div className="kd-mandi-location">

        <div className="kd-mandi-location-text">
          <MapPin size={16} />

          {location ? (
            <span>
              Showing prices near{" "}
              <strong>
                {[location.district, location.state]
                  .filter(Boolean)
                  .join(", ")}
              </strong>
            </span>
          ) : (
            <span>
              Set your location to see nearby mandi prices
            </span>
          )}
        </div>

        <button
          type="button"
          className="kd-mandi-btn"
          onClick={openLocationPicker}
        >
          <Navigation size={16} />
          {location ? "Change location" : "Set location"}
        </button>

      </div>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <div className="kd-mandi-toolbar">

        <div className="kd-mandi-search">
          <Search size={18} />

          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search commodity, market, district..."
          />
        </div>

        <div className="kd-mandi-actions">

          {activeFilterCount > 0 && (
            <button
              type="button"
              className="kd-mandi-btn"
              onClick={clearFilters}
            >
              <X size={16} />
              Clear
            </button>
          )}

          <button
            type="button"
            className="kd-mandi-btn primary"
            onClick={() => loadRates(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "kd-spin" : ""
              }
            />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="kd-mandi-filters">

        <div className="kd-mandi-field">
          <label>State</label>

          <select
            value={filters.state}
            onChange={e =>
              updateFilter("state", e.target.value)
            }
          >
            <option value="">All states</option>

            {filters.state &&
              !INDIAN_STATES.includes(filters.state) && (
                <option value={filters.state}>
                  {filters.state}
                </option>
              )}

            {INDIAN_STATES.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="kd-mandi-field">
          <label>District</label>

          <input
            value={filters.district}
            onChange={e =>
              updateFilter("district", e.target.value)
            }
            placeholder="e.g. Indore"
          />
        </div>

        <div className="kd-mandi-field">
          <label>Market</label>

          <input
            value={filters.market}
            onChange={e =>
              updateFilter("market", e.target.value)
            }
            placeholder="e.g. Indore"
          />
        </div>

        <div className="kd-mandi-field">
          <label>Commodity</label>

          <input
            list="mandi-commodities"
            value={filters.commodity}
            onChange={e =>
              updateFilter(
                "commodity",
                e.target.value
              )
            }
            placeholder="e.g. Wheat"
          />

          <datalist id="mandi-commodities">
            {commodities.map(commodity => (
              <option
                key={commodity}
                value={commodity}
              />
            ))}
          </datalist>
        </div>

      </div>

      {notice && !error && (
        <div className="kd-mandi-notice">{notice}</div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="kd-mandi-error">
          <strong>Could not load mandi rates.</strong>
          <br />
          {error}
        </div>
      )}

      {/* =====================================================
          RESULT HEADER
      ===================================================== */}

      <div className="kd-mandi-result-head">

        <div>
          <strong>
            Today's mandi prices
          </strong>

          <div className="kd-mandi-count">
            {loading
              ? "Loading market data..."
              : `${visibleRates.length} rates found`}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <span className="kd-mandi-count">
            <Filter
              size={13}
              style={{
                verticalAlign: "middle",
                marginRight: "4px"
              }}
            />
            {activeFilterCount} filter
            {activeFilterCount > 1 ? "s" : ""} active
          </span>
        )}

      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="kd-mandi-empty">
          <RefreshCw
            size={30}
            className="kd-spin"
          />

          <p>
            Fetching the latest mandi prices...
          </p>
        </div>
      )}

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}

      {!loading && visibleRates.length > 0 && (
        <div className="kd-mandi-table-wrap">

          <table className="kd-mandi-table">

            <thead>
              <tr>
                <th>Commodity</th>
                <th>Market</th>
                <th>District</th>
                <th>State</th>
                <th>Min Price</th>
                <th>Max Price</th>
                <th>Modal Price</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>

              {visibleRates.map((rate, index) => (
                <tr
                  key={`${rate.market}-${rate.commodity}-${index}`}
                >

                  <td>
                    <div className="kd-mandi-commodity">

                      <strong>
                        {rate.commodity || "—"}
                      </strong>

                      {(rate.variety ||
                        rate.grade) && (
                        <span>
                          {[
                            rate.variety,
                            rate.grade
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}

                    </div>
                  </td>

                  <td>
                    {rate.market || "—"}
                  </td>

                  <td>
                    {rate.district || "—"}
                  </td>

                  <td>
                    {rate.state || "—"}
                  </td>

                  <td className="kd-price">
                    {price(rate.minPrice)}
                  </td>

                  <td className="kd-price">
                    {price(rate.maxPrice)}
                  </td>

                  <td className="kd-modal-price">
                    {price(rate.modalPrice)}
                  </td>

                  <td>
                    {formatDate(rate.arrivalDate)}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

      {/* =====================================================
          MOBILE CARDS
      ===================================================== */}

      {!loading && visibleRates.length > 0 && (
        <div className="kd-mandi-mobile">

          {visibleRates.map((rate, index) => (
            <div
              className="kd-mandi-card"
              key={`mobile-${rate.market}-${rate.commodity}-${index}`}
            >

              <div className="kd-mandi-card-top">

                <div className="kd-mandi-commodity">

                  <strong>
                    {rate.commodity || "Unknown commodity"}
                  </strong>

                  <span>
                    {rate.variety ||
                      rate.grade ||
                      "Market price"}
                  </span>

                </div>

                <span className="kd-mandi-count">
                  {formatDate(rate.arrivalDate)}
                </span>

              </div>

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  marginBottom: "13px",
                  color: "#657065",
                  fontSize: "12px"
                }}
              >
                <MapPin size={14} />

                {rate.market || "—"}
                {rate.district
                  ? `, ${rate.district}`
                  : ""}
              </div>

              <div className="kd-mandi-card-grid">

                <div className="kd-mandi-card-price">
                  <small>MIN</small>
                  <strong>
                    {price(rate.minPrice)}
                  </strong>
                </div>

                <div className="kd-mandi-card-price">
                  <small>MODAL</small>
                  <strong
                    style={{
                      color: "#24794a"
                    }}
                  >
                    {price(rate.modalPrice)}
                  </strong>
                </div>

                <div className="kd-mandi-card-price">
                  <small>MAX</small>
                  <strong>
                    {price(rate.maxPrice)}
                  </strong>
                </div>

              </div>

            </div>
          ))}

        </div>
      )}

      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!loading && !visibleRates.length && (
        <div className="kd-mandi-empty">

          <Wheat size={38} />

          <h3>
            No mandi rates found
          </h3>

          <p>
            Try changing your filters or search
            for another commodity or market.
          </p>

          <button
            type="button"
            className="kd-mandi-btn primary"
            onClick={clearFilters}
          >
            Clear filters
          </button>

        </div>
      )}

      {/* =====================================================
          SOURCE
      ===================================================== */}

      <div className="kd-mandi-source">
        <strong>Data source:</strong>{" "}
        Government of India, Open Government Data
        (OGD) Platform India — Directorate of
        Marketing & Inspection (DMI).
        <br />
        Mandi prices are provided as government
        market data. Prices may change throughout
        the day and should be verified with the
        respective market before making trading
        decisions.
      </div>


      {/* =====================================================
          LOCATION POPUP
      ===================================================== */}

      {showLocationPicker && (
        <div
          className="kd-loc-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kd-loc-title"
        >
          <div className="kd-loc-modal">

            <button
              type="button"
              className="kd-loc-close"
              onClick={skipLocation}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="kd-loc-icon">
              <MapPin size={26} />
            </div>

            <h3 id="kd-loc-title">
              Where do you want mandi prices from?
            </h3>

            <p>
              Choose your location to see prices from
              markets near you.
            </p>

            {locationError && (
              <div className="kd-loc-error">
                {locationError}
              </div>
            )}

            {pickerMode === "choose" ? (
              <div className="kd-loc-actions">

                <button
                  type="button"
                  className="kd-mandi-btn primary"
                  onClick={useCurrentLocation}
                  disabled={locating}
                >
                  <Navigation
                    size={16}
                    className={locating ? "kd-spin" : ""}
                  />
                  {locating
                    ? "Detecting location..."
                    : "Use my current location"}
                </button>

                <button
                  type="button"
                  className="kd-mandi-btn"
                  onClick={() => {
                    setLocationError("");
                    setPickerMode("manual");
                  }}
                >
                  Enter location manually
                </button>

              </div>
            ) : (
              <form
                className="kd-loc-form"
                onSubmit={submitManualLocation}
              >

                <div>
                  <label>State</label>

                  <select
                    value={manual.state}
                    onChange={e =>
                      setManual(prev => ({
                        ...prev,
                        state: e.target.value
                      }))
                    }
                  >
                    <option value="">Select state</option>

                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>District (optional)</label>

                  <input
                    value={manual.district}
                    onChange={e =>
                      setManual(prev => ({
                        ...prev,
                        district: e.target.value
                      }))
                    }
                    placeholder="e.g. Durg"
                  />
                </div>

                <button
                  type="submit"
                  className="kd-mandi-btn primary"
                >
                  Save location
                </button>

                <button
                  type="button"
                  className="kd-mandi-btn"
                  onClick={useCurrentLocation}
                  disabled={locating}
                >
                  <Navigation size={16} />
                  {locating
                    ? "Detecting location..."
                    : "Use my current location instead"}
                </button>

              </form>
            )}

            <button
              type="button"
              className="kd-loc-skip"
              onClick={skipLocation}
            >
              Skip for now — show all India
            </button>

          </div>
        </div>
      )}

    </section>
  );
}
