import React,{useEffect,useMemo,useState}from'react';
import useSWR from'swr';
import{ArrowLeft,Play,Plus,Check,Heart,Info,ChevronRight,Film,Clock,ListVideo}from'lucide-react';
import{api}from'../../lib/api';
import{AnimeDetails,AnimeItem,DEFAULT_POSTER}from'../../types';
import{libraryManager}from'../../lib/library';
import{historyUtil}from'../../lib/history';

interface Props{animeId:string;initialItem?:AnimeItem|null;onPlayEpisode:(id:string,timestamp?:number)=>void;onBack:()=>void;}
export function TVDetailsView({animeId,initialItem,onPlayEpisode,onBack}:Props){
 const{data}=useSWR<AnimeDetails>(`tv-details-${animeId}`,()=>api.getDetails(animeId),{revalidateOnFocus:false});
 const anime=data||initialItem as AnimeDetails|undefined;
 const[seasonIndex,setSeasonIndex]=useState(0);const[episodeIndex,setEpisodeIndex]=useState(0);const[liked,setLiked]=useState(false);
 const seasons=anime?.seasons||[];const season=seasons[seasonIndex];const{data:eps=[] ,isLoading}=useSWR(season?`tv-eps-${season.animeId}`:anime?`tv-eps-${anime.id}`:null,()=>api.getSeasonEpisodes(season?.animeId||anime!.id),{revalidateOnFocus:false});
 const episodes=Array.isArray(eps)?eps:(eps as any)?.episodes||anime?.episodes||[];
 useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key==='Escape'||e.key==='Backspace'||e.keyCode===10009){onBack();return}if(e.key==='ArrowLeft'){if(episodeIndex>0)setEpisodeIndex(i=>i-1);else if(seasonIndex>0){setSeasonIndex(i=>i-1);setEpisodeIndex(0)}}if(e.key==='ArrowRight'){if(episodeIndex<episodes.length-1)setEpisodeIndex(i=>i+1)}if(e.key==='ArrowUp'&&seasonIndex>0){setSeasonIndex(i=>i-1);setEpisodeIndex(0)}if(e.key==='ArrowDown'&&seasonIndex<seasons.length-1){setSeasonIndex(i=>i+1);setEpisodeIndex(0)}if(e.key==='Enter'){const ep=episodes[episodeIndex];if(ep)onPlayEpisode(ep.id,0)}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[onBack,onPlayEpisode,episodeIndex,seasonIndex,episodes,seasons.length]);
 if(!anime)return <div className="min-h-screen bg-[#080a10] text-white"/>;
 const title=typeof anime.title==='string'?anime.title:anime.title?.english||anime.title?.romaji||'Anime';
 const desc=(anime.description||'').replace(/<[^>]+>/g,'').trim();
 const inList=libraryManager.isInWatchlist(anime.id);
 const history=historyUtil.getHistory().find(h=>h.animeId===anime.id||h.slug===anime.id);
 const toggle=()=>libraryManager.toggleWatchlist({id:anime.id,title,image:anime.image||DEFAULT_POSTER});
 return <main className="min-h-screen bg-[#080a10] text-white">
  <section className="relative min-h-[500px] overflow-hidden"><img src={anime.banner||anime.cover||anime.image||DEFAULT_POSTER} alt="" className="absolute inset-0 h-full w-full object-cover brightness-[.55] saturate-[.8]"/><div className="absolute inset-0 bg-gradient-to-r from-[#080a10] via-[#080a10]/80 to-transparent"/><div className="absolute inset-0 bg-gradient-to-t from-[#080a10] via-transparent to-transparent"/>
   <button onClick={onBack} className="absolute left-8 top-8 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-3 text-sm font-black backdrop-blur-sm"><ArrowLeft className="h-4 w-4"/>Back</button>
   <div className="relative z-10 flex min-h-[500px] items-end gap-10 px-10 pb-14 lg:px-16"><img src={anime.image||DEFAULT_POSTER} alt="" className="hidden h-[300px] w-[200px] rounded-[26px] object-cover shadow-2xl lg:block"/><div className="max-w-3xl"><div className="mb-3 flex flex-wrap gap-2 text-xs font-bold text-white/60"><span>{anime.releaseDate||'Anime'}</span>{anime.status&&<span>• {anime.status}</span>}{anime.type&&<span>• {anime.type}</span>}</div><h1 className="text-5xl font-black tracking-tight lg:text-6xl">{title}</h1><p className="mt-4 line-clamp-4 text-sm leading-6 text-white/65">{desc}</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={()=>{const ep=episodes[episodeIndex];if(ep)onPlayEpisode(ep.id,history?.playbackTimestamp||0)}} className="flex items-center gap-2 rounded-[18px] bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 px-6 py-4 font-black text-black"><Play className="h-5 w-5 fill-current"/>{history?'Continue Watching':'Watch Now'}</button><button onClick={toggle} className="flex items-center gap-2 rounded-[18px] border border-white/15 bg-white/5 px-6 py-4 font-black">{inList?<Check/>:<Plus/>}{inList?'In My List':'My List'}</button></div></div></div>
  </section>
  <section className="px-10 py-10 lg:px-16"><div className="mb-6 flex items-center gap-3"><ListVideo className="text-cyan-300"/><div><h2 className="text-2xl font-black">Seasons & Episodes</h2><p className="text-xs text-white/35">Left and right to choose episodes. Up and down to change seasons.</p></div></div>
   <div className="grid gap-5 lg:grid-cols-[240px_1fr]"><aside className="rounded-[26px] border border-white/8 bg-white/[.025] p-3">{(seasons.length?seasons:[{seasonNumber:1,animeId:anime.id,title:'Episodes',episodeCount:episodes.length}]).map((s:any,i:number)=><button key={s.animeId||i} onClick={()=>{setSeasonIndex(i);setEpisodeIndex(0)}} className={`mb-2 w-full rounded-[18px] border p-4 text-left ${i===seasonIndex?'border-white bg-white text-black':'border-white/8 bg-white/[.02] text-white/55'}`}><div className="text-sm font-black">{s.title||'Season '+s.seasonNumber}</div><div className="mt-1 text-[10px] opacity-55">{s.episodeCount||0} episodes</div></button>)}</aside>
    <div className="rounded-[26px] border border-white/8 bg-white/[.025] p-4"><div className="mb-4 flex items-center justify-between"><span className="text-sm font-black">{season?.title||'Episodes'}</span><span className="text-[10px] font-bold text-white/35">{episodes.length} episodes</span></div>{isLoading?<div className="p-10 text-white/35">Loading episodes…</div>:<div className="grid gap-3 md:grid-cols-2">{episodes.map((ep:any,i:number)=><button key={ep.id||i} onClick={()=>onPlayEpisode(ep.id,0)} className={`flex items-center gap-3 rounded-[18px] border p-3 text-left transition ${i===episodeIndex?'border-white/70 bg-white/10 scale-[1.01]':'border-white/7 bg-white/[.02]'}`}><img src={ep.image||anime.image} alt="" className="h-16 w-28 rounded-xl object-cover"/><div className="min-w-0 flex-1"><div className="text-[10px] font-black uppercase tracking-wider text-white/35">Episode {ep.number}</div><div className="truncate text-sm font-black">{ep.title||'Episode '+ep.number}</div></div><ChevronRight className="h-4 w-4 text-white/25"/></button>)}</div>}</div>
   </div>
  </section>
 </main>;
}