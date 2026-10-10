import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../utils/auth";

import {
  CheckCircle2,
  ChefHat,
  ClipboardCheck,
  Images,
  LayoutDashboard,
  Newspaper,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  UserRound,
  XCircle
} from "lucide-react";

import api from "../../api";
import AdvertisementManager from "../Advertisement/AdvertisementManager";
import RecipeManager from "../Recipes/RecipeManager";
import BlogManager from "../Blogs/BlogManager";


/* =========================
   HELPERS
========================= */

const STATUS_LABEL = {
  APPROVED: "Approved",
  PENDING_APPROVAL: "Pending",
  REJECTED: "Rejected",
  DRAFT: "Draft",
  INACTIVE: "Inactive"
};


const FILTERS = [
  ["ALL", "All"],
  ["APPROVED", "Approved"],
  ["PENDING_APPROVAL", "Pending"],
  ["REJECTED", "Rejected"],
  ["INACTIVE", "Inactive"]
];


const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: ClipboardCheck
  },
  {
    id: "products",
    label: "Products",
    icon: Package
  },
  {
    id: "ads",
    label: "Advertisements",
    icon: Images
  },
  {
    id: "recipes",
    label: "Recipes",
    icon: ChefHat
  },
  {
    id: "blogs",
    label: "Blogs",
    icon: Newspaper
  }
];


