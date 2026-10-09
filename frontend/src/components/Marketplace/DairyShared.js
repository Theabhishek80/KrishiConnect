import React, { useCallback, useEffect, useState } from "react";
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
  CATEGORIES.find((category) => category.value === value) ??
  CATEGORIES[CATEGORIES.length - 1];

/* Currency formatter */
export const rupees = (amount) => {
  const parsed = Number(amount ?? 0);
  const safeAmount = Number.isFinite(parsed) ? parsed : 0;

  return (
    "₹" +
    safeAmount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })
  );
};

/* Listing date labels */
export function daysListedLabel(days) {
  if (days === undefined || days === null || days === "") return "";

  const value = Number(days);
  if (!Number.isFinite(value)) return "";
  if (value <= 0) return "Listed today";
  if (value === 1) return "Listed 1 day ago";

  return `Listed ${value} days ago`;
}

/* API error messages */
export function errorText(
  error,
  fallback = "Something went wrong. Please try again."
) {
  if (!error?.response) {
    return "Can't reach the server. Check your connection.";
  }

  const data = error.response.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.message === "string") return data.message;
  if (error.response.status === 401) return "Please sign in to continue.";
  if (error.response.status === 403) {
    return "You don't have permission to perform this action.";
  }
  if (error.response.status === 404) {
    return "The requested dairy resource could not be found.";
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
      const response = await api.get("/dairy/stores/mine");
      const data = response?.data;

      setStore(Array.isArray(data) ? data[0] ?? null : data ?? null);
    } catch (error) {
      console.error("Failed to load dairy store:", error);
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

/* Shopper location storage */
const LOCATION_KEY = "kc_dairy_location";

export function loadLocation() {
  try {
    if (typeof window === "undefined") return null;

    const stored = window.localStorage.getItem(LOCATION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveLocation(location) {
  try {
    if (typeof window === "undefined") return;

    if (location) {
      window.localStorage.setItem(
        LOCATION_KEY,
        JSON.stringify(location)
      );
    } else {
      window.localStorage.removeItem(LOCATION_KEY);
    }
  } catch {
    // Ignore unavailable browser storage.
  }
}

/* Browser GPS */
export function detectPosition() {
  return new Promise((resolve, reject) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
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
        const message =
          error.code === 1
            ? "Location permission was declined. Please type your city or PIN code."
            : error.code === 3
              ? "Location detection timed out. Please type your city or PIN code."
              : "Couldn't detect your location. Please type your city or PIN code.";

        reject(new Error(message));
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
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return {};
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      "https://nominatim.openstreetmap.org/reverse" +
        `?format=jsonv2&addressdetails=1&zoom=14&lat=${lat}&lon=${lon}`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) return {};

    const address = (await response.json())?.address ?? {};

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

/* Rating helpers */
function normalizeRating(value) {
  const number = Number(value ?? 0);

  return Number.isFinite(number)
    ? Math.min(5, Math.max(0, number))
    : 0;
}

/* Star display: no JSX, compatible with a .js file */
export function Stars({ value = 0, size = 16 }) {
  const rating = normalizeRating(value);
  const starSize = Number.isFinite(Number(size))
    ? Math.max(8, Math.min(48, Number(size)))
    : 16;

  return React.createElement(
    "span",
    {
      className: "dairy-stars",
      role: "img",
      "aria-label": `${rating} out of 5 stars`,
    },
    [1, 2, 3, 4, 5].map((number) =>
      React.createElement(Star, {
        key: number,
        size: starSize,
        className: number <= Math.round(rating) ? "on" : "off",
        fill: number <= Math.round(rating) ? "currentColor" : "none",
        "aria-hidden": true,
      })
    )
  );
}

/* Interactive star picker */
export function StarPicker({ value = 0, onChange }) {
  const rating = normalizeRating(value);

  return React.createElement(
    "span",
    {
      className: "dairy-star-picker",
      role: "radiogroup",
      "aria-label": "Your rating",
    },
    [1, 2, 3, 4, 5].map((number) =>
      React.createElement(
        "button",
        {
          key: number,
          type: "button",
          role: "radio",
          "aria-checked": rating === number,
          "aria-label": `${number} star${number === 1 ? "" : "s"}`,
          onClick: () => onChange?.(number),
          className: number <= rating ? "on" : "",
        },
        React.createElement(Star, {
          size: 28,
          fill: number <= rating ? "currentColor" : "none",
          "aria-hidden": true,
        })
      )
    )
  );
}

/* Rating summary */
export function RatingLine({ average = 0, count = 0 }) {
  const rating = normalizeRating(average);
  const reviewCount = Math.max(0, Number(count) || 0);

  if (reviewCount === 0) {
    return React.createElement(
      "span",
      { className: "dairy-rating-line dairy-rating-new" },
      "⭐ New · no reviews yet"
    );
  }

  return React.createElement(
    "span",
    { className: "dairy-rating-line" },
    React.createElement(Stars, { value: rating, size: 15 }),
    React.createElement("strong", null, rating.toFixed(1)),
    React.createElement(
      "small",
      null,
      `(${reviewCount} review${reviewCount === 1 ? "" : "s"})`
    )
  );
}
