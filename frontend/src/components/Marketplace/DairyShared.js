```jsx
import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "../../api";
import { AUTH_EVENT, getStoredUser } from "../../utils/auth";

/* Product categories */
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
  CATEGORIES.find((category) => category.value === value) ||
  CATEGORIES[CATEGORIES.length - 1];

export const rupees = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export function daysListedLabel(days) {
  if (days === undefined || days === null) return "";
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed 1 day ago";
  return `Listed ${days} days ago`;
}

export function errorText(
  error,
  fallback = "Something went wrong. Please try again."
) {
  const data = error?.response?.data;

  if (!error?.response) {
    return "Can't reach the server. Check your connection.";
  }

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message === "string") return data.message;

  if (error.response.status === 401) {
    return "Please sign in to continue.";
  }

  return fallback;
}

/* Authentication state */
export function useAuthUser() {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());

    window.addEventListener(AUTH_EVENT, syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener(AUTH_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  return user;
}

/* Current user's dairy store */
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

    setLoading(true);

    try {
      const { data } = await api.get("/dairy/stores/mine");
      setStore(Array.isArray(data) ? data[0] ?? null : data ?? null);
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

/* Shopper location */
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
    if (location) {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
    } else {
      localStorage.removeItem(LOCATION_KEY);
    }
  } catch {
    // Browser storage may be unavailable.
  }
}

/* Browser GPS */
export function detectPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "Your browser can't detect location. Please type your city or PIN code."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? "Location permission was declined. Please type your city or PIN code."
              : "Couldn't detect your location. Please type your city or PIN code."
          )
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}

/* Reverse geocoding */
export async function reverseGeocode(latitude, longitude) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=14&lat=${latitude}&lon=${longitude}`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) return {};

    const address = (await response.json())?.address || {};

    return {
      city:
        address.city ||
        address.town ||
        address.village ||
        address.suburb ||
        address.county ||
        address.state_district ||
        "",
      state: address.state || "",
      postalCode: address.postcode || "",
      area:
        address.suburb ||
        address.neighbourhood ||
        address.road ||
        "",
    };
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

/* Shared rating display */
function normalizeRating(value) {
  const rating = Number(value);
  return Number.isFinite(rating)
    ? Math.min(5, Math.max(0, rating))
    : 0;
}

export function Stars({ value = 0, size = 16 }) {
  const rating = normalizeRating(value);

  return (
    <span
      className="dairy-stars"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((number) => {
        const filled = number <= Math.round(rating);

        return (
          <Star
            key={number}
            size={size}
            className={filled ? "on" : "off"}
            fill={filled ? "currentColor" : "none"}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}

/* Interactive rating selector */
export function StarPicker({ value = 0, onChange }) {
  const rating = normalizeRating(value);

  return (
    <span
      className="dairy-star-picker"
      role="radiogroup"
      aria-label="Your rating"
    >
      {[1, 2, 3, 4, 5].map((number) => (
        <button
          key={number}
          type="button"
          role="radio"
          aria-checked={rating === number}
          aria-label={`${number} star${number === 1 ? "" : "s"}`}
          onClick={() => onChange(number)}
          className={number <= rating ? "on" : ""}
        >
          <Star
            size={28}
            fill={number <= rating ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      ))}
    </span>
  );
}

/* Rating and review count */
export function RatingLine({ average = 0, count = 0 }) {
  const reviewCount = Math.max(0, Number(count) || 0);
  const rating = normalizeRating(average);

  if (reviewCount === 0) {
    return (
      <span className="dairy-rating-line dairy-rating-new">
        ⭐ New · no reviews yet
      </span>
    );
  }

  return (
    <span className="dairy-rating-line">
      <Stars value={rating} size={15} />
      <strong>{rating.toFixed(1)}</strong>
      <small>
        ({reviewCount} review{reviewCount === 1 ? "" : "s"})
      </small>
    </span>
  );
}
```
