import React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Routes,
  Route,
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  Leaf,
  ShoppingCart,
  UserRound,
  LogOut,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sprout,
  Star,
  X,
  Package,
  Plus,
  Minus,
  Mail,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

import api from "./api";
import Profile from "./Profile";
import GoogleButton from "./components/Auth/GoogleButton";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import VerifyEmail from "./components/Auth/VerifyEmail";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import CartPage from "./components/Marketplace/Cart";
import Navbar from "./components/Navbar/Navbar";
import AdvertisementSlider from "./components/Advertisement/AdvertisementSlider";
import AdvertisementManager from "./components/Advertisement/AdvertisementManager";

import "./styles/navbar.css";
import "./styles/advertisement.css";

import {
  signInWithEmailAndPassword,
 createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";

import { auth } from "./firebase";


const getUser = () =>
  JSON.parse(localStorage.getItem("kc_user") || "null");


function saveSession(data) {
  localStorage.setItem("kc_access", data.accessToken);
  localStorage.setItem("kc_refresh", data.refreshToken);
  localStorage.setItem("kc_user", JSON.stringify(data));
}


/* =========================
   LAYOUT
========================= */

function Layout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    const sync = () => setUser(getUser());

    window.addEventListener("storage", sync);

    return () => window.removeEventListener("storage", sync);
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);

      localStorage.removeItem("kc_access");
      localStorage.removeItem("kc_refresh");
      localStorage.removeItem("kc_user");

      setUser(null);
      setLogoutConfirmOpen(false);

      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div className="app-shell">

      <Navbar
        user={user}
        onLogout={() => setLogoutConfirmOpen(true)}
      />

      {logoutConfirmOpen && (
        <div
          className="logout-modal-overlay"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div
            className="logout-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="logout-modal-icon">
              <LogOut size={22} />
            </div>

            <h3>Are you sure you want to logout?</h3>

            <p>
              You will be signed out of your KisanDirect account.
            </p>

            <div className="logout-modal-actions">

              <button
                className="secondary-btn"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Cancel
              </button>

              <button
                className="primary-btn"
                onClick={logout}
              >
                Yes, Logout
              </button>

            </div>
          </div>
        </div>
      )}

      <main>
        {children}
      </main>

      <footer>

        <div>

          <div className="brand footer-brand">
            <span className="brandmark">
              <Leaf size={18} />
            </span>

            KisanDirect
          </div>

          <p>
            Better food, fairer trade, stronger farms.
          </p>

        </div>

        <div className="footer-note">
          © {new Date().getFullYear()} KisanDirect
        </div>

      </footer>

    </div>
  );
}


/* =========================
   HOME / MARKETPLACE
========================= */

function Home() {

  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState(
    new URLSearchParams(location.search).get("q") || ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQ(params.get("q") || "");
  }, [location.search]);

  useEffect(() => {

    const timer = setTimeout(() => {

      setLoading(true);
      setError("");

      api
        .get("/products", {
          params: {
            q,
            page: 0,
            size: 12
          }
        })
        .then(r => {
          setProducts(r.data.content || []);
        })
        .catch(() => {
          setProducts([]);
          setError(
            "Could not load products. Please check your backend connection."
          );
        })
        .finally(() => {
          setLoading(false);
        });

    }, 250);


    return () => clearTimeout(timer);

  }, [q]);


const add = async id => {
  if (!getUser()) {
    setToast("Please sign in to add products to your cart.");

    setTimeout(() => {
      setToast("");
    }, 3000);

    return;
  }

  try {
    await api.post(
      "/cart/items",
      {
        productId: id,
        quantity: 1
      }
    );

    setToast("Added to cart");

    setTimeout(() => {
      setToast("");
    }, 2500);

  } catch (e) {
    console.error("Add to cart failed:", e);

    const errorMessage =
      typeof e.response?.data?.error === "string"
        ? e.response.data.error
        : typeof e.response?.data?.message === "string"
          ? e.response.data.message
          : "Could not add item to cart.";

    setToast(errorMessage);

    setTimeout(() => {
      setToast("");
    }, 3000);
  }
};

