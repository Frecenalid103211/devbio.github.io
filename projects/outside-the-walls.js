const FIXED_BASE64 = `F3sidiI6MCwibiI6IlVudGl0bGVkIiwicCAOCU5vcm1hbCIsImcgDAhTX05PX0dPQUwgDwFzIkAxAXQiQAUEbCI6W3tALgl7InUiOi00MDAsQFEEMzUwfSxAKGAWATEwYBQJMTB9LCJyIjo5MIBvFUJvdW5jeV9QbGFua19TbWFsbCIsIm8gRQkxLCJ4IjowfSx74AlZATI14E9ZAzM4OH3gELMDLTE4MOAqtQEzMCA1IWEBMjjgSlsCMzgsYFsCNzV94BC34QxrBVRpbnkiLOEQauAAtAA14QNqAi0xMGBuwcXhLhEDMjYyLGC1AjM4feAItSBjIBTiDyLgH7YBMTIgRCKkYnsgUgAsQG/gNrYBMTCARuAVXCAjQ0jiJNgBNjJhDwExNeELbAEtMaEQAi05MOAqW+AAtQA44hJ+4CtYoLQBMjXgA7Sj5gAtwLPiDHvjF+cCMTM4Ya8AMuAEWgAtonwgBwB95DFDAjI1LEIKADLgDFriACDhNGkBMTHiC3wALcESADDhKcQANSAzREHgDLQALcBYAC3gK7UBMTJieuIN0wAtwFoAMOApswIxMjWBaQAx4QsNwWkAMOAqWAE2MmCyATE14gN4AC3iBx0ALeEsDaBbATI14ANb4jvUAjg4LOEawuMrLgAxoWgBMTHhC2gALeEywgItMziAtSBEATB95QipwcPgK7TgAlrgA7WhacBZADDiBB0FQ2lyY2xl5Bg9AjMxMmIfJKAAfeAQswEtMectywI1MCxBxgEtN+dHb8C0ADHhBGkgDmBvwRDgLrYCMjc1Y4sCLTEx4QptIGQAfeURUOcXceAAuAAz5wPMIFMALEEo4Da4ATE1gEYqB+cAzeIGI+IsfcBXIKbiR9jgAVrhCmrhNw4BMTKC2gAx4AS2IA7hBWzkK/oCLTM4YEQALeANWyAWAH1iJAAt4CxcATc1ooAAM+ILJQEtMaBcADDjBPDsHBUgMica4kYggFQgluJGHaBXADXmCl3iNRoCMzgsQQYAM+ELXQAx4TFcJlNicOFGXsBWAC3iBWvjOtngAFnhSWIAMaSLADPhO2MJXSwiYSI6MSwiYyFcACxNhgQiIiwiZCBdAzIsImgvUAldLCJtIjowLCJiIBoFYmFja2dyLyoGZF8wMjUifQ==`;
const canvas=document.getElementById("mapCanvas"),ctx=canvas.getContext("2d");
const objectType=document.getElementById("objectType"),locationSelect=document.getElementById("mapLocation"),baseShape=document.getElementById("baseShape"),readout=document.getElementById("positionReadout"),message=document.getElementById("copyMessage");
const objects=window.NV4_OBJECTS;
objects.forEach(name=>{const o=document.createElement("option");o.value=name;o.textContent=name;objectType.appendChild(o)});

/*
  NV4 map model:
  - yellow = the boundary of the map
  - diagonal hatch = outside the map
  - dark grid = inside the map
  - object = inside the grid
  The map changes position/orientation for each of the 8 locations.
*/
const CELL=64;
const specs={
  "center-left":  {cols:4,rows:6,side:"left"},
  "top-left":     {cols:4,rows:4,side:"top-left"},
  "bottom-left":  {cols:4,rows:4,side:"bottom-left"},
  "bottom-center":{cols:6,rows:3,side:"bottom"},
  "bottom-right": {cols:4,rows:4,side:"bottom-right"},
  "center-right": {cols:4,rows:6,side:"right"},
  "top-right":    {cols:4,rows:4,side:"top-right"},
  "top-center":   {cols:6,rows:3,side:"top"}
};

