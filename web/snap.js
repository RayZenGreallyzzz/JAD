/* Exact millimetre-granularity positions; geometrical connections use dimensions, not arbitrary grid rounding. */
(function(){'use strict';
const AXIS={px:0,nx:0,py:1,ny:1,pz:2,nz:2};
const round=(v)=>Math.round(v*1000)/1000;
function worldDims(type,yaw){const base=window.PSB.byId[type];if(!base)throw Error('Unknown module '+type);
 const [x,y,z]=base.dim;return yaw%180===90?[z,y,x]:[x,y,z];}
function facePosition(parent,child,face){if(!(face in AXIS))throw Error('Invalid face');
 const a=worldDims(parent.type,parent.yaw),b=worldDims(child.type,child.yaw),
 at=[parent.x,parent.y,parent.z].slice(),axis=AXIS[face],sign=face[0]==='p'?1:-1;
 at[axis]+=sign*(a[axis]+b[axis])/2;return at.map(round);}
function penetration(a,b){const d=worldDims(a.type,a.yaw),e=worldDims(b.type,b.yaw);return ['x','y','z'].map((axis,i)=>(d[i]+e[i])/2-Math.abs(a[axis]-b[axis]));}
function intersects(a,b,epsilon=.002){return penetration(a,b).every(d=>d>epsilon);}
window.PSBSnap={worldDims,facePosition,penetration,intersects,round};
})();