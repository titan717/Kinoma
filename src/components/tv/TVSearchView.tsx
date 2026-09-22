import React,{useEffect,useRef,useState}from'react';
import{Mic,MicOff,Search,ArrowLeft,Clock,X,Sparkles}from'lucide-react';
import{api}from'../../lib/api';
import{AnimeItem}from'../../types';
import{TVCard}from'./TVCard';
import{libraryManager}from'../../lib/library';

interface Props{onSelectAnime:(a:AnimeItem)=>void;onBackToSidebar:()=>void;}
const KEYS=['A B C D E F G','H I J K L M N','O P Q R S T U','V W X Y Z 1 2','3 4 5 6 7 8 9','0 SPACE ⌫'];
export function TVSearchView({onSelectAnime,onBackToSidebar}:Props){
 const[q,setQ]=useState('');const[results,setResults]=useState<AnimeItem[]>([]);const[loading,setLoading]=useState(false);const[listening,setListening]=useState(false);
 const[zone,setZone]=useState<'search'|'keys'|'results'|'recent'>('search');const[row,setRow]=useState(0);const[col,setCol]=useState(0);const[ri,setRi]=useState(0);const recRef=useRef<any>(null);
 const recents=libraryManager.getSearchHistory().slice(0,6);
 const voice=()=>{const C=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!C){window.alert('Voice search is not supported on this TV browser.');return;}if(recRef.current){recRef.current.abort();recRef.current=null;setListening(false);return;}const r=new C();r.lang='en-US';r.interimResults=true;r.continuous=false;r.onstart=()=>setListening(true);r.onresult=(e:any)=>{const t=Array.from(e.results).map((x:any)=>x[0]?.transcript||'').join(' ').trim();if(t){setQ(t);if(e.results[e.results.length-1].isFinal){libraryManager.addSearchQuery(t);setZone('results');}}};r.onerror=()=>setListening(false);r.onend=()=>{setListening(false);recRef.current=null};recRef.current=r;r.start();};
 useEffect(()=>{if(!q.trim()){setResults([]);return;}const t=setTimeout(async()=>{setLoading(true);try{const r=await api.searchPaged(q.trim(),18,0);setResults(r.results||[]);setRi(0)}finally{setLoading(false)}},280);return()=>clearTimeout(t)},[q]);
 const keyPress=(k:string)=>{if(k==='SPACE')setQ(v=>v+' ');else if(k==='⌫')setQ(v=>v.slice(0,-1));else setQ(v=>v+k)};
 useEffect(()=>{const h=(e:KeyboardEvent)=>{if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&![' ','Enter'].includes(e.key)){setQ(v=>v+e.key.toUpperCase());return}if(e.key==='Escape'||e.key==='Backspace'&&zone==='search'){onBackToSidebar();return}
  if(e.key==='ArrowLeft'){if(zone==='keys'){if(col>0)setCol(c=>c-1);else setZone('search')}else if(zone==='results'){if(ri>0)setRi(i=>i-1);else setZone('keys')}else if(zone==='recent')setZone('search')}
  if(e.key==='ArrowRight'){if(zone==='keys'){if(col<KEYS[row].split(' ').length-1)setCol(c=>c+1);else if(results.length)setZone('results')}else if(zone==='results'&&ri<results.length-1)setRi(i=>i+1)}
  if(e.key==='ArrowUp'){if(zone==='keys'){if(row>0){const nr=row-1;setRow(nr);setCol(c=>Math.min(c,KEYS[nr].split(' ').length-1))}else setZone('search')}else if(zone==='results'&&ri>=4)setRi(i=>i-4)}
  if(e.key==='ArrowDown'){if(zone==='search')setZone('keys');else if(zone==='recent')setZone('keys');else if(zone==='keys'){if(row<KEYS.length-1){const nr=row+1;setRow(nr);setCol(c=>Math.min(c,KEYS[nr].split(' ').length-1))}else if(results.length)setZone('results')}else if(zone==='results'&&ri+4<results.length)setRi(i=>i+4)}
  if(e.key==='Enter'){if(zone==='search')voice();else if(zone==='keys')keyPress(KEYS[row].split(' ')[col]);else if(zone==='recent'){const x=recents[ri];if(x){setQ(x);libraryManager.addSearchQuery(x);setZone('results')}}else if(zone==='results'&&results[ri])onSelectAnime(results[ri])}
 };window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[zone,row,col,ri,results,recents,onBackToSidebar]);
 return <main className="min-h-screen bg-[#080a10] px-10 pb-16 pt-12 text-white lg:px-16">
  <div className="mb-10 flex items-end justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.28em] text-white/35">Kinoma TV</div><h1 className="mt-2 text-5xl font-black tracking-tight">Find your next anime.</h1><p className="mt-2 text-sm text-white/45">Fast search, voice input, and remote-first navigation.</p></div><button onClick={onBackToSidebar} className="rounded-full border border-white/10 bg-white/5 p-3 text-white/60 hover:text-white"><ArrowLeft/></button></div>
  <div className="grid gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
   <section className="rounded-[32px] border border-white/10 bg-white/[.035] p-6 shadow-2xl">
    <div className={`flex items-center gap-4 rounded-[24px] border p-5 ${zone==='search'?'border-white/50 bg-white/[.07]':'border-white/10 bg-black/20'}`}><Search className="h-6 w-6 text-violet-300"/><div className="min-w-0 flex-1 text-2xl font-black">{q||<span className="text-white/25">Search anime...</span>}</div>{q&&<button onClick={()=>setQ('')}><X className="text-white/40"/></button>}<button onClick={voice} className={`rounded-[16px] p-3 ${listening?'bg-fuchsia-400 text-black':'bg-gradient-to-r from-violet-400 to-cyan-300 text-black'}`}>{listening?<MicOff/>:<Mic/>}</button></div>
    <div className="mt-6 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.22em] text-white/35">Remote keyboard</span><span className="text-[10px] text-white/30">Enter to select</span></div>
    <div className="mt-3 space-y-2">{KEYS.map((line,r)=>{const ks=line.split(' ');return <div key={line} className="flex gap-2">{ks.map((k,c)=>{const f=zone==='keys'&&row===r&&col===c;return <button key={k} onClick={()=>keyPress(k)} className={`h-12 flex-1 rounded-[14px] border text-sm font-black ${f?'bg-white text-black border-white scale-105':'border-white/8 bg-white/[.035] text-white/65'}`}>{k==='SPACE'?'Space':k}</button>})}</div>})}</div>
    {recents.length>0&&<div className="mt-7"><div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-white/35"><Clock className="h-3 w-3"/>Recent</div><div className="flex flex-wrap gap-2">{recents.map((x,i)=><button key={x} onClick={()=>{setQ(x);setZone('results')}} className={`rounded-full border px-4 py-2 text-xs font-bold ${zone==='recent'&&ri===i?'bg-white text-black':'border-white/10 bg-white/5 text-white/55'}`}>{x}</button>)}</div></div>}
   </section>
   <section className="min-w-0"><div className="mb-5 flex items-center gap-2"><Sparkles className="h-4 w-4 text-fuchsia-300"/><h2 className="text-xl font-black">{loading?'Searching…':q?'Results':'Explore'}</h2></div>{loading?<div className="rounded-[28px] border border-white/8 bg-white/[.03] p-10 text-white/35">Finding titles…</div>:results.length?<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{results.map((x,i)=><TVCard key={x.id+i} item={x} isFocused={zone==='results'&&ri===i} onSelect={()=>onSelectAnime(x)} index={i}/>)}</div>:<div className="rounded-[28px] border border-white/8 bg-white/[.03] p-10 text-white/35">{q?'No titles found. Try another name.':'Start typing or use the microphone.'}</div>}</section>
  </div>
 </main>;
}