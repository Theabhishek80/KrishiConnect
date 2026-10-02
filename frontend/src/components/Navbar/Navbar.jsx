import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Leaf, LogOut, Menu, Search, ShieldCheck, ShoppingCart, Sprout, UserRound, X } from "lucide-react";

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(false);
  const [q, setQ] = useState(new URLSearchParams(location.search).get("q") || "");
  const isAdmin = user?.role === "ADMIN";
  const isFarmer = user?.role === "FARMER";

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => setQ(new URLSearchParams(location.search).get("q") || ""), [location.search]);

  const submitSearch = e => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}#products` : "/#products");
  };

  const initials = (user?.name || user?.email || "U").trim().slice(0, 1).toUpperCase();
  const home = isAdmin ? "/admin" : isFarmer ? "/farmer" : "/";

  return <>
    <header className="topbar">
      <Link to={home} className="brand" aria-label="KisanDirect home"><span className="brandmark"><Leaf size={19}/></span><span>Kisan<span>Direct</span></span></Link>
      <nav className="desktop-nav">
        {!isAdmin && <Link className={location.pathname === "/" ? "active" : ""} to="/">Marketplace</Link>}
        {!isAdmin && <Link to="/mandi">Mandi</Link>}
        {!isAdmin && <Link to="/recipes">Recipes</Link>}
        {!isAdmin && <Link to="/kisandirect-ai"><Sprout size={16}/> AI</Link>}
        {isFarmer && <Link to="/farmer">Farmer dashboard</Link>}
        {isAdmin && <Link to="/admin"><ShieldCheck size={16}/> Admin dashboard</Link>}
        <Link to="/about">About</Link>
      </nav>
      <div className="nav-actions">
        {!isAdmin && <form className="nav-search" onSubmit={submitSearch}><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search produce…" aria-label="Search produce"/></form>}
        {user && !isAdmin && <Link className="icon-button" to="/cart" aria-label="Cart"><ShoppingCart size={19}/></Link>}
        {user && <button className="icon-button" onClick={()=>setAccount(v=>!v)} aria-label="Account"><div className="avatar">{user.profileImageUrl ? <img src={user.profileImageUrl} alt=""/> : initials}</div><ChevronDown size={15}/></button>}
        {!user && <Link className="signin-button" to="/login">Sign in</Link>}
        <button className="mobile-menu" onClick={()=>setOpen(v=>!v)} aria-label="Menu">{open ? <X/> : <Menu/>}</button>
      </div>
    </header>
    {open && <div className="mobile-panel">
      {!isAdmin && <><Link to="/">Marketplace</Link><Link to="/mandi">Mandi prices</Link><Link to="/recipes">Recipes</Link><Link to="/kisandirect-ai">KisanDirect AI</Link></>}
      {isFarmer && <Link to="/farmer">Farmer dashboard</Link>}
      {isAdmin && <Link to="/admin">Admin dashboard</Link>}
      <Link to="/about">About</Link>
      {!user && <Link className="primary-btn" to="/login">Sign in</Link>}
    </div>}
    {account && user && <>
      <div className="account-popover-backdrop" onClick={()=>setAccount(false)}/>
      <aside className="account-popover">
        <div className="account-head"><div className="avatar large">{user.profileImageUrl ? <img src={user.profileImageUrl} alt=""/> : initials}</div><div><strong>{user.name || "KisanDirect user"}</strong><span>{user.email}</span><small>{user.role}</small></div><button onClick={()=>setAccount(false)}><X size={17}/></button></div>
        <div className="account-links">
          <Link to="/profile"><UserRound/> Profile</Link>
          {!isAdmin && <Link to="/orders">My orders</Link>}
          {!isAdmin && <Link to="/addresses">Addresses</Link>}
          <Link to="/settings">Settings</Link>
          {isFarmer && <Link to="/farmer">Farmer dashboard</Link>}
          {isAdmin && <Link to="/admin">Admin dashboard</Link>}
        </div>
        <button className="logout-link" onClick={()=>{setAccount(false);onLogout();}}><LogOut/> Logout</button>
      </aside>
    </>}
  </>;
}
