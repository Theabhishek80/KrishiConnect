import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import api from "../../api";
import { errorText, rupees, useMyDairyStore } from "./DairyShared";
import "./dairy-marketplace.css";
import "./dairy-store.css";

const ORDER_FLOW = ["CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERED"];
const label = (s) => s.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default function DairyOrders() {
  const { user, store, loading: storeLoading } = useMyDairyStore();
  const [tab, setTab] = useState("orders");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tabs = [
    { key: "orders", text: "My orders", url: "/dairy/orders/mine", owner: false },
    { key: "subs", text: "My subscriptions", url: "/dairy/subscriptions/mine", owner: false },
    ...(store
      ? [
          { key: "store-orders", text: "Store orders", url: "/dairy/orders/store", owner: true },
          { key: "store-subs", text: "Store subscribers", url: "/dairy/subscriptions/store", owner: true },
        ]
      : []),
  ];
  const current = tabs.find((t) => t.key === tab) || tabs[0];
  const isSubs = current.key.endsWith("subs");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get(current.url);
      setRows(data);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [user, current.url]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(row, status) {
    try {
      const base = isSubs ? "subscriptions" : "orders";
      await api.patch(`/dairy/${base}/${row.id}/status`, { status });
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  }

  if (!user) {
    return (
      <div className="dairy-page">
        <div className="dairy-empty-state">
          <h3>Sign in to see your dairy orders</h3>
          <Link to="/login" className="dairy-primary-button">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dairy-page">
      <div className="dairy-topbar">
        <Link to="/dairy" className="dairy-back-link"><ArrowLeft size={17} /> Dairy stores</Link>
      </div>

      <h1 className="dairy-orders-title">Dairy orders</h1>

      <div className="dairy-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={current.key === t.key}
            className={current.key === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.text}
          </button>
        ))}
        {storeLoading && <span className="dairy-muted-text">…</span>}
      </div>

      {error && <div className="dairy-form-message" role="alert">{error}</div>}

      {loading ? (
        <p className="dairy-muted-text">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="dairy-empty-state"><h3>Nothing here yet</h3></div>
      ) : (
        <ul className="dairy-order-list">
          {rows.map((r) => (
            <li key={r.id} className="dairy-order-card">
              <div className="dairy-order-top">
                <strong>{r.productName}</strong>
                <span className={`dairy-status dairy-status-${r.status.toLowerCase()}`}>{label(r.status)}</span>
              </div>

              <p className="dairy-order-line">
                {isSubs ? (
                  <>
                    {Number(r.quantityPerDay)} {r.unit}/day · <strong>{rupees(r.monthlyPrice)}</strong>/month · starts {r.startDate}
                  </>
                ) : (
                  <>
                    {Number(r.quantity)} {r.unit} × {rupees(r.unitPrice)} = <strong>{rupees(r.totalAmount)}</strong> · {r.paymentMethod === "COD" ? "Cash on delivery" : r.paymentMethod}
                  </>
                )}
              </p>

              <p className="dairy-order-sub">
                {current.owner ? (
                  <>Customer: {r.consumerName} · {r.phone}</>
                ) : (
                  <>Store: <Link to={`/dairy/stores/${r.storeId}`}>{r.storeName}</Link></>
                )}
                <br />Deliver to: {r.deliveryAddress}
                {r.note && <><br />Note: {r.note}</>}
                <br /><small>{new Date(r.createdAt).toLocaleString("en-IN")}</small>
              </p>

              <div className="dairy-order-actions">
                {current.owner && !isSubs && !["DELIVERED", "CANCELLED"].includes(r.status) && (
                  <>
                    {ORDER_FLOW.filter((s) => s !== r.status).map((s) => (
                      <button key={s} type="button" className="dairy-secondary-button dairy-small-button"
                        onClick={() => setStatus(r, s)}>Mark {label(s)}</button>
                    ))}
                    <button type="button" className="dairy-danger-button" onClick={() => setStatus(r, "CANCELLED")}>Cancel</button>
                  </>
                )}

                {current.owner && isSubs && r.status !== "CANCELLED" && (
                  <>
                    {r.status !== "ACTIVE" && (
                      <button type="button" className="dairy-primary-button dairy-small-button" onClick={() => setStatus(r, "ACTIVE")}>
                        {r.status === "PENDING" ? "Accept" : "Resume"}
                      </button>
                    )}
                    {r.status === "ACTIVE" && (
                      <button type="button" className="dairy-secondary-button dairy-small-button" onClick={() => setStatus(r, "PAUSED")}>Pause</button>
                    )}
                    <button type="button" className="dairy-danger-button" onClick={() => setStatus(r, "CANCELLED")}>Cancel</button>
                  </>
                )}

                {!current.owner && !isSubs && r.status === "PLACED" && (
                  <button type="button" className="dairy-danger-button" onClick={() => setStatus(r, "CANCELLED")}>Cancel order</button>
                )}
                {!current.owner && isSubs && r.status !== "CANCELLED" && (
                  <button type="button" className="dairy-danger-button" onClick={() => setStatus(r, "CANCELLED")}>Cancel subscription</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
