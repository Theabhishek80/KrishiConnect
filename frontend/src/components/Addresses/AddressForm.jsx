import { useState } from "react";
import { Loader2 } from "lucide-react";

import { INDIA_STATES } from "../../utils/indiaStates";
import "../../styles/account.css";

const LABELS = ["Home", "Work", "Other"];

const EMPTY = {
  label: "Home",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  makeDefault: false
};

/**
 * Add / edit address modal.
 *  initial  : an existing address (edit) or undefined (new)
 *  defaults : values used to pre-fill a NEW address (name / phone of the user)
 *  onSave   : async (payload) => void   - should throw an Error with a message on failure
 */
export default function AddressForm({ initial, defaults, onSave, onClose, forceDefault = false }) {
  const editing = Boolean(initial?.id);

  const [form, setForm] = useState(() => ({
    ...EMPTY,
    ...(defaults || {}),
    ...(initial
      ? {
          label: initial.label || "Home",
          recipientName: initial.recipientName || "",
          phone: initial.phone || "",
          line1: initial.line1 || "",
          line2: initial.line2 || "",
          city: initial.city || "",
          state: initial.state || "",
          postalCode: initial.postalCode || "",
          makeDefault: Boolean(initial.defaultAddress)
        }
      : {})
  }));

  const [customLabel, setCustomLabel] = useState(
    initial && !LABELS.includes(initial.label) ? initial.label : ""
  );

  const [labelMode, setLabelMode] = useState(
    initial && !LABELS.includes(initial.label) ? "Other" : initial?.label || "Home"
  );

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};

    if (!form.recipientName.trim()) next.recipientName = "Enter the receiver's name";

    if (!/^[+0-9 ()-]{7,20}$/.test(form.phone.trim())) next.phone = "Enter a valid phone number";

    if (!form.line1.trim()) next.line1 = "Enter house / flat / street";

    if (!form.city.trim()) next.city = "Enter your city";

    if (!form.state) next.state = "Choose your state";

    if (!/^[0-9]{6}$/.test(form.postalCode.trim())) next.postalCode = "Enter a 6-digit PIN code";

    if (labelMode === "Other" && !customLabel.trim()) next.label = "Give this address a name";

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const submit = async event => {
    event.preventDefault();

    if (!validate()) return;

    setSaving(true);
    setServerError("");

    try {
      await onSave({
        label: labelMode === "Other" ? customLabel.trim() : labelMode,
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state,
        postalCode: form.postalCode.trim(),
        makeDefault: forceDefault ? true : form.makeDefault
      });
    } catch (err) {
      setServerError(err.message || "Could not save the address.");
      setSaving(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className={`ac-field ${props.full ? "full" : ""} ${errors[name] ? "invalid" : ""}`}>
      <label htmlFor={`addr-${name}`}>{label}</label>
      <input
        id={`addr-${name}`}
        value={form[name]}
        onChange={event => update(name, event.target.value)}
        {...props.input}
      />
      {errors[name] && <small>{errors[name]}</small>}
    </div>
  );

  return (
    <div className="ac-overlay" onClick={() => !saving && onClose()}>
      <div
        className="ac-modal"
        role="dialog"
        aria-modal="true"
        onClick={event => event.stopPropagation()}
      >
        <h3>{editing ? "Edit address" : "Add a new address"}</h3>
        <p>Where should the farmer deliver your order?</p>

        {serverError && <div className="ac-alert error">{serverError}</div>}

        <form className="ac-form" onSubmit={submit} noValidate>
          <div className={`ac-field full ${errors.label ? "invalid" : ""}`}>
            <label>Save as</label>

            <div className="ac-chips">
              {LABELS.map(label => (
                <button
                  key={label}
                  type="button"
                  className={`ac-chip ${labelMode === label ? "active" : ""}`}
                  onClick={() => {
                    setLabelMode(label);
                    setErrors(prev => ({ ...prev, label: undefined }));
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {labelMode === "Other" && (
              <input
                value={customLabel}
                onChange={event => {
                  setCustomLabel(event.target.value);
                  setErrors(prev => ({ ...prev, label: undefined }));
                }}
                placeholder="e.g. Parents' house"
                maxLength={50}
              />
            )}

            {errors.label && <small>{errors.label}</small>}
          </div>

          {field("recipientName", "Receiver's name", { input: { autoComplete: "name", maxLength: 120 } })}
          {field("phone", "Phone number", { input: { autoComplete: "tel", inputMode: "tel", maxLength: 20 } })}

          {field("line1", "House no., building, street", {
            full: true,
            input: { autoComplete: "address-line1", maxLength: 255 }
          })}

          {field("line2", "Area, landmark (optional)", {
            full: true,
            input: { autoComplete: "address-line2", maxLength: 255 }
          })}

          {field("city", "City / town", { input: { autoComplete: "address-level2", maxLength: 100 } })}

          <div className={`ac-field ${errors.state ? "invalid" : ""}`}>
            <label htmlFor="addr-state">State</label>
            <select
              id="addr-state"
              value={form.state}
              onChange={event => update("state", event.target.value)}
            >
              <option value="">Select state</option>
              {INDIA_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && <small>{errors.state}</small>}
          </div>

          {field("postalCode", "PIN code", {
            input: { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6 }
          })}

          {!forceDefault && (
            <label className="ac-check full">
              <input
                type="checkbox"
                checked={form.makeDefault}
                onChange={event => update("makeDefault", event.target.checked)}
              />
              Make this my default address
            </label>
          )}

          <div className="ac-modal-actions full" style={{ gridColumn: "1 / -1" }}>
            <button type="button" className="ac-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>

            <button type="submit" className="ac-btn primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="ac-spin" /> : null}
              {editing ? "Save changes" : "Save address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
