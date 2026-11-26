import React,{useEffect,useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {launchScene} from './scene.js';
import {chapters,colors,stack} from './data.js';
import './style.css';

const arrow=<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5"/></svg>;
export default function App(){
 const scene=useRef(),api=useRef(),dialog=useRef(),returnFocus=useRef();
 const [state,setState]=useState({index:0,tour:false,paused:false,cinema:false,progress:0,ready:false});
 const [panel,setPanel]=useState(null),[toast,setToast]=useState(''),[error,setError]=useState(false);const toastTimer=useRef();
 const reduced=useReducedMotion(),c=chapters[state.index];
 useEffect(()=>{try{api.current=launchScene(scene.current,setState)}catch(e){console.error(e);setError(true)}return()=>{api.current?.dispose();clearTimeout(toastTimer.current)}},[]);
 useEffect(()=>{document.body.dataset.view=state.cinema?'cinema':'portfolio'},[state.cinema]);
 function open(p){returnFocus.current=document.activeElement;setPanel(p);api.current?.modal(true)}
 function close(){dialog.current?.close();setPanel(null);api.current?.modal(false);returnFocus.current?.focus()}
 useEffect(()=>{if(panel!==null&&!dialog.current.open)dialog.current.showModal()},[panel]);
 function go(i){close();api.current?.go(i)}
 function notify(message){setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),3000)}
 const demo=['','Separate the layers','Explore the layers','Call next visitor','Add to cart','Pause / resume motion','Run an experiment'][state.index];
 const transition={duration:reduced?0:.55,ease:[.22,1,.36,1]};
 return <>
  <div ref={scene} className="world" role="img" aria-label="An open architectural landscape. A developer follows a winding path through nine portfolio spaces."/>
  <div className="reading-shade"/>
  <div className="transition-curtain"/>
  <header className="site-header interface"><button className="identity" onClick={()=>go(0)} aria-label="Jei Surya — return to the beginning"><span className="monogram">j<span>.</span></span><span>JEI SURYA T<small>DEVELOPER & CURIOUS HUMAN</small></span></button><nav aria-label="Main navigation"><button onClick={()=>open('index')}>Explore work <span className="tiny-num">04</span></button><button onClick={()=>{go(7)}}>About</button><button className="contact-link" onClick={()=>go(8)}>Let’s talk {arrow}</button></nav></header>
  <div className="edition interface"><span className="dot"/> A PORTFOLIO, IN NINE PLACES <span>2026 — 2027</span></div>
  <AnimatePresence mode="wait"><motion.main key={state.index} className={'story interface '+(state.index===0?'intro':'')} initial={{opacity:0,y:22}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={transition}>
   <div className="chapter-label"><span>{String(state.index+1).padStart(2,'0')}</span><i/>{c.name}</div>
   <h1>{c.headline}<em>{c.accent}</em></h1>
   <p className="summary">{c.summary}</p>
   <div className="story-actions"><button className="primary" onClick={()=>state.index===0?api.current?.go(1):open(state.index)}>{state.index===0?'Step inside':state.index===8?'Start a conversation':state.index===1?'Explore my toolkit':state.index===7?'My story & experience':'Read the project'}<span>{arrow}</span></button>{state.index===0?<button className="text-button" onClick={()=>open(0)}>A little about me ↗</button>:demo?<button className="text-button" onClick={()=>notify(api.current?.action()||'Explore this project in the notes.')}>{demo} ↗</button>:null}</div>
   {state.index===0?<div className="signature">Java. Spring Boot. React.<span>Built with intent.</span></div>:<div className="tech-line">{c.tags.slice(0,3).join('  /  ')}</div>}
  </motion.main></AnimatePresence>
  <aside className="space-note interface"><span>THE SPACE</span><p>{['An idea taking shape.','A foundation in layers.','A place for shared knowledge.','A little room to breathe.','Every detail considered.','Progress, made visible.','Curiosity without a ceiling.','A path still unfolding.','There’s always a next chapter.'][state.index]}</p><span className="space-line"/></aside>
  <div className="view-tools interface"><button aria-pressed={state.tour} onClick={()=>api.current?.tour()}>{state.tour?'Ⅱ Pause tour':'▷ Guided walk'}</button><span/><button onClick={()=>api.current?.cinema()}>Scene only</button><button aria-label={state.paused?'Resume animation':'Pause animation'} aria-pressed={state.paused} onClick={()=>api.current?.pause()}>{state.paused?'▷':'Ⅱ'}</button></div>
  <footer className="interface"><div className="walking-hint"><span className="scroll-symbol"/><div>Scroll to wander<small>W / S to walk · drag to look</small></div></div><nav className="journey" aria-label="Journey chapters">{chapters.map((chapter,i)=><button key={chapter.slug} title={chapter.name} aria-label={'Go to '+chapter.name} aria-current={i===state.index?'step':undefined} className={i===state.index?'selected':''} onClick={()=>api.current?.go(i)}><span>{String(i+1).padStart(2,'0')}</span><i style={{background:colors[i]}}/>{i===state.index&&<b>{chapter.name}</b>}</button>)}</nav><button className="next-space" disabled={state.index===8} onClick={()=>api.current?.go(state.index+1)} aria-label="Next space">{arrow}</button></footer>
  <div className="route-progress interface"><i style={{width:state.progress*100+'%'}}/></div>
  {state.cinema&&<button className="exit-scene" onClick={()=>api.current?.cinema()}>Back to portfolio <kbd>ESC</kbd></button>}
  <AnimatePresence>{toast&&<motion.div role="status" className="toast" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{toast}</motion.div>}</AnimatePresence>
  <dialog ref={dialog} className="detail-dialog" onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===dialog.current)close()}} aria-labelledby="panel-title"><button className="close-panel" onClick={close} aria-label="Close details">×</button>{panel!==null&&<Details panel={panel} go={go} notify={notify}/>}</dialog>
  {!state.ready&&!error&&<div className="opening"><span>j.</span><p>A world is taking shape.</p></div>}
  {error&&<div className="render-error"><h2>The 3D view couldn’t start.</h2><p>You can still explore all the work and professional details.</p><button className="primary" onClick={()=>open('index')}>Open portfolio index {arrow}</button></div>}
 </>;
}
function Details({panel,go,notify}){
 if(panel==='index')return <div className="index-content"><p className="overline">A FEW THINGS I’VE BUILT</p><h2 id="panel-title">Selected work.<em>And the thinking behind it.</em></h2><div className="project-index">{chapters.filter((_,i)=>[2,3,4,5].includes(i)).map(c=>{const i=chapters.indexOf(c);return <button key={c.slug} onClick={()=>go(i)}><span className="index-number">0{i-1}</span><div><h3>{c.detail.title}</h3><p>{c.tags.slice(0,3).join(' / ')}</p></div>{arrow}</button>})}</div><div className="index-bottom"><button onClick={()=>go(6)}>Visit the experimental lab ↗</button><button onClick={()=>go(7)}>Experience & education ↗</button></div></div>;
 const c=chapters[panel],d=c.detail;
 if(d.stackView)return <div className="index-content"><p className="overline">FROM INTERFACE TO INFRASTRUCTURE</p><h2 id="panel-title">The toolkit.<em>Different tools. One connected system.</em></h2><div className="stack-grid">{stack.map(s=><section key={s.group}><h3>{s.group}</h3><p>{s.items.join(' · ')}</p></section>)}</div></div>;
 return <div className="case-content"><p className="overline">{String(panel+1).padStart(2,'0')} / {c.label}</p><h2 id="panel-title">{d.title}</h2><p className="case-lead">{d.lead}</p>{d.facts&&<dl className="facts">{d.facts.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}{d.timeline&&<div className="timeline">{d.timeline.map(([date,name,role])=><section key={name}><span>{date}</span><h3>{name}</h3><p>{role}</p></section>)}</div>}{d.features&&<section className="feature-section"><h3>What it does</h3><ul>{d.features.map(f=><li key={f}>{f}</li>)}</ul></section>}<div className="case-blocks">{d.blocks?.filter(([title])=>title!=='In this room').map(([title,body])=><section key={title}><h3>{title}</h3><p>{body}</p></section>)}</div>{d.stack&&<div className="case-tags">{d.stack.map(t=><span key={t}>{t}</span>)}</div>}{d.links&&<div className="case-links">{d.links.map(([label,url])=><a key={url} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div>}{d.contact&&<div className="contact-actions"><a className="primary" href="mailto:jeisurya624@gmail.com">Write me a note {arrow}</a><button className="text-button" onClick={async()=>{try{await navigator.clipboard.writeText('jeisurya624@gmail.com');notify('Email address copied')}catch{notify('jeisurya624@gmail.com')}}}>Copy email</button><a href="https://github.com/jeisurya15" target="_blank" rel="noreferrer">GitHub ↗</a><a href="https://linkedin.com/in/jeisurya15" target="_blank" rel="noreferrer">LinkedIn ↗</a></div>}<p className="case-caption">Professional details retained from the supplied résumé and existing portfolio. The 3D spaces and interface studies are illustrative.</p></div>;
}

