import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Minus,
  Milk,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  X,
} from "lucide-react";
import "./dairy-marketplace.css";

const DAIRY_PRODUCTS = [
  {
    id: 1,
    name: "Fresh Cow Milk",
    category: "Milk",
    seller: "Local Dairy Partner",
    price: 60,
    unit: "litre",
    emoji: "🥛",
    description: "Fresh milk from a local dairy producer.",
  },
  {
    id: 2,
    name: "Buffalo Milk",
    category: "Milk",
    seller: "Local Dairy Partner",
    price: 75,
    unit: "litre",
    emoji: "🐃",
    description: "Rich buffalo milk for everyday use.",
  },
  {
    id: 3,
    name: "Fresh Curd",
    category: "Curd",
    seller: "Local Dairy Partner",
    price: 45,
    unit: "500 g",
    emoji: "🥣",
    description: "Fresh curd for your daily meals.",
  },
  {
    id: 4,
    name: "Farm Fresh Paneer",
    category: "Paneer",
    seller: "Local Dairy Partner",
    price: 100,
    unit: "200 g",
    emoji: "🧀",
    description: "Soft paneer for home cooking.",
  },
  {
    id: 5,
    name: "Pure Desi Ghee",
    category: "Ghee",
    seller: "Local Dairy Partner",
    price: 280,
    unit: "250 g",
    emoji: "🫙",
    description: "Traditional ghee from a local seller.",
  },
  {
    id: 6,
    name: "Fresh Buttermilk",
    category: "Curd",
    seller: "Local Dairy Partner",
    price: 25,
    unit: "500 ml",
    emoji: "🥤",
    description: "A refreshing dairy drink.",
  },
];

const CATEGORIES = ["All", "Milk", "Curd", "Paneer", "Ghee"];

