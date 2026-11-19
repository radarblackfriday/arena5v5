/* ===== MAPA DUST 2 (módulo de jogo) =====
   Mapa "De_Dust 2 with real light" por Neo_minigan (CC BY 4.0) — https://sketchfab.com/neominigan
   O visual vem do arquivo dust2.glb (luz já "assada" na textura). A colisão, a altura do chão e o caminho
   dos bots vêm de dust2.bin (grade de 25 cm gerada a partir do próprio mapa).
   Só liga nas partidas 5v5 / mata-mata. No treino, e se algo falhar, o jogo usa o mapa antigo. */
(function(){
'use strict';
let LST=0,LSH=0,dead=false,ON=false,READY=false,CORE=null,GRP=null,SITES=null,MESHES=[],HID=[],BAK=null,gS=0,BUD=2,lt=performance.now();
const OFF=3.5;                       /* o mapa é levantado 3,5 m para o chão nunca ficar abaixo de y=0 */
const A_SITE=[15,-44.5],B_SITE=[-32,-47.5],T_SP=[-25,10],CT_SP=[-12,-39.5];
const SRC=['https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js','https://unpkg.com/three@0.128.0/examples/js/loaders/GLTFLoader.js','https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/examples/js/loaders/GLTFLoader.js'];
function st(t){try{let d=document.getElementById('d2st');if(!d){d=document.createElement('div');d.id='d2st';d.style.cssText='position:fixed;left:4px;bottom:2px;z-index:99999;font:bold 15px sans-serif;color:#ffd24a;background:rgba(0,0,0,.55);padding:1px 4px;pointer-events:none;max-width:70vw';document.body.appendChild(d)}d.textContent='[v4] '+t}catch(_){}}
const fail=e=>{st('Dust2 ERRO: '+(e&&e.message||e));dead=true;try{leave()}catch(_){}try{console.error('[dust2]',e)}catch(_){}};
const rn=()=>typeof rnd==='function'?rnd():Math.random();
function loadLoader(i){return new Promise((res,rej)=>{if(THREE.GLTFLoader)return res();if(i>=SRC.length)return rej(new Error('GLTFLoader indisponível'));
 const s=document.createElement('script');s.src=SRC[i];s.onload=()=>THREE.GLTFLoader?res():loadLoader(i+1).then(res,rej);s.onerror=()=>loadLoader(i+1).then(res,rej);document.head.appendChild(s)})}
const get=u=>fetch(u).then(r=>{if(!r.ok)throw new Error(u+' '+r.status);return r.arrayBuffer()});

/* ---- guarda o que fica visível do mapa antigo (não esconde luzes, céu, sol, câmera, bomba) ---- */
function snapshot(){
 const hasBot=o=>{let f=false;o.traverse&&o.traverse(x=>{if(x.userData&&x.userData.bot)f=true});return f};
 const keep=o=>o===GRP||o===SITES||hasBot(o)||o===C||o===bm||o.isLight||(typeof WG!=='undefined'&&o===WG)||(o.material&&o.material.side===THREE.BackSide)||
  (o.geometry&&o.geometry.type==='SphereGeometry'&&o.geometry.parameters.radius>=7)||(o.isSprite&&o.material.fog===false&&o.scale.x>10);
 return S.children.filter(o=>o.visible&&(o.isMesh||o.isGroup||o.isSprite)&&!keep(o))}
let OLDVIS=null;               /* objetos do mapa antigo, anotados quando o jogo abre */

function mkSites(){
 const g=new THREE.Group();
 [A_SITE,B_SITE].forEach((p,i)=>{
  const y=CORE.ground(p[0],p[1]);
  const r=new THREE.Mesh(new THREE.RingGeometry(2.8,3.2,32),new THREE.MeshBasicMaterial({color:0xffd24a,side:2,depthWrite:false,fog:false}));r.rotation.x=-Math.PI/2;r.position.set(p[0],y+.06,p[1]);g.add(r);
  const d=new THREE.Mesh(new THREE.CircleGeometry(2.8,32),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,opacity:.18,side:2,depthWrite:false,fog:false}));d.rotation.x=-Math.PI/2;d.position.set(p[0],y+.05,p[1]);g.add(d);
  const c=document.createElement('canvas');c.width=c.height=64;const q=c.getContext('2d');q.fillStyle='#ffd24a';q.font='bold 52px sans-serif';q.textAlign='center';q.fillText('AB'[i],32,50);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),fog:false}));s.scale.set(2,2,1);s.position.set(p[0],y+3.2,p[1]);g.add(s)});
 return g}

