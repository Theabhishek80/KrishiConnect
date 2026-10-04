import React, { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, RefreshCw, Server, Database, Sparkles, Image } from "lucide-react";
import api from "../../api";

const labels = {
  databaseReachable: ["Database", Database],
  firebaseConfigured: ["Firebase authentication", Server],
  aiConfigured: ["Gemini AI", Sparkles],
  imageKitConfigured: ["ImageKit uploads", Image],
};

export default function ServiceStatus() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const response = await api.get("/status");
      setData(response.data);
    } catch (e) {
      setData(null);
      setError(e.response?.data?.message || "The frontend could not reach the backend.");
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="page-section">
      <div className="panel" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="sectionhead">
          <div>
            <span className="section-kicker">DEPLOYMENT CHECK</span>
            <h1>KrishiConnect system status</h1>
            <p>Safe diagnostics for frontend → backend → database and external services. No credentials are shown.</p>
          </div>
          <button className="secondary-btn" type="button" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && <div className="notice error">{error}</div>}

        {data && (
          <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
            {Object.entries(labels).map(([key, [label, Icon]]) => {
              const ok = Boolean(data[key]);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 18px", border: "1px solid var(--line, #e5e7eb)", borderRadius: 16 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon size={19} /> {label}
                  </span>
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    {ok ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
                    {ok ? "Connected" : "Not configured / unavailable"}
                  </strong>
                </div>
              );
            })}
            {data.databaseError && (
              <div className="notice error">
                Database check failed with {data.databaseError}. Check the Railway/Render DATABASE_URL, DATABASE_USERNAME and DATABASE_PASSWORD variables.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
