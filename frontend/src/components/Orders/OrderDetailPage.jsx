import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ImageOff,
  Loader2,
  MapPin,
  PackageSearch,
  Receipt,
  Truck,
  User,
  XCircle
} from "lucide-react";

import api from "../../api";
import {
  FARMER_ACTION_LABEL,
  PAYMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  TIMELINE,
  currentUser,
  errorMessage,
  formatDate,
  formatDateTime,
  formatINR,
  statusMeta
} from "../../utils/orderUtils";
import "../../styles/account.css";

export default function OrderDetailPage() {
  const { id } = useParams();
  const user = currentUser();
  const isFarmer = user?.role === "FARMER";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(`/orders/${id}`);

        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) {
          setOrder(null);
          setError(
            err.response?.status === 404 || err.response?.status === 403
              ? "We couldn't find this order."
              : errorMessage(err, "Could not load this order.")
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!user) return <Navigate to="/login" replace />;

  const run = async (request, successText) => {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const { data } = await request();

      setOrder(data);
      setNotice(successText);
      setConfirmCancel(false);
      setNewDate("");
    } catch (err) {
      setError(errorMessage(err, "Something went wrong. Please try again."));
      setConfirmCancel(false);
    } finally {
      setBusy(false);
    }
  };

  const cancelAsCustomer = () =>
    run(() => api.patch(`/orders/${id}/cancel`), "The order has been cancelled.");

  const setStatus = (status, text) =>
    run(() => api.patch(`/orders/${id}/status`, { status }), text);

  const saveDate = () =>
    run(
      () =>
        api.patch(`/orders/${id}/status`, {
          status: order.status,
          expectedDeliveryDate: newDate
        }),
      "Expected delivery date updated."
    );

  if (loading) {
    return (
      <section className="ac-page">
        <div className="ac-state">
          <Loader2 size={30} className="ac-spin" />
          <p>Loading order...</p>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="ac-page">
        <div className="ac-state">
          <PackageSearch size={40} />
          <h3>{error || "Order not found"}</h3>
          <Link className="ac-btn primary" to="/orders">Back to orders</Link>
        </div>
      </section>
    );
  }

  const meta = statusMeta(order.status);
  const cancelled = order.status === "CANCELLED";
  const currentIndex = TIMELINE.indexOf(order.status);
  const items = order.items || [];
  const nextForward = (order.nextStatuses || []).find(s => s !== "CANCELLED");
  const farmerCanCancel = (order.nextStatuses || []).includes("CANCELLED");
  const finished = order.status === "DELIVERED" || cancelled;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="ac-page">
      <Link to="/orders" className="ac-back">
        <ArrowLeft size={16} /> {isFarmer ? "All received orders" : "All orders"}
      </Link>

      <div className="ac-head">
        <div>
          <span className="ac-kicker">ORDER</span>
          <h1>{order.orderNumber}</h1>
          <p>Placed on {formatDateTime(order.createdAt)}</p>
        </div>

        <span className={`ac-badge ${meta.tone}`}>{meta.label}</span>
      </div>

      {notice && (
        <div className="ac-alert success">
          <CheckCircle2 size={18} /> <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="ac-alert error">
          <AlertTriangle size={18} /> <span>{error}</span>
        </div>
      )}

      <div className="ac-detail-grid">
        {/* ---------------- LEFT ---------------- */}
        <div className="ac-col">
          <div className="ac-card">
            <h2><Truck size={18} /> Order status</h2>

            {cancelled ? (
              <div className="ac-cancelled">
                <XCircle size={22} />
                <div>
                  <strong>This order was cancelled</strong>
                  <div>on {formatDateTime(order.cancelledAt)}. Stock has been returned to the farmer.</div>
                </div>
              </div>
            ) : (
              <ol className="ac-timeline">
                {TIMELINE.map((step, index) => {
                  const done = index <= currentIndex;
                  const current = index === currentIndex;

                  return (
                    <li
                      key={step}
                      className={`ac-step ${done ? "done" : ""} ${current ? "current" : ""} ${
                        current && index < TIMELINE.length - 1 ? "cut" : ""
                      }`}
                    >
                      {statusMeta(step).label}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="ac-card">
            <h2><Receipt size={18} /> Items ({items.length})</h2>

            {items.map(item => (
              <div className="ac-line" key={item.id}>
                {item.image ? (
                  <img src={item.image} alt={item.productName} loading="lazy" />
                ) : (
                  <span className="ac-noimg"><ImageOff size={22} /></span>
                )}

                <div className="ac-line-info">
                  <strong>{item.productName}</strong>
                  <span>
                    {formatINR(item.unitPrice)}
                    {item.unit ? ` / ${item.unit}` : ""} × {item.quantity}
                  </span>
                </div>

                <div className="ac-line-total">{formatINR(item.lineTotal)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- RIGHT ---------------- */}
        <div className="ac-col">
          <div className="ac-card">
            <h2><CalendarDays size={18} /> Delivery</h2>

            <div className="ac-eta">
              <CalendarDays size={22} />
              <div>
                <small>
                  {order.status === "DELIVERED"
                    ? "Delivered on"
                    : cancelled
                      ? "Was expected by"
                      : "Expected delivery by"}
                </small>
                <strong>
                  {order.status === "DELIVERED"
                    ? formatDate(order.deliveredAt)
                    : formatDate(order.expectedDeliveryDate)}
                </strong>
              </div>
            </div>

            <div className="ac-addr">
              <strong><MapPin size={14} style={{ verticalAlign: "-2px" }} /> Delivery address</strong>
              <div>{order.shippingName}</div>
              <div>{order.shippingAddress}</div>
              {order.shippingPhone && <div>Phone: {order.shippingPhone}</div>}
            </div>
          </div>

          <div className="ac-card">
            <h2><User size={18} /> {isFarmer ? "Customer" : "Sold by"}</h2>
            <div className="ac-addr">
              <strong>{isFarmer ? order.consumer?.name : order.farmer?.name}</strong>
            </div>
          </div>

          <div className="ac-card">
            <h2><Receipt size={18} /> Payment</h2>

            <div className="ac-kv">
              <div>
                <span>Items total</span>
                <strong>{formatINR(order.totalAmount)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <strong>Free</strong>
              </div>
              <div>
                <span>Method</span>
                <strong>{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</strong>
              </div>
              <div>
                <span>Payment status</span>
                <strong>{PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus}</strong>
              </div>
              <div className="total">
                <span>Order total</span>
                <strong>{formatINR(order.totalAmount)}</strong>
              </div>
            </div>
          </div>

          {/* ---------- customer: cancel ---------- */}
          {!isFarmer && order.cancellable && (
            <div className="ac-card">
              <h2>Need to change something?</h2>
              <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: ".88rem" }}>
                You can cancel until the farmer starts preparing your order.
              </p>
              <button
                type="button"
                className="ac-btn danger"
                disabled={busy}
                onClick={() => setConfirmCancel(true)}
              >
                Cancel order
              </button>
            </div>
          )}

          {/* ---------- farmer: manage ---------- */}
          {isFarmer && !finished && (
            <div className="ac-card">
              <h2>Manage this order</h2>

              <div className="ac-actions">
                {nextForward && (
                  <button
                    type="button"
                    className="ac-btn primary"
                    disabled={busy}
                    onClick={() =>
                      setStatus(
                        nextForward,
                        `Order marked as ${statusMeta(nextForward).label.toLowerCase()}. The customer was notified.`
                      )
                    }
                  >
                    {busy ? <Loader2 size={16} className="ac-spin" /> : null}
                    {FARMER_ACTION_LABEL[nextForward] || statusMeta(nextForward).label}
                  </button>
                )}

                <label className="ac-field-inline">
                  Change expected delivery date
                  <input
                    type="date"
                    min={today}
                    value={newDate}
                    onChange={event => setNewDate(event.target.value)}
                  />
                </label>

                <button
                  type="button"
                  className="ac-btn"
                  disabled={busy || !newDate}
                  onClick={saveDate}
                >
                  Save delivery date
                </button>

                {farmerCanCancel && (
                  <button
                    type="button"
                    className="ac-btn danger"
                    disabled={busy}
                    onClick={() => setConfirmCancel(true)}
                  >
                    Cancel order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {confirmCancel && (
        <div className="ac-overlay" onClick={() => !busy && setConfirmCancel(false)}>
          <div className="ac-modal small" onClick={event => event.stopPropagation()}>
            <div className="ac-modal-icon"><XCircle size={24} /></div>
            <h3>Cancel order {order.orderNumber}?</h3>
            <p>
              {isFarmer
                ? "The customer will be notified and the stock will be returned."
                : "The farmer will be notified. This can't be undone."}
            </p>

            <div className="ac-modal-actions">
              <button
                type="button"
                className="ac-btn"
                disabled={busy}
                onClick={() => setConfirmCancel(false)}
              >
                Keep order
              </button>

              <button
                type="button"
                className="ac-btn danger-solid"
                disabled={busy}
                onClick={() =>
                  isFarmer
                    ? setStatus("CANCELLED", "The order has been cancelled and the customer notified.")
                    : cancelAsCustomer()
                }
              >
                {busy ? <Loader2 size={16} className="ac-spin" /> : null}
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
