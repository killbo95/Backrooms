// Level 1 lives in its own folder so its environment and entities can be maintained separately.
export function buildLevelOne(THREE,scene,randomOpenCell,cellCenter){
 const [ex,ez]=randomOpenCell(3.7,4.1);
 const elevatorCell=[ex,ez];
 const lift=new THREE.Group();lift.position.copy(cellCenter(ex,ez));
 const steel=new THREE.MeshStandardMaterial({color:0x59615e,metalness:.78,roughness:.34}),darkSteel=new THREE.MeshStandardMaterial({color:0x202725,metalness:.55,roughness:.5}),doors=new THREE.MeshStandardMaterial({color:0x858d87,metalness:.82,roughness:.28}),sign=new THREE.MeshStandardMaterial({color:0xb8c9a1,emissive:0x779b69,emissiveIntensity:1.1});
 const frame=new THREE.Mesh(new THREE.BoxGeometry(3.8,3.7,.35),steel);frame.position.set(0,1.85,-3.45);lift.add(frame);
 const recess=new THREE.Mesh(new THREE.BoxGeometry(3.05,3.15,.18),darkSteel);recess.position.set(0,1.62,-3.23);lift.add(recess);
 for(const side of [-1,1]){const panel=new THREE.Mesh(new THREE.BoxGeometry(1.43,2.95,.12),doors);panel.position.set(side*.72,1.55,-3.08);lift.add(panel)}
 const header=new THREE.Mesh(new THREE.BoxGeometry(2.2,.42,.13),sign);header.position.set(0,3.35,-3.18);lift.add(header);
 const button=new THREE.Mesh(new THREE.BoxGeometry(.22,.5,.12),sign);button.position.set(2.05,1.35,-3.25);lift.add(button);
 const light=new THREE.PointLight(0xb8d69a,3.2,13);light.position.set(0,3.4,-2.9);lift.add(light);scene.add(lift);
 function buildLevelOneEntities(THREE,scene,randomOpenCell,cellCenter){
 const levelEntities=[];
 const dark=new THREE.MeshStandardMaterial({color:0x101311,roughness:1}),pale=new THREE.MeshStandardMaterial({color:0x777d76,roughness:.95});
 const eye=new THREE.MeshBasicMaterial({color:0xe5d9a0}),glow=new THREE.MeshBasicMaterial({color:0xffe9a0});
 const addActor=(kind,range,speed)=>{
  const [x,z]=randomOpenCell(range[0],range[1]),group=new THREE.Group();group.position.copy(cellCenter(x,z));const limbs=[];
  if(kind==='hound'){
   const body=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.85,4,7),dark);body.rotation.x=Math.PI/2;body.position.y=.62;group.add(body);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.29,10,8),dark);head.position.set(0,.72,-.62);group.add(head);
   for(const side of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.045,6,5),eye);e.position.set(side*.17,.82,-.83);group.add(e)}
   for(const side of [-1,1])for(const front of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.085,.42,3,5),dark);leg.position.set(side*.2,.28,front*.34);group.add(leg);limbs.push(leg)}
  }else if(kind==='skin-stealer'){
   const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.24,1.1,4,7),pale);torso.position.y=1.65;group.add(torso);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.22,9,7),pale);head.position.set(0,2.48,-.02);group.add(head);
   for(const side of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.95,3,5),pale);arm.position.set(side*.36,1.55,0);arm.rotation.z=side*-.12;group.add(arm);limbs.push(arm);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.09,.78,3,5),dark);leg.position.set(side*.14,.48,0);group.add(leg);limbs.push(leg);const e=new THREE.Mesh(new THREE.SphereGeometry(.018,5,4),eye);e.position.set(side*.075,2.5,-.19);group.add(e)}
  }else{
   const orb=new THREE.Mesh(new THREE.SphereGeometry(.62,12,10),dark);orb.position.y=2.2;group.add(orb);
   for(const side of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.095,8,6),glow);e.position.set(side*.23,2.36,-.49);group.add(e)}
   const pts=[];for(let i=0;i<=12;i++){const x=-.34+i*.68/12;pts.push(new THREE.Vector3(x,2.04+Math.pow(x/.34,2)*.16,-.49))}
   group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,.035,5,false),glow));
   const light=new THREE.PointLight(0xd8c47c,.65,5);light.position.set(0,2.2,-.4);group.add(light);
  }
  scene.add(group);levelEntities.push({kind,group,speed,limbs,phase:Math.random()*6.28,lastPathAt:0,cachedTarget:null});
 };
 addActor('hound',[8,12],4.15);addActor('smiler',[9,13],1.05);addActor('skin-stealer',[13,18],2.35);
}
 const entities=buildLevelOneEntities(THREE,scene,randomOpenCell,cellCenter);
 return {elevatorCell,elevator:lift,entities};
}
