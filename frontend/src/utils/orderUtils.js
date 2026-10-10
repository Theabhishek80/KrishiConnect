/* Small helpers shared by the Orders, Checkout, Addresses and Notification UIs. */

export const STATUS_META = {
  PLACED: { label: "Order placed", tone: "info" },
  CONFIRMED: { label: "Confirmed", tone: "info" },
  PROCESSING: { label: "Being prepared", tone: "warn" },
  READY_FOR_DISPATCH: { label: "Ready for dispatch", tone: "warn" },
  SHIPPED: { label: "Shipped", tone: "ship" },
  DELIVERED: { label: "Delivered", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "bad" }
};

/** Steps shown in the tracking timeline (cancelled orders are shown separately). */
export const TIMELINE = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_DISPATCH",
  "SHIPPED",
  "DELIVERED"
];

/** Button text a farmer sees to move an order to the given status. */
export const FARMER_ACTION_LABEL = {
  CONFIRMED: "Confirm order",
  PROCESSING: "Start preparing",
  READY_FOR_DISPATCH: "Mark ready for dispatch",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered"
};

export const PAYMENT_LABEL = {
  COD: "Cash on delivery"
};

export const PAYMENT_STATUS_LABEL = {
  PENDING: "Pay on delivery",
  PROCESSING: "Processing",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded"
};

export function statusMeta(status) {
  return STATUS_META[status] || { label: status || "Unknown", tone: "info" };
}

export function isActiveOrder(order) {
  return order.status !== "DELIVERED" && order.status !== "CANCELLED";
}

export function formatINR(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return "₹0";

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: number % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2
  })}`;
}

/** Accepts "2026-10-13" (a plain date) or a full ISO timestamp. */
export function formatDate(value) {
  if (!value) return "—";

  let date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function timeAgo(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return formatDate(value);
}

export function errorMessage(error, fallback) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    fallback
  );
}

export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("kc_user") || "null");
  } catch {
    return null;
  }
}
