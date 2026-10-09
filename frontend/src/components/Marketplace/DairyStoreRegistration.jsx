
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Milk,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import api from "../../api";
import "./dairy-marketplace.css";

const INITIAL_FORM = {
  storeName: "",
  description: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  deliveryRadiusKm: "5",
  operatingDays: "",
};

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("kc_user") || "null");
  } catch {
    return null;
  }
}

function getErrorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 403) {
    return "Your account does not have permission to register a dairy store. Please check the backend security rules.";
  }

  if (status === 400) {
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") return data.error;
    return "Some information is invalid. Please check the fields and try again.";
  }

  if (!error?.response) {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  if ([502, 503, 504].includes(status)) {
    return "The server is temporarily unavailable. Please try again shortly.";
  }

  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;

  return "We could not register your store. Please try again.";
}

export default function DairyStoreRegistration() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [registeredStore, setRegisteredStore] = useState(null);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  };

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (busy) return;

    const user = getCurrentUser();

    if (!user) {
      showMessage("Please sign in to register your dairy store.");
      return;
    }

    const requiredFields = [
      ["storeName", "Store name"],
      ["addressLine", "Complete address"],
      ["city", "City"],
      ["state", "State"],
      ["postalCode", "Postal code"],
    ];

    for (const [key, label] of requiredFields) {
      if (!form[key].trim()) {
        showMessage(`${label} is required.`);
        return;
      }
    }

    const latitudeText = form.latitude.trim();
    const longitudeText = form.longitude.trim();

    if (Boolean(latitudeText) !== Boolean(longitudeText)) {
      showMessage(
        "Enter both latitude and longitude, or leave both empty."
      );
      return;
    }

    const latitude = latitudeText ? Number(latitudeText) : null;
    const longitude = longitudeText ? Number(longitudeText) : null;
    const deliveryRadiusKm = Number(form.deliveryRadiusKm || 5);

    if (
      (latitude !== null &&
        (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null &&
        (!Number.isFinite(longitude) ||
          longitude < -180 ||
          longitude > 180))
    ) {
      showMessage("Please enter valid latitude and longitude coordinates.");
      return;
    }

    if (
      !Number.isFinite(deliveryRadiusKm) ||
      deliveryRadiusKm <= 0 ||
      deliveryRadiusKm > 500
    ) {
      showMessage("Delivery radius must be between 0.1 and 500 km.");
      return;
    }

    const payload = {
      storeName: form.storeName.trim(),
      description: form.description.trim(),
      phone: form.phone.trim(),
      addressLine: form.addressLine.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      latitude,
      longitude,
      deliveryRadiusKm,
      operatingDays: form.operatingDays.trim(),
    };

    setBusy(true);
    setMessage("");

    try {
      const response = await api.post("/dairy/stores", payload);

      setRegisteredStore(response.data);
      showMessage(
        "Your dairy store has been registered successfully!",
        "success"
      );

      setForm(INITIAL_FORM);
    } catch (error) {
      console.error("Dairy store registration failed:", error);
      showMessage(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dairy-page dairy-registration-page">
      <div className="dairy-topbar">
        <Link to="/dairy" className="dairy-back-link">
          <ArrowLeft size={17} />
          Back to Dairy Marketplace
        </Link>
      </div>

      <section className="dairy-registration-layout">
        <div className="dairy-registration-intro">
          <span className="dairy-section-kicker">
            <Milk size={15} />
            YOUR BUSINESS, YOUR STORE
          </span>

          <h1>
            Bring your dairy business
            <span> closer to home.</span>
          </h1>

          <p>
            Whether you are a farmer, a milk vendor, a dairy owner,
            or a consumer starting a business, create your own dairy
            store on KisanDirect.
          </p>

          <div className="dairy-registration-benefits">
            <div>
              <span className="dairy-registration-benefit-icon">
                <Store size={20} />
              </span>
              <span>
                <strong>Your own store</strong>
                <small>Share your business with local customers.</small>
              </span>
            </div>

            <div>
              <span className="dairy-registration-benefit-icon">
                <MapPin size={20} />
              </span>
              <span>
                <strong>Local discovery</strong>
                <small>Help nearby customers find your dairy.</small>
              </span>
            </div>

            <div>
              <span className="dairy-registration-benefit-icon">
                <Truck size={20} />
              </span>
              <span>
                <strong>Your delivery area</strong>
                <small>Tell customers how far you can deliver.</small>
              </span>
            </div>
          </div>

          <div className="dairy-registration-trust">
            <ShieldCheck size={17} />
            Sign in with your existing KisanDirect account.
          </div>
        </div>

        {/* Animated village milk delivery illustration */}
        <div
          className="dairy-village-scene"
          role="img"
          aria-label="Illustration of a village dairy farmer handing milk to a customer"
        >
          <div className="dairy-scene-sun" />
          <div className="dairy-scene-cloud dairy-cloud-one" />
          <div className="dairy-scene-cloud dairy-cloud-two" />

          <div className="dairy-scene-hill dairy-scene-hill-back" />
          <div className="dairy-scene-hill dairy-scene-hill-front" />

          <div className="dairy-scene-house">🏡</div>
          <div className="dairy-scene-tree dairy-tree-one">🌳</div>
          <div className="dairy-scene-tree dairy-tree-two">🌴</div>

          <div className="dairy-scene-caption">
            <span>🥛 FRESH FROM THE VILLAGE</span>
            <strong>From our dairy to your family</strong>
            <small>Local milk. Trusted connections.</small>
          </div>

          <div className="dairy-farmer-character">
            <div className="dairy-farmer-head">👨🏽‍🌾</div>
            <div className="dairy-farmer-body" />
            <div className="dairy-farmer-arm" />
            <div className="dairy-farmer-can">🥛</div>
          </div>

          <div className="dairy-customer-character">
            <div className="dairy-customer-head">🧑🏻</div>
            <div className="dairy-customer-body" />
            <div className="dairy-customer-arm" />
          </div>

          <div className="dairy-milk-drop dairy-drop-one">✦</div>
          <div className="dairy-milk-drop dairy-drop-two">✧</div>
          <div className="dairy-milk-drop dairy-drop-three">✦</div>

          <div className="dairy-scene-ground" />

          <div className="dairy-scene-stamp">
            <CheckCircle2 size={16} />
            Connecting local dairies
          </div>
        </div>
      </section>

      <section className="dairy-registration-form-section">
        <div className="dairy-registration-form-heading">
          <span className="dairy-section-kicker">STORE DETAILS</span>
          <h2>Let's set up your dairy.</h2>
          <p>
            Add accurate details so customers can identify and contact
            your business.
          </p>
        </div>

        <form
          className="dairy-subscription-form dairy-store-form"
          onSubmit={submit}
        >
          <div className="dairy-form-field">
            <label htmlFor="dairy-store-name">Store name *</label>
            <input
              id="dairy-store-name"
              name="storeName"
              value={form.storeName}
              onChange={updateField}
              placeholder="e.g. Sharma Fresh Dairy"
              maxLength={150}
              autoComplete="organization"
              required
            />
          </div>

          <div className="dairy-form-field">
            <label htmlFor="dairy-store-description">About your store</label>
            <textarea
              id="dairy-store-description"
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Tell customers about your dairy and products."
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="dairy-form-field">
            <label htmlFor="dairy-store-phone">Contact phone</label>
            <input
              id="dairy-store-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField}
              placeholder="Business contact number"
              autoComplete="tel"
              maxLength={20}
            />
          </div>

          <div className="dairy-form-field">
            <label htmlFor="dairy-store-address">Complete address *</label>
            <input
              id="dairy-store-address"
              name="addressLine"
              value={form.addressLine}
              onChange={updateField}
              placeholder="House number, street or locality"
              autoComplete="street-address"
              maxLength={250}
              required
            />
          </div>

          <div className="dairy-registration-grid">
            <div className="dairy-form-field">
              <label htmlFor="dairy-store-city">City *</label>
              <input
                id="dairy-store-city"
                name="city"
                value={form.city}
                onChange={updateField}
                placeholder="City"
                autoComplete="address-level2"
                maxLength={100}
                required
              />
            </div>

            <div className="dairy-form-field">
              <label htmlFor="dairy-store-state">State *</label>
              <input
                id="dairy-store-state"
                name="state"
                value={form.state}
                onChange={updateField}
                placeholder="State"
                autoComplete="address-level1"
                maxLength={100}
                required
              />
            </div>

            <div className="dairy-form-field">
              <label htmlFor="dairy-store-postal">Postal code *</label>
              <input
                id="dairy-store-postal"
                name="postalCode"
                value={form.postalCode}
                onChange={updateField}
                placeholder="Postal code"
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={12}
                required
              />
            </div>

            <div className="dairy-form-field">
              <label htmlFor="dairy-store-radius">Delivery radius (km) *</label>
              <input
                id="dairy-store-radius"
                name="deliveryRadiusKm"
                type="number"
                min="0.1"
                max="500"
                step="0.1"
                value={form.deliveryRadiusKm}
                onChange={updateField}
                required
              />
            </div>

            <div className="dairy-form-field">
              <label htmlFor="dairy-store-latitude">Latitude (optional)</label>
              <input
                id="dairy-store-latitude"
                name="latitude"
                type="number"
                min="-90"
                max="90"
                step="any"
                value={form.latitude}
                onChange={updateField}
                placeholder="e.g. 23.2599"
              />
            </div>

            <div className="dairy-form-field">
              <label htmlFor="dairy-store-longitude">Longitude (optional)</label>
              <input
                id="dairy-store-longitude"
                name="longitude"
                type="number"
                min="-180"
                max="180"
                step="any"
                value={form.longitude}
                onChange={updateField}
                placeholder="e.g. 77.4126"
              />
            </div>
          </div>

          <div className="dairy-form-field">
            <label htmlFor="dairy-store-days">Operating days</label>
            <input
              id="dairy-store-days"
              name="operatingDays"
              value={form.operatingDays}
              onChange={updateField}
              placeholder="e.g. Monday to Sunday"
              maxLength={150}
            />
          </div>

          {message && (
            <div
              className={`dairy-form-message dairy-form-message-${messageType}`}
              role={messageType === "error" ? "alert" : "status"}
            >
              {message}
            </div>
          )}

          {registeredStore && (
            <div className="dairy-registration-success-details">
              <CheckCircle2 size={20} />
              <span>
                <strong>{registeredStore.storeName || "Your dairy store"}</strong>
                <small>
                  Your store has been created. You can now return to the
                  marketplace.
                </small>
              </span>
            </div>
          )}

          <button
            type="submit"
            className="dairy-primary-button dairy-submit-button"
            disabled={busy || Boolean(registeredStore)}
          >
            {busy
              ? "Registering your store..."
              : registeredStore
                ? "Store registered"
                : "Register my store"}
            {!busy && !registeredStore && <ArrowRight size={17} />}
          </button>

          {registeredStore && (
            <button
              type="button"
              className="dairy-secondary-button dairy-registration-return"
              onClick={() => navigate("/dairy")}
            >
              Explore Dairy Marketplace
              <ArrowRight size={17} />
            </button>
          )}

          <p className="dairy-prototype-note">
            Store registration does not automatically publish products.
            You can add product management and delivery subscriptions as
            separate features.
          </p>
        </form>
      </section>
    </div>
  );
}

