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
        <form