function enter(){
 if(ON)return;if(!READY||!CORE||dead)throw new Error('mapa não pronto');
 ON=true;
 BAK={walls:walls.slice(),boxes:boxes.slice(),ND:ND.slice(),SI:SI.map(v=>v.clone()),fog:S.fog,bg:S.background,far:C.far};
 OLDVIS=snapshot();OLDVIS.forEach(o=>o.visible=false);st('Dust2 LIGADO ('+OLDVIS.length+' itens antigos escondidos)');
 S.add(GRP);GRP.visible=true;if(!SITES)SITES=mkSites();S.add(SITES);
 walls.length=0;MESHES.forEach(m=>walls.push(m));boxes.length=0;
 const sp=[A_SITE,B_SITE];SI.forEach((v,i)=>v.set(sp[i][0],CORE.ground(sp[i][0],sp[i][1]),sp[i][1]));
 ND.length=0;CORE.scatter(5,.9).forEach(q=>ND.push(new V(q[0],CORE.ground(q[0],q[1]),q[1])));
 S.fog=new THREE.Fog(0xcfd8e3,70,300);S.background=new THREE.Color(0xa9c6e6);C.far=Math.max(C.far,400);C.updateProjectionMatrix();
 gS=CORE.ground(P.p.x,P.p.z)}
function leave(){
 if(!ON)return;ON=false;
 try{S.remove(GRP);if(SITES)S.remove(SITES)}catch(_){}
 if(OLDVIS)OLDVIS.forEach(o=>o.visible=true);
 if(BAK){walls.length=0;BAK.walls.forEach(x=>walls.push(x));boxes.length=0;BAK.boxes.forEach(x=>boxes.push(x));ND.length=0;BAK.ND.forEach(x=>ND.push(x));
  SI.forEach((v,i)=>v.copy(BAK.SI[i]));S.fog=BAK.fog;S.background=BAK.bg;C.far=BAK.far;C.updateProjectionMatrix();BAK=null}
 try{bots.forEach(b=>{b.p.y=0;b.mesh.position.y=0});P.p.y=0}catch(_){}}

/* ---- troca das funções do jogo (só valem com o mapa ligado) ---- */
const ocol=col,olos=los,onav=nav,os0=spawn0;
col=function(p,r){if(!ON)return ocol(p,r);CORE.col(p,r*.82)};
/* visão do bot: primeiro a grade (rápido) e depois um raio de verdade contra o mapa, na altura do peito */
let RC3=null;const o3=new V(),d3=new V();
function ray3(a,b){
 if(!RC3)RC3=new THREE.Raycaster();
 o3.set(a.x,a.y+1.5,a.z);d3.set(b.x-a.x,(b.y+1.35)-(a.y+1.5),b.z-a.z);const L=d3.length();if(L<.3)return true;d3.multiplyScalar(1/L);
 RC3.set(o3,d3);RC3.near=0;RC3.far=L-.2;RC3.firstHitOnly=true;
 return RC3.intersectObjects(MESHES,false).length===0}
los=function(a,b){if(!ON)return olos(a,b);if(!CORE.los(a,b))return false;try{return ray3(a,b)}catch(_){return true}};
spawn0=function(e){
 os0(e);if(!ON)return;
 const at=e.team?T_SP:CT_SP,q=CORE.randomFree(at[0],at[1],3.4,.9,rn);
 e.p.set(q[0],CORE.ground(q[0],q[1]),q[1]);e._d2=null;
 if(e===P){P.yaw=P.team?0:Math.PI;gS=e.p.y}else try{e.mesh.position.copy(e.p)}catch(_){}};
