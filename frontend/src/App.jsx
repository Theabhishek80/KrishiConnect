import { useEffect, useState } from "react";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import { Leaf, ShoppingCart, UserRound, LogOut, LayoutDashboard, Search } from "lucide-react";
import api from "./api";

function Layout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("kc_user") || "null"));

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/");
  };

  return (
    <>
      <header>
        <Link className="brand" to="/"><Leaf size={23}/> KrishiConnect</Link>
        <nav>
          <Link to="/">Marketplace</Link>
          {user && <Link to="/cart"><ShoppingCart size={18}/> Cart</Link>}
          {user?.role === "FARMER" && <Link to="/farmer"><LayoutDashboard size={18}/> Farmer</Link>}
          {user?.role === "ADMIN" && <Link to="/admin"><LayoutDashboard size={18}/> Admin</Link>}
          {user
            ? <button className="linkbtn" onClick={logout}><LogOut size={18}/> Logout</button>
            : <Link to="/login"><UserRound size={18}/> Login</Link>}
        </nav>
      </header>
      <main>{children}</main>
      <footer>© 2026 KrishiConnect · Fresh from farms</footer>
    </>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params: { q, page: 0, size: 12 } })
      .then(r => setProducts(r.data.content || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q]);

  const add = async (id) => {
    try {
      await api.post("/cart/items", { productId: id, quantity: 1 });
      alert("Added to cart");
    } catch (e) {
      alert(e.response?.status === 401 ? "Please login first" : (e.response?.data?.error || "Could not add item"));
    }
  };

  return (
    <div>
      <section className="hero">
        <div>
          <span className="pill">Farm to your table</span>
          <h1>Fresh produce.<br/><em>Direct from farmers.</em></h1>
          <p>Discover quality agricultural products from producers and support the people who grow your food.</p>
          <div className="searchbox"><Search size={20}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search vegetables, fruits, grains..."/></div>
        </div>
        <div className="hero-art">🌾<br/>🥕 🍅 🥬</div>
      </section>

      <section>
        <div className="sectionhead"><h2>Fresh products</h2><span>{loading ? "Loading…" : `${products.length} shown`}</span></div>
        <div className="grid">
          {products.map(p => (
            <article className="card" key={p.id}>
              <div className="productpic">🌱</div>
              <div className="cardbody">
                <small>{p.unit}</small><h3>{p.name}</h3>
                <p>{p.description}</p><strong>₹{p.price}</strong>
                <button onClick={() => add(p.id)}>Add to cart</button>
              </div>
            </article>
          ))}
        </div>
        {!loading && !products.length && <div className="empty">No approved products yet. Farmers can add products from the Farmer dashboard.</div>}
      </section>
    </div>
  );
}

function Auth({ title, children }) {
  return <div className="auth"><div className="authbox"><Leaf className="authicon"/><h2>{title}</h2>{children}</div></div>;
}

function Login() {
  const navigate = useNavigate();
  const [form,setForm]=useState({email:"",password:""});
  const [error,setError]=useState("");
  const submit=async e=>{
    e.preventDefault(); setError("");
    try {
      const r=await api.post("/auth/login",form);
      localStorage.setItem("kc_access",r.data.accessToken);
      localStorage.setItem("kc_user",JSON.stringify(r.data));
      navigate(r.data.role==="ADMIN"?"/admin":r.data.role==="FARMER"?"/farmer":"/");
      window.location.reload();
    } catch(e){setError(e.response?.data?.error||"Login failed");}
  };
  return <Auth title="Welcome back">
    <form onSubmit={submit}>
      <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
      <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
      <button>Login</button>
      {error&&<div className="error">{error}</div>}
    </form>
    <p>No account? <Link to="/register">Create one</Link></p>
  </Auth>;
}

function Register() {
  const navigate=useNavigate();
  const [form,setForm]=useState({name:"",email:"",password:"",role:"CONSUMER"});
  const [error,setError]=useState("");
  const submit=async e=>{
    e.preventDefault();setError("");
    try{await api.post("/auth/register",form);navigate("/login")}
    catch(e){setError(e.response?.data?.error||"Registration failed")}
  };
  return <Auth title="Create your account">
    <form onSubmit={submit}>
      <input name="name" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
      <input name="password" type="password" minLength="8" placeholder="Password (8+ characters)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
      <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
        <option value="CONSUMER">Consumer</option><option value="FARMER">Farmer</option>
      </select>
      <button>Create account</button>{error&&<div className="error">{error}</div>}
    </form>
    <p>Already registered? <Link to="/login">Login</Link></p>
  </Auth>;
}

function Cart() {
  const [cart,setCart]=useState(null);
  useEffect(()=>{api.get("/cart").then(r=>setCart(r.data)).catch(()=>setCart(null))},[]);
  const checkout=async()=>{
    const address=prompt("Delivery address");
    if(!address)return;
    try{await api.post("/orders/checkout",{shippingAddress:address});alert("Order placed successfully");}
    catch(e){alert(e.response?.data?.error||"Checkout failed")}
  };
  return <section><h1>Your cart</h1><div className="panel">
    {cart ? <><p>Your persistent cart is connected to the backend.</p><button onClick={checkout}>Checkout with mock payment</button></> : <p>Loading cart…</p>}
  </div></section>;
}

function Farmer() {
  const [name,setName]=useState(""); const [description,setDescription]=useState(""); const [price,setPrice]=useState(""); const [unit,setUnit]=useState("kg"); const [category,setCategory]=useState(""); const [qty,setQty]=useState(10); const [categories,setCategories]=useState([]);
  useEffect(()=>api.get("/categories").then(r=>setCategories(r.data)),[]);
  const create=async e=>{e.preventDefault();try{await api.post("/products/farmer",{name,description,price,unit,categoryId:Number(category),quantity:Number(qty)});alert("Product submitted for admin approval")}catch(e){alert(e.response?.data?.error||"Could not create product")}};
  return <section><h1>Farmer dashboard</h1>
    <div className="stats"><div><b>Products</b><span>Create and manage listings</span></div><div><b>Orders</b><span>Process customer orders</span></div><div><b>Inventory</b><span>Stock is protected transactionally</span></div></div>
    <div className="panel formpanel"><h2>New product</h2><form onSubmit={create}>
      <input placeholder="Product name" value={name} onChange={e=>setName(e.target.value)} required/>
      <textarea placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} required/>
      <div className="formrow"><input type="number" step="0.01" placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)} required/><input placeholder="Unit" value={unit} onChange={e=>setUnit(e.target.value)} required/></div>
      <div className="formrow"><select value={category} onChange={e=>setCategory(e.target.value)} required><option value="">Category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="number" min="0" placeholder="Initial stock" value={qty} onChange={e=>setQty(e.target.value)}/></div>
      <button>Submit for approval</button>
    </form></div>
  </section>;
}

function Admin() {
  const [d,setD]=useState(null);
  useEffect(()=>api.get("/admin/dashboard").then(r=>setD(r.data)),[]);
  return <section><h1>Admin dashboard</h1><div className="stats">
    {[["Users",d?.users],["Products",d?.products],["Orders",d?.orders]].map(([label,value])=>
      <div key={label}><b>{value??"—"}</b><span>{label}</span></div>)}
  </div><p className="muted">Admin API is protected by backend role authorization.</p></section>;
}

export default function App(){
  return <Layout><Routes>
    <Route path="/" element={<Home/>}/><Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/><Route path="/cart" element={<Cart/>}/>
    <Route path="/farmer" element={<Farmer/>}/><Route path="/admin" element={<Admin/>}/>
  </Routes></Layout>;
}
