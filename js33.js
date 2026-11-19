/* ===== DUST 2 — núcleo (sem THREE): colisão, altura do chão, linha de visão e caminhos =====
   Lê o arquivo dust2.bin (grade de 25 cm gerada a partir do mapa: altura do chão + distância até a parede). */
(function(root){
'use strict';
function Core(buf,OFF){OFF=OFF||0;
 const dv=new DataView(buf);
 const NX=dv.getUint16(0,true),NZ=dv.getUint16(2,true),CELL=dv.getFloat32(4,true),X0=dv.getFloat32(8,true),Z0=dv.getFloat32(12,true);
 const N=NX*NZ,H=new Int16Array(buf.slice(16,16+N*2)),Q=new Uint8Array(buf,16+N*2,N);
 const sdc=(i,k)=>(i<0||k<0||i>=NX||k>=NZ)?-1:(Q[k*NX+i]-128)*.0625;
 /* distância (m) até a parede, negativa dentro de parede; interpolada */
 function sd(x,z){
  const fx=(x-X0)/CELL-.5,fz=(z-Z0)/CELL-.5,i=Math.floor(fx),k=Math.floor(fz),tx=fx-i,tz=fz-k;
  const a=sdc(i,k),b=sdc(i+1,k),c=sdc(i,k+1),d=sdc(i+1,k+1);
  return (a*(1-tx)+b*tx)*(1-tz)+(c*(1-tx)+d*tx)*tz}
 function hc(i,k){i=i<0?0:i>=NX?NX-1:i;k=k<0?0:k>=NZ?NZ-1:k;return H[k*NX+i]*.01}
 function ground(x,z){
  const fx=(x-X0)/CELL-.5,fz=(z-Z0)/CELL-.5,i=Math.floor(fx),k=Math.floor(fz),tx=fx-i,tz=fz-k;
  return OFF+(hc(i,k)*(1-tx)+hc(i+1,k)*tx)*(1-tz)+(hc(i,k+1)*(1-tx)+hc(i+1,k+1)*tx)*tz}
 const SK=.1; /* a parede fica, em média, meio quadradinho dentro da célula bloqueada */
 function col(p,r){
  for(let it=0;it<4;it++){
   const d=sd(p.x,p.z)-SK;if(d>=r)return;
   const e=.12,gx=sd(p.x+e,p.z)-sd(p.x-e,p.z),gz=sd(p.x,p.z+e)-sd(p.x,p.z-e),l=Math.hypot(gx,gz);
   if(l<1e-4)return;
   const m=Math.min(r-d,.6);p.x+=gx/l*m;p.z+=gz/l*m}}
 function blocked(x,z){const i=Math.floor((x-X0)/CELL),k=Math.floor((z-Z0)/CELL);return i<0||k<0||i>=NX||k>=NZ||Q[k*NX+i]<128}
 function los(a,b){
  const dx=b.x-a.x,dz=b.z-a.z,L=Math.hypot(dx,dz);if(L<.01)return true;
  const n=Math.ceil(L/.15);for(let s=1;s<n;s++){const t=s/n;if(blocked(a.x+dx*t,a.z+dz*t))return false}return true}
 /* ---- caminhos (A* numa grade de 50 cm) ---- */
 const GS=1,GX=Math.ceil(NX/GS),GZ=Math.ceil(NZ/GS);
 const gx2x=i=>X0+(i+.5)*CELL*GS,gz2z=k=>Z0+(k+.5)*CELL*GS;
 const x2gx=x=>Math.floor((x-X0)/(CELL*GS)),z2gz=z=>Math.floor((z-Z0)/(CELL*GS));
 let pass=null;const P1=new Uint8Array(GX*GZ),P2=new Uint8Array(GX*GZ);
 for(let k=0;k<GZ;k++)for(let i=0;i<GX;i++){const d=sd(gx2x(i),gz2z(k))-SK;P1[k*GX+i]=d>=.5?1:0;P2[k*GX+i]=d>=.25?1:0}
 function mkPass(th){pass=th>=.4?P1:P2}
 pass=P1;
 function label(PS){const L=new Int32Array(GX*GZ),st=[];let n=0;for(let a=0;a<L.length;a++){if(!PS[a]||L[a])continue;n++;L[a]=n;st.push(a);while(st.length){const c=st.pop(),ci=c%GX,ck=(c/GX)|0;for(let d=0;d<4;d++){const ni=ci+(d==0)-(d==1),nk=ck+(d==2)-(d==3);if(ni<0||nk<0||ni>=GX||nk>=GZ)continue;const q=nk*GX+ni;if(PS[q]&&!L[q]){L[q]=n;st.push(q)}}}}return L}
 const L1=label(P1),L2=label(P2);
 function nearest(i,k){
  if(i>=0&&k>=0&&i<GX&&k<GZ&&pass[k*GX+i])return [i,k];
  for(let r=1;r<24;r++){let best=null,bd=1e9;
   for(let di=-r;di<=r;di++)for(let dk=-r;dk<=r;dk++){if(Math.max(Math.abs(di),Math.abs(dk))!==r)continue;
    const a=i+di,b=k+dk;if(a<0||b<0||a>=GX||b>=GZ||!pass[b*GX+a])continue;const d=di*di+dk*dk;if(d<bd){bd=d;best=[a,b]}}
   if(best)return best}
  return null}
 /* heap binário */
 function Heap(){this.a=[];this.k=[]}
 Heap.prototype.push=function(v,key){const a=this.a,kk=this.k;let i=a.length;a.push(v);kk.push(key);while(i>0){const p=(i-1)>>1;if(kk[p]<=kk[i])break;[a[p],a[i]]=[a[i],a[p]];[kk[p],kk[i]]=[kk[i],kk[p]];i=p}};
 Heap.prototype.pop=function(){const a=this.a,kk=this.k,top=a[0],la=a.pop(),lk=kk.pop();if(a.length){a[0]=la;kk[0]=lk;let i=0;for(;;){let l=2*i+1,r=l+1,m=i;if(l<a.length&&kk[l]<kk[m])m=l;if(r<a.length&&kk[r]<kk[m])m=r;if(m===i)break;[a[m],a[i]]=[a[i],a[m]];[kk[m],kk[i]]=[kk[i],kk[m]];i=m}}return top};
 Heap.prototype.size=function(){return this.a.length};
 const DIRS=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
 const gS=new Float32Array(GX*GZ),gP=new Int32Array(GX*GZ),gC=new Uint32Array(GX*GZ),gD=new Uint32Array(GX*GZ);let stamp=0;
 function path(ax,az,bx,bz){let r=path1(ax,az,bx,bz,P1);if(!r)r=path1(ax,az,bx,bz,P2);return r}
 function path1(ax,az,bx,bz,PS){pass=PS;
  const s=nearest(x2gx(ax),z2gz(az)),e=nearest(x2gx(bx),z2gz(bz));if(!s||!e)return null;const LL=PS===P1?L1:L2;if(LL[s[1]*GX+s[0]]!==LL[e[1]*GX+e[0]])return null;
  stamp++;const si=s[1]*GX+s[0],ei=e[1]*GX+e[0],h=new Heap();
  gS[si]=0;gP[si]=-1;gC[si]=stamp;h.push(si,0);let it=0,found=false;
  const hx=e[0],hz=e[1];
  while(h.size()&&it++<400000){
   const c=h.pop();if(gD[c]===stamp)continue;gD[c]=stamp;if(c===ei){found=true;break}
   const ci=c%GX,ck=(c/GX)|0,cs=gS[c];
   for(const [di,dk,w] of DIRS){const ni=ci+di,nk=ck+dk;if(ni<0||nk<0||ni>=GX||nk>=GZ)continue;const n=nk*GX+ni;if(!pass[n])continue;
    if(di&&dk&&(!pass[ck*GX+ni]||!pass[nk*GX+ci]))continue;
    const ns=cs+w;if(gC[n]===stamp&&gS[n]<=ns)continue;gC[n]=stamp;gS[n]=ns;gP[n]=c;
    const hh=Math.hypot(ni-hx,nk-hz);h.push(n,ns+hh*1.6)}}
  if(!found)return null;
  const out=[];for(let c=ei;c!==-1;c=gP[c])out.push([gx2x(c%GX),gz2z((c/GX)|0)]);out.reverse();return out}
 function randomFree(cx,cz,r,minSd,rnd){
  for(let t=0;t<200;t++){const a=rnd()*6.2832,d=Math.sqrt(rnd())*r,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;if(sd(x,z)-SK>=minSd)return [x,z]}
  return [cx,cz]}
 function bestNear(cx,cz,r){let bb=null;for(let x=cx-r;x<=cx+r;x+=.5)for(let z=cz-r;z<=cz+r;z+=.5){const s=sd(x,z);if(!bb||s>bb[0])bb=[s,x,z]}return bb}
 function scatter(step,minSd){const o=[];for(let x=X0;x<X0+NX*CELL;x+=step)for(let z=Z0;z<Z0+NZ*CELL;z+=step)if(sd(x,z)-SK>=minSd)o.push([x,z]);return o}
 return {NX,NZ,CELL,X0,Z0,sd,ground,col,los,blocked,path,randomFree,bestNear,scatter,mkPass,H,Q}}
root.D2Core=Core;if(typeof module!=='undefined')module.exports=Core;
})(typeof window!=='undefined'?window:globalThis);
