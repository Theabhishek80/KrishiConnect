
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Store, Milk } from "lucide-react";
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

export default function DairyStoreRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;

    const user = JSON.parse(localStorage.getItem("kc_user") || "null");

    if (!user) {
      setMessage("Please sign in before registering your dairy store.");
      setMessageType("error");
      return;
    }

    if (
      !form.storeName.trim() ||
      !form.addressLine.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.postalCode.trim()
    ) {
      setMessage("Please complete all required fields.");
      setMessageType("error");
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
      latitude: form.latitude.trim() ? Number(form.latitude) : null,
      longitude: form.longitude.trim() ? Number(form.longitude) : null,
      deliveryRadiusKm: Number(form.deliveryRadiusKm || 5),
      operatingDays: form.operatingDays.trim(),
    };

    if (
      (payload.latitude !== null && !Number.isFinite(payload.latitude)) ||
      (payload.longitude !== null && !Number.isFinite(payload.longitude))
    ) {
      setMessage("Please enter valid latitude and longitude values.");
      setMessageType("error");
      return;
    }

    if (
      (payload.latitude === null) !== (payload.longitude === null)
    ) {
      setMessage("Enter both latitude and longitude, or leave both empty.");
      setMessageType("error");
      return;
    }

    if (
      !Number.isFinite(payload.deliveryRadiusKm) ||
      payload.deliveryRadiusKm <= 0
    ) {
      setMessage("Delivery radius must be greater than zero.");
      setMessageType("error");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      await api.post("/dairy/stores", payload);

      setMessageType("success");
      setMessage("Your dairy store was registered successfully.");

      setTimeout(() => navigate("/dairy"), 1200);
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      const serverMessage =
        typeof data?.message === "string"
          ? data.message
          : typeof data?.error === "string"
            ? data.error
            : "";

      setMessage(
        status === 401
          ? "Your session is not authenticated. Please sign in again."
          : status === 403
            ? "Registration was denied. Please check the backend security rules."
            : serverMessage || "Could not register your store. Please try again."
      );
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dairy-page">
      <div className="dairy-topbar">
        <Link to="/dairy" className="dairy-back-link">
          <ArrowLeft size={17} />
          Back to Dairy Marketplace
        </Link>
      </div>

      <section className="dairy-products-section">
        <div className="dairy-section-heading">
          <div>
            <span className="dairy-section-kicker">
              OPEN YOUR DAIRY STORE
            </span>
            <h2>Bring your dairy business online.</h2>
            <p>
              Register your local dairy, milk shop or dairy business.
              Existing farmers and consumers can both register.
            </p>
          </div>
          <Store size={34} />
        </div>

        <form className="dairy-subscription-form" onSubmit={submit}>
          <label>
            Store name *
            <input
              name="storeName"
              value={form.storeName}
              onChange={updateField}
              placeholder="e.g. Sharma Fresh Dairy"
              maxLength={150}
              required
            />
          </label>

          <label>
            About your store
            <textarea
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Tell customers about your dairy and products"
              rows={3}
            />
          </label>

          <label>
            Contact phone
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField}
              placeholder="Your business contact number"
            />
          </label>

          <label>
            Complete address *
            <input
              name="addressLine"
              value={form.addressLine}
              onChange={updateField}
              placeholder="House number, street or locality"
              required
            />
          </label>

          <div className="dairy-registration-grid">
            <label>
              City *
              <input
                name="city"
                value={form.city}
                onChange={updateField}
                placeholder="City"
                required
              />
            </label>

            <label>
              State *
              <input
                name="state"
                value={form.state}
                onChange={updateField}
                placeholder="State"
                required
              />
            </label>

            <label>
              Postal code *
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={updateField}
                placeholder="Postal code"
                required
              />
            </label>

            <label>
              Delivery radius (km)
              <input
                name="deliveryRadiusKm"
                type="number"
                min="0.1"
                step="0.1"
                value={form.deliveryRadiusKm}
                onChange={updateField}
                required
              />
            </label>

            <label>
              Latitude (optional)
              <input
                name="latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={updateField}
                placeholder="e.g. 23.2599"
              />
            </label>

            <label>
              Longitude (optional)
              <input
                name="longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={updateField}
                placeholder="e.g. 77.4126"
              />
            </label>
          </div>

          <label>
            Operating days
            <input
              name="operatingDays"
              value={form.operatingDays}
              onChange={updateField}
              placeholder="e.g. Monday to Sunday"
            />
          </label>

          {message && (
            <div
              className="dairy-form-message"
              role={messageType === "error" ? "alert" : "status"}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="dairy-primary-button dairy-submit-button"
            disabled={busy}
          >
            {busy ? "Registering store..." : "Register my store"}
            {!busy && <ArrowRight size={17} />}
          </button>

          <p className="dairy-prototype-note">
            Register using your existing KisanDirect account.
            Store registration does not automatically create products.
          </p>
        </form>
      </section>
    </div>
  );
}
