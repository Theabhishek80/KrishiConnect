import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, TrendingUp } from "lucide-react";

const mandi=[
 {market:"Bhopal Mandi",crop:"Soybean",price:"₹4,650",unit:"/ quintal",trend:"+2.4%"},
 {market:"Indore Mandi",crop:"Wheat",price:"₹2,480",unit:"/ quintal",trend:"+1.1%"},
 {market:"Sehore Mandi",crop:"Chana",price:"₹5,420",unit:"/ quintal",trend:"+0.8%"},
 {market:"Ujjain Mandi",crop:"Onion",price:"₹2,950",unit:"/ quintal",trend:"-0.6%"}
];
const recipes=[
 {title:"Sarson saag & makki roti",time:"35 min",tag:"Winter favourite",emoji:"🥬"},
 {title:"Fresh vegetable poha",time:"20 min",tag:"Breakfast",emoji:"🥕"},
 {title:"Farm-style dal tadka",time:"30 min",tag:"Protein rich",emoji:"🫘"},
 {title:"Seasonal fruit bowl",time:"10 min",tag:"Quick & fresh",emoji:"🍎"}
];
function Slider({title,kicker,items,type}){ return <section className="info-slider"><div className="section-head"><div><span className="section-kicker">{kicker}</span><h2>{title}</h2></div><Link to={type==="mandi"?"/mandi":"/recipes"}>View all <ArrowRight size={16}/></Link></div><div className="horizontal-cards">{items.map((x,i)=> type==="mandi" ? <article className="mandi-card" key={i}><div className="mandi-top"><span>{x.market}</span><TrendingUp size={17}/></div><strong>{x.crop}</strong><div className="mandi-price"><b>{x.price}</b><span>{x.unit}</span></div><small className={x.trend.startsWith("-")?"down":"up"}>{x.trend} today</small></article> : <article className="recipe-card" key={i}><div className="recipe-emoji">{x.emoji}</div><div><span>{x.tag}</span><h3>{x.title}</h3><small><BookOpen size={14}/> {x.time}</small></div></article>)}</div></section> }
export function MandiSlider(){return <Slider kicker="MANDI WATCH" title="Today’s market snapshot" items={mandi} type="mandi"/>}
export function RecipeSlider(){return <Slider kicker="FARM TO PLATE" title="Recipes from the harvest" items={recipes} type="recipes"/>}
export { mandi, recipes };