const errorMessage = error => {

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


const money = value =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;


function StatusBadge({ status }) {

  const key = status || "UNKNOWN";

  return (
    <span className={`kd-badge kd-badge-${key.toLowerCase()}`}>
      {STATUS_LABEL[key] || key}
    </span>
  );
}


function Thumb({ product }) {

  const url =
    product.images?.length > 0
      ? product.images[0]?.url
      : null;

  return url ? (
    <img
      className="kd-admin-thumb"
      src={url}
      alt={product.name}
    />
  ) : (
    <span className="kd-admin-thumb kd-admin-thumb-empty">
      🌱
    </span>
  );
}


function ProductRow({ product, children }) {

  return (
    <div className="kd-admin-row">

      <Thumb product={product} />

      <div className="kd-admin-row-info">

        <div className="kd-admin-row-title">

          <strong>
            {product.name}
          </strong>

          <StatusBadge
            status={product.status}
          />

        </div>

        <span>
          {money(product.price)}
          {" / "}
          {product.unit}
          {" · "}
          {product.farmer?.name || "Unknown farmer"}
        </span>

        {product.description && (
          <small>
            {product.description}
          </small>
        )}

      </div>

      <div className="kd-admin-row-actions">
        {children}
      </div>

    </div>
  );
}


/* =========================
   ADMIN PANEL
========================= */

export default function AdminPanel({
  defaultTab = "overview"
}) {

  const navigate = useNavigate();
  const user = getStoredUser();


  const [tab, setTab] = useState(
    TABS.some(item => item.id === defaultTab)
      ? defaultTab
      : "overview"
  );


  useEffect(() => {

    if (!user) {
      navigate("/login", {
        replace: true
      });
    }

    else if (user.role !== "ADMIN") {
      navigate("/", {
        replace: true
      });
    }

  }, [navigate, user?.role]);


  if (!user || user.role !== "ADMIN") {
    return null;
  }


  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");


  const toList = response => {

    const data =
      response.data?.content ||
      response.data ||
      [];

    return Array.isArray(data)
      ? data
      : [];
  };


  const load = async () => {

    setLoading(true);
    setError("");


    const results =
      await Promise.allSettled([

        api.get("/admin/dashboard"),

        api.get(
          "/admin/products/pending"
        ),

        api.get(
          "/admin/products"
        )

      ]);


    const [dash, pend, all] =
      results;


    if (dash.status === "fulfilled") {
      setStats(
        dash.value.data
      );
    }


    if (pend.status === "fulfilled") {
      setPending(
        toList(pend.value)
      );
    }


    if (all.status === "fulfilled") {
      setProducts(
        toList(all.value)
      );
    }


    const failed =
      results.find(
        r => r.status === "rejected"
      );


    if (failed) {
      setError(
        errorMessage(
          failed.reason
        )
      );
    }


    setLoading(false);
  };


  useEffect(() => {
    load();
  }, []);


  /* =========================
     APPROVE / REJECT
  ========================= */

  const review = async (
    id,
    type
  ) => {

    setBusyKey(
      `${type}-${id}`
    );

    setError("");


    try {

      await api.patch(
        `/admin/products/${id}/${type}`
      );

      await load();

    } catch (e) {

      setError(
        errorMessage(e)
      );

    } finally {

      setBusyKey(null);

    }
  };


  /* =========================
     SAFE ADMIN DELETE
  ========================= */

  const remove = async id => {

    const product =
      products.find(
        p => p.id === id
      );


    const productName =
      product?.name ||
      "this product";


    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${productName}"?\n\n` +
        "If this product already has orders, " +
        "it will be archived instead of permanently deleted."
      );


    if (!confirmed) {
      return;
    }


    setBusyKey(
      `delete-${id}`
    );

    setError("");


    try {

      const response =
        await api.delete(
          `/admin/products/${id}`
        );


      const message =
        response.data?.message ||
        "Product deleted successfully.";


      /*
       * Show backend result to admin.
       *
       * Example:
       * Product deleted successfully.
       *
       * OR:
       * Product archived because it has order history.
       */
      setError("");


      /*
       * Temporary browser message.
       *
       * This avoids adding another state variable
       * and keeps the existing AdminPanel structure.
       */
      window.alert(message);


      await load();


    } catch (e) {

      console.error(
        "Admin product deletion failed:",
        e
      );


      setError(
        errorMessage(e)
      );

    } finally {

      setBusyKey(null);

    }
  };


  /* =========================
     FILTER PRODUCTS
  ========================= */

  const visibleProducts =
    useMemo(() => {

      const q =
        query
          .trim()
          .toLowerCase();


      return products.filter(
        p => {

          if (
            filter !== "ALL" &&
            p.status !== filter
          ) {
            return false;
          }


          if (!q) {
            return true;
          }


          return (
            p.name
              ?.toLowerCase()
              .includes(q) ||

            p.farmer?.name
              ?.toLowerCase()
              .includes(q)
          );

        }
      );

    }, [
      products,
      query,
      filter
    ]);


  const pendingCount =
    loading
      ? "…"
      : pending.length;


  const value = v =>
    loading && !stats
      ? "…"
      : v ?? 0;


  /* =========================
     APPROVAL BUTTONS
  ========================= */

  const approvalButtons =
    product => {

      const approving =
        busyKey ===
        `approve-${product.id}`;


      const rejecting =
        busyKey ===
        `reject-${product.id}`;


      const disabled =
        approving ||
        rejecting;


      return (
        <>

          <button
            type="button"
            className="kd-btn kd-btn-approve"
            disabled={disabled}
            onClick={() =>
              review(
                product.id,
                "approve"
              )
            }
          >

            <CheckCircle2
              size={16}
            />

            {approving
              ? "Approving…"
              : "Approve"}

          </button>


          <button
            type="button"
            className="kd-btn kd-btn-reject"
            disabled={disabled}
            onClick={() =>
              review(
                product.id,
                "reject"
              )
            }
          >

            <XCircle
              size={16}
            />

            {rejecting
              ? "Rejecting…"
              : "Reject"}

          </button>

        </>
      );
    };


  /* =========================
     OVERVIEW
  ========================= */

  const overview = (

    <>

      <div className="kd-admin-stats">

        <div className="kd-stat kd-stat-green">

          <span className="kd-stat-icon">
            <UserRound
              size={20}
            />
          </span>

          <b>
            {value(
              stats?.users
            )}
          </b>

          <span>
            Registered users
          </span>

        </div>


        <div className="kd-stat kd-stat-blue">

          <span className="kd-stat-icon">
            <Package
              size={20}
            />
          </span>

          <b>
            {value(
              stats?.products
            )}
          </b>

          <span>
            Total products
          </span>

        </div>


        <div className="kd-stat kd-stat-amber">

          <span className="kd-stat-icon">
            <ClipboardCheck
              size={20}
            />
          </span>

          <b>
            {
              loading
                ? "…"
                : stats?.pendingProducts ??
                  pending.length
            }
          </b>

          <span>
            Awaiting approval
          </span>

        </div>


        <div className="kd-stat kd-stat-violet">

          <span className="kd-stat-icon">
            <ShoppingCart
              size={20}
            />
          </span>

          <b>
            {value(
              stats?.orders
            )}
          </b>

          <span>
            Total orders
          </span>

        </div>

      </div>


      <div className="kd-admin-card">

        <div className="kd-admin-card-head">

          <div>

            <h2>
              Needs your attention
            </h2>

            <p>
              Newest products waiting for review.
            </p>

          </div>


          {pending.length > 3 && (

            <button
              type="button"
              className="kd-link-btn"
              onClick={() =>
                setTab("approvals")
              }
            >
              View all {pending.length}
            </button>

          )}

        </div>


        {loading &&
        !pending.length ? (

          <div className="empty-inline">
            Loading…
          </div>

        ) : !pending.length ? (

          <div className="empty-inline">

            <CheckCircle2 />

            You're all caught up.

          </div>

        ) : (

          pending
            .slice(0, 3)
            .map(p => (

              <ProductRow
                key={p.id}
                product={p}
              >

                {approvalButtons(p)}

              </ProductRow>

            ))

        )}

      </div>

    </>
  );


  /* =========================
     APPROVALS
  ========================= */

  const approvals = (

    <div className="kd-admin-card">

      <div className="kd-admin-card-head">

        <div>

          <h2>
            Products awaiting approval
          </h2>

          <p>
            Approve products to show them on the marketplace.
          </p>

        </div>

        <span className="kd-count">
          {pendingCount} pending
        </span>

      </div>


      {loading &&
      !pending.length ? (

        <div className="empty-inline">
          Loading pending products…
        </div>

      ) : !pending.length ? (

        <div className="empty-inline">

          <CheckCircle2 />

          Nothing waiting for review.

        </div>

      ) : (

        pending.map(p => (

          <ProductRow
            key={p.id}
            product={p}
          >

            {approvalButtons(p)}

          </ProductRow>

        ))

      )}

    </div>
  );


  /* =========================
     PRODUCTS
  ========================= */

  const productsTab = (

    <div className="kd-admin-card">

      <div className="kd-admin-card-head">

        <div>

          <h2>
            Product management
          </h2>

          <p>
            Search, filter and safely remove products.
          </p>

        </div>

        <span className="kd-count">
          {visibleProducts.length} shown
        </span>

      </div>


      <div className="kd-admin-toolbar">

        <label className="kd-admin-search">

          <Search
            size={17}
          />

          <input
            value={query}
            onChange={e =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Search by product or farmer"
            aria-label="Search products"
          />

        </label>


        <div
          className="kd-chips"
          role="tablist"
        >

          {FILTERS.map(
            ([id, label]) => (

              <button
                key={id}
                type="button"
                className={
                  filter === id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter(id)
                }
              >
                {label}
              </button>

            )
          )}

        </div>

      </div>


      {loading &&
      !products.length ? (

        <div className="empty-inline">
          Loading products…
        </div>

      ) : !visibleProducts.length ? (

        <div className="empty-inline">

          <Package />

          No products found.

        </div>

      ) : (

        visibleProducts.map(
          p => (

            <ProductRow
              key={p.id}
              product={p}
            >

              <button
                type="button"
                className="kd-btn kd-btn-reject"
                disabled={
                  busyKey ===
                  `delete-${p.id}`
                }
                onClick={() =>
                  remove(p.id)
                }
              >

                <Trash2
                  size={16}
                />

                {
                  busyKey ===
                  `delete-${p.id}`
                    ? "Deleting…"
                    : "Delete"
                }

              </button>

            </ProductRow>

          )
        )

      )}

    </div>
  );


  /* =========================
     RENDER
  ========================= */

  return (

    <section className="kd-admin">

      <aside className="kd-admin-side">

        <div className="kd-admin-side-head">

          <span className="kd-admin-logo">
            <ShieldCheck
              size={20}
            />
          </span>

          <div>

            <strong>
              Control Center
            </strong>

            <small>
              KisanDirect Admin
            </small>

          </div>

        </div>


        <nav
          className="kd-admin-nav"
          aria-label="Admin sections"
        >

          {TABS.map(
            ({
              id,
              label,
              icon: Icon
            }) => (

              <button
                key={id}
                type="button"
                className={
                  tab === id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setTab(id)
                }
              >

                <Icon
                  size={18}
                />

                <span>
                  {label}
                </span>


                {id ===
                  "approvals" &&
                  pending.length >
                    0 && (

                    <em>
                      {pending.length}
                    </em>

                  )}

              </button>

            )
          )}

        </nav>

      </aside>


      <div className="kd-admin-main">

        <div className="kd-admin-top">

          <div>

            <span className="section-kicker">
              CONTROL CENTER
            </span>

            <h1>
              {
                TABS.find(
                  t => t.id === tab
                )?.label
              }
            </h1>

          </div>


          <button
            type="button"
            className="kd-refresh"
            onClick={load}
            disabled={loading}
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>


        {error && (
          <div className="notice error">
            {error}
          </div>
        )}


        {tab === "overview" &&
          overview}

        {tab === "approvals" &&
          approvals}

        {tab === "products" &&
          productsTab}

        {tab === "ads" &&
          <AdvertisementManager />}

        {tab === "recipes" &&
          <RecipeManager />}

        {tab === "blogs" &&
          <BlogManager />}

      </div>

    </section>
  );
}
