import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Banknote,
  CalendarDays,
  ImageOff,
  Loader2,
  MapPin,
  Plus,
  ShoppingBag
} from "lucide-react";

import api from "../../api";
import AddressForm from "../Addresses/AddressForm";
import { currentUser, errorMessage, formatINR } from "../../utils/orderUtils";
import "../../styles/account.css";

export default function Checkout() {
  const navigate = useNavigate();
  const user = currentUser();

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [cartResponse, addressResponse] = await Promise.all([
          api.get("/cart"),
          api.get("/addresses")
        ]);

        if (cancelled) return;

        const list = Array.isArray(addressResponse.data) ? addressResponse.data : [];

        setCart(cartResponse.data);
        setAddresses(list);
        setSelectedId((list.find(a => a.defaultAddress) || list[0])?.id ?? null);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load checkout."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = cart?.items || [];

  const total = useMemo(
    () =>
      cart?.total ??
      items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [cart, items]
  );

  if (!user) return <Navigate to="/login" replace />;

  if (user.role !== "CONSUMER") {
    return (
      <section className="ac-page narrow">
        <div className="ac-state">
          <ShoppingBag size={38} />
          <h3>Only customer accounts can place orders</h3>
          <Link className="ac-btn primary" to="/">Back to marketplace</Link>
        </div>
      </section>
    );
  }

  const saveAddress = async payload => {
    try {
      const { data } = await api.post("/addresses", payload);
      const { data: list } = await api.get("/addresses");

      setAddresses(Array.isArray(list) ? list : []);
      setSelectedId(data.id);
    } catch (err) {
      throw new Error(errorMessage(err, "Could not save the address."));
    }

    setFormOpen(false);
  };

  const placeOrder = async () => {
    if (!selectedId) {
      setError("Please choose or add a delivery address.");
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const { data } = await api.post("/orders/checkout", {
        addressId: selectedId,
        paymentMethod: "COD"
      });

      const placed = Array.isArray(data) ? data : [];

      if (placed.length === 1) {
        navigate(`/orders/${placed[0].id}`, { state: { placed: true } });
      } else {
        navigate("/orders", { state: { placed: true } });
      }
    } catch (err) {
      setError(errorMessage(err, "Could not place your order. Please try again."));
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <section className="ac-page">
        <div className="ac-state">
          <Loader2 size={30} className="ac-spin" />
          <p>Preparing checkout...</p>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="ac-page narrow">
        <div className="ac-state">
          <ShoppingBag size={40} />
          <h3>Your cart is empty</h3>
          <p>Add some fresh products before checking out.</p>
          <Link className="ac-btn primary" to="/">Start shopping</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="ac-page">
      <div className="ac-head">
        <div>
          <span className="ac-kicker">ALMOST THERE</span>
          <h1>Checkout</h1>
          <p>Choose where to deliver and review your order.</p>
        </div>

        <Link className="ac-btn" to="/cart">Back to cart</Link>
      </div>

      {error && <div className="ac-alert error">{error}</div>}

      <div className="ac-checkout">
        <div>
          <div className="ac-card">
            <h2><MapPin size={18} /> Delivery address</h2>

            {addresses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <p style={{ color: "var(--muted)", marginTop: 0 }}>
                  You haven't saved an address yet.
                </p>
                <button type="button" className="ac-btn primary" onClick={() => setFormOpen(true)}>
                  <Plus size={16} /> Add delivery address
                </button>
              </div>
            ) : (
              <>
                <div className="ac-pick">
                  {addresses.map(address => (
                    <label
                      key={address.id}
                      className={`ac-pick-item ${selectedId === address.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedId === address.id}
                        onChange={() => setSelectedId(address.id)}
                      />

                      <div className="ac-addr">
                        <strong>{address.recipientName}</strong>{" "}
                        <span className="ac-badge default" style={{ marginLeft: 6 }}>
                          {address.label}
                        </span>
                        <div>
                          {address.line1}
                          {address.line2 ? `, ${address.line2}` : ""}, {address.city},{" "}
                          {address.state} - {address.postalCode}
                        </div>
                        <div>Phone: {address.phone}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  className="ac-btn small"
                  style={{ marginTop: 12 }}
                  onClick={() => setFormOpen(true)}
                >
                  <Plus size={15} /> Add a new address
                </button>
              </>
            )}
          </div>

          <div className="ac-card">
            <h2><Banknote size={18} /> Payment</h2>

            <div className="ac-pay">
              <Banknote size={22} />
              <div>
                <strong>Cash on delivery</strong>
                <small>Pay the farmer when your order arrives. Online payment is coming soon.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="ac-card ac-summary">
          <h2>Order summary</h2>

          {items.map(item => (
            <div className="ac-line" key={item.id}>
              {item.product?.images?.[0] ? (
                <img src={item.product.images[0]} alt="" loading="lazy" />
              ) : (
                <span className="ac-noimg"><ImageOff size={20} /></span>
              )}

              <div className="ac-line-info">
                <strong>{item.product?.name}</strong>
                <span>
                  {formatINR(item.product?.price)}
                  {item.product?.unit ? ` / ${item.product.unit}` : ""} × {item.quantity}
                </span>
              </div>

              <div className="ac-line-total">{formatINR(item.subtotal)}</div>
            </div>
          ))}

          <div className="ac-kv" style={{ marginTop: 16 }}>
            <div>
              <span>Items total</span>
              <strong>{formatINR(total)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>Free</strong>
            </div>
            <div className="total">
              <span>You pay</span>
              <strong>{formatINR(total)}</strong>
            </div>
          </div>

          <div className="ac-eta" style={{ marginTop: 16, marginBottom: 0 }}>
            <CalendarDays size={20} />
            <div>
              <small>Estimated delivery</small>
              <strong>Within 3 days</strong>
            </div>
          </div>

          <button
            type="button"
            className="ac-btn primary"
            style={{ width: "100%", marginTop: 16, minHeight: 48 }}
            disabled={placing || !selectedId}
            onClick={placeOrder}
          >
            {placing ? <Loader2 size={17} className="ac-spin" /> : null}
            {placing ? "Placing order..." : "Place order"}
          </button>

          <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: ".78rem", textAlign: "center" }}>
            If your cart has products from several farmers, each farmer gets a separate order.
          </p>
        </div>
      </div>

      {formOpen && (
        <AddressForm
          defaults={{ recipientName: user.name || "", phone: user.phone || "" }}
          forceDefault={addresses.length === 0}
          onSave={saveAddress}
          onClose={() => setFormOpen(false)}
        />
      )}
    </section>
  );
}