return (
  <>
    {toast && (
      <div className="app-toast">
        <span className="app-toast-icon">✓</span>
        <span>{toast}</span>
      </div>
    )}

  

      <section className="hero-modern">

        <div className="hero-copy">

          <div className="eyebrow">
            <span>●</span>
            Farm fresh marketplace
          </div>


          <h1>
            Good food starts
            <br />
            <span>with good farms.</span>
          </h1>


          <p>
            Buy fresh produce directly from local farmers.
            Transparent pricing, quality products and a simpler
            farm-to-home experience.
          </p>


          <div className="hero-actions">

            <a
              className="primary-btn"
              href="#products"
            >
              Explore produce
              <ArrowRight size={18} />
            </a>


            <Link
              className="secondary-btn"
              to="/register"
            >
              Join KisanDirect
            </Link>

          </div>


          <div className="trust-row">

            <span>
              <CheckCircle2 size={16} />
              Farmer verified
            </span>

            <span>
              <Truck size={16} />
              Direct sourcing
            </span>

            <span>
              <ShieldCheck size={16} />
              Secure accounts
            </span>

          </div>

        </div>


        <div className="hero-visual">

          <div className="floating-card card-one">

            <Sprout size={19} />

            <div>
              <b>Fresh harvest</b>
              <small>Picked with care</small>
            </div>

          </div>


          <div className="farm-orb">

            <span>🌾</span>
            <span>🥬</span>
            <span>🍅</span>
            <span>🥕</span>

          </div>


          <div className="floating-card card-two">

            <Star size={18} />

            <div>
              <b>Local farmers</b>
              <small>Fairer connection</small>
            </div>

          </div>

        </div>

      </section>


      <AdvertisementSlider />


      <section className="benefits">

        <div>
          <Sprout />

          <div>
            <b>From real farms</b>
            <span>Know where your food comes from.</span>
          </div>
        </div>


        <div>
          <Truck />

          <div>
            <b>Simple ordering</b>
            <span>One clean place for your produce.</span>
          </div>
        </div>


        <div>
          <ShieldCheck />

          <div>
            <b>Built with security</b>
            <span>Protected authentication and data.</span>
          </div>
        </div>

      </section>


      <section
        id="products"
        className="products-section"
      >

        <div className="sectionhead modern-head">

          <div>

            <span className="section-kicker">
              MARKETPLACE
            </span>

            <h2>
              Fresh picks for today
            </h2>

          </div>


          <span className="result-count">
            {loading
              ? "Loading…"
              : `${products.length} products`}
          </span>

        </div>


        {error && (
          <div className="notice error">
            {error}
          </div>
        )}


        {loading ? (

          <div className="product-grid">

            {[1, 2, 3, 4].map(i => (

              <div
                className="skeleton-card"
                key={i}
              >
                <div className="skeleton image"></div>
                <div className="skeleton line"></div>
                <div className="skeleton short"></div>
              </div>

            ))}

          </div>

        ) : (

          <div className="product-grid">

            {products.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={add}
              />
            ))}

          </div>

        )}


        {!loading && !products.length && (

          <div className="empty-state">

            <Package size={34} />

            <h3>
              No products found
            </h3>

            <p>
              Try another search or check back after
              farmers publish new produce.
            </p>

          </div>

        )}

      </section>

</>
);
}



/* =========================
   ABOUT
========================= */

/* =========================
   KISANDIRECT AI
========================= */

function KisanDirectAI() {
  return (
    <section className="page-section kd-ai-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">KISANDIRECT AI</span>
          <h1>Your agriculture assistant.</h1>
        </div>
      </div>

      <div className="panel kd-ai-page-card">
        <div className="kd-ai-page-icon">✦</div>
        <h2>KisanDirect AI</h2>
        <p>
          This is the dedicated AI workspace. The assistant can be
          connected here next without changing the navigation again.
        </p>
      </div>
    </section>
  );
}


