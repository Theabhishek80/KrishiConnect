import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
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

  const notificationRef = useRef(null);

  const isAdmin = user?.role === "ADMIN";
  const isFarmer = user?.role === "FARMER";

  const userName = user?.name?.trim() || "Account";
  const firstName = userName.split(" ")[0] || "Account";
  const initial = userName.charAt(0).toUpperCase() || "U";

  const closeMenus = () => {
    setMobileOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(false);
  };

  useEffect(() => {
    closeMenus();
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") closeMenus();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handlePointerDown = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [notificationsOpen]);

  const submitSearch = (event) => {
    event.preventDefault();

    const value = search.trim();

    if (!value) {
      navigate("/");
      return;
    }

    closeMenus();
    navigate(`/?q=${encodeURIComponent(value)}`);
  };

  const openAccount = () => {
    setMobileOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(true);
  };

  const toggleNotifications = () => {
    setMobileOpen(false);
    setAccountOpen(false);
    setNotificationsOpen((value) => !value);
  };

  const go = (path) => {
    closeMenus();
    navigate(path);
  };

  const requestLogout = () => {
    closeMenus();
    if (onLogout) onLogout();
  };

  return (
    <>
      <header className="kd-navbar">
        <div className="kd-navbar-inner">

          <Link
            className="kd-brand"
            to="/"
            onClick={closeMenus}
            aria-label="KisanDirect home"
          >
            <span className="kd-brand-mark" aria-hidden="true">
              <span className="kd-brand-k">K</span>
              <span className="kd-brand-leaf">⌁</span>
            </span>

            <span className="kd-brand-word">
              Kisan<span>Direct</span>
            </span>
          </Link>

          {!isAdmin && (
            <form className="kd-search" onSubmit={submitSearch} role="search">
              <Search size={18} aria-hidden="true" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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

          <nav className="kd-desktop-nav" aria-label="Primary navigation">
            <Link to="/" onClick={closeMenus}>
              <Home size={16} />
              <span>Home</span>
            </Link>

            <Link to="/about" onClick={closeMenus}>
              <Info size={16} />
              <span>About Us</span>
            </Link>

            {user && !isAdmin && (
              <Link to="/cart" onClick={closeMenus}>
                <ShoppingCart size={16} />
                <span>Cart</span>
              </Link>
            )}

            {isFarmer && (
              <Link to="/farmer" onClick={closeMenus}>
                <Sprout size={16} />
                <span>Farmer</span>
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" onClick={closeMenus}>
                <LayoutDashboard size={16} />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          <div className="kd-navbar-actions">

            {user && !isAdmin && (
              <button
                type="button"
                className="kd-ai-nav-button"
                onClick={() => go("/kisandirect-ai")}
                aria-label="Open KisanDirect AI"
              >
                <Sparkles size={17} />
                <span>KisanDirect AI</span>
              </button>
            )}

            {user && !isAdmin && (
              <div className="kd-notification-wrap" ref={notificationRef}>
                <button
                  type="button"
                  className={
                    notificationsOpen
                      ? "kd-icon-button kd-notification-button is-active"
                      : "kd-icon-button kd-notification-button"
                  }
                  onClick={toggleNotifications}
                  aria-label="Open notifications"
                  aria-expanded={notificationsOpen}
                >
                  <Bell size={18} />
                </button>

                {notificationsOpen && (
                  <div
                    className="kd-notification-popover"
                    role="dialog"
                    aria-label="Notifications"
                  >
                    <div className="kd-popover-header">
                      <div>
                        <strong>Notifications</strong>
                        <span>Latest updates</span>
                      </div>

                      <button
                        type="button"
                        className="kd-popover-close"
                        onClick={() => setNotificationsOpen(false)}
                        aria-label="Close notifications"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="kd-notification-empty">
                      <span className="kd-notification-empty-icon">
                        <Bell size={20} />
                      </span>

                      <strong>You're all caught up</strong>

                      <p>
                        New order and account updates will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <button
                type="button"
                className="kd-profile-button"
                onClick={openAccount}
                aria-label="Open account menu"
              >
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="kd-profile-image"
                  />
                ) : (
                  <span className="kd-profile-avatar">{initial}</span>
                )}

                <span className="kd-profile-name">{firstName}</span>
                <ChevronRight size={15} />
              </button>
            ) : (
              <Link
                className="kd-signin-button"
                to="/login"
                onClick={closeMenus}
              >
                <UserRound size={16} />
                <span>Sign in</span>
              </Link>
            )}

            <button
              type="button"
              className="kd-mobile-menu-button"
              onClick={() => {
                setAccountOpen(false);
                setNotificationsOpen(false);
                setMobileOpen((value) => !value);
              }}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="kd-mobile-panel">
          <nav className="kd-mobile-nav" aria-label="Mobile navigation">

            <Link to="/" onClick={closeMenus}>
              <Home size={18} />
              <span>Home</span>
            </Link>

            <Link to="/about" onClick={closeMenus}>
              <Info size={18} />
              <span>About Us</span>
            </Link>

            {user && !isAdmin && (
              <Link to="/cart" onClick={closeMenus}>
                <ShoppingCart size={18} />
                <span>Cart</span>
              </Link>
            )}

            {isFarmer && (
              <Link to="/farmer" onClick={closeMenus}>
                <Sprout size={18} />
                <span>Farmer Dashboard</span>
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin" onClick={closeMenus}>
                <LayoutDashboard size={18} />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {user && !isAdmin && (
              <button type="button" onClick={() => go("/kisandirect-ai")}>
                <Sparkles size={18} />
                <span>KisanDirect AI</span>
              </button>
            )}

            {user && (
              <button type="button" onClick={() => go("/profile")}>
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="kd-mobile-avatar-image"
                  />
                ) : (
                  <span className="kd-mobile-avatar">{initial}</span>
                )}
                <span>My Profile</span>
              </button>
            )}

            {!user && (
              <Link
                className="kd-mobile-signin"
                to="/login"
                onClick={closeMenus}
              >
                <UserRound size={18} />
                <span>Sign in</span>
              </Link>
            )}
          </nav>
        </div>
      )}

      {accountOpen && user && (
        <div className="kd-account-overlay" onClick={closeMenus}>
          <aside
            className="kd-account-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="kd-account-header">
              <div className="kd-account-identity">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="kd-drawer-profile-image"
                  />
                ) : (
                  <span className="kd-drawer-avatar">{initial}</span>
                )}

                <div className="kd-account-text">
                  <span className="kd-account-label">
                    {isAdmin
                      ? "ADMIN ACCOUNT"
                      : isFarmer
                      ? "FARMER ACCOUNT"
                      : "ACCOUNT"}
                  </span>

                  <h2>{userName}</h2>
                  <p>{user.email}</p>
                </div>
              </div>

              <button
                type="button"
                className="kd-account-close"
                onClick={closeMenus}
                aria-label="Close account menu"
              >
                <X size={19} />
              </button>
            </div>

            <div className="kd-account-content">
              <div className="kd-account-links">

                {isAdmin ? (
                  <>
                    <button type="button" onClick={() => go("/admin")}>
                      <LayoutDashboard size={18} />
                      <span>
                        <strong>Admin Dashboard</strong>
                        <small>Manage KisanDirect</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>

                    <button type="button" onClick={() => go("/profile")}>
                      <UserRound size={18} />
                      <span>
                        <strong>My Profile</strong>
                        <small>View and edit your profile</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>

                    <button type="button" onClick={() => go("/settings")}>
                      <Settings size={18} />
                      <span>
                        <strong>Settings</strong>
                        <small>Account preferences</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => go("/profile")}>
                      <UserRound size={18} />
                      <span>
                        <strong>My Profile</strong>
                        <small>View and edit your profile</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>

                    {isFarmer && (
                      <button type="button" onClick={() => go("/farmer")}>
                        <Sprout size={18} />
                        <span>
                          <strong>Farmer Dashboard</strong>
                          <small>Manage your products</small>
                        </span>
                        <ChevronRight size={17} />
                      </button>
                    )}

                    <button type="button" onClick={() => go("/orders")}>
                      <Package size={18} />
                      <span>
                        <strong>My Orders</strong>
                        <small>View your order history</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>

                    <button type="button" onClick={() => go("/addresses")}>
                      <MapPin size={18} />
                      <span>
                        <strong>Saved Addresses</strong>
                        <small>Manage delivery addresses</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>

                    <button type="button" onClick={() => go("/settings")}>
                      <Settings size={18} />
                      <span>
                        <strong>Settings</strong>
                        <small>Account and preferences</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="kd-account-footer">
              <button
                type="button"
                className="kd-logout-button"
                onClick={requestLogout}
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