let map={x:0,y:0,w:0,h:0};
let state={location:"center-left",shape:"square",object:objects[0],x:0,y:0};
let dragging=false,offsetX=0,offsetY=0;

function buildMap(){
  const s=specs[state.location];
  map.w=s.cols*CELL; map.h=s.rows*CELL;
  const pad=42;
  if(state.location==="center-left"){
    map.x=canvas.width/2-map.w/2-210; map.y=canvas.height/2-map.h/2;
  }else if(state.location==="center-right"){
    map.x=canvas.width/2-map.w/2+210; map.y=canvas.height/2-map.h/2;
  }else if(state.location==="top-center"){
    map.x=canvas.width/2-map.w/2; map.y=pad;
  }else if(state.location==="bottom-center"){
    map.x=canvas.width/2-map.w/2; map.y=canvas.height-map.h-pad;
  }else if(state.location==="top-left"){
    map.x=pad; map.y=pad;
  }else if(state.location==="top-right"){
    map.x=canvas.width-map.w-pad; map.y=pad;
  }else if(state.location==="bottom-left"){
    map.x=pad; map.y=canvas.height-map.h-pad;
  }else if(state.location==="bottom-right"){
    map.x=canvas.width-map.w-pad; map.y=canvas.height-map.h-pad;
  }
}

function initialPosition(){
  const s=specs[state.location];
  const half=CELL/2;
  if(state.location.includes("left")) state.x=map.x+half;
  else if(state.location.includes("right")) state.x=map.x+map.w-half;
  else state.x=map.x+map.w/2;

  if(state.location.includes("top")) state.y=map.y+half;
  else if(state.location.includes("bottom")) state.y=map.y+map.h-half;
  else state.y=map.y+map.h/2;
}

function snap(v){return Math.round(v/(CELL/4))*(CELL/4)}
function clampObject(){
  // Intentionally empty: the object may leave the map and cross
  // the yellow boundary. Only the 1/4-grid snap is preserved.
}
function resetLocation(){buildMap();initialPosition();draw()}
function objectColor(name){
  if(name.startsWith("Ice_"))return"#55d7df";
  if(name.startsWith("Rough_"))return"#36c96a";
  if(name.startsWith("Bouncy_"))return"#d600c8";
  if(name.startsWith("DT_"))return"#080808";
  if(name.startsWith("NoDraw_"))return"#ff0800";
  if(name.startsWith("Water_"))return"#279ce8";
  if(name.startsWith("MagnetN_"))return"#ff0800";
  if(name.startsWith("Magnet_"))return"#3f8fe8";
  if(name.startsWith("Ball_Orange"))return"#f39a22";
  if(name.startsWith("Ball_Yellow"))return"#ffd72e";
  if(name.startsWith("Ball_Moveable"))return"#f4f4f4";
  if(name.startsWith("Ball_Red"))return"#ff0800";
  if(name.startsWith("Ball_Bouncy"))return"#d600c8";
  if(name.startsWith("Ball_Rough"))return"#36c96a";
  if(name.startsWith("Ball_Ice"))return"#20cfd8";
  if(name.startsWith("Ball_DT"))return"#090909";
  if(name.startsWith("Moveable_"))return"#c9c9c9";
  if(name.startsWith("Gear_"))return"#aaaaaa";
  return"#808080";
}

