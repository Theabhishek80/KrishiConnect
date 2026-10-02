import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Loader2,
  ImageOff
} from "lucide-react";

import api from "../../api";

export default function Cart() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  const loadCart = async () => {
    try {
      setError("");

      const response = await api.get("/cart");

      setCart(response.data);
    } catch (error) {
      console.error("Failed to load cart:", error);

      setError(
        error.response?.data?.message ||
        "Could not load your cart."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const items = cart?.items || [];

  const total =
    cart?.total ??
    items.reduce(
      (sum, item) =>
        sum +
        Number(item.product?.price || 0) *
          Number(item.quantity || 0),
      0
    );

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      return;
    }

    try {
      setUpdatingId(productId);
      setError("");

      const response = await api.patch(
        `/cart/items/${productId}`,
        {
          quantity
        }
      );

      setCart(response.data);
    } catch (error) {
      console.error(
        "Failed to update quantity:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Could not update quantity."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async productId => {
    try {
      setRemovingId(productId);
      setError("");

      await api.delete(
        `/cart/items/${productId}`
      );

      await loadCart();
    } catch (error) {
      console.error(
        "Failed to remove item:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Could not remove item."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const goToCheckout = () => {
    if (!items.length) {
      return;
    }

    navigate("/checkout");
  };

  if (loading) {
    return (
      <section className="page-section cart-page">
        <div className="cart-loading">
          <Loader2
            size={30}
            className="spin"
          />

          <p>Loading your cart...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section cart-page">

      {/* HEADER */}
      <div className="page-heading">

        <div>
          <span className="section-kicker">
            YOUR BASKET
          </span>

          <h1>
            Shopping cart
          </h1>

          <p className="cart-subtitle">
            Review your products before checkout.
          </p>
        </div>

        <Link
          to="/"
          className="cart-continue-link"
        >
          Continue shopping
          <ArrowRight size={17} />
        </Link>

      </div>

      {/* ERROR */}
      {error && (
        <div className="cart-error">
          {error}
        </div>
      )}

      {/* EMPTY CART */}
      {!items.length ? (
        <div className="cart-empty">

          <div className="cart-empty-icon">
            <ShoppingBag size={42} />
          </div>

          <h2>
            Your cart is empty
          </h2>

          <p>
            Explore fresh products from farmers
            and add something you love.
          </p>

          <Link
            to="/"
            className="primary-btn cart-shop-btn"
          >
            Start shopping
            <ArrowRight size={17} />
          </Link>

        </div>
      ) : (

        <div className="cart-layout">

          {/* CART ITEMS */}
          <div className="cart-items-section">

            <div className="cart-items-header">
              <div>
                <h2>
                  Your items
                </h2>

                <span>
                  {items.length}{" "}
                  {items.length === 1
                    ? "item"
                    : "items"}
                </span>
              </div>
            </div>

            <div className="cart-items">

              {items.map(item => {

                const product =
                  item.product || {};

                const productId =
                  product.id;

                const image =
                  product.images?.[0];

                const price =
                  Number(product.price || 0);

                const quantity =
                  Number(item.quantity || 0);

                const subtotal =
                  Number(
                    item.subtotal ??
                    price * quantity
                  );

                const updating =
                  updatingId === productId;

                const removing =
                  removingId === productId;

                return (
                  <article
                    className={`cart-item ${
                      removing
                        ? "cart-item-removing"
                        : ""
                    }`}
                    key={item.id || productId}
                  >

                    {/* IMAGE */}
                    <div className="cart-product-image">

                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="cart-image-placeholder">
                          <ImageOff size={28} />
                        </div>
                      )}

                    </div>

                    {/* PRODUCT INFO */}
                    <div className="cart-product-info">

                      <h3>
                        {product.name}
                      </h3>

                      <p className="cart-product-unit">
                        ₹{price.toFixed(2)}
                        {product.unit
                          ? ` / ${product.unit}`
                          : ""}
                      </p>

                      {product.description && (
                        <p className="cart-product-description">
                          {product.description}
                        </p>
                      )}

                    </div>

                    {/* QUANTITY */}
                    <div className="cart-quantity">

                      <span>
                        Quantity
                      </span>

                      <div className="quantity-control">

                        <button
                          type="button"
                          disabled={
                            updating ||
                            quantity <= 1
                          }
                          onClick={() =>
                            updateQuantity(
                              productId,
                              quantity - 1
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>

                        <strong>
                          {updating ? (
                            <Loader2
                              size={16}
                              className="spin"
                            />
                          ) : (
                            quantity
                          )}
                        </strong>

                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            updateQuantity(
                              productId,
                              quantity + 1
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>

                      </div>

                    </div>

                    {/* SUBTOTAL */}
                    <div className="cart-item-price">

                      <span>
                        Subtotal
                      </span>

                      <strong>
                        ₹{subtotal.toFixed(2)}
                      </strong>

                    </div>

                    {/* REMOVE */}
                    <button
                      type="button"
                      className="cart-remove-btn"
                      disabled={removing}
                      onClick={() =>
                        removeItem(productId)
                      }
                      aria-label={`Remove ${product.name}`}
                    >
                      {removing ? (
                        <Loader2
                          size={18}
                          className="spin"
                        />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>

                  </article>
                );
              })}

            </div>
          </div>

          {/* SUMMARY */}
          <aside className="cart-summary">

            <div className="cart-summary-header">
              <ShoppingCart size={20} />

              <h2>
                Order summary
              </h2>
            </div>

            <div className="cart-summary-row">
              <span>
                Items
              </span>

              <span>
                {items.reduce(
                  (sum, item) =>
                    sum +
                    Number(
                      item.quantity || 0
                    ),
                  0
                )}
              </span>
            </div>

            <div className="cart-summary-row">
              <span>
                Subtotal
              </span>

              <span>
                ₹{Number(total).toFixed(2)}
              </span>
            </div>

            <div className="cart-summary-row">
              <span>
                Delivery
              </span>

              <span className="free-delivery">
                FREE
              </span>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total">
              <span>
                Total
              </span>

              <strong>
                ₹{Number(total).toFixed(2)}
              </strong>
            </div>

            <button
              type="button"
              className="cart-checkout-btn"
              onClick={goToCheckout}
            >
              Proceed to checkout
              <ArrowRight size={18} />
            </button>

            <p className="cart-secure-note">
              Secure checkout • Your payment
              details are protected.
            </p>

          </aside>

        </div>
      )}

    </section>
  );
}
