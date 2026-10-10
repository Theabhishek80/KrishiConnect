import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ImageOff,
  Loader2,
  PackageSearch,
  Search
} from "lucide-react";

import api from "../../api";
import {
  currentUser,
  errorMessage,
  formatDate,
  formatINR,
  isActiveOrder,
  statusMeta
} from "../../utils/orderUtils";
import "../../styles/account.css";

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" }
];

export default function OrdersPage() {
  const user = currentUser();
  const location = useLocation();

  const isFarmer = user?.role === "FARMER";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const justPlaced = location.state?.placed === true;

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const load = async () => {
      try {
        setError("");

        const { data } = await api.get(isFarmer ? "/orders/farmer" : "/orders/mine");

        if (!cancelled) setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load your orders."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFarmer]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter(order => {
      if (tab === "active" && !isActiveOrder(order)) return false;
      if (tab === "delivered" && order.status !== "DELIVERED") return false;
      if (tab === "cancelled" && order.status !== "CANCELLED") return false;

      if (!query) return true;

      const text = [
        order.orderNumber,
        order.consumer?.name,
        order.farmer?.name,
        ...(order.items || []).map(item => item.productName)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [orders, tab, search]);

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") {
    return (
      <section className="ac-page">
        <div className="ac-state">
          <PackageSearch size={36} />
          <h3>Orders are for customers and farmers</h3>
          <p>Admins can see order totals on the admin overview.</p>
          <Link className="ac-btn primary" to="/admin">Go to admin</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ac-page">
      <div className="ac-head">
        <div>
          <span className="ac-kicker">{isFarmer ? "ORDERS RECEIVED" : "YOUR PURCHASES"}</span>
          <h1>{isFarmer ? "Orders from customers" : "My orders"}</h1>
          <p>
            {isFarmer
              ? "Confirm, prepare and ship the orders customers place with you."
              : "Track your orders, delivery dates and delivery addresses."}
          </p>
        </div>
      </div>

      {justPlaced && (
        <div className="ac-alert success">
          <CheckCircle2 size={18} />
          <span>Your order has been placed. The farmer has been notified.</span>
        </div>
      )}

      {error && <div className="ac-alert error">{error}</div>}

      {loading ? (
        <div className="ac-state">
          <Loader2 size={30} className="ac-spin" />
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="ac-state">
          <PackageSearch size={40} />
          <h3>{isFarmer ? "No orders yet" : "You haven't ordered anything yet"}</h3>
          <p>
            {isFarmer
              ? "When a customer orders your products, it will show up here."
              : "Fresh produce straight from farmers is a few taps away."}
          </p>
          {!isFarmer && (
            <Link className="ac-btn primary" to="/">Start shopping</Link>
          )}
        </div>
      ) : (
        <>
          <div className="ac-toolbar">
            <div className="ac-tabs">
              {TABS.map(item => (
                <button
                  key={item.key}
                  type="button"
                  className={`ac-tab ${tab === item.key ? "active" : ""}`}
                  onClick={() => setTab(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="ac-search">
              <Search size={16} />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search order or product"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="ac-state">
              <PackageSearch size={34} />
              <h3>No orders match</h3>
              <p>Try another filter or search word.</p>
            </div>
          ) : (
            visible.map(order => (
              <OrderCard key={order.id} order={order} isFarmer={isFarmer} />
            ))
          )}
        </>
      )}
    </section>
  );
}

function OrderCard({ order, isFarmer }) {
  const meta = statusMeta(order.status);
  const items = order.items || [];
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;
  const needsAction = isFarmer && order.status === "PLACED";

  const summary =
    items.length === 0
      ? "Order details"
      : items.length === 1
        ? items[0].productName
        : `${items[0].productName} + ${items.length - 1} more`;

  let dateLine;

  if (order.status === "DELIVERED") {
    dateLine = `Delivered on ${formatDate(order.deliveredAt)}`;
  } else if (order.status === "CANCELLED") {
    dateLine = `Cancelled on ${formatDate(order.cancelledAt)}`;
  } else {
    dateLine = `Expected by ${formatDate(order.expectedDeliveryDate)}`;
  }

  return (
    <Link
      to={`/orders/${order.id}`}
      className={`ac-order ${needsAction ? "needs-action" : ""}`}
    >
      <div className="ac-order-top">
        <div>
          <div className="ac-order-no">{order.orderNumber}</div>
          <div className="ac-order-meta">
            Placed on {formatDate(order.createdAt)}
            {isFarmer
              ? ` • Customer: ${order.consumer?.name || "—"}`
              : ` • Sold by ${order.farmer?.name || "—"}`}
          </div>
        </div>

        <span className={`ac-badge ${needsAction ? "warn" : meta.tone}`}>
          {needsAction ? "Needs your confirmation" : meta.label}
        </span>
      </div>

      <div className="ac-order-body">
        <div className="ac-thumbs">
          {shown.map(item =>
            item.image ? (
              <img key={item.id} className="ac-thumb" src={item.image} alt="" loading="lazy" />
            ) : (
              <span key={item.id} className="ac-thumb"><ImageOff size={18} /></span>
            )
          )}
          {extra > 0 && <span className="ac-thumb more">+{extra}</span>}
        </div>

        <div className="ac-order-items">
          {summary}
          <small>
            {items.reduce((sum, item) => sum + item.quantity, 0)} item
            {items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "" : "s"}
          </small>
        </div>

        <div className="ac-order-side">
          <div className="ac-order-total">{formatINR(order.totalAmount)}</div>
          <div className="ac-order-eta">
            <CalendarDays size={13} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            {dateLine}
          </div>
        </div>
      </div>
    </Link>
  );
}