function About() {
  return (
    <section className="page-section kd-simple-page">
      <div className="page-heading">
        <div>
          <span className="section-kicker">ABOUT KISANDIRECT</span>
          <h1>Built to make agriculture more connected.</h1>
        </div>
      </div>

      <div className="panel kd-simple-page-card">
        <p>
          KisanDirect is a modern agriculture-focused platform
          connecting people with products, information and
          useful digital tools.
        </p>

        <p>
          This project combines a responsive React frontend,
          Spring Boot APIs, secure authentication, PostgreSQL
          and role-based features in one production-style
          application.
        </p>
      </div>
    </section>
  );
}

/* =========================
   PRODUCT CARD
========================= */

function ProductCard({ product, onAdd }) {

  const emoji = useMemo(() => {

    const n = product.name.toLowerCase();

    if (n.includes("tomato")) return "🍅";
    if (n.includes("rice")) return "🍚";
    if (n.includes("apple")) return "🍎";
    if (n.includes("potato")) return "🥔";
    if (n.includes("banana")) return "🍌";
    if (n.includes("carrot")) return "🥕";
    if (n.includes("spinach") || n.includes("leaf")) return "🥬";

    return "🌱";

  }, [product.name]);


  const imageUrl =
    product.images?.length > 0
      ? product.images[0]?.url
      : null;


  return (
    <article className="product-card">

      <div className="product-art">

        {imageUrl ? (

          <img
            src={imageUrl}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
          />

        ) : (

          <span>
            {emoji}
          </span>

        )}


        <small>
          {product.category?.name || "Farm fresh"}
        </small>

      </div>


      <div className="product-content">

        <div className="product-title">

          <h3>
            {product.name}
          </h3>

          <span>
            /{product.unit}
          </span>

        </div>


        <p>
          {product.description}
        </p>


        <div className="product-bottom">

          <strong>
            ₹
            {Number(product.price).toLocaleString("en-IN")}
          </strong>


          <button
            onClick={() => onAdd(product.id)}
          >
            <Plus size={17} />
            Add
          </button>

        </div>

      </div>

    </article>
  );
}


/* =========================
   AUTH LAYOUT
========================= */

function Auth({
  title,
  subtitle,
  children
}) {

  return (

    <div className="auth-page">

      <div className="auth-side">

        <div className="auth-brand">

          <span className="brandmark">
            <Leaf size={20} />
          </span>

          KisanDirect

        </div>


        <div>

          <span className="section-kicker">
            FARM TO HOME
          </span>

          <h1>
            Fresh choices.
            <br />
            <span>Better connections.</span>
          </h1>

          <p>
            Join a modern marketplace connecting consumers
            with the farmers behind their food.
          </p>

        </div>

      </div>


      <div className="auth-panel">

        <div className="authbox">

          <div className="auth-mobile-brand">

            <span className="brandmark">
              <Leaf size={19} />
            </span>

            KisanDirect

          </div>


          <h2>
            {title}
          </h2>


          <p className="auth-subtitle">
            {subtitle}
          </p>


          {children}

        </div>

      </div>

    </div>
  );
}



/* =========================
   CART
========================= */

