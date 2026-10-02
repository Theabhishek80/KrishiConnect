export default function PageLoader({ label = "Loading KisanDirect…" }) {
  return <div className="page-loader"><div className="spinner"/><span>{label}</span></div>;
}
