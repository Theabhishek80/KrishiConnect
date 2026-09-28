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
  Search,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sprout,
  Star,
  Menu,
  X,
  Package,
  Plus,
  Minus,
  Mail,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

import api from "./api";


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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setUser(getUser());

    window.addEventListener("storage", sync);

    return () => window.removeEventListener("storage", sync);
  }, []);

  const logout = () => {
    localStorage.removeItem("kc_access");
    localStorage.removeItem("kc_refresh");
    localStorage.removeItem("kc_user");

    setUser(null);
    setOpen(false);

    navigate("/");
  };

  const close = () => setOpen(false);

  return (
    <div className="app-shell">

      <header className="topbar">

        <Link
          className="brand"
          to="/"
          onClick={close}
        >
          <span className="brandmark">
            <Leaf size={19} />
          </span>

          <span>
            Krishi<span>Connect</span>
          </span>
        </Link>


        <button
          className="mobile-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>


        <nav className={open ? "nav open" : "nav"}>

          <Link to="/" onClick={close}>
            Marketplace
          </Link>


          {user && (
            <Link to="/cart" onClick={close}>
              <ShoppingCart size={17} />
              Cart
            </Link>
          )}


          {user?.role === "FARMER" && (
            <Link to="/farmer" onClick={close}>
              <Sprout size={17} />
              Farmer
            </Link>
          )}


          {user?.role === "ADMIN" && (
            <Link to="/admin" onClick={close}>
              <LayoutDashboard size={17} />
              Admin
            </Link>
          )}


          {user ? (
            <button
              className="nav-user"
              onClick={logout}
            >
              <span className="avatar">
                {user.name?.[0]?.toUpperCase()}
              </span>

              {user.name?.split(" ")[0]}

              <LogOut size={16} />
            </button>
          ) : (
            <Link
              className="login-link"
              to="/login"
              onClick={close}
            >
              <UserRound size={17} />
              Sign in
            </Link>
          )}

        </nav>

      </header>


      <main>
        {children}
      </main>


      <footer>

        <div>

          <div className="brand footer-brand">
            <span className="brandmark">
              <Leaf size={18} />
            </span>

            KrishiConnect
          </div>

          <p>
            Better food, fairer trade, stronger farms.
          </p>

        </div>


        <div className="footer-note">
          © {new Date().getFullYear()} KrishiConnect
        </div>

      </footer>

    </div>
  );
}


/* =========================
   HOME / MARKETPLACE
========================= */

