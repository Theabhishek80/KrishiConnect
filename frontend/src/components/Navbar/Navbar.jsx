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


export default function Navbar({
  user,
  onLogout
}) {

  const navigate = useNavigate();
  const location = useLocation();


  /* =====================================================
     STATE
  ===================================================== */

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [accountOpen, setAccountOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");


  /* =====================================================
     USER ROLES
  ===================================================== */

  const isAdmin =
    user?.role === "ADMIN";

  const isFarmer =
    user?.role === "FARMER";


  /* =====================================================
     CLOSE EVERYTHING
  ===================================================== */

  const closeAll = () => {

    setMobileOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(false);

  };


  /* =====================================================
     CLOSE MENUS WHEN ROUTE CHANGES
  ===================================================== */

  useEffect(() => {

    setMobileOpen(false);
    setAccountOpen(false);
    setNotificationsOpen(false);

  }, [
    location.pathname,
    location.search
  ]);


  /* =====================================================
     ESCAPE KEY
  ===================================================== */

  useEffect(() => {

    const handleKeyDown = event => {

      if (event.key === "Escape") {
        closeAll();
      }

    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, []);


  /* =====================================================
     NOTIFICATION OUTSIDE CLICK
  ===================================================== */

  useEffect(() => {

    if (!notificationsOpen) {
      return;
    }

    const handleOutsideClick = event => {

      const notification =
        event.target.closest(
          ".kd-notification-popover"
        );

      const notificationButton =
        event.target.closest(
          ".kd-notification-button"
        );

      if (
        !notification &&
        !notificationButton
      ) {

        setNotificationsOpen(false);

      }

    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

    };

  }, [notificationsOpen]);


  /* =====================================================
     SEARCH
  ===================================================== */

  const submitSearch = event => {

    event.preventDefault();

    const value =
      search.trim();

    if (!value) {

      navigate("/");

      return;

    }

    closeAll();

    navigate(
      `/?q=${encodeURIComponent(value)}`
    );

  };


  /* =====================================================
     ACCOUNT
  ===================================================== */

  const openAccount = () => {

    setMobileOpen(false);
    setNotificationsOpen(false);
    setAccountOpen(true);

  };


  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  const openNotifications = event => {

    event?.stopPropagation();

    setMobileOpen(false);
    setAccountOpen(false);

    setNotificationsOpen(
      value => !value
    );

  };


  /* =====================================================
     ACCOUNT NAVIGATION
  ===================================================== */

  const navigateFromAccount = path => {

    closeAll();

    navigate(path);

  };


  /* =====================================================
     LOGOUT
  ===================================================== */

  const requestLogout = () => {

    closeAll();

    if (onLogout) {
      onLogout();
    }

  };


  /* =====================================================
     USER DISPLAY
  ===================================================== */

  const userName =
    user?.name?.trim() ||
    "Account";

  const firstName =
    userName
      .split(" ")[0] ||
    "Account";

  const userInitial =
    userName
      .charAt(0)
      .toUpperCase() ||
    "U";


  return (

    <>

      {/* =================================================
          MAIN NAVBAR
      ================================================= */}

      <header className="kd-navbar">

        <div className="kd-navbar-inner">


          {/* ===============================================
              BRAND
          =============================================== */}

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


          {/* ===============================================
              SEARCH
          =============================================== */}

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
                type="search"
                value={search}
                onChange={event =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search products, recipes, mandi rates..."
                aria-label="Search KisanDirect"
              />


              {search && (

                <button
                  type="button"
                  className="kd-search-clear"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >

                  <X size={15} />

                </button>

              )}

            </form>

          )}


          {/* ===============================================
              DESKTOP NAVIGATION
          =============================================== */}

          <nav
            className={
              mobileOpen
                ? "kd-nav-links kd-nav-open"
                : "kd-nav-links"
            }
            aria-label="Primary navigation"
          >


            {/* HOME */}

            <Link
              to="/"
              onClick={closeAll}
            >

              <Home size={17} />

              <span>
                Home
              </span>

            </Link>


            {/* ABOUT */}

            <Link
              to="/about"
              onClick={closeAll}
            >

              <Info size={17} />

              <span>
                About Us
              </span>

            </Link>


            {/* CART */}

            {user && !isAdmin && (

              <Link
                to="/cart"
                onClick={closeAll}
              >

                <ShoppingCart size={17} />

                <span>
                  Cart
                </span>

              </Link>

            )}


            {/* FARMER */}

            {isFarmer && (

              <Link
                to="/farmer"
                onClick={closeAll}
              >

                <Sprout size={17} />

                <span>
                  Farmer
                </span>

              </Link>

            )}


            {/* ADMIN */}

            {isAdmin && (

              <Link
                to="/admin"
                onClick={closeAll}
              >

                <LayoutDashboard size={17} />

                <span>
                  Admin
                </span>

              </Link>

            )}


            {/* MOBILE ONLY PROFILE */}

            {user && (

              <button
                type="button"
                className="kd-mobile-profile-link"
                onClick={() =>
                  navigateFromAccount(
                    "/profile"
                  )
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
                    {userInitial}
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

                <span>
                  KisanDirect AI
                </span>

              </button>

            )}

          </nav>


          {/* ===============================================
              RIGHT SIDE ACTIONS
          =============================================== */}

          <div className="kd-navbar-actions">


            {/* AI */}

            {user && !isAdmin && (

              <button
                type="button"
                className="kd-desktop-ai-button"
                onClick={() =>
                  navigate(
                    "/kisandirect-ai"
                  )
                }
                aria-label="Open KisanDirect AI"
              >

                <Sparkles size={18} />

                <span>
                  KisanDirect AI
                </span>

              </button>

            )}


            {/* NOTIFICATION */}

            {user && !isAdmin && (

              <button
                type="button"
                className="kd-nav-icon-button kd-notification-button"
                onClick={openNotifications}
                aria-label="Open notifications"
                aria-expanded={
                  notificationsOpen
                }
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
                    {userInitial}
                  </span>

                )}


                <span className="kd-profile-name">
                  {firstName}
                </span>


                <ChevronRight
                  size={16}
                />

              </button>

            ) : (

              <Link
                className="kd-signin"
                to="/login"
                onClick={closeAll}
              >

                <UserRound size={17} />

                <span>
                  Sign in
                </span>

              </Link>

            )}


            {/* MOBILE MENU */}

            <button
              type="button"
              className="kd-mobile-menu"
              onClick={() =>
                setMobileOpen(
                  value => !value
                )
              }
              aria-label={
                mobileOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={
                mobileOpen
              }
            >

              {mobileOpen ? (

                <X size={22} />

              ) : (

                <Menu size={22} />

              )}

            </button>

          </div>

        </div>

      </header>


      {/* =================================================
          MOBILE NAVIGATION PANEL
      ================================================= */}

      {mobileOpen && (

        <div
          className="kd-mobile-nav-panel"
        >

          <div className="kd-mobile-nav-inner">


            <Link
              to="/"
              onClick={closeAll}
            >

              <Home size={18} />

              <span>
                Home
              </span>

            </Link>


            <Link
              to="/about"
              onClick={closeAll}
            >

              <Info size={18} />

              <span>
                About Us
              </span>

            </Link>


            {user && !isAdmin && (

              <Link
                to="/cart"
                onClick={closeAll}
              >

                <ShoppingCart size={18} />

                <span>
                  Cart
                </span>

              </Link>

            )}


            {isFarmer && (

              <Link
                to="/farmer"
                onClick={closeAll}
              >

                <Sprout size={18} />

                <span>
                  Farmer Dashboard
                </span>

              </Link>

            )}


            {isAdmin && (

              <Link
                to="/admin"
                onClick={closeAll}
              >

                <LayoutDashboard size={18} />

                <span>
                  Admin Dashboard
                </span>

              </Link>

            )}


            {user && (

              <button
                type="button"
                onClick={() =>
                  navigateFromAccount(
                    "/profile"
                  )
                }
              >

                <UserRound size={18} />

                <span>
                  My Profile
                </span>

              </button>

            )}


            {user && !isAdmin && (

              <button
                type="button"
                onClick={() =>
                  navigateFromAccount(
                    "/kisandirect-ai"
                  )
                }
              >

                <Sparkles size={18} />

                <span>
                  KisanDirect AI
                </span>

              </button>

            )}

          </div>

        </div>

      )}


      {/* =================================================
          NOTIFICATION DROPDOWN
      ================================================= */}

      {notificationsOpen &&
        user &&
        !isAdmin && (

          <div
            className="kd-notification-popover"
            role="dialog"
            aria-label="Notifications"
            onClick={event =>
              event.stopPropagation()
            }
          >

            <div className="kd-notification-popover-header">

              <div>

                <strong>
                  Notifications
                </strong>

                <span>
                  Latest updates
                </span>

              </div>


              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen(false)
                }
                aria-label="Close notifications"
              >

                <X size={17} />

              </button>

            </div>


            <div className="kd-notification-popover-body">

              <div className="kd-notification-empty-icon">

                <Bell size={20} />

              </div>


              <strong>
                You're all caught up
              </strong>


              <p>
                New order and account updates
                will appear here.
              </p>

            </div>

          </div>

        )}


      {/* =================================================
          ACCOUNT DRAWER
      ================================================= */}

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


            {/* DRAWER HEADER */}

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
                    {userInitial}
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
                    {userName}
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


            {/* DRAWER CONTENT */}

            <div className="kd-drawer-scroll">


              {isAdmin ? (

                <div className="kd-drawer-nav">


                  {/* ADMIN DASHBOARD */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount(
                        "/admin"
                      )
                    }
                  >

                    <LayoutDashboard
                      size={18}
                    />

                    <span>

                      <strong>
                        Admin Dashboard
                      </strong>

                      <small>
                        Manage KisanDirect
                      </small>

                    </span>

                    <ChevronRight
                      size={17}
                    />

                  </button>


                  {/* PROFILE */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount(
                        "/profile"
                      )
                    }
                  >

                    <UserRound
                      size={18}
                    />

                    <span>

                      <strong>
                        My Profile
                      </strong>

                      <small>
                        View and edit your profile
                      </small>

                    </span>

                    <ChevronRight
                      size={17}
                    />

                  </button>


                  {/* SETTINGS */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount(
                        "/settings"
                      )
                    }
                  >

                    <Settings
                      size={18}
                    />

                    <span>

                      <strong>
                        Settings
                      </strong>

                      <small>
                        Account preferences
                      </small>

                    </span>

                    <ChevronRight
                      size={17}
                    />

                  </button>

                </div>

              ) : (

                <div className="kd-drawer-nav">


                  {/* PROFILE */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount(
                        "/profile"
                      )
                    }
                  >

                    <UserRound
                      size={18}
                    />

                    <span>

                      <strong>
                        My Profile
                      </strong>

                      <small>
                        View and edit your profile
                      </small>

                    </span>

                    <ChevronRight
                      size={17}
                    />

                  </button>


                  {/* FARMER DASHBOARD */}

                  {isFarmer && (

                    <button
                      type="button"
                      onClick={() =>
                        navigateFromAccount(
                          "/farmer"
                        )
                      }
                    >

                      <Sprout
                        size={18}
                      />

                      <span>

                        <strong>
                          Farmer Dashboard
                        </strong>

                        <small>
                          Manage your products
                        </small>

                      </span>

                      <ChevronRight
                        size={17}
                      />

                    </button>

                  )}


                  {/* ORDERS */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount(
                        "/orders"
                      )
                    }
                  >

                    <Package
                      size={18}
                    />

                    <span>

                      <strong>
                        My Orders
                      </strong>

                      <small>
                        View your order history
                      </small>

                    </span>

                    <ChevronRight
                      size={17}
                    />

                  </button>


                  {/* ADDRESSES */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount(
                        "/addresses"
                      )
                    }
                  >

                    <MapPin
                      size={18}
                    />

                    <span>

                      <strong>
                        Saved Addresses
                      </strong>

                      <small>
                        Manage delivery addresses
                      </small>

                    </span>

                    <ChevronRight
                      size={17}
                    />

                  </button>


                  {/* SETTINGS */}

                  <button
                    type="button"
                    onClick={() =>
                      navigateFromAccount(
                        "/settings"
                      )
                    }
                  >

                    <Settings
                      size={18}
                    />

                    <span>

                      <strong>
                        Settings
                      </strong>

                      <small>
                        Account and preferences
                      </small>

                    </span>

                    <ChevronRight
                      size={17}
                    />

                  </button>

                </div>

              )}

            </div>


            {/* LOGOUT */}

            <div className="kd-drawer-footer">

              <button
                type="button"
                className="kd-drawer-logout"
                onClick={requestLogout}
              >

                <LogOut
                  size={18}
                />

                <span>
                  Log out
                </span>

              </button>

            </div>

          </aside>

        </div>

      )}

    </>

  );

}
