import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {chapters,colors} from './data.js';

export const points=chapters.map((_,i)=>new T.Vector3(Math.sin(i*.95)*5,0,-i*18));
export const path=new T.CatmullRomCurve3(points,false,'catmullrom',.35);
export const stations=points.map((p,i)=>{let nearest=0,d=Infinity;for(let j=0;j<=2000;j++){const v=path.getPointAt(j/2000).distanceTo(p);if(v<d){d=v;nearest=j/2000}}return nearest});

export function createWorld(scene){
 const stone=new T.MeshStandardMaterial({color:0xdad8cc,roughness:.86});
 const edge=new T.MeshStandardMaterial({color:0xb9bcae,roughness:.8});
 const ink=new T.MeshStandardMaterial({color:0x263b39,roughness:.55});
 const white=new T.MeshStandardMaterial({color:0xf2eee4,roughness:.55});
 const groups=[],screens=[],animated=[],hit=[];let exploded=false,queue=8,cart=0,fitness=true,test=0;
 function mesh(geo,mat,x,y,z,p=scene){const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
 const box=(w,h,d,x,y,z,m=stone,p=scene)=>mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.08),m,x,y,z,p);
 const cyl=(r,h,x,y,z,m=stone,p=scene)=>mesh(new T.CylinderGeometry(r,r,h,64),m,x,y,z,p);
 const lineMat=new T.MeshBasicMaterial({color:0xc38b62});
 function text(str,x,y,z,w,h,p,color='#354942'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.font='500 96px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(str,512,128);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;
  const o=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false}),x,y,z,p);o.castShadow=false;return o;
 }
 // Fine mineral surface: subtle variation, no noisy postprocessing over the interface.
 const grain=document.createElement('canvas');grain.width=grain.height=256;const gc=grain.getContext('2d');const img=gc.createImageData(256,256);let seed=61;const rand=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646};
 for(let j=0;j<img.data.length;j+=4){const v=218+rand()*16;img.data.set([v,v,v-4,255],j)}gc.putImageData(img,0,0);const tx=new T.CanvasTexture(grain);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(20,20);tx.colorSpace=T.SRGBColorSpace;stone.map=tx;
 const ground=mesh(new T.PlaneGeometry(1600,1600),new T.MeshStandardMaterial({color:0xb6bdb2,roughness:.96}),0,-.82,-80);ground.rotation.x=-Math.PI/2;
 // A continuous curved ribbon instead of a repeated straight corridor.
 const verts=[],uv=[],ids=[],steps=900;
 for(let i=0;i<=steps;i++){const u=i/steps,p=path.getPointAt(u),t=path.getTangentAt(u),side=new T.Vector3(-t.z,0,t.x);for(const s of [-1,1]){const q=p.clone().addScaledVector(side,s*2.35);verts.push(q.x,-.01,q.z);uv.push((s+1)/2,u*50)}if(i<steps){const a=i*2;ids.push(a,a+2,a+1,a+1,a+2,a+3)}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ids);geo.computeVertexNormals();const ribbon=mesh(geo,stone,0,0,0);ribbon.material.side=T.DoubleSide;
 for(let i=0;i<90;i++){const u=i/89,p=path.getPointAt(u),t=path.getTangentAt(u);const mark=box(.055,.012,.35,p.x,0,p.z,lineMat);mark.rotation.y=Math.atan2(-t.x,-t.z)}
 function tree(x,z,g,scale=1){const wood=new T.MeshStandardMaterial({color:0x666550,roughness:1});const leaves=new T.MeshStandardMaterial({color:0x71856a,roughness:1});const tr=new T.Group();tr.position.set(x,0,z);tr.scale.setScalar(scale);g.add(tr);mesh(new T.CylinderGeometry(.09,.16,2.6,9),wood,0,1.3,0,tr);for(let j=0;j<9;j++){const a=j*2.4;const o=mesh(new T.IcosahedronGeometry(.8+rand()*.45,1),leaves,Math.sin(a)*.7,2.3+rand()*1.3,Math.cos(a)*.6,tr);o.scale.set(1,.72,1)} }
 function screen(i,g){const c=document.createElement('canvas');c.width=1200;c.height=800;const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;const frame=new T.Group();frame.position.set(2.6,2.3,-3.4);frame.scale.setScalar(.65);frame.rotation.y=-.12;g.add(frame);box(5.9,4,.22,0,0,0,ink,frame);mesh(new T.PlaneGeometry(5.64,3.76),new T.MeshBasicMaterial({map:texture}),0,0,.119,frame);box(.14,1,.14,0,-2.45,0,ink,frame);box(2.6,.12,1.2,0,-2.98,0,ink,frame);frame.traverse(o=>{if(o.isMesh){o.userData.chapter=i;hit.push(o)}});screens.push({i,c,texture});return frame}
 const mats=colors.map(color=>new T.MeshStandardMaterial({color,roughness:.48,metalness:.15}));
 points.forEach((p,i)=>{
  const g=new T.Group();g.position.copy(p);const heading=path.getTangentAt(stations[i]);g.rotation.y=Math.atan2(-heading.x,-heading.z);scene.add(g);groups.push(g);cyl(10,.55,1,-.31,-2,stone,g);
  // Each island is a small piece of architecture, open to the sky.
  const border=mesh(new T.TorusGeometry(9.35,.018,8,120),edge,1,-.02,-2,g);border.rotation.x=-Math.PI/2;
  box(8,.42,6.5,4.7,.18,-3.2,white,g);text(String(i+1).padStart(2,'0'),-4.4,.8,-1,1,.4,g);
  tree(-5,-5,g,1.15);tree(8,-7,g,.8);
  for(let j=0;j<5;j++){box(.07,.8,.07,-3.5,.4,-7+j*.4,edge,g)}
  if(i===0){
   for(let j=0;j<4;j++){const ar=new T.Group();ar.position.set(4.2,0,-4-j*1.5);g.add(ar);box(.6,7,.65,-2.5,3.5,0,stone,ar);box(.6,7,.65,2.5,3.5,0,stone,ar);box(5.6,.65,.65,0,7,0,stone,ar)}
   const orb=mesh(new T.TorusKnotGeometry(1.1,.32,180,24,2,3),mats[0],4.2,3.6,-5,g);animated.push({type:'orb',o:orb});
   cyl(1.8,.3,4.2,.55,-5,ink,g);text('IDEAS TAKE SHAPE',4.2,1.1,-2.4,4,.5,g);
  }else if(i===1){
   ['REACT','SPRING BOOT','MYSQL'].forEach((s,j)=>{const b=box(4.4,.75,3.1,4.4,.9+j*1.25,-3,mats[(j+1)%9],g);text(s,4.4,.9+j*1.25,-1.43,3,.4,g,'#f7f2e8');animated.push({type:'layer',o:b,base:b.position.y,j})});
  }else if([2,3,4,5].includes(i)){
   screen(i,g);text(['','','LEARN / BUILD / GROW','MAKE TIME MATTER','A THOUGHTFUL CHECKOUT','PROGRESS IS PERSONAL'][i],3,4.35,-3.7,3.8,.36,g);
   if(i===2){for(let j=0;j<3;j++){const b=box(.7,.7,.7,1.4+j*1,.82,-.9,mats[2],g);animated.push({type:'layer',o:b,base:.82,j})}}
   if(i===3)for(let j=0;j<5;j++){const b=mesh(new T.SphereGeometry(.17,16,16),mats[3],2+j*.8,.85,-.8,g);animated.push({type:'queue',o:b,j})}
   if(i===4){for(let j=0;j<3;j++){const b=box(.7,.9,.6,2+j*1.1,.9,-.8,mats[4],g);animated.push({type:'cart',o:b,j})}}
   if(i===5){const curve=new T.CatmullRomCurve3(Array.from({length:35},(_,k)=>new T.Vector3(1.7+k*.15,.9+Math.sin(k*.5)*.22,-.8)));const pulse=mesh(new T.TubeGeometry(curve,90,.04,8,false),mats[5],0,0,0,g);animated.push({type:'fitness',o:pulse})}
  }else if(i===6){for(let j=0;j<5;j++){const b=mesh(new T.IcosahedronGeometry(.65,1),mats[6],2.1+j*1.1,1.5+Math.sin(j)*.4,-3,g);animated.push({type:'lab',o:b,j})}text('ASK. TRY. LEARN.',4.4,4,-4,5,.8,g)}
  else if(i===7){['2023','2025','2026'].forEach((s,j)=>{box(1.5,1.4+j*.9,1.5,2.4+j*2,.7+j*.45,-3,mats[7],g);text(s,2.4+j*2,1.7+j*.9,-2.2,1.3,.4,g)});text('EVERY STEP COUNTS',4.5,5,-4,5,.45,g)}
  else{const ring=mesh(new T.TorusGeometry(2.3,.17,24,100),mats[8],4.3,3.1,-3,g);text('HELLO.',4.3,3.1,-2.7,3,1,g);animated.push({type:'portal',o:ring});cyl(2.6,.28,4.3,.5,-3,white,g)}
 });
 function drawScreen({i,c,texture}){
  const cx=c.getContext('2d'),accent=colors[i];cx.fillStyle='#f3f1e9';cx.fillRect(0,0,1200,800);cx.fillStyle='#20352f';cx.fillRect(0,0,210,800);cx.font='bold 28px Arial';cx.fillStyle='#f4f0e7';cx.fillText(['','','learn.','queue.','the store.','stride.'][i],30,65);cx.font='18px Arial';['Overview','Your activity','Saved items','Settings'].forEach((s,j)=>{cx.fillStyle=j===0?'#e4c5a0':'#98ada5';cx.fillText(s,30,150+j*60)});
  cx.fillStyle='#253d35';cx.font='bold 36px Arial';cx.fillText(['','','Keep your curiosity.','Your time, considered.','Objects for the everyday.','A little better, every day.'][i],255,80);cx.font='18px Arial';cx.fillStyle='#7a867d';cx.fillText('INTERFACE STUDY  /  ILLUSTRATIVE PROJECT PREVIEW',255,115);
  const card=(x,y,w,h)=>{cx.fillStyle='#e6e8df';cx.beginPath();cx.roundRect(x,y,w,h,14);cx.fill()};
  if(i===2){['Java foundations','Data structures','Building with React'].forEach((s,j)=>{card(255,170+j*170,890,145);cx.fillStyle=accent;cx.fillRect(280,200+j*170,80,80);cx.fillStyle='#253d35';cx.font='bold 26px Arial';cx.fillText(s,390,225+j*170);cx.font='19px Arial';cx.fillText('Continue learning  →',390,265+j*170);cx.fillStyle='#abb89a';cx.fillRect(390,290+j*170,360-j*70,5)})}
  if(i===3){card(255,170,530,360);cx.fillStyle=accent;cx.font='100px Arial';cx.fillText(String(queue*4)+' min',290,330);cx.font='24px Arial';cx.fillStyle='#253d35';cx.fillText('Illustrative estimated wait',290,390);cx.fillText(queue+' visitors · 2 active counters',290,435);card(810,170,335,360);cx.font='25px Arial';cx.fillText('You’re in good hands.',835,240);cx.font='84px Arial';cx.fillText('A-0'+(9-queue),850,365);cx.font='22px Arial';cx.fillText('Now serving',850,410);cx.fillStyle=accent;cx.fillRect(255,575,890,85);cx.fillStyle='white';cx.font='25px Arial';cx.fillText('Appointments. Walk-ins. One clear view.',285,628)}
  if(i===4){['Everyday carry','Desk essentials','Quiet moments'].forEach((s,j)=>{card(255+j*300,180,275,390);cx.fillStyle=['#be9e7d','#7e928b','#a5a68d'][j];cx.fillRect(280+j*300,215,225,230);cx.fillStyle='#f1ebdd';cx.beginPath();cx.arc(390+j*300,330,65,0,Math.PI*2);cx.fill();cx.fillStyle='#253d35';cx.font='22px Arial';cx.fillText(s,275+j*300,500)});cx.font='25px Arial';cx.fillText('Your illustrative cart: '+cart+' items',255,650)}
  if(i===5){card(255,170,890,440);cx.strokeStyle=accent;cx.lineWidth=7;cx.beginPath();for(let j=0;j<12;j++){const x=290+j*73,y=540-j*21-Math.sin(j)*30;j?cx.lineTo(x,y):cx.moveTo(x,y)}cx.stroke();cx.fillStyle='#253d35';cx.font='26px Arial';cx.fillText('Consistency looks good on you.',285,235);cx.font='20px Arial';cx.fillText('Workouts  ·  Daily activity  ·  Goals',255,680)}
  texture.needsUpdate=true;
 }
 screens.forEach(drawScreen);
 return {hit,act(i){if(i===1||i===2){exploded=!exploded;return exploded?'Architecture expanded':'Architecture assembled'}if(i===3){queue=queue>0?queue-1:8;screens.filter(s=>s.i===3).forEach(drawScreen);return 'Next visitor called · illustrative wait updated'}if(i===4){cart++;screens.filter(s=>s.i===4).forEach(drawScreen);return 'Added to the illustrative cart'}if(i===5){fitness=!fitness;return fitness?'Motion resumed':'Motion paused'}if(i===6){test++;return 'Experiment '+test+' · explore the project notes for the real work'}return null},update(t,dt,pos,paused){groups.forEach(g=>g.visible=g.position.distanceTo(pos)<48);for(const a of animated){if(a.type==='orb'){a.o.rotation.y=t*.2;a.o.rotation.z=.25+Math.sin(t*.2)*.12}if(a.type==='layer')a.o.position.y=T.MathUtils.damp(a.o.position.y,a.base+(exploded?a.j*.5:.0),4,dt);if(a.type==='queue')a.o.position.y=.85+(paused?0:Math.sin(t+a.j)*.05);if(a.type==='cart')a.o.rotation.y=cart> a.j?.15:0;if(a.type==='lab'){a.o.rotation.y=t*.25;a.o.position.y=1.8+Math.sin(t*.6+a.j)*.3}if(a.type==='fitness'&&fitness&&!paused)a.o.scale.y=1+Math.sin(t*2)*.15;if(a.type==='lab')a.o.material.emissive.setHex(test>0?0x151020:0);if(a.type==='portal')a.o.rotation.y=Math.sin(t*.3)*.12}}
 };
}
