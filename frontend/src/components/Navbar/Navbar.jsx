import React, { useEffect, useState } from "react";

import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  Bell,
  ChevronRight,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Sprout,
  UserRound,
  X
} from "lucide-react";

export default function Navbar({ user, onLogout }) {

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isFarmer = user?.role === "FARMER";

  const closeAll = () => {
    setMobileOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(false);
  };

  useEffect(() => {
    closeAll();
  }, [location.pathname, location.search]);

  useEffect(() => {

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        closeAll();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, []);

  const submitSearch = event => {

    event.preventDefault();

    const value = search.trim();

    if (!value) {
      navigate("/");
      return;
    }

    closeAll();

    navigate(
      `/?q=${encodeURIComponent(value)}`
    );
  };

  const openAccount = () => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(true);
  };

  const openNotifications = () => {
    setMobileOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(true);
  };

  const navigateFromAccount = path => {
    closeAll();
    navigate(path);
  };

  const requestLogout = () => {
    closeAll();

    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="kd-navbar">

        <div className="kd-navbar-inner">

          {/* BRAND */}

          <Link
            className="kd-brand"
            to="/"
            onClick={closeAll}
            aria-label="KisanDirect home"
          >

            <span
              className="kd-brand-mark"
              aria-hidden="true"
            >
              <span className="kd-brand-k">
                K
              </span>

              <span className="kd-brand-leaf">
                ⌁
              </span>
            </span>

            <span className="kd-brand-word">
              Kisan<span>Direct</span>
            </span>

          </Link>


          {/* SEARCH */}

          {!isAdmin && (

            <form
              className="kd-search"
              onSubmit={submitSearch}
              role="search"
            >

              <Search
                size={18}
                aria-hidden="true"
              />

              <input
                value={search}
                onChange={event =>
                  setSearch(event.target.value)
                }
                placeholder="Search products, recipes, mandi rates..."
                aria-label="Search KisanDirect"
              />

              {search && (

                <button
                  type="button"
                  className="kd-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>

              )}

            </form>

          )}


          {/* DESKTOP / MOBILE NAV */}

          <nav
            className={
              mobileOpen
                ? "kd-nav-links kd-nav-open"
                : "kd-nav-links"
            }
            aria-label="Primary navigation"
          >

            <Link
              to="/"
              onClick={closeAll}
            >
              <Home size={17} />
              <span>Home</span>
            </Link>


            <Link
              to="/about"
              onClick={closeAll}
            >
              <Info size={17} />
              <span>About Us</span>
            </Link>


            {/* CART */}

            {user && !isAdmin && (

              <Link
                to="/cart"
                onClick={closeAll}
              >
                <ShoppingCart size={17} />
                <span>Cart</span>
              </Link>

            )}


            {/* FARMER */}

            {isFarmer && (

              <Link
                to="/farmer"
                onClick={closeAll}
              >
                <Sprout size={17} />
                <span>Farmer</span>
              </Link>

            )}


            {/* ADMIN */}

            {isAdmin && (

              <Link
                to="/admin"
                onClick={closeAll}
              >
                <LayoutDashboard size={17} />
                <span>Admin</span>
              </Link>

            )}


            {/* MOBILE PROFILE */}

            {user && (

              <button
                type="button"
                className="kd-mobile-profile-link"
                onClick={() =>
                  navigateFromAccount("/profile")
                }
              >

                {user.profileImageUrl ? (

                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="kd-mobile-profile-image"
                  />

                ) : (

                  <span className="kd-mobile-profile-avatar">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </span>

                )}

                <span>
                  My Profile
                </span>

              </button>

            )}


            {/* MOBILE AI */}

            {user && !isAdmin && (

              <button
                type="button"
                className="kd-mobile-ai"
                onClick={() =>
                  navigateFromAccount(
                    "/kisandirect-ai"
                  )
                }
              >
                <Sparkles size={16} />
                <span>KisanDirect AI</span>
              </button>

            )}


            {/* NOTIFICATIONS */}

            {user && !isAdmin && (

              <button
                type="button"
                className="kd-nav-icon-button"
                onClick={openNotifications}
                aria-label="Open notifications"
                title="Notifications"
              >
                <Bell size={19} />
              </button>

            )}


            {/* PROFILE */}

            {user ? (

              <button
                type="button"
                className="kd-profile-trigger"
                onClick={openAccount}
                aria-label="Open account menu"
              >

                {user.profileImageUrl ? (

                  <img
                    className="kd-profile-image"
                    src={user.profileImageUrl}
                    alt="Profile"
                  />

                ) : (

                  <span className="kd-avatar">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </span>

                )}

                <span className="kd-profile-name">
                  {user.name?.split(" ")[0] || "Account"}
                </span>

                <ChevronRight size={16} />

              </button>

            ) : (

              <Link
                className="kd-signin"
                to="/login"
                onClick={closeAll}
              >
                <UserRound size={17} />
                <span>Sign in</span>
              </Link>

            )}

          </nav>


          {/* MOBILE ACTIONS */}

          <div className="kd-mobile-actions">

            {user && !isAdmin && (

              <button
                type="button"
                className="kd-nav-icon-button"
                onClick={openNotifications}
                aria-label="Open notifications"
              >
                <Bell size={19} />
              </button>

            )}

            <button
              type="button"
              className="kd-mobile-menu"
              onClick={() =>
                setMobileOpen(value => !value)
              }
              aria-label={
                mobileOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={mobileOpen}
            >

              {mobileOpen ? (
                <X size={23} />
              ) : (
                <span>☰</span>
              )}

            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          FLOATING AI
      ===================================================== */}

      {user && !isAdmin && (

        <button
          type="button"
          className="kd-ai-floating"
          onClick={() =>
            navigate("/kisandirect-ai")
          }
          aria-label="Open KisanDirect AI"
        >

          <span className="kd-ai-sparkle">
            ✦
          </span>

          <span className="kd-ai-floating-text">
            KisanDirect AI
          </span>

        </button>

      )}


      {/* =====================================================
          ACCOUNT DRAWER
      ===================================================== */}

      {accountOpen && user && (

        <div
          className="kd-drawer-overlay"
          onClick={closeAll}
        >

          <aside
            className="kd-drawer"
            onClick={event =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="kd-drawer-header">

              <div className="kd-account-heading">

                {user.profileImageUrl ? (

                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="kd-drawer-profile-image"
                  />

                ) : (

                  <span className="kd-drawer-avatar">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </span>

                )}

                <div className="kd-account-heading-text">

                  <span className="kd-drawer-eyebrow">
                    {isAdmin
                      ? "ADMIN ACCOUNT"
                      : isFarmer
                      ? "FARMER ACCOUNT"
                      : "ACCOUNT"}
                  </span>

                  <h2>
                    {user.name || "My Account"}
                  </h2>

                  <p>
                    {user.email}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="kd-drawer-close"
                onClick={closeAll}
                aria-label="Close account menu"
              >
                <X size={20} />
              </button>

            </div>


            {/* CONTENT */}

            <div className="kd-drawer-scroll">

              {/* ADMIN */}

              {isAdmin ? (

                <div className="kd-drawer-nav">

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount("/admin")
                    }
                  >

                    <LayoutDashboard size={18} />

                    <span>
                      <strong>
                        Admin Dashboard
                      </strong>

                      <small>
                        Manage KisanDirect
                      </small>
                    </span>

                    <ChevronRight size={17} />

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount("/profile")
                    }
                  >

                    <UserRound size={18} />

                    <span>
                      <strong>
                        My Profile
                      </strong>

                      <small>
                        View and edit your profile
                      </small>
                    </span>

                    <ChevronRight size={17} />

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount("/settings")
                    }
                  >

                    <Settings size={18} />

                    <span>
                      <strong>
                        Settings
                      </strong>

                      <small>
                        Account preferences
                      </small>
                    </span>

                    <ChevronRight size={17} />

                  </button>

                </div>

              ) : (

                /* CONSUMER / FARMER */

                <div className="kd-drawer-nav">

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount("/profile")
                    }
                  >

                    <UserRound size={18} />

                    <span>
                      <strong>
                        My Profile
                      </strong>

                      <small>
                        View and edit your profile
                      </small>
                    </span>

                    <ChevronRight size={17} />

                  </button>


                  {isFarmer && (

                    <button
                      type="button"
                      onClick={() =>
                        navigateFromAccount("/farmer")
                      }
                    >

                      <Sprout size={18} />

                      <span>
                        <strong>
                          Farmer Dashboard
                        </strong>

                        <small>
                          Manage your products
                        </small>
                      </span>

                      <ChevronRight size={17} />

                    </button>

                  )}


                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount("/orders")
                    }
                  >

                    <Package size={18} />

                    <span>
                      <strong>
                        My Orders
                      </strong>

                      <small>
                        View your order history
                      </small>
                    </span>

                    <ChevronRight size={17} />

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount("/addresses")
                    }
                  >

                    <MapPin size={18} />

                    <span>
                      <strong>
                        Saved Addresses
                      </strong>

                      <small>
                        Manage delivery addresses
                      </small>
                    </span>

                    <ChevronRight size={17} />

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount("/settings")
                    }
                  >

                    <Settings size={18} />

                    <span>
                      <strong>
                        Settings
                      </strong>

                      <small>
                        Account and preferences
                      </small>
                    </span>

                    <ChevronRight size={17} />

                  </button>

                </div>

              )}

            </div>


            {/* LOGOUT — ALWAYS VISIBLE */}

            <div className="kd-drawer-footer">

              <button
                type="button"
                className="kd-drawer-logout"
                onClick={requestLogout}
              >

                <LogOut size={18} />

                <span>
                  Log out
                </span>

              </button>

            </div>

          </aside>

        </div>

      )}


      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      {notificationsOpen &&
        user &&
        !isAdmin && (

          <div
            className="kd-drawer-overlay"
            onClick={closeAll}
          >

            <aside
              className="kd-notification-drawer"
              onClick={event =>
                event.stopPropagation()
              }
            >

              <div className="kd-drawer-header">

                <div>

                  <span className="kd-drawer-eyebrow">
                    UPDATES
                  </span>

                  <h2>
                    Notifications
                  </h2>

                  <p>
                    Your latest account updates
                  </p>

                </div>

                <button
                  type="button"
                  className="kd-drawer-close"
                  onClick={closeAll}
                  aria-label="Close notifications"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="kd-notification-empty">

                <span className="kd-notification-empty-icon">
                  <Bell size={22} />
                </span>

                <h3>
                  You're all caught up
                </h3>

                <p>
                  New order, account and platform
                  updates will appear here.
                </p>

              </div>

            </aside>

          </div>

        )}

    </>
  );
}
        )}

    </>
  );
}
