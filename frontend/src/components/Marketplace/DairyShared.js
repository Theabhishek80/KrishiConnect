
import { useCallback, useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "../../api";
import { AUTH_EVENT, getStoredUser } from "../../utils/auth";

/* =========================================================
   PRODUCT CATEGORIES
========================================================= */

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

/* =========================================================
   CURRENCY FORMATTER
========================================================= */

export const rupees = (amount) => {
  const parsedAmount = Number(amount ?? 0);
  const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

  return (
    "₹" +
    safeAmount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })
  );
};

/* =========================================================
   LISTING DATE LABELS
========================================================= */

export function daysListedLabel(days) {
  if (days === undefined || days === null || days === "") {
    return "";
  }

  const numberOfDays = Number(days);

  if (!Number.isFinite(numberOfDays)) {
    return "";
  }

  if (numberOfDays <= 0) return "Listed today";
  if (numberOfDays === 1) return "Listed 1 day ago";

  return `Listed ${numberOfDays} days ago`;
}

/* =========================================================
   API ERROR MESSAGES
========================================================= */

export function errorText(
  error,
  fallback = "Something went wrong. Please try again."
) {
  if (!error?.response) {
    return "Can't reach the server. Check your connection.";
  }

  const data = error.response.data;

  if (typeof data?.error === "string") {
    return data.error;
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (error.response.status === 401) {
    return "Please sign in to continue.";
  }

  if (error.response.status === 403) {
    return "You don't have permission to perform this action.";
  }

  if (error.response.status === 404) {
    return "The requested dairy resource could not be found.";
  }

  return fallback;
}

/* =========================================================
   AUTHENTICATED USER
========================================================= */

export function useAuthUser() {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    const syncUser = () => {
      setUser(getStoredUser());
    };

    window.addEventListener(AUTH_EVENT, syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener(AUTH_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  return user;
}

/* =========================================================
   CURRENT USER'S DAIRY STORE
========================================================= */

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

      if (Array.isArray(data)) {
        setStore(data[0] ?? null);
      } else {
        setStore(data ?? null);
      }
    } catch (error) {
      console.error("Failed to load my dairy store:", error);
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    user,
    store,
    loading,
    reload,
  };
}

/* =========================================================
   SHOPPER LOCATION STORAGE
========================================================= */

const LOCATION_KEY = "kc_dairy_location";

export function loadLocation() {
  try {
    if (typeof window === "undefined") return null;

    const storedLocation = window.localStorage.getItem(LOCATION_KEY);

    if (!storedLocation) return null;

    return JSON.parse(storedLocation);
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
    // Storage can be disabled by the browser.
  }
}

/* =========================================================
   BROWSER GPS
========================================================= */

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

/* =========================================================
   REVERSE GEOCODING
   GPS coordinates -> city, state, PIN code and area
========================================================= */

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
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) return {};

    const result = await response.json();
    const address = result?.address ?? {};

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

/* =========================================================
   RATING HELPERS
========================================================= */

function normalizeRating(value) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(5, Math.max(0, numericValue));
}

/* =========================================================
   STAR DISPLAY
========================================================= */

export function Stars({ value = 0, size = 16 }) {
  const rating = normalizeRating(value);
  const starSize = Number.isFinite(Number(size))
    ? Math.max(8, Math.min(48, Number(size)))
    : 16;

  return (
    <span
      className="dairy-stars"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((number) => {
        const isActive = number <= Math.round(rating);

        return (
          <Star
            key={number}
            size={starSize}
            className={isActive ? "on" : "off"}
            fill={isActive ? "currentColor" : "none"}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}

/* =========================================================
   INTERACTIVE STAR PICKER
========================================================= */

export function StarPicker({ value = 0, onChange }) {
  const rating = normalizeRating(value);

  return (
    <span
      className="dairy-star-picker"
      role="radiogroup"
      aria-label="Your rating"
    >
      {[1, 2, 3, 4, 5].map((number) => {
        const isActive = number <= rating;

        return (
          <button
            key={number}
            type="button"
            role="radio"
            aria-checked={rating === number}
            aria-label={`${number} star${number === 1 ? "" : "s"}`}
            onClick={() => onChange?.(number)}
            className={isActive ? "on" : ""}
          >
            <Star
              size={28}
              fill={isActive ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </span>
  );
}

/* =========================================================
   RATING SUMMARY
========================================================= */

export function RatingLine({ average = 0, count = 0 }) {
  const rating = normalizeRating(average);
  const reviewCount = Math.max(0, Number(count) || 0);

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
