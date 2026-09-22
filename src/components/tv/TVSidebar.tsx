import React from 'react';
import { Home, Search, Bookmark, Film, Sparkles, Compass, Settings, Monitor } from 'lucide-react';
import { KinomaLogo } from '../ui/KinomaLogo';

export type TVNavSection = 'home' | 'search' | 'mylist' | 'movies' | 'new_season' | 'genres' | 'settings';
export const TV_NAV_ITEMS: { id: TVNavSection; label: string; icon: React.ElementType }[] = [
  { id:'home',label:'Home',icon:Home },{ id:'search',label:'Search',icon:Search },
  { id:'new_season',label:'Anime',icon:Sparkles },{ id:'movies',label:'Movies',icon:Film },
  { id:'genres',label:'Discover',icon:Compass },{ id:'mylist',label:'My List',icon:Bookmark },
  { id:'settings',label:'Settings',icon:Settings }
];
interface Props { activeSection:TVNavSection; onSelectSection:(s:TVNavSection)=>void; isFocused:boolean; focusedIndex:number; isExpanded:boolean; setIsExpanded:(v:boolean)=>void; onExitTVMode:()=>void; }

export function TVSidebar({activeSection,onSelectSection,isFocused,focusedIndex,isExpanded,setIsExpanded,onExitTVMode}:Props){
 return <aside onMouseEnter={()=>setIsExpanded(true)} onMouseLeave={()=>setIsExpanded(false)}
  className={`fixed left-0 top-0 bottom-0 z-[80] flex flex-col overflow-hidden border-r border-white/10 bg-[#0b0d13]/96 shadow-[18px_0_60px_rgba(0,0,0,.32)] transition-[width,border-radius] duration-300 ${isExpanded?'w-[300px] rounded-r-[42px]':'w-[92px] rounded-r-[30px]'}`}>
  <div className="px-4 pt-7 pb-5"><div className={`flex items-center ${isExpanded?'justify-between gap-3':'justify-center'}`}>
   {isExpanded?<KinomaLogo size="md" variant="full"/>:<KinomaLogo size="sm" variant="mark"/>}
   {isExpanded&&<span className="rounded-full bg-white/8 border border-white/10 px-3 py-1 text-[9px] font-black tracking-[.2em] text-white/45">TV</span>}
  </div></div>
  <div className="px-3 pb-4"><div className={`relative overflow-hidden rounded-[26px] border border-white/8 bg-gradient-to-br from-violet-500/18 via-fuchsia-500/8 to-cyan-400/10 ${isExpanded?'h-24':'h-12'}`}>
   <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-fuchsia-400/15 blur-2xl"/><div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl"/>
   <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-70">✦</div>
   {isExpanded&&<div className="absolute bottom-3 left-4 text-[9px] font-black uppercase tracking-[.28em] text-white/40">Anime, made simple</div>}
  </div></div>
  <nav className="flex-1 flex flex-col justify-center gap-2 px-3">
   {TV_NAV_ITEMS.map((item,index)=>{const Icon=item.icon;const active=activeSection===item.id;const focused=isFocused&&focusedIndex===index;return <button key={item.id} onClick={()=>onSelectSection(item.id)}
    className={`relative flex h-14 items-center rounded-[20px] outline-none transition-all duration-200 ${isExpanded?'w-full gap-4 px-4':'mx-auto w-14 justify-center'} ${focused?'scale-[1.04] bg-white text-[#0b0d13] shadow-[0_12px_30px_rgba(255,255,255,.12)]':active?'bg-white/10 text-white':'text-white/55 hover:bg-white/6 hover:text-white'}`}>
    {active&&<span className="absolute left-1 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-fuchsia-300 to-cyan-300"/>}<Icon className="h-6 w-6 shrink-0"/>{isExpanded&&<span className="truncate text-[15px] font-black">{item.label}</span>}</button>})}
  </nav>
  <div className="p-3"><button onClick={onExitTVMode} className={`flex h-12 items-center rounded-[18px] text-white/45 outline-none hover:bg-white/6 hover:text-white ${isExpanded?'w-full gap-3 px-4':'mx-auto w-12 justify-center'} ${isFocused&&focusedIndex===TV_NAV_ITEMS.length?'bg-white/10 text-white ring-2 ring-white/20':''}`}>
   <Monitor className="h-5 w-5"/>{isExpanded&&<span className="text-sm font-bold">Exit TV</span>}</button></div>
  <div className="pointer-events-none absolute right-[-2px] top-1/2 h-24 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-transparent via-white/20 to-transparent"/>
 </aside>;
}