export default function DairyMarketplace() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [frequency, setFrequency] = useState("Daily");
  const [area, setArea] = useState("");
  const [message, setMessage] = useState("");

  const products = useMemo(() => {
    const query = search.trim().toLowerCase();

    return DAIRY_PRODUCTS.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.seller.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const cartItems = DAIRY_PRODUCTS.filter(
    (product) => (cart[product.id] || 0) > 0
  );

  const cartCount = Object.values(cart).reduce(
    (total, count) => total + count,
    0
  );

  const cartTotal = cartItems.reduce(
    (total, product) => total + product.price * cart[product.id],
    0
  );

  function updateCart(productId, change) {
    setCart((current) => {
      const nextQuantity = Math.max(0, (current[productId] || 0) + change);

      return {
        ...current,
        [productId]: nextQuantity,
      };
    });

    setMessage("");
  }

  function closeSubscription() {
    setSubscriptionOpen(false);
    setMessage("");
  }

  function requestSubscription(event) {
    event.preventDefault();

    if (!area.trim()) {
      setMessage("Please enter your delivery area.");
      return;
    }

    setMessage(
      "Your preferences are ready. Subscription activation requires a connected ordering backend."
    );
  }

  return (
    <div className="dairy-page">
      <div className="dairy-topbar">
        <Link to="/" className="dairy-back-link">
          <ArrowLeft size={17} />
          Back to KisanDirect
        </Link>

        <button
          type="button"
          className="dairy-cart-button"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart size={18} />
          Basket
          <span>{cartCount}</span>
        </button>
      </div>

      <section className="dairy-hero">
        <div className="dairy-hero-copy">
          <span className="dairy-eyebrow">
            <Milk size={15} />
            KISANDIRECT DAIRY
          </span>

          <h1>
            Dairy essentials,
            <br />
            <span>closer to home.</span>
          </h1>

          <p>
            Discover milk and everyday dairy products from local producers.
            Explore your options and choose what works for your household.
          </p>

          <div className="dairy-hero-actions">
            <a href="#dairy-products" className="dairy-primary-button">
              Explore dairy
              <ArrowRight size={17} />
            </a>

            <button
              type="button"
              className="dairy-secondary-button"
              onClick={() => setSubscriptionOpen(true)}
            >
              <CalendarDays size={17} />
              Milk subscription
            </button>
          </div>

          <div className="dairy-trust-row">
            <span>
              <ShieldCheck size={16} />
              Seller information
            </span>
            <span>
              <Truck size={16} />
              Local delivery options
            </span>
          </div>
        </div>

        <div className="dairy-hero-art" aria-label="Dairy products">
          <div className="dairy-art-circle">
            <span>🥛</span>
          </div>
          <div className="dairy-art-note dairy-art-note-one">
            <span>🥣</span>
            Fresh curd
          </div>
          <div className="dairy-art-note dairy-art-note-two">
            <span>🧀</span>
            Paneer &amp; more
          </div>
        </div>
      </section>

      <section className="dairy-benefits">
        <div>
          <Store size={21} />
          <span>
            <strong>Local sellers</strong>
            <small>Discover nearby producers</small>
          </span>
        </div>

        <div>
          <CalendarDays size={21} />
          <span>
            <strong>Flexible preferences</strong>
            <small>Explore recurring delivery</small>
          </span>
        </div>

        <div>
          <Clock3 size={21} />
          <span>
            <strong>Convenient shopping</strong>
            <small>Browse in one place</small>
          </span>
        </div>
      </section>

      <section className="dairy-products-section" id="dairy-products">
        <div className="dairy-section-heading">
          <div>
            <span className="dairy-section-kicker">OUR COLLECTION</span>
            <h2>Everyday dairy essentials</h2>
            <p>Find the products you need for your daily routine.</p>
          </div>

          <span className="dairy-product-count">
            {products.length} products
          </span>
        </div>

        <div className="dairy-search">
          <Search size={19} />
          <input
            type="search"
            placeholder="Search milk, curd, paneer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search dairy products"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div className="dairy-categories">
          {CATEGORIES.map((item) => (
            <button
              type="button"
              key={item}
              className={
                category === item ? "dairy-category active" : "dairy-category"
              }
              onClick={() => setCategory(item)}
            >
              {item === "Milk" ? <Milk size={16} /> : null}
              {item}
            </button>
          ))}
        </div>

        {products.length > 0 ? (
          <div className="dairy-product-grid">
            {products.map((product) => (
              <article className="dairy-product-card" key={product.id}>
                <div className="dairy-product-art">
                  <span>{product.emoji}</span>
                  <small>{product.category}</small>
                </div>

                <div className="dairy-product-info">
                  <div className="dairy-seller-name">
                    <Store size={13} />
                    {product.seller}
                  </div>

                  <h3>{product.name}</h3>
                  <p>{product.description}</p>

                  <div className="dairy-product-bottom">
                    <div>
                      <strong>₹{product.price.toLocaleString("en-IN")}</strong>
                      <small> / {product.unit}</small>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateCart(product.id, 1)}
                      aria-label={"Add " + product.name + " to basket"}
                    >
                      <Plus size={17} />
                      Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="dairy-empty-state">
            <Milk size={35} />
            <h3>No dairy products found</h3>
            <p>Try a different search or product category.</p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className="dairy-subscription-banner">
        <div className="dairy-subscription-icon">
          <CalendarDays size={29} />
        </div>

        <div>
          <span className="dairy-section-kicker">YOUR DAILY ROUTINE</span>
          <h2>Need milk regularly?</h2>
          <p>
            Explore daily and weekly delivery preferences for your household.
          </p>
        </div>

        <button type="button" onClick={() => setSubscriptionOpen(true)}>
          Explore subscriptions
          <ArrowRight size={17} />
        </button>
      </section>

      {cartOpen && (
        <div
          className="dairy-modal-overlay"
          onClick={() => setCartOpen(false)}
        >
          <section
            className="dairy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dairy-cart-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dairy-modal-header">
              <div>
                <span className="dairy-section-kicker">YOUR ORDER</span>
                <h2 id="dairy-cart-title">Dairy basket</h2>
              </div>

              <button
                type="button"
                className="dairy-close-button"
                onClick={() => setCartOpen(false)}
                aria-label="Close basket"
              >
                <X size={20} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="dairy-empty-cart">
                <ShoppingBag size={38} />
                <h3>Your basket is empty</h3>
                <p>Add some dairy products to get started.</p>
                <button type="button" onClick={() => setCartOpen(false)}>
                  Browse products
                </button>
              </div>
            ) : (
              <>
                <div className="dairy-cart-items">
                  {cartItems.map((product) => (
                    <div className="dairy-cart-item" key={product.id}>
                      <span className="dairy-cart-emoji">{product.emoji}</span>

                      <div className="dairy-cart-item-info">
                        <strong>{product.name}</strong>
                        <small>
                          ₹{product.price} / {product.unit}
                        </small>

                        <div className="dairy-quantity-control">
                          <button
                            type="button"
                            onClick={() => updateCart(product.id, -1)}
                            aria-label={"Remove one " + product.name}
                          >
                            <Minus size={14} />
                          </button>

                          <span>{cart[product.id]}</span>

                          <button
                            type="button"
                            onClick={() => updateCart(product.id, 1)}
                            aria-label={"Add one " + product.name}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <strong>₹{product.price * cart[product.id]}</strong>
                    </div>
                  ))}
                </div>

                <div className="dairy-cart-total">
                  <span>Subtotal</span>
                  <strong>₹{cartTotal.toLocaleString("en-IN")}</strong>
                </div>

                <p className="dairy-prototype-note">
                  This basket is a frontend preview. Checkout and payment will
                  work after backend integration.
                </p>
              </>
            )}
          </section>
        </div>
      )}

      {subscriptionOpen && (
        <div className="dairy-modal-overlay" onClick={closeSubscription}>
          <section
            className="dairy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dairy-subscription-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dairy-modal-header">
              <div>
                <span className="dairy-section-kicker">RECURRING DELIVERY</span>
                <h2 id="dairy-subscription-title">
                  Milk subscription preferences
                </h2>
              </div>

              <button
                type="button"
                className="dairy-close-button"
                onClick={closeSubscription}
                aria-label="Close subscription form"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="dairy-subscription-form"
              onSubmit={requestSubscription}
            >
              <label>
                Milk quantity per delivery
                <select
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                >
                  <option value="0.5">500 ml</option>
                  <option value="1">1 litre</option>
                  <option value="1.5">1.5 litres</option>
                  <option value="2">2 litres</option>
                </select>
              </label>

              <label>
                Delivery frequency
                <select
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value)}
                >
                  <option value="Daily">Daily</option>
                  <option value="Alternate days">Alternate days</option>
                  <option value="Weekly">Selected weekly schedule</option>
                </select>
              </label>

              <label>
                Your delivery area
                <input
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  placeholder="e.g. Kolar Road, Bhopal"
                  required
                />
              </label>

              <div className="dairy-subscription-summary">
                <CalendarDays size={19} />
                <span>
                  <strong>{quantity} litre(s) per delivery</strong>
                  <small>
                    {frequency} · {area || "Area not entered"}
                  </small>
                </span>
              </div>

              {message && (
                <div className="dairy-form-message" role="status">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="dairy-primary-button dairy-submit-button"
              >
                Save preferences
                <Check size={17} />
              </button>

              <p className="dairy-prototype-note">
                Saving preferences does not create a paid subscription. Seller
                availability, scheduled orders, and billing require backend
                integration.
              </p>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

