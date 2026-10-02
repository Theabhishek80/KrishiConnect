import { Plus, ShieldCheck } from "lucide-react";
export default function ProductCard({ product, onAdd }) {
 const image=product.images?.[0]?.url;
 return <article className="product-card"><div className="product-art">{image?<img src={image} alt={product.name}/>:<span>🌱</span>}<small>{product.category?.name||"Farm fresh"}</small></div><div className="product-content"><div className="product-title"><h3>{product.name}</h3><span>/{product.unit}</span></div><p>{product.description||"Freshly listed farm produce."}</p><div className="product-meta"><span><ShieldCheck size={14}/> Verified listing</span></div><div className="product-bottom"><strong>₹{Number(product.price||0).toLocaleString("en-IN")}</strong><button onClick={()=>onAdd(product.id)}><Plus size={17}/> Add</button></div></div></article>;
}