function Home() {

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


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
      return alert(
        "Please sign in to add products to your cart."
      );
    }


    try {

      await api.post(
        "/cart/items",
        {
          productId: id,
          quantity: 1
        }
      );

      alert("Added to cart");

    } catch (e) {

      alert(
        e.response?.data?.error ||
        "Could not add item"
      );

    }
  };


  return (
    <div>

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
              Join KrishiConnect
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


        <div className="search-modern">

          <Search size={19} />

          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search tomatoes, rice, fruits, spices…"
          />

          {q && (
            <button
              onClick={() => setQ("")}
            >
              Clear
            </button>
          )}

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

    </div>
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

          KrishiConnect

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

            KrishiConnect

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
   LOGIN
========================= */

function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);


  const submit = async e => {

    e.preventDefault();

    setBusy(true);
    setError("");


    try {

      const r = await api.post(
        "/auth/login",
        form
      );

      saveSession(r.data);

      navigate(
        r.data.role === "ADMIN"
          ? "/admin"
          : r.data.role === "FARMER"
            ? "/farmer"
            : "/"
      );

      window.location.reload();

    } catch (e) {

      setError(
        e.response?.data?.error ||
        "Login failed."
      );

    } finally {

      setBusy(false);

    }
  };


  return (

    <Auth
      title="Welcome back"
      subtitle="Sign in to continue to your marketplace."
    >

      <form onSubmit={submit}>

        <label>
          Email

          <input
            type="email"
            value={form.email}
            onChange={e =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            placeholder="you@example.com"
            required
          />

        </label>


        <label>
          Password

          <input
            type="password"
            value={form.password}
            onChange={e =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            placeholder="Your password"
            required
          />

        </label>


        <div className="form-links">

          <span></span>

          <Link to="/forgot-password">
            Forgot password?
          </Link>

        </div>


        {error && (
          <div className="notice error">
            {error}
          </div>
        )}


        <button
          className="primary-btn full"
          disabled={busy}
        >
          {busy
            ? "Signing in…"
            : "Sign in"}
        </button>

      </form>


      <p className="auth-switch">
        New here?{" "}
        <Link to="/register">
          Create an account
        </Link>
      </p>

    </Auth>
  );
}


/* =========================
   REGISTER
========================= */

function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CONSUMER"
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);


  const submit = async e => {

    e.preventDefault();

    setBusy(true);
    setError("");


    try {

      await api.post(
        "/auth/register",
        form
      );

      navigate("/login");

    } catch (e) {

      setError(
        e.response?.data?.error ||
        "Registration failed."
      );

    } finally {

      setBusy(false);

    }
  };


  return (

    <Auth
      title="Create your account"
      subtitle="Choose how you want to use KrishiConnect."
    >

      <form onSubmit={submit}>

        <label>
          Full name

          <input
            placeholder="Your name"
            value={form.name}
            onChange={e =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
            required
          />

        </label>


        <label>
          Email

          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            required
          />

        </label>


        <label>
          Password

          <input
            type="password"
            minLength="8"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={e =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            required
          />

        </label>


        <label>
          Account type

          <select
            value={form.role}
            onChange={e =>
              setForm({
                ...form,
                role: e.target.value
              })
            }
          >
            <option value="CONSUMER">
              Consumer — buy produce
            </option>

            <option value="FARMER">
              Farmer — sell produce
            </option>
          </select>

        </label>


        {error && (
          <div className="notice error">
            {error}
          </div>
        )}


        <button
          className="primary-btn full"
          disabled={busy}
        >
          {busy
            ? "Creating…"
            : "Create account"}
        </button>

      </form>


      <p className="auth-switch">

        Already have an account?{" "}

        <Link to="/login">
          Sign in
        </Link>

      </p>

    </Auth>
  );
}


/* =========================
   FORGOT PASSWORD
========================= */

function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");


  const submit = async e => {

    e.preventDefault();

    setBusy(true);
    setError("");


    try {

      await api.post(
        "/auth/forgot-password",
        { email }
      );

      setSent(true);

    } catch (e) {

      setError(
        e.response?.data?.error ||
        "Could not process request."
      );

    } finally {

      setBusy(false);

    }
  };


  return (

    <Auth
      title="Reset your password"
      subtitle="Enter your account email and we’ll send a secure reset link."
    >

      {sent ? (

        <div className="success-box">

          <Mail size={30} />

          <h3>
            Check your inbox
          </h3>

          <p>
            If an account exists for that email,
            a reset link has been sent.
            The link expires in 30 minutes.
          </p>

          <Link
            className="primary-btn full"
            to="/login"
          >
            Back to sign in
          </Link>

        </div>

      ) : (

        <form onSubmit={submit}>

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={e =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              required
            />

          </label>


          {error && (
            <div className="notice error">
              {error}
            </div>
          )}


          <button
            className="primary-btn full"
            disabled={busy}
          >
            {busy
              ? "Sending…"
              : "Send reset link"}
          </button>


          <p className="auth-switch">

            <Link to="/login">
              ← Back to sign in
            </Link>

          </p>

        </form>

      )}

    </Auth>
  );
}


/* =========================
   RESET PASSWORD
========================= */

function ResetPassword() {

  const token =
    new URLSearchParams(
      useLocation().search
    ).get("token") || "";

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);


  const submit = async e => {

    e.preventDefault();


    if (password !== confirm) {
      return setError(
        "Passwords do not match."
      );
    }


    setBusy(true);
    setError("");


    try {

      await api.post(
        "/auth/reset-password",
        {
          token,
          password
        }
      );

      setDone(true);

    } catch (e) {

      setError(
        e.response?.data?.error ||
        "Reset link is invalid or expired."
      );

    } finally {

      setBusy(false);

    }
  };


  return (

    <Auth
      title="Set a new password"
      subtitle="Choose a strong password you haven’t used before."
    >

      {done ? (

        <div className="success-box">

          <CheckCircle2 size={32} />

          <h3>
            Password updated
          </h3>

          <p>
            Your password has been changed successfully.
          </p>

          <button
            className="primary-btn full"
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>

        </div>

      ) : (

        <form onSubmit={submit}>

          <label>
            New password

            <input
              type="password"
              minLength="8"
              value={password}
              onChange={e =>
                setPassword(e.target.value)
              }
              required
            />

          </label>


          <label>
            Confirm password

            <input
              type="password"
              minLength="8"
              value={confirm}
              onChange={e =>
                setConfirm(e.target.value)
              }
              required
            />

          </label>


          {error && (
            <div className="notice error">
              {error}
            </div>
          )}


          <button
            className="primary-btn full"
            disabled={busy || !token}
          >
            {busy
              ? "Updating…"
              : "Update password"}
          </button>

        </form>

      )}

    </Auth>
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


  useEffect(() => {

    api
      .get("/categories")
      .then(r => setCategories(r.data))
      .catch(() => {
        setCategories([]);
      });

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

    </section>
  );
}


/* =========================
   ADMIN
========================= */

function Admin() {

  const [d, setD] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState("");


  const load = () => {

    api
      .get("/admin/dashboard")
      .then(r => setD(r.data))
      .catch(e =>
        setError(
          e.response?.data?.error ||
          "Could not load dashboard"
        )
      );


    api
      .get("/admin/products/pending")
      .then(r =>
        setPending(
          r.data.content ||
          r.data ||
          []
        )
      )
      .catch(() => {});

  };


  useEffect(load, []);


  const act = async (id, type) => {

    await api.patch(
      `/admin/products/${id}/${type}`
    );

    load();

  };


  return (

    <section className="page-section">

      <div className="page-heading">

        <div>

          <span className="section-kicker">
            CONTROL CENTER
          </span>

          <h1>
            Admin dashboard
          </h1>

        </div>


        <span className="status-chip">

          <ShieldCheck size={15} />

          Protected

        </span>

      </div>


      {error && (
        <div className="notice error">
          {error}
        </div>
      )}


      <div className="stats modern-stats">

        <div>

          <UserRound />

          <b>
            {d?.users ?? "—"}
          </b>

          <span>
            Registered users
          </span>

        </div>


        <div>

          <Package />

          <b>
            {d?.products ?? "—"}
          </b>

          <span>
            Total products
          </span>

        </div>


        <div>

          <ShoppingCart />

          <b>
            {d?.orders ?? "—"}
          </b>

          <span>
            Total orders
          </span>

        </div>

      </div>


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
            {pending.length} pending
          </span>

        </div>


        {!pending.length ? (

          <div className="empty-inline">

            <CheckCircle2 />

            Nothing waiting for review.

          </div>

        ) : (

          pending.map(p => (

            <div
              className="review-row"
              key={p.id}
            >

              <div>

                <b>
                  {p.name}
                </b>

                <span>
                  {p.description}
                </span>

              </div>


              <div className="review-actions">

                <button
                  className="approve"
                  onClick={() =>
                    act(p.id, "approve")
                  }
                >
                  Approve
                </button>


                <button
                  className="reject"
                  onClick={() =>
                    act(p.id, "reject")
                  }
                >
                  Reject
                </button>

              </div>

            </div>

          ))

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
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
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
          element={<Cart />}
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
