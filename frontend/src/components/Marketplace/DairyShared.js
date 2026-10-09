import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "../../api";
import { AUTH_EVENT, getStoredUser } from "../../utils/auth";

/* ------------------------------------------------------------------
   Product categories (the owner picks one when adding a product)
------------------------------------------------------------------ */
export const CATEGORIES = [
  { value: "MILK", label: "Milk", emoji: "🥛" },
  { value: "CURD", label: "Curd / Dahi", emoji: "🍶" },
  { value: "BUTTERMILK", label: "Buttermilk / Chaas", emoji: "🥤" },
  { value: "GHEE", label: "Ghee", emoji: "🧈" },
  { value: "BUTTER", label: "Butter", emoji: "🧈" },
  { value: "PANEER", label: "Paneer", emoji: "🧀" },
  { value: "OTHER", label: "Other", emoji: "🥣" },
];

export const categoryOf = (value) =>
  CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

export const rupees = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function daysListedLabel(days) {
  if (days === undefined || days === null) return "";
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed 1 day ago";
  return `Listed ${days} days ago`;
}

export function errorText(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;
  if (!error?.response) return "Can't reach the server. Check your connection.";
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message === "string") return data.message;
  if (error.response.status === 401) return "Please sign in to continue.";
  return fallback;
}

/* ------------------------------------------------------------------
   Login state (re-renders when the user signs in / out)
------------------------------------------------------------------ */
export function useAuthUser() {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return user;
}

/* ------------------------------------------------------------------
   The signed-in user's own dairy store (null when they have none).
   This is what decides whether "Register as a Dairy Store" is shown.
------------------------------------------------------------------ */
export function useMyDairyStore() {
  const user = useAuthUser();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(Boolean(user));

  const reload = useCallback(async () => {
    if (!user) {
      setStore(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get("/dairy/stores/mine");
      setStore(Array.isArray(data) && data.length ? data[0] : null);
    } catch {
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { user, store, loading, reload };
}

/* ------------------------------------------------------------------
   Remembered shopper location
------------------------------------------------------------------ */
const LOCATION_KEY = "kc_dairy_location";

export function loadLocation() {
  try {
    return JSON.parse(localStorage.getItem(LOCATION_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveLocation(location) {
  try {
    if (location) localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    else localStorage.removeItem(LOCATION_KEY);
  } catch {
    /* storage unavailable - ignore */
  }
}

/** Browser GPS -> { latitude, longitude }. Rejects with a friendly message. */
export function detectPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser can't detect location. Please type your city or PIN code."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission was declined. Please type your city or PIN code."
              : "Couldn't detect your location. Please type your city or PIN code."
          )
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}

/** Best-effort city / PIN lookup (OpenStreetMap). Returns {} when it fails. */
export async function reverseGeocode(latitude, longitude) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=14&lat=${latitude}&lon=${longitude}`,
      { signal: controller.signal, headers: { Accept: "application/json" } }
    );
    clearTimeout(timer);
    if (!res.ok) return {};
    const a = (await res.json())?.address || {};
    return {
      city: a.city || a.town || a.village || a.suburb || a.county || a.state_district || "",
      state: a.state || "",
      postalCode: a.postcode || "",
      area: a.suburb || a.neighbourhood || a.road || "",
    };
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------------
   Stars
------------------------------------------------------------------ */
export function Stars({ value = 0, size = 16 }) {
  return (
    <span className="dairy-stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? "on" : "off"}
          fill={n <= Math.round(value) ? "currentColor" : "none"}
        />
      ))}
    </span>
  );
}

export function StarPicker({ value, onChange }) {
  return (
    <span className="dairy-star-picker" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={n <= value ? "on" : ""}
        >
          <Star size={28} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </span>
  );
}

export function RatingLine({ average, count }) {
  if (!count) return <span className="dairy-rating-line dairy-rating-new">⭐ New · no reviews yet</span>;
  return (
    <span className="dairy-rating-line">
      <Stars value={average} size={15} />
      <strong>{average.toFixed(1)}</strong>
      <small>({count} review{count === 1 ? "" : "s"})</small>
    </span>
  );
}
