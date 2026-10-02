import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import api from "../../api";

const fallback = [
  { id: "fallback-1", title: "Fresh from local farms", imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80", linkUrl: "/" },
  { id: "fallback-2", title: "Discover seasonal produce", imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1400&q=80", linkUrl: "/recipes" }
];

export default function AdvertisementSlider() {
  const [ads, setAds] = useState(fallback);
  const [index, setIndex] = useState(0);
  useEffect(()=>{ api.get("/advertisements").then(r=>{if(r.data?.length) setAds(r.data)}).catch(()=>{}); },[]);
  useEffect(()=>{ if(ads.length<2) return; const t=setInterval(()=>setIndex(i=>(i+1)%ads.length),5000); return()=>clearInterval(t); },[ads.length]);
  const ad=ads[index % ads.length];
  return <section className="ad-section" aria-label="KisanDirect advertisements">
    <div className="ad-header"><div><span className="section-kicker"><Megaphone size={14}/> SPONSORED & UPDATES</span><h2>From our partners</h2></div><div className="slider-controls"><button onClick={()=>setIndex(i=>(i-1+ads.length)%ads.length)}><ChevronLeft/></button><span>{index+1}/{ads.length}</span><button onClick={()=>setIndex(i=>(i+1)%ads.length)}><ChevronRight/></button></div></div>
    <a className="ad-slide" href={ad.linkUrl || "#"} onClick={e=>{if(!ad.linkUrl)e.preventDefault()}} style={{backgroundImage:`linear-gradient(90deg,rgba(8,31,18,.78),rgba(8,31,18,.12)),url(${ad.imageUrl})`}}>
      <div><span>ADVERTISEMENT</span><h3>{ad.title || "Grow smarter with KisanDirect"}</h3><p>Useful offers and agriculture-focused updates in one place.</p><b>Explore <ArrowUpRight size={17}/></b></div>
    </a>
  </section>;
}
