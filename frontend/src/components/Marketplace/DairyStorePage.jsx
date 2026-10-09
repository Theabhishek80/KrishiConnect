import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Repeat,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import api from "../../api";
import {
  CATEGORIES,
  RatingLine,
  StarPicker,
  Stars,
  categoryOf,
  daysListedLabel,
  errorText,
  rupees,
  useMyDairyStore,
} from "./DairyShared";
import "./dairy-marketplace.css";
import "./dairy-store.css";

const EMPTY_PRODUCT = {
  name: "",
  category: "MILK",
  description: "",
  price: "",
  unit: "litre",
  stockQuantity: "",
  available: true,
  subscriptionEnabled: false,
  subscriptionQuantityPerDay: "1",
  monthlySubscriptionPrice: "",
};

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function DairyStorePage() {
  const { id } = useParams();
  const routeState = useLocation().state;
  const { user, store: myStore } = useMyDairyStore();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState({ averageRating: 0, reviewCount: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [orderFor, setOrderFor] = useState(null);
  const [subscribeFor, setSubscribeFor] = useState(null);
  const [productForm, setProductForm] = useState(null); // null | {id?, ...fields}

  const isOwner = Boolean(myStore && store && myStore.id === store.id);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [s, p, r] = await Promise.all([
        api.get(`/dairy/stores/${id}`),
        api.get(`/dairy/stores/${id}/products`),
        api.get(`/dairy/stores/${id}/reviews`),
      ]);
      setStore(s.data);
      setProducts(p.data);
      setReviews(r.data);
    } catch (e) {
      setError(e.response?.status === 404 ? "This dairy store was not found." : errorText(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Owner sees every product (including hidden ones) so they can manage them.
  const loadOwnerProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/dairy/my-store/products");
      setProducts(data);
    } catch {
      /* keep public list */
    }
  }, []);

  useEffect(() => {
    if (isOwner) loadOwnerProducts();
  }, [isOwner, loadOwnerProducts]);

  const refreshAfterChange = async () => {
    if (isOwner) await loadOwnerProducts();
    else {
      const { data } = await api.get(`/dairy/stores/${id}/products`);
      setProducts(data);
    }
    const { data: s } = await api.get(`/dairy/stores/${id}`);
    setStore(s);
  };

  const needLogin = (action) => {
    if (user) return true;
    setNotice(`Please sign in to ${action}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return false;
  };

  async function removeProduct(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      await api.delete(`/dairy/products/${product.id}`);
      await refreshAfterChange();
    } catch (e) {
      setNotice(errorText(e));
    }
  }

  if (loading) {
    return (
      <div className="dairy-page">
        <div className="dairy-empty-state"><h3>Loading store…</h3></div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="dairy-page">
        <div className="dairy-topbar">
          <Link to="/dairy" className="dairy-back-link"><ArrowLeft size={17} /> All dairy stores</Link>
        </div>
        <div className="dairy-empty-state" role="alert">
          <h3>{error || "Store not found"}</h3>
          <Link to="/dairy" className="dairy-primary-button">Back to stores</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dairy-page">
      <div className="dairy-topbar">
        <Link to="/dairy" className="dairy-back-link"><ArrowLeft size={17} /> All dairy stores</Link>
        {user && (
          <Link to="/dairy/orders" className="dairy-secondary-button dairy-small-button">
            <ClipboardList size={16} /> {isOwner ? "Store orders" : "My orders"}
          </Link>
        )}
      </div>

      {routeState?.welcome && isOwner && (
        <div className="dairy-banner dairy-banner-success">
          <CheckCircle2 size={20} />
          <span>
            <strong>Your store is live!</strong> Add your first product below so customers can order.
          </span>
        </div>
      )}

      {notice && (
        <div className="dairy-banner" role="status">
          <span>
            {notice}{" "}
            {!user && <Link to="/login"><strong>Sign in</strong></Link>}
          </span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

      {/* ---------------- store header ---------------- */}
      <section className="dairy-store-hero">
        <div className="dairy-store-hero-icon">🏡</div>
        <div className="dairy-store-hero-main">
          <h1>{store.storeName}</h1>
          <RatingLine average={store.averageRating} count={store.reviewCount} />
          {store.description && <p className="dairy-store-about">{store.description}</p>}

          <ul className="dairy-store-facts">
            <li><MapPin size={15} /> {[store.addressLine, store.city, store.state, store.postalCode].filter(Boolean).join(", ")}</li>
            <li><Truck size={15} /> Delivers within {store.deliveryRadiusKm} km</li>
            <li><CalendarDays size={15} /> {daysListedLabel(store.daysListed)}</li>
            {store.operatingDays && <li><Clock3 size={15} /> {store.operatingDays}</li>}
            {store.phone && <li><Phone size={15} /> {store.phone}</li>}
          </ul>
        </div>
      </section>

      {/* ---------------- products ---------------- */}
      <section className="dairy-section">
        <div className="dairy-section-heading">
          <div>
            <span className="dairy-section-kicker">{isOwner ? "MANAGE YOUR PRODUCTS" : "PRODUCTS"}</span>
            <h2>{isOwner ? "Your products" : "What this store sells"}</h2>
          </div>
          {isOwner && (
            <button type="button" className="dairy-primary-button dairy-small-button"
              onClick={() => setProductForm({ ...EMPTY_PRODUCT })}>
              <Plus size={16} /> Add product
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="dairy-empty-state">
            <ShoppingBag size={32} />
            <h3>{isOwner ? "You haven't added any product yet" : "No products listed yet"}</h3>
            <p>{isOwner ? "Add milk, curd, ghee or paneer with price and stock." : "Check back soon."}</p>
          </div>
        ) : (
          <div className="dairy-product-grid dairy-product-grid-v2">
            {products.map((p) => {
              const cat = categoryOf(p.category);
              const soldOut = Number(p.stockQuantity) <= 0;
              return (
                <article className={`dairy-product-tile ${!p.available ? "is-hidden" : ""}`} key={p.id}>
                  <div className="dairy-product-tile-top">
                    <span className="dairy-product-emoji">{cat.emoji}</span>
                    <span className="dairy-chip">{cat.label}</span>
                    {!p.available && <span className="dairy-chip dairy-chip-muted">Hidden</span>}
                  </div>

                  <h3>{p.name}</h3>
                  {p.description && <p className="dairy-product-desc">{p.description}</p>}

                  <div className="dairy-product-price">
                    <strong>{rupees(p.price)}</strong>
                    <small>/ {p.unit}</small>
                  </div>
                  <small className={soldOut ? "dairy-stock-out" : "dairy-stock"}>
                    {soldOut ? "Out of stock" : `${Number(p.stockQuantity)} ${p.unit} available`}
                  </small>

                  {p.subscriptionEnabled && (
                    <div className="dairy-plan-line">
                      <Repeat size={14} />
                      {Number(p.subscriptionQuantityPerDay)} {p.unit}/day · <strong>{rupees(p.monthlySubscriptionPrice)}</strong>/month
                    </div>
                  )}

                  {isOwner ? (
                    <div className="dairy-tile-actions">
                      <button type="button" className="dairy-secondary-button dairy-small-button"
                        onClick={() => setProductForm({
                          id: p.id,
                          name: p.name,
                          category: p.category,
                          description: p.description || "",
                          price: String(p.price),
                          unit: p.unit,
                          stockQuantity: String(p.stockQuantity),
                          available: p.available,
                          subscriptionEnabled: p.subscriptionEnabled,
                          subscriptionQuantityPerDay: String(p.subscriptionQuantityPerDay ?? "1"),
                          monthlySubscriptionPrice: p.monthlySubscriptionPrice == null ? "" : String(p.monthlySubscriptionPrice),
                        })}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button type="button" className="dairy-danger-button" onClick={() => removeProduct(p)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ) : (
                    <div className="dairy-tile-actions">
                      <button type="button" className="dairy-primary-button dairy-small-button"
                        disabled={soldOut}
                        onClick={() => needLogin("place an order") && setOrderFor(p)}>
                        <ShoppingBag size={15} /> Order now
                      </button>
                      {p.subscriptionEnabled && (
                        <button type="button" className="dairy-secondary-button dairy-small-button"
                          onClick={() => needLogin("subscribe") && setSubscribeFor(p)}>
                          <Repeat size={15} /> Subscribe
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- reviews ---------------- */}
      <ReviewsSection
        storeId={store.id}
        data={reviews}
        isOwner={isOwner}
        user={user}
        onChange={async (data) => {
          setReviews(data);
          const { data: s } = await api.get(`/dairy/stores/${id}`);
          setStore(s);
        }}
        onNeedLogin={() => needLogin("write a review")}
      />

      {/* ---------------- modals ---------------- */}
      {orderFor && (
        <OrderModal
          product={orderFor}
          onClose={() => setOrderFor(null)}
          onDone={refreshAfterChange}
        />
      )}
      {subscribeFor && (
        <SubscribeModal
          product={subscribeFor}
          onClose={() => setSubscribeFor(null)}
        />
      )}
      {productForm && (
        <ProductModal
          initial={productForm}
          onClose={() => setProductForm(null)}
          onSaved={async () => {
            setProductForm(null);
            await refreshAfterChange();
          }}
        />
      )}
    </div>
  );
}

/* ================================================================
   Reviews of the whole store
================================================================ */
function ReviewsSection({ storeId, data, isOwner, user, onChange, onNeedLogin }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // If this user already reviewed, pre-fill so they can edit.
  useEffect(() => {
    const mine = data.reviews.find((r) => user && String(r.userId) === String(user.id));
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment || "");
    }
  }, [data.reviews, user]);

  async function submit(e) {
    e.preventDefault();
    if (!onNeedLogin()) return;
    if (!rating) {
      setMessage("Please choose a star rating.");
      return;
    }
    try {
      setBusy(true);
      setMessage("");
      const res = await api.post(`/dairy/stores/${storeId}/reviews`, { rating, comment });
      await onChange(res.data);
      setMessage("Thanks! Your review has been saved.");
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="dairy-section">
      <div className="dairy-section-heading">
        <div>
          <span className="dairy-section-kicker">REVIEWS</span>
          <h2>What customers say about this store</h2>
        </div>
        <div className="dairy-review-summary">
          <strong>{data.reviewCount ? data.averageRating.toFixed(1) : "—"}</strong>
          <Stars value={data.averageRating} />
          <small>{data.reviewCount} review{data.reviewCount === 1 ? "" : "s"}</small>
        </div>
      </div>

      {!isOwner && (
        <form className="dairy-review-form" onSubmit={submit}>
          <strong>Rate this store</strong>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Share your experience: freshness, delivery, service…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {message && <p className="dairy-inline-note" role="status">{message}</p>}
          <button type="submit" className="dairy-primary-button dairy-small-button" disabled={busy}>
            {busy ? "Saving…" : "Submit review"}
          </button>
        </form>
      )}

      {data.reviews.length === 0 ? (
        <p className="dairy-muted-text">No reviews yet.</p>
      ) : (
        <ul className="dairy-review-list">
          {data.reviews.map((r) => (
            <li key={r.id}>
              <div className="dairy-review-head">
                <strong>{r.userName || "Customer"}</strong>
                <Stars value={r.rating} size={14} />
                <small>{new Date(r.createdAt).toLocaleDateString("en-IN")}</small>
              </div>
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ================================================================
   Direct order
================================================================ */
function OrderModal({ product, onClose, onDone }) {
  const [quantity, setQuantity] = useState("1");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(null);

  const qty = Number(quantity);
  const total = Number.isFinite(qty) ? qty * Number(product.price) : 0;

  async function submit(e) {
    e.preventDefault();
    if (!(qty > 0)) return setError("Enter a valid quantity.");
    if (qty > Number(product.stockQuantity)) {
      return setError(`Only ${Number(product.stockQuantity)} ${product.unit} in stock.`);
    }
    try {
      setBusy(true);
      setError("");
      const { data } = await api.post("/dairy/orders", {
        productId: product.id,
        quantity: qty,
        deliveryAddress: address,
        phone,
        note,
      });
      setPlaced(data);
      onDone?.();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={placed ? "Order placed" : `Order ${product.name}`} onClose={onClose}>
      {placed ? (
        <div className="dairy-done">
          <CheckCircle2 size={42} />
          <h3>Thank you!</h3>
          <p>
            {Number(placed.quantity)} {placed.unit} of {placed.productName} · <strong>{rupees(placed.totalAmount)}</strong>
            <br />Pay cash on delivery. The store will confirm your order shortly.
          </p>
          <Link to="/dairy/orders" className="dairy-primary-button">View my orders</Link>
        </div>
      ) : (
        <form className="dairy-subscription-form" onSubmit={submit}>
          <label>
            Quantity ({product.unit})
            <input type="number" min="0.5" step="0.5" value={quantity}
              onChange={(e) => setQuantity(e.target.value)} required />
          </label>
          <label>
            Delivery address
            <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="House no., street, area" required />
          </label>
          <label>
            Phone number
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          <label>
            Note for the store (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. deliver before 7 AM" />
          </label>

          <div className="dairy-subscription-summary">
            <ShoppingBag size={19} />
            <span>
              <strong>Total {rupees(total)}</strong>
              <small>{rupees(product.price)} / {product.unit} · Cash on delivery</small>
            </span>
          </div>

          {error && <div className="dairy-form-message" role="alert">{error}</div>}
          <button type="submit" className="dairy-primary-button dairy-submit-button" disabled={busy}>
            {busy ? "Placing order…" : "Place order"}
          </button>
        </form>
      )}
    </Modal>
  );
}

/* ================================================================
   Monthly subscription
================================================================ */
function SubscribeModal({ product, onClose }) {
  const [startDate, setStartDate] = useState(tomorrow());
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setError("");
      const { data } = await api.post("/dairy/subscriptions", {
        productId: product.id,
        deliveryAddress: address,
        phone,
        startDate,
      });
      setDone(data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={done ? "Subscription requested" : `Subscribe to ${product.name}`} onClose={onClose}>
      {done ? (
        <div className="dairy-done">
          <CheckCircle2 size={42} />
          <h3>Request sent</h3>
          <p>
            The store will review and activate your plan. Starting {done.startDate}, {Number(done.quantityPerDay)} {done.unit} each day for <strong>{rupees(done.monthlyPrice)}</strong> a month, paid to the store.
          </p>
          <Link to="/dairy/orders" className="dairy-primary-button">View my subscriptions</Link>
        </div>
      ) : (
        <form className="dairy-subscription-form" onSubmit={submit}>
          <div className="dairy-subscription-summary">
            <Repeat size={19} />
            <span>
              <strong>{Number(product.subscriptionQuantityPerDay)} {product.unit} every day</strong>
              <small>{rupees(product.monthlySubscriptionPrice)} per month, set by the store</small>
            </span>
          </div>
          <label>
            Start date
            <input type="date" min={new Date().toISOString().slice(0, 10)}
              value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>
          <label>
            Delivery address
            <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="House no., street, area" required />
          </label>
          <label>
            Phone number
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>
          {error && <div className="dairy-form-message" role="alert">{error}</div>}
          <button type="submit" className="dairy-primary-button dairy-submit-button" disabled={busy}>
            {busy ? "Sending…" : "Request subscription"}
          </button>
        </form>
      )}
    </Modal>
  );
}

/* ================================================================
   Add / edit product (store owner)
================================================================ */
function ProductModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(initial.id);

  const set = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  async function submit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price: Number(form.price),
      unit: form.unit.trim(),
      stockQuantity: Number(form.stockQuantity),
      available: form.available,
      subscriptionEnabled: form.subscriptionEnabled,
      subscriptionQuantityPerDay: form.subscriptionEnabled ? Number(form.subscriptionQuantityPerDay) : null,
      monthlySubscriptionPrice: form.subscriptionEnabled ? Number(form.monthlySubscriptionPrice) : null,
    };
    if (!payload.name) return setError("Product name is required.");
    if (!(payload.price >= 0) || form.price === "") return setError("Enter a valid price.");
    if (!(payload.stockQuantity >= 0) || form.stockQuantity === "") return setError("Enter the stock you have.");
    if (form.subscriptionEnabled &&
      (!(payload.subscriptionQuantityPerDay > 0) || form.monthlySubscriptionPrice === "")) {
      return setError("Enter the daily quantity and the monthly price for the subscription.");
    }

    try {
      setBusy(true);
      setError("");
      if (editing) await api.put(`/dairy/products/${initial.id}`, payload);
      else await api.post("/dairy/products", payload);
      await onSaved();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? "Edit product" : "Add a product"} onClose={onClose} wide>
      <form className="dairy-subscription-form" onSubmit={submit}>
        <div className="dairy-form-row">
          <label>
            Product name
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Fresh cow milk" maxLength={180} required />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
        </div>

        <label>
          Description (optional)
          <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="Cow / buffalo, fat %, packaging…" maxLength={2000} />
        </label>

        <div className="dairy-form-row dairy-form-row-3">
          <label>
            Price (₹)
            <input type="number" min="0" step="0.01" value={form.price}
              onChange={(e) => set("price", e.target.value)} required />
          </label>
          <label>
            Per unit
            <input list="dairy-units" value={form.unit} onChange={(e) => set("unit", e.target.value)} required />
            <datalist id="dairy-units">
              <option value="litre" /><option value="500 ml" /><option value="kg" />
              <option value="500 g" /><option value="packet" /><option value="piece" />
            </datalist>
          </label>
          <label>
            Stock available
            <input type="number" min="0" step="0.5" value={form.stockQuantity}
              onChange={(e) => set("stockQuantity", e.target.value)} required />
          </label>
        </div>

        <label className="dairy-check">
          <input type="checkbox" checked={form.available} onChange={(e) => set("available", e.target.checked)} />
          Show this product to customers
        </label>

        <div className="dairy-sub-box">
          <label className="dairy-check">
            <input type="checkbox" checked={form.subscriptionEnabled}
              onChange={(e) => set("subscriptionEnabled", e.target.checked)} />
            Offer a monthly subscription
          </label>

          {form.subscriptionEnabled && (
            <div className="dairy-form-row">
              <label>
                Delivered every day ({form.unit || "unit"})
                <input type="number" min="0.1" step="0.1" value={form.subscriptionQuantityPerDay}
                  onChange={(e) => set("subscriptionQuantityPerDay", e.target.value)} />
              </label>
              <label>
                Monthly charge (₹)
                <input type="number" min="0" step="1" value={form.monthlySubscriptionPrice}
                  onChange={(e) => set("monthlySubscriptionPrice", e.target.value)}
                  placeholder="e.g. 1800" />
              </label>
            </div>
          )}
        </div>

        {error && <div className="dairy-form-message" role="alert">{error}</div>}
        <button type="submit" className="dairy-primary-button dairy-submit-button" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save changes" : "Add product"}
        </button>
      </form>
    </Modal>
  );
}

/* ---------------- shared modal shell ---------------- */
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="dairy-modal-overlay" onClick={onClose}>
      <section
        className={`dairy-modal ${wide ? "dairy-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dairy-modal-header">
          <h2>{title}</h2>
          <button type="button" className="dairy-close-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