function Cart() {

  const [cart, setCart] = useState(null);
  const [busy, setBusy] = useState(false);


  const load = () =>
    api
      .get("/cart")
      .then(r => setCart(r.data))
      .catch(() => setCart(null));


  useEffect(load, []);


  const items = cart?.items || [];


  const total = items.reduce(
    (sum, i) =>
      sum +
      Number(i.product?.price || 0) *
      i.quantity,
    0
  );


  const remove = async id => {

    await api.delete(
      `/cart/items/${id}`
    );

    load();
  };


  const checkout = async () => {

    const address = prompt(
      "Enter your delivery address"
    );

    if (!address) return;

    setBusy(true);


    try {

      await api.post(
        "/orders/checkout",
        {
          shippingAddress: address
        }
      );

      alert(
        "Order placed successfully"
      );

      load();

    } catch (e) {

      alert(
        e.response?.data?.error ||
        "Checkout failed"
      );

    } finally {

      setBusy(false);

    }
  };


  return (

    <section className="page-section">

      <div className="page-heading">

        <div>

          <span className="section-kicker">
            YOUR BASKET
          </span>

          <h1>
            Shopping cart
          </h1>

        </div>


        <Link to="/">
          Continue shopping
          <ChevronRight size={16} />
        </Link>

      </div>


      {!cart ? (

        <div className="empty-state">

          <Package />

          <p>
            Loading your cart…
          </p>

        </div>

      ) : !items.length ? (

        <div className="empty-state">

          <ShoppingCart size={40} />

          <h3>
            Your cart is empty
          </h3>

          <p>
            Explore fresh products and add
            something you love.
          </p>

          <Link
            className="primary-btn"
            to="/"
          >
            Browse marketplace
          </Link>

        </div>

      ) : (

        <div className="cart-layout">

          <div className="cart-items">

            {items.map(i => (

              <div
                className="cart-item"
                key={i.id}
              >

                <div className="mini-product">
                  🌱
                </div>


                <div>

                  <h3>
                    {i.product?.name}
                  </h3>

                  <span>
                    ₹
                    {Number(
                      i.product?.price || 0
                    ).toLocaleString("en-IN")}
                    {" / "}
                    {i.product?.unit}
                  </span>

                </div>


                <div className="qty">

                  <button>
                    <Minus size={14} />
                  </button>

                  <b>
                    {i.quantity}
                  </b>

                  <button>
                    <Plus size={14} />
                  </button>

                </div>


                <strong>
                  ₹
                  {(
                    Number(
                      i.product?.price || 0
                    ) *
                    i.quantity
                  ).toLocaleString("en-IN")}
                </strong>


                <button
                  className="remove-btn"
                  onClick={() =>
                    remove(i.product?.id)
                  }
                >
                  Remove
                </button>

              </div>

            ))}

          </div>


          <aside className="summary">

            <span className="section-kicker">
              ORDER SUMMARY
            </span>

            <h2>
              Ready to order?
            </h2>


            <div>
              <span>Subtotal</span>
              <b>
                ₹{total.toLocaleString("en-IN")}
              </b>
            </div>


            <div>
              <span>Delivery</span>
              <b>Address based</b>
            </div>


            <hr />


            <div className="summary-total">

              <span>Total</span>

              <b>
                ₹{total.toLocaleString("en-IN")}
              </b>

            </div>


            <button
              className="primary-btn full"
              onClick={checkout}
              disabled={busy}
            >
              {busy
                ? "Placing order…"
                : "Checkout"}
            </button>


            <small>
              Secure checkout · Payment integration
              can be added next
            </small>

          </aside>

        </div>

      )}

    </section>
  );
}


/* =========================
   FARMER
========================= */

function Farmer() {

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    unit: "kg",
    categoryId: "",
    quantity: 10
  });


  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [categories, setCategories] = useState([]);

  const [message, setMessage] = useState("");

  const [busy, setBusy] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
