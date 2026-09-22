import React,{useEffect,useMemo,useState}from'react';
import{Play,Plus,Check,Info,Star,ChevronDown}from'lucide-react';
import{AnimeItem,DEFAULT_BANNER,DEFAULT_POSTER}from'../../types';
import{libraryManager}from'../../lib/library';
import{historyUtil}from'../../lib/history';
interface Props{item:AnimeItem|null;isFocused:boolean;focusedButtonIndex:number;onPlay:(i:AnimeItem)=>void;onMoreInfo:(i:AnimeItem)=>void;onToggleList?:(i:AnimeItem)=>void;}
export function TVHero({item,isFocused,focusedButtonIndex,onPlay,onMoreInfo,onToggleList}:Props){
 const[inList,setInList]=useState(false);useEffect(()=>setInList(item?libraryManager.isInWatchlist(item.id):false),[item]);
 const resume=useMemo(()=>item?historyUtil.getHistory().find(h=>h.animeId===item.id||h.slug===item.id):null,[item]);
 if(!item)return <div className="h-[650px] bg-[#080a10]"/>;
 const title=typeof item.title==='string'?item.title:item.title?.english||item.title?.romaji||'Featured Anime';
 const image=item.banner||item.cover||item.image||DEFAULT_BANNER;const poster=item.image||item.cover||DEFAULT_POSTER;
 const desc=(item.description||'').replace(/<[^>]+>/g,'').trim();const playLabel=resume?'Continue Watching':'Watch Now';
 const toggle=()=>{const v=libraryManager.toggleWatchlist({id:item.id,title,image:poster});setInList(v);onToggleList?.(item);};
 return <section className="relative h-[650px] overflow-hidden"><img src={image} alt="" className="absolute inset-0 h-full w-full object-cover object-center scale-[1.025] brightness-[.72] saturate-[.82]" loading="eager" decoding="async"/>
 <div className="absolute inset-0 bg-gradient-to-r from-[#080a10] via-[#080a10]/80 via-42% to-transparent"/><div className="absolute inset-0 bg-gradient-to-t from-[#080a10] via-[#080a10]/45 via-28% to-transparent"/>
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(192,132,252,.16),transparent_30%),radial-gradient(circle_at_58%_70%,rgba(34,211,238,.10),transparent_28%)]"/>
 <div className="relative z-10 flex h-full max-w-[1150px] flex-col justify-end px-10 pb-16 lg:px-16">
  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold text-white/65">{item.rating!=null&&<span className="rounded-full bg-white/10 px-3 py-1"><Star className="mr-1 inline h-3 w-3 fill-current"/>{typeof item.rating==='number'?Math.round(item.rating):item.rating}% Match</span>}{item.releaseDate&&<span>{item.releaseDate}</span>}{item.totalEpisodes&&<span>• {item.totalEpisodes} episodes</span>}</div>
  <h1 className="max-w-4xl text-5xl font-black leading-[.96] tracking-tight sm:text-6xl lg:text-7xl">{title}</h1><p className="mt-5 max-w-2xl line-clamp-3 text-base leading-7 text-white/72">{desc||'A new story is waiting for you.'}</p>
  <div className="mt-8 flex flex-wrap gap-3"><button onClick={()=>onPlay(item)} className={`flex items-center gap-3 rounded-[18px] bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 px-7 py-4 text-sm font-black text-black outline-none ${isFocused&&focusedButtonIndex===0?'scale-105 ring-2 ring-white/70':''}`}><Play className="h-5 w-5 fill-current"/>{playLabel}</button>
   <button onClick={toggle} className={`flex items-center gap-2 rounded-[18px] border px-6 py-4 text-sm font-black outline-none ${isFocused&&focusedButtonIndex===1?'scale-105 border-white bg-white/15 ring-2 ring-white/30':'border-white/15 bg-black/25'}`}>{inList?<Check className="h-5 w-5"/>:<Plus className="h-5 w-5"/>}{inList?'In My List':'My List'}</button>
   <button onClick={()=>onMoreInfo(item)} className={`flex items-center gap-2 rounded-[18px] border px-6 py-4 text-sm font-black outline-none ${isFocused&&focusedButtonIndex===2?'scale-105 border-white bg-white/15 ring-2 ring-white/30':'border-white/15 bg-black/25'}`}><Info className="h-5 w-5"/>Details</button></div>
  <div className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-white/35"><ChevronDown className="h-4 w-4"/>Down for seasons & episodes</div>
 </div><div className="absolute right-16 bottom-14 hidden xl:block h-[330px] w-[220px] overflow-hidden rounded-[28px] border border-white/15 shadow-2xl rotate-2"><img src={poster} alt="" className="h-full w-full object-cover"/></div>
 </section>;
}