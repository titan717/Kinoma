import React from 'react';
import { Play } from 'lucide-react';
import { AnimeItem } from '../../types';
import { HistoryItem } from '../../lib/history';

export function prefetchImage(src?:string){if(!src)return;const i=new Image();i.decoding='async';i.src=src;}
interface Props{item?:AnimeItem;historyItem?:HistoryItem;isContinueWatching?:boolean;isFocused:boolean;onSelect:()=>void;index:number;}
export const TVCard=React.memo(function TVCard({item,historyItem,isContinueWatching,isFocused,onSelect}:Props){
 const title=item?(typeof item.title==='string'?item.title:item.title?.english||item.title?.romaji||'Anime'):historyItem?.title||'Anime';
 const image=item?.image||item?.cover||historyItem?.image||'';
 const progress=historyItem?.duration?Math.min(100,Math.max(0,(historyItem.playbackTimestamp/historyItem.duration)*100)):0;
 return <button onClick={onSelect} className={`group relative w-[210px] shrink-0 overflow-hidden rounded-[22px] text-left outline-none transition-all duration-200 ${isFocused?'z-10 scale-[1.055] shadow-[0_22px_55px_rgba(0,0,0,.55)]':'opacity-90'}`}>
  <div className={`relative aspect-[2/3] overflow-hidden rounded-[22px] border bg-[#11131b] ${isFocused?'border-white/80 ring-2 ring-white/30':'border-white/8'}`}>
   {image?<img src={image} alt="" loading="lazy" decoding="async" className={`h-full w-full object-cover transition-transform duration-500 ${isFocused?'scale-105':''}`}/>:<div className="h-full w-full bg-gradient-to-br from-violet-900/50 to-cyan-900/30"/>}
   <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent"/>
   {isFocused&&<div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black"><Play className="h-4 w-4 fill-current"/></div>}
   <div className="absolute inset-x-3 bottom-3"><div className="line-clamp-2 text-sm font-black leading-tight text-white">{title}</div>{isContinueWatching&&<div className="mt-1 text-[10px] font-bold text-white/55">S{historyItem?.seasonNumber||1} • E{historyItem?.episodeNumber||1}</div>}</div>
   {isContinueWatching&&<div className="absolute inset-x-0 bottom-0 h-1 bg-white/15"><div className="h-full bg-gradient-to-r from-fuchsia-400 to-cyan-300" style={{width:`${progress}%`}}/></div>}
  </div>
 </button>;
});