const [loadingProducts, setLoadingProducts] = useState(true);


  const loadMyProducts = async () => {
  try {
    setLoadingProducts(true);

    const r = await api.get(
      "/products/farmer/my-products"
    );

    setMyProducts(
      r.data.content || []
    );

  } catch (e) {

    console.error(
      "Could not load farmer products",
      e
    );

    setMyProducts([]);

  } finally {
    setLoadingProducts(false);
  }
};

   useEffect(() => {

  api
    .get("/categories")
    .then(r => setCategories(r.data))
    .catch(() => {
      setCategories([]);
    });

  loadMyProducts();

}, []);


  const handleImageChange = e => {

    const file = e.target.files?.[0] || null;

    setImage(file);


    if (file) {

      const previewUrl =
        URL.createObjectURL(file);

      setImagePreview(previewUrl);

    } else {

      setImagePreview("");

    }
  };


  const create = async e => {

    e.preventDefault();

    setMessage("");


    if (!form.categoryId) {

      setMessage(
        "Please select a category."
      );

      return;
    }


    setBusy(true);


    try {

      /* -------------------------
         STEP 1: CREATE PRODUCT
      ------------------------- */

      const productResponse =
        await api.post(
          "/products/farmer",
          {
            ...form,
            price: Number(form.price),
            categoryId: Number(form.categoryId),
            quantity: Number(form.quantity)
          }
        );


      const productId =
        productResponse.data.id;


      /* -------------------------
         STEP 2: UPLOAD IMAGE
      ------------------------- */

      if (image) {

        setMessage(
          "Product created. Uploading image…"
        );


        const formData = new FormData();

        formData.append(
          "image",
          image
        );


        await api.post(
          `/products/farmer/${productId}/images`,
          formData
        );

      }


      /* -------------------------
         SUCCESS
      ------------------------- */

      setMessage(
        image
          ? "Product and image uploaded successfully. Waiting for admin approval."
          : "Product submitted for admin approval."
      );


      setForm({
        name: "",
        description: "",
        price: "",
        unit: "kg",
        categoryId: "",
        quantity: 10
      });


      setImage(null);
      setImagePreview("");
      await loadMyProducts();


      /* Reset file input */
      const fileInput =
        document.getElementById(
          "product-image"
        );

      if (fileInput) {
        fileInput.value = "";
      }


    } catch (e) {

      setMessage(
        e.response?.data?.error ||
        "Could not create product."
      );

    } finally {

      setBusy(false);

    }
  };


  const deleteProduct = async productId => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {

      await api.delete(
        `/products/farmer/${productId}`
      );

      setMessage("Product deleted successfully.");
      await loadMyProducts();

    } catch (e) {

      setMessage(
        e.response?.data?.error ||
        "Could not delete product."
      );

    }
  };


  return (

    <section className="page-section">

      <div className="page-heading">

        <div>

          <span className="section-kicker">
            FARMER STUDIO
          </span>

          <h1>
            Your farm dashboard
          </h1>

        </div>


        <span className="status-chip">
          ● Account active
        </span>

      </div>


      <div className="stats modern-stats">

        <div>

          <Sprout />

          <b>
            List produce
          </b>

          <span>
            Publish fresh products for customers.
          </span>

        </div>


        <div>

          <Package />

          <b>
            Manage stock
          </b>

          <span>
            Keep inventory quantities accurate.
          </span>

        </div>


        <div>

          <Truck />

          <b>
            Fulfil orders
          </b>

          <span>
            Track the journey after checkout.
          </span>

        </div>

      </div>


      <div className="panel formpanel modern-form">

        <div>

          <span className="section-kicker">
            NEW LISTING
          </span>

          <h2>
            Add a farm product
          </h2>

          <p>
            Products go through admin approval
            before appearing publicly.
          </p>

        </div>


        <form onSubmit={create}>

          <label>
            Product name

            <input
              value={form.name}
              onChange={e =>
                setForm({
                  ...form,
                  name: e.target.value
                })
              }
              placeholder="e.g. Fresh tomatoes"
              required
            />

          </label>


          <label>
            Description

            <textarea
              value={form.description}
              onChange={e =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
              placeholder="Tell customers about freshness, quality or harvest."
              required
            />

          </label>


          <div className="formrow">

            <label>
              Price

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e =>
                  setForm({
                    ...form,
                    price: e.target.value
                  })
                }
                placeholder="0.00"
                required
              />

            </label>


            <label>
              Unit

              <input
                value={form.unit}
                onChange={e =>
                  setForm({
                    ...form,
                    unit: e.target.value
                  })
                }
                placeholder="kg, dozen…"
                required
              />

            </label>

          </div>


          <div className="formrow">

            <label>
              Category

              <select
                value={form.categoryId}
                onChange={e =>
                  setForm({
                    ...form,
                    categoryId: e.target.value
                  })
                }
                required
              >

                <option value="">
                  Select category
                </option>


                {categories.map(c => (

                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>

                ))}

              </select>

            </label>


            <label>
              Initial stock

              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={e =>
                  setForm({
                    ...form,
                    quantity: e.target.value
                  })
                }
              />

            </label>

          </div>


          {/* =========================
              PRODUCT IMAGE
          ========================= */}

          <label>
            Product image

            <input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            <small>
              Optional · Maximum 5 MB
            </small>

          </label>


          {imagePreview && (

            <div
              style={{
                marginTop: "12px",
                marginBottom: "12px"
              }}
            >

              <img
                src={imagePreview}
                alt="Product preview"
                style={{
                  width: "180px",
                  height: "140px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  display: "block"
                }}
              />

            </div>

          )}


          {image && (

            <div className="notice success">

              Selected:
              {" "}
              {image.name}

            </div>

          )}


          {message && (

            <div className="notice success">
              {message}
            </div>

          )}


          <button
            className="primary-btn"
            type="submit"
            disabled={busy}
          >

            <Plus size={17} />

            {busy
              ? "Submitting…"
              : "Submit listing"}

          </button>

        </form>

      </div>

      {/* =========================
          MY PRODUCTS
      ========================= */}

      <div className="panel admin-panel" style={{ marginTop: "24px" }}>

        <div className="sectionhead">
          <div>
            <span className="section-kicker">MY PRODUCTS</span>
            <h2>Products you listed</h2>
          </div>
          <span>{myProducts.length} products</span>
        </div>

        {loadingProducts ? (
          <div className="empty-inline">Loading your products…</div>
        ) : !myProducts.length ? (
          <div className="empty-inline">
            <Package />
            You have not listed any products yet.
          </div>
        ) : (
          myProducts.map(p => {
            const productImage = p.images?.length > 0 ? p.images[0]?.url : null;
            return (
              <div className="review-row" key={p.id}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  {productImage ? (
                    <img src={productImage} alt={p.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "10px", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "64px", height: "64px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f0", fontSize: "26px", flexShrink: 0 }}>🌱</div>
                  )}
                  <div>
                    <b>{p.name}</b>
                    <span>₹{Number(p.price || 0).toLocaleString("en-IN")} / {p.unit}</span>
                    <span>Status: {p.status || "PENDING_APPROVAL"}</span>
                  </div>
                </div>
                <div className="review-actions">
                  <button className="reject" onClick={() => deleteProduct(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>


    </section>
  );
}


/* =========================
   ADMIN
========================= */

function Admin() {
  const [d, setD] = useState(null);
  const [pending, setPending] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(null);

  const getErrorMessage = error => {
    const data = error?.response?.data;

    if (typeof data?.error === "string") {
      return data.error;
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (typeof data === "string") {
      return data;
    }

    if (error?.message) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  };


  const loadDashboard = async () => {
    setLoadingDashboard(true);

    try {
      const response = await api.get("/admin/dashboard");
      setD(response.data);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      setError(getErrorMessage(error));
    } finally {
      setLoadingDashboard(false);
    }
  };


  const loadPendingProducts = async () => {
    setLoadingPending(true);

    try {
      const response = await api.get(
        "/admin/products/pending"
      );

      const data =
        response.data?.content ||
        response.data ||
        [];

      setPending(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "Pending products error:",
        error
      );

      setPending([]);

      setError(
        getErrorMessage(error)
      );
    } finally {
      setLoadingPending(false);
    }
  };


  const loadAllProducts = async () => {
    setLoadingProducts(true);

    try {
      const response = await api.get(
        "/admin/products"
      );

      const data =
        response.data?.content ||
        response.data ||
        [];

      setAllProducts(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (error) {
      console.error(
        "All products error:",
        error
      );

      setAllProducts([]);

      setError(
        getErrorMessage(error)
      );
    } finally {
      setLoadingProducts(false);
    }
  };


  const load = async () => {
    setError("");

    await Promise.all([
      loadDashboard(),
      loadPendingProducts(),
      loadAllProducts()
    ]);
  };


  useEffect(() => {
    load();
  }, []);


  const act = async (id, type) => {
    try {
      setActionBusy(`${type}-${id}`);
      setError("");

      await api.patch(
        `/admin/products/${id}/${type}`
      );

      await load();
    } catch (error) {
      console.error(
        `Product ${type} error:`,
        error
      );

      setError(
        getErrorMessage(error)
      );
    } finally {
      setActionBusy(null);
    }
  };


  const deleteProduct = async productId => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionBusy(`delete-${productId}`);
      setError("");

      await api.delete(
        `/admin/products/${productId}`
      );

      await load();
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      setError(
        getErrorMessage(error)
      );
    } finally {
      setActionBusy(null);
    }
  };


  return (
    <section className="page-section">

      {/* =========================
          HEADER
      ========================= */}

      <div className="page-heading">

        <div>
          <span className="section-kicker">
            CONTROL CENTER
          </span>

          <h1>
            Admin dashboard
          </h1>

          <p>
            Manage users, products and marketplace activity.
          </p>
        </div>

        <span className="status-chip">
          <ShieldCheck size={15} />
          Protected
        </span>

      </div>


      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="notice error">
          {error}
        </div>
      )}


      <AdvertisementManager />


      {/* =========================
          OVERVIEW STATS
      ========================= */}

      <div className="stats modern-stats">

        <div>
          <UserRound />

          <b>
            {loadingDashboard
              ? "..."
              : d?.users ?? "0"}
          </b>

          <span>
            Registered users
          </span>
        </div>


        <div>
          <Package />

          <b>
            {loadingDashboard
              ? "..."
              : d?.products ?? "0"}
          </b>

          <span>
            Total products
          </span>
        </div>


        <div>
          <ShoppingCart />

          <b>
            {loadingDashboard
              ? "..."
              : d?.orders ?? "0"}
          </b>

          <span>
            Total orders
          </span>
        </div>

      </div>


      {/* =========================
          PENDING PRODUCTS
      ========================= */}

      <div className="panel admin-panel">

        <div className="sectionhead">

          <div>
            <span className="section-kicker">
              REVIEW QUEUE
            </span>

            <h2>
              Products awaiting approval
            </h2>
          </div>

          <span>
            {loadingPending
              ? "Loading..."
              : `${pending.length} pending`}
          </span>

        </div>


        {loadingPending ? (

          <div className="empty-inline">
            Loading pending products…
          </div>

        ) : !pending.length ? (

          <div className="empty-inline">
            <CheckCircle2 />
            Nothing waiting for review.
          </div>

        ) : (

          pending.map(product => {

            const productImage =
              product.images?.length > 0
                ? product.images[0]?.url
                : null;

            const approveBusy =
              actionBusy ===
              `approve-${product.id}`;

            const rejectBusy =
              actionBusy ===
              `reject-${product.id}`;

            return (
              <div
                className="review-row"
                key={product.id}
              >

                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center"
                  }}
                >

                  {productImage ? (

                    <img
                      src={productImage}
                      alt={product.name}
                      style={{
                        width: "64px",
                        height: "64px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        flexShrink: 0
                      }}
                    />

                  ) : (

                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f1f5f0",
                        fontSize: "26px",
                        flexShrink: 0
                      }}
                    >
                      🌱
                    </div>

                  )}


                  <div>

                    <b>
                      {product.name}
                    </b>

                    <span>
                      ₹
                      {Number(
                        product.price || 0
                      ).toLocaleString("en-IN")}
                      {" / "}
                      {product.unit}
                    </span>

                    <span>
                      Farmer:{" "}
                      {product.farmer?.name ||
                        "Unknown"}
                    </span>

                    <span>
                      Status:{" "}
                      {product.status ||
                        "PENDING_APPROVAL"}
                    </span>

                    {product.description && (
                      <span>
                        {product.description}
                      </span>
                    )}

                  </div>

                </div>


                <div className="review-actions">

                  <button
                    className="approve"
                    disabled={
                      approveBusy ||
                      rejectBusy
                    }
                    onClick={() =>
                      act(
                        product.id,
                        "approve"
                      )
                    }
                  >
                    {approveBusy
                      ? "Approving…"
                      : "Approve"}
                  </button>


                  <button
                    className="reject"
                    disabled={
                      approveBusy ||
                      rejectBusy
                    }
                    onClick={() =>
                      act(
                        product.id,
                        "reject"
                      )
                    }
                  >
                    {rejectBusy
                      ? "Rejecting…"
                      : "Reject"}
                  </button>

                </div>

              </div>
            );
          })

        )}

      </div>


      {/* =========================
          ALL PRODUCTS
      ========================= */}

      <div
        className="panel admin-panel"
        style={{
          marginTop: "24px"
        }}
      >

        <div className="sectionhead">

          <div>
            <span className="section-kicker">
              ALL PRODUCTS
            </span>

            <h2>
              Product management
            </h2>
          </div>

          <span>
            {loadingProducts
              ? "Loading..."
              : `${allProducts.length} products`}
          </span>

        </div>


        {loadingProducts ? (

          <div className="empty-inline">
            Loading products…
          </div>

        ) : !allProducts.length ? (

          <div className="empty-inline">
            <CheckCircle2 />
            No products found.
          </div>

        ) : (

          allProducts.map(product => {

            const productImage =
              product.images?.length > 0
                ? product.images[0]?.url
                : null;

            const deleteBusy =
              actionBusy ===
              `delete-${product.id}`;

            return (
              <div
                className="review-row"
                key={product.id}
              >

                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    alignItems: "center"
                  }}
                >

                  {productImage ? (

                    <img
                      src={productImage}
                      alt={product.name}
                      style={{
                        width: "64px",
                        height: "64px",
                        objectFit: "cover",
                        borderRadius: "10px",
                        flexShrink: 0
                      }}
                    />

                  ) : (

                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f1f5f0",
                        fontSize: "26px",
                        flexShrink: 0
                      }}
                    >
                      🌱
                    </div>

                  )}


                  <div>

                    <b>
                      {product.name}
                    </b>

                    <span>
                      ₹
                      {Number(
                        product.price || 0
                      ).toLocaleString("en-IN")}
                      {" / "}
                      {product.unit}
                    </span>

                    <span>
                      Farmer:{" "}
                      {product.farmer?.name ||
                        "Unknown"}
                    </span>

                    <span>
                      Status:{" "}
                      {product.status ||
                        "UNKNOWN"}
                    </span>

                  </div>

                </div>


                <div className="review-actions">

                  <button
                    className="reject"
                    disabled={deleteBusy}
                    onClick={() =>
                      deleteProduct(
                        product.id
                      )
                    }
                  >
                    {deleteBusy
                      ? "Deleting…"
                      : "Delete"}
                  </button>

                </div>

              </div>
            );
          })

        )}

      </div>

    </section>
  );
}

/* =========================
   APP ROUTES
========================= */

export default function App() {

  return (

    <Layout>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/kisandirect-ai"
          element={<KisanDirectAI />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
  path="/verify-email"
  element={<VerifyEmail />}
/>

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

      <Route
  path="/cart"
  element={<CartPage />}
/>

        <Route
  path="/profile"
  element={<Profile />}
/>

        <Route
          path="/farmer"
          element={<Farmer />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

      </Routes>

    </Layout>
  );
}
