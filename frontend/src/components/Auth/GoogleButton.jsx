import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle } from "../../services/authService";
export default function GoogleButton({role="CONSUMER"}){const [busy,setBusy]=useState(false);const nav=useNavigate();const go=async()=>{setBusy(true);try{const u=await loginWithGoogle(role);nav(u?.role==="ADMIN"?"/admin":u?.role==="FARMER"?"/farmer":"/");window.location.reload();}catch(e){alert(e.response?.data?.message||e.message||"Google sign-in failed.")}finally{setBusy(false)}};return <button type="button" className="google-btn" onClick={go} disabled={busy}><span>G</span>{busy?"Connecting…":"Continue with Google"}</button>}
