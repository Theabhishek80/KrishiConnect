import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Briefcase,
  Home,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";

import api from "../../api";
import AddressForm from "./AddressForm";
import { currentUser, errorMessage } from "../../utils/orderUtils";
import "../../styles/account.css";

function LabelIcon({ label }) {
  if (label === "Home") return <Home size={16} />;
  if (label === "Work") return <Briefcase size={16} />;
  return <MapPin size={16} />;
}

export default function SavedAddresses() {
  const user = currentUser();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      setError("");

      const { data } = await api.get("/addresses");

      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, "Could not load your addresses."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = address => {
    setEditing(address);
    setFormOpen(true);
  };

  const save = async payload => {
    try {
      if (editing) {
        await api.put(`/addresses/${editing.id}`, payload);
      } else {
        await api.post("/addresses", payload);
      }
    } catch (err) {
      throw new Error(errorMessage(err, "Could not save the address."));
    }

    setFormOpen(false);
    setEditing(null);
    await load();
  };

  const makeDefault = async address => {
    setBusyId(address.id);

    try {
      await api.patch(`/addresses/${address.id}/default`);
      await load();
    } catch (err) {
      setError(errorMessage(err, "Could not change the default address."));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const address = deleting;

    setBusyId(address.id);

    try {
      await api.delete(`/addresses/${address.id}`);
      setDeleting(null);
      await load();
    } catch (err) {
      setDeleting(null);
      setError(errorMessage(err, "Could not delete the address."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="ac-page">
      <div className="ac-head">
        <div>
          <span className="ac-kicker">DELIVERY</span>
          <h1>Saved addresses</h1>
          <p>Choose one of these at checkout. Old orders keep the address they were placed with.</p>
        </div>

        <button type="button" className="ac-btn primary" onClick={openAdd}>
          <Plus size={17} /> Add address
        </button>
      </div>

      {error && <div className="ac-alert error">{error}</div>}

      {loading ? (
        <div className="ac-state">
          <Loader2 size={30} className="ac-spin" />
          <p>Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="ac-state">
          <MapPin size={40} />
          <h3>No saved addresses yet</h3>
          <p>Add your delivery address once and checkout becomes a single tap.</p>
          <button type="button" className="ac-btn primary" onClick={openAdd}>
            <Plus size={17} /> Add your first address
          </button>
        </div>
      ) : (
        <div className="ac-addr-grid">
          {addresses.map(address => (
            <div
              key={address.id}
              className={`ac-addr-card ${address.defaultAddress ? "is-default" : ""}`}
            >
              <div className="ac-addr-top">
                <span className="ac-addr-label">
                  <LabelIcon label={address.label} /> {address.label}
                </span>

                {address.defaultAddress && <span className="ac-badge default">Default</span>}
              </div>

              <div className="ac-addr">
                <strong>{address.recipientName}</strong>
                <div>
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </div>
                <div>
                  {address.city}, {address.state} - {address.postalCode}
                </div>
                <div>Phone: {address.phone}</div>
              </div>

              <div className="ac-addr-actions">
                <button type="button" className="ac-btn small" onClick={() => openEdit(address)}>
                  <Pencil size={14} /> Edit
                </button>

                {!address.defaultAddress && (
                  <button
                    type="button"
                    className="ac-btn small"
                    disabled={busyId === address.id}
                    onClick={() => makeDefault(address)}
                  >
                    Set as default
                  </button>
                )}

                <button
                  type="button"
                  className="ac-btn small danger"
                  disabled={busyId === address.id}
                  onClick={() => setDeleting(address)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && addresses.length > 0 && (
        <p style={{ marginTop: 22, color: "var(--muted)", fontSize: ".86rem" }}>
          Looking for a past order's delivery address? Open it from{" "}
          <Link to="/orders" style={{ color: "var(--green)", fontWeight: 700 }}>My orders</Link>.
        </p>
      )}

      {formOpen && (
        <AddressForm
          initial={editing}
          defaults={{ recipientName: user.name || "", phone: user.phone || "" }}
          onSave={save}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <div className="ac-overlay" onClick={() => setDeleting(null)}>
          <div className="ac-modal small" onClick={event => event.stopPropagation()}>
            <div className="ac-modal-icon"><Trash2 size={22} /></div>
            <h3>Delete this address?</h3>
            <p>
              {deleting.label} — {deleting.line1}, {deleting.city}. Your past orders are not affected.
            </p>

            <div className="ac-modal-actions">
              <button type="button" className="ac-btn" onClick={() => setDeleting(null)}>
                Keep it
              </button>

              <button
                type="button"
                className="ac-btn danger-solid"
                disabled={busyId === deleting.id}
                onClick={confirmDelete}
              >
                {busyId === deleting.id ? <Loader2 size={16} className="ac-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
