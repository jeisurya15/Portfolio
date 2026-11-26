import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createTechie} from './character.js';
import {createWorld,path,stations} from './world.js';
import {chapters} from './data.js';

export function launchScene(container,onState){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scene=new T.Scene();scene.background=new T.Color('#e5e5dc');scene.fog=new T.Fog('#e5e5dc',16,58);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;container.append(renderer.domElement);
 const pmrem=new T.PMREMGenerator(renderer);const environment=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=environment.texture;scene.environmentIntensity=.35;pmrem.dispose();
 const camera=new T.PerspectiveCamera(44,innerWidth/innerHeight,.1,220);
 scene.add(new T.HemisphereLight(0xffffff,0x9a9984,2.2));
 const sun=new T.DirectionalLight(0xfff1d5,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:65});sun.shadow.bias=-.0002;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
 const world=createWorld(scene),avatar=createTechie(scene),length=path.getLength();
 const initial=Math.max(0,chapters.findIndex(c=>c.slug===location.hash.slice(1)));
 let progress=stations[initial],target=progress,velocity=0,index=initial,paused=reduced,tour=false,dwell=0,next=initial+1,modal=false,cinema=false,time=0,yaw=0,dragging=false,lastX=0,key=0,cutTimer,disposed=false,raf=0,first=true;
 const pos=new T.Vector3(),tangent=new T.Vector3(),right=new T.Vector3(),camGoal=new T.Vector3(),lookGoal=new T.Vector3(),look=new T.Vector3();
 function emit(){onState({index,tour,paused,cinema,progress,ready:true})}
 function stopTour(){tour=false;target=progress;velocity=0;emit()}
 function go(i){i=T.MathUtils.clamp(i,0,8);tour=false;key=0;clearTimeout(cutTimer);if(paused){progress=target=stations[i];first=true;setIndex(i);emit();return}document.body.classList.add('scene-cut');cutTimer=setTimeout(()=>{progress=target=stations[i];velocity=0;first=true;setIndex(i);document.body.classList.remove('scene-cut');emit()},260)}
 function setIndex(i){if(index!==i){index=i;history.replaceState(null,'','#'+chapters[i].slug);emit()}}
 const api={go,action(){return world.act(index)},pause(){paused=!paused;tour=false;key=0;target=progress;velocity=0;emit()},tour(){if(tour){stopTour();return}paused=false;tour=true;dwell=0;if(index===8){progress=target=0;first=true;setIndex(0)}next=index+1;emit()},cinema(){cinema=!cinema;emit()},modal(value){modal=value;key=0;if(value){tour=false;target=progress;emit()}},resetLook(){yaw=0}};
 function wheel(e){if(modal)return;e.preventDefault();tour=false;target=T.MathUtils.clamp(target+e.deltaY*.000035,Math.max(0,progress-.035),Math.min(1,progress+.035));emit()}
 function down(e){if(modal||e.target.closest('input,textarea'))return;if(e.key==='Escape'){if(cinema){cinema=false;emit()}yaw=0;return}if(['w','W','s','S','ArrowUp','ArrowDown'].includes(e.key)&&(!e.target.closest('button,a')||/^[ws]$/i.test(e.key))){e.preventDefault();tour=false;key=['w','W','ArrowUp'].includes(e.key)?1:-1;emit()}if(e.key==='PageDown'){e.preventDefault();go(index+1)}if(e.key==='PageUp'){e.preventDefault();go(index-1)}}
 const up=()=>key=0;
 function pointerDown(e){if(e.button!==0)return;dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)}
 function pointerMove(e){if(!dragging)return;yaw=T.MathUtils.clamp(yaw+(e.clientX-lastX)*.004,-.65,.65);lastX=e.clientX}
 const pointerUp=()=>dragging=false;
 function resize(){camera.aspect=container.clientWidth/container.clientHeight;camera.updateProjectionMatrix();renderer.setSize(container.clientWidth,container.clientHeight)}
 addEventListener('resize',resize);addEventListener('wheel',wheel,{passive:false});addEventListener('keydown',down);addEventListener('keyup',up);addEventListener('blur',up);renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);resize();
 const clock=new T.Clock();let lastEmit=0;
 function render(){if(disposed)return;raf=requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.04);if(document.hidden)return;if(!paused)time+=dt;
  if(!modal){if(key)target=T.MathUtils.clamp(progress+key*.012,0,1);if(tour){if(dwell<4){dwell+=dt;target=stations[Math.max(0,next-1)]}else{target=stations[Math.min(8,next)];if(Math.abs(progress-target)<.0004){dwell=0;if(next===8){tour=false;emit()}else next++}}}}
  const error=(target-progress)*length,desired=T.MathUtils.clamp(error*3,-2.6,2.6);velocity=paused?0:T.MathUtils.damp(velocity,desired,6,dt);
  if(paused)progress=target;else if(Math.abs(error)<.003){progress=target;velocity=0}else progress=T.MathUtils.clamp(progress+velocity*dt/length,0,1);
  let near=0;stations.forEach((s,i)=>{if(Math.abs(progress-s)<Math.abs(progress-stations[near]))near=i});setIndex(near);
  path.getPointAt(progress,pos);path.getTangentAt(progress,tangent);right.set(-tangent.z,0,tangent.x);
  avatar.root.position.copy(pos);const heading=Math.atan2(-tangent.x,-tangent.z);avatar.root.rotation.y=heading;avatar.update(dt,velocity,time,paused,-.08);
  const follow=tangent.clone().multiplyScalar(-7.7).addScaledVector(right,-2.3);follow.applyAxisAngle(new T.Vector3(0,1,0),yaw);
  camGoal.copy(pos).add(follow);camGoal.y=3.6;
  lookGoal.copy(pos).addScaledVector(tangent,5).addScaledVector(right,index>=2&&index<=5?.9:.45);lookGoal.y=1.35;
  if(first||paused){camera.position.copy(camGoal);look.copy(lookGoal)}else{camera.position.lerp(camGoal,1-Math.exp(-dt*5));look.lerp(lookGoal,1-Math.exp(-dt*5))}camera.lookAt(look);
  sun.position.copy(pos).add(new T.Vector3(-10,17,7));sun.target.position.copy(pos);world.update(time,dt,pos,paused);renderer.render(scene,camera);
  if(time-lastEmit>.2||first){lastEmit=time;emit()}first=false;
 }
 render();return {...api,dispose(){disposed=true;cancelAnimationFrame(raf);clearTimeout(cutTimer);removeEventListener('resize',resize);removeEventListener('wheel',wheel);removeEventListener('keydown',down);removeEventListener('keyup',up);removeEventListener('blur',up);renderer.dispose();environment.dispose();scene.traverse(o=>{o.geometry?.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.filter(Boolean).forEach(m=>{m.map?.dispose();m.dispose()})});container.replaceChildren()}};
}