function hatchOutside(){
  ctx.save();
  ctx.fillStyle="#0a0d12";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle="rgba(220,225,230,.42)";
  ctx.lineWidth=5;
  const spacing=38;
  for(let i=-canvas.height;i<canvas.width+canvas.height;i+=spacing){
    ctx.beginPath();
    ctx.moveTo(i,0);
    ctx.lineTo(i-canvas.height,canvas.height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGrid(){
  ctx.fillStyle="#101820";
  ctx.fillRect(map.x,map.y,map.w,map.h);
  ctx.strokeStyle="rgba(145,150,156,.52)";
  ctx.lineWidth=5;
  for(let gx=map.x;gx<=map.x+map.w;gx+=CELL){
    ctx.beginPath();ctx.moveTo(gx,map.y);ctx.lineTo(gx,map.y+map.h);ctx.stroke();
  }
  for(let gy=map.y;gy<=map.y+map.h;gy+=CELL){
    ctx.beginPath();ctx.moveTo(map.x,gy);ctx.lineTo(map.x+map.w,gy);ctx.stroke();
  }
}

function drawBoundary(){
  const s=specs[state.location];
  ctx.save();
  ctx.strokeStyle="#ffe500";
  ctx.lineWidth=8;
  ctx.lineCap="butt";
  ctx.beginPath();
  if(s.side==="left"||s.side==="top-left"||s.side==="bottom-left"){
    ctx.moveTo(map.x,map.y);ctx.lineTo(map.x,map.y+map.h);
  }
  if(s.side==="right"||s.side==="top-right"||s.side==="bottom-right"){
    ctx.moveTo(map.x+map.w,map.y);ctx.lineTo(map.x+map.w,map.y+map.h);
  }
  if(s.side==="top"||s.side==="top-left"||s.side==="top-right"){
    ctx.moveTo(map.x,map.y);ctx.lineTo(map.x+map.w,map.y);
  }
  if(s.side==="bottom"||s.side==="bottom-left"||s.side==="bottom-right"){
    ctx.moveTo(map.x,map.y+map.h);ctx.lineTo(map.x+map.w,map.y+map.h);
  }
  ctx.stroke();
  ctx.restore();
}

function drawObject(){
  ctx.save();ctx.translate(state.x,state.y);
  const size=CELL;
  ctx.fillStyle=objectColor(state.object);
  ctx.strokeStyle="#a00000";
  ctx.lineWidth=5;
  if(state.shape==="circle"){
    ctx.beginPath();ctx.arc(0,0,size/2-5,0,Math.PI*2);ctx.fill();ctx.stroke();
  }else if(state.shape==="triangle"){
    ctx.beginPath();ctx.moveTo(0,-size/2+5);ctx.lineTo(size/2-5,size/2-5);ctx.lineTo(-size/2+5,size/2-5);ctx.closePath();ctx.fill();ctx.stroke();
  }else{
    ctx.fillRect(-size/2+5,-size/2+5,size-10,size-10);ctx.strokeRect(-size/2+5,-size/2+5,size-10,size-10);
  }
  ctx.restore();
}

function draw(){
  buildMap();
  hatchOutside();
  drawGrid();
  drawBoundary();
  drawObject();
  readout.textContent=state.location.replaceAll("-"," ");
}

function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}}
function hit(p){return Math.abs(p.x-state.x)<=CELL/2&&Math.abs(p.y-state.y)<=CELL/2}

canvas.addEventListener("pointerdown",e=>{
  const p=point(e);
  if(hit(p)){
    dragging=true;offsetX=p.x-state.x;offsetY=p.y-state.y;
    canvas.classList.add("dragging");canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener("pointermove",e=>{
  if(!dragging)return;
  const p=point(e);
  state.x=snap(p.x-offsetX);state.y=snap(p.y-offsetY);draw();
});
function stop(){dragging=false;canvas.classList.remove("dragging")}
canvas.addEventListener("pointerup",stop);canvas.addEventListener("pointercancel",stop);

locationSelect.addEventListener("change",()=>{state.location=locationSelect.value;resetLocation()});
objectType.addEventListener("change",()=>{state.object=objectType.value;draw()});
baseShape.addEventListener("change",()=>{state.shape=baseShape.value;draw()});

document.getElementById("generateCode").addEventListener("click",async()=>{
  const data={object:state.object,location:state.location,shape:state.shape,position:{x:state.x,y:state.y},gridStep:"1/4 grid"};
  const raw=JSON.stringify({type:"OutsideTheWalls",...data});
  const text=FIXED_BASE64;
  try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}
  message.textContent="Copy layout complete! Base 64 copied";
  setTimeout(()=>message.textContent="",2200)
});

buildMap();initialPosition();draw();