nav=function(b,g){
 if(!ON)return onav(b,g);
 if(CORE.los(b.p,g))return g;
 let pc=b._d2;
 if(pc&&(Math.hypot(pc.gx-g.x,pc.gz-g.z)>3||Math.hypot(pc.path[pc.i][0]-b.p.x,pc.path[pc.i][1]-b.p.z)>5))pc=b._d2=null;
 if(!pc){
  if(BUD<=0)return g;BUD--;
  const p=CORE.path(b.p.x,b.p.z,g.x,g.z);if(!p||p.length<2)return g;
  pc=b._d2={path:p,i:0,gx:g.x,gz:g.z}}
 /* anda para o ponto mais distante do caminho que o bot enxerga (até 6 m) */
 let best=pc.i;const n=pc.path.length;
 for(let k=pc.i;k<n&&k<pc.i+40;k++){const q=pc.path[k];if(Math.hypot(q[0]-b.p.x,q[1]-b.p.z)>6)break;if(CORE.los(b.p,{x:q[0],z:q[1]}))best=k}
 if(best===pc.i&&best<n-1&&Math.hypot(pc.path[best][0]-b.p.x,pc.path[best][1]-b.p.z)<.9)best++;
 pc.i=best;const q=pc.path[best];return new V(q[0],b.p.y,q[1])};

/* ---- por quadro (roda antes das outras camadas de desenho) ---- */
function frame(){
 const now=performance.now();let dt=(now-lt)/1000;lt=now;if(!(dt>0)||dt>.1)dt=.016;BUD=2;
 if(now-LST>1000){LST=now;st('Dust2 LIGADO · chão '+CORE.ground(P.p.x,P.p.z).toFixed(1)+' · escondidos '+(OLDVIS?OLDVIS.length:0)+' · mapa na cena '+(GRP&&GRP.parent===S?'sim':'NÃO'))}
 if(now-LSH>100){LSH=now;for(const b of bots){if(b.hp>0&&b.tg&&b.tg.hp>0&&!los(b.p,b.tg.p)){b.tg=null}}}
 const g=CORE.ground(P.p.x,P.p.z);gS=Math.abs(g-gS)>1.5?g:gS+(g-gS)*(1-Math.exp(-dt*14));
 P.p.y=g;C.position.y+=gS;
 for(const b of bots){const y=CORE.ground(b.p.x,b.p.z);b.p.y=y;if(b.mesh)b.mesh.position.y=y}
 if(RD&&RD.pos&&bm.visible)bm.position.y=RD.pos.y+.08}

function start(){
 if(typeof THREE==='undefined'||typeof S==='undefined'||typeof D2Core==='undefined'||typeof walls==='undefined'||typeof setupMatch!=='function'||typeof newRound!=='function')throw new Error('jogo incompleto');

 st('Dust2 carregando…');
 Promise.all([get('dust2.bin?v=3'),get('dust2b.glb?v=3'),loadLoader(0)]).then(([bin,glb])=>{
  CORE=D2Core(bin,OFF);
  const cib0=window.createImageBitmap;window.createImageBitmap=undefined;
  try{new THREE.GLTFLoader().parse(glb,'',gltf=>{
   try{
    GRP=gltf.scene;GRP.position.y=OFF;MESHES=[];
    GRP.traverse(o=>{if(!o.isMesh)return;MESHES.push(o);o.castShadow=o.receiveShadow=false;
     [].concat(o.material).forEach(m=>{if(m.map){m.map.encoding=THREE.LinearEncoding;m.map.anisotropy=4;m.map.needsUpdate=true}m.fog=false;m.needsUpdate=true})});
    if(!MESHES.length)throw new Error('mapa vazio');
    GRP.updateMatrixWorld(true);READY=true;st('Dust2 pronto ('+MESHES.length+' peças)');console.log('[dust2] ok',MESHES.length,'peças')
   }catch(e){fail(e)}},e=>fail(e))}finally{window.createImageBitmap=cib0}
 }).catch(fail);
 /* liga/desliga o mapa a cada rodada (o setupMatch é trocado pelo módulo dos bots, por isso uso o newRound) */
 const onr=window.newRound;
 window.newRound=function(){
  try{const want=!dead&&READY&&LB.mode!==2&&!(window.__TR&&(__TR.pending||__TR.on));if(want)enter();else leave()}catch(e){fail(e)}
  const r=onr.apply(this,arguments);try{if(ON){P.yaw=P.team?0:Math.PI}}catch(_){}return r};
 const pr=R.render;
 R.render=function(s,c){if(ON&&!dead&&s===S&&c===C){try{frame()}catch(e){fail(e)}}return pr.apply(R,arguments)};
}
try{start()}catch(e){fail(e)}
})();
