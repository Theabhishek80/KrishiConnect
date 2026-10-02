import { CheckCircle2, XCircle, X } from "lucide-react";
export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return <div className={`toast toast-${toast.type || "success"}`}>
    {toast.type === "error" ? <XCircle size={18}/> : <CheckCircle2 size={18}/>}<span>{toast.message}</span>
    <button onClick={onClose} aria-label="Close"><X size={15}/></button>
  </div>;
}
