const O=document.getElementById("object");
const M=document.getElementById("modifier");
const A=document.getElementById("after");
const F=document.getElementById("factor");
const N=document.getElementById("num");
const R=document.getElementById("rot");
const XY=document.getElementById("xy");
const num=document.getElementById("number");
const rotation=document.getElementById("rotation");
const rotv=document.getElementById("rotv");
const x=document.getElementById("x");
const y=document.getElementById("y");
const shape=document.getElementById("shape");
const c=document.getElementById("canvas");
const ctx=c.getContext("2d");
const so=document.getElementById("so");
const sm=document.getElementById("sm");
const sf=document.getElementById("sf");
const copyBtn=document.getElementById("transformCopy");
const copyToast=document.getElementById("copyToast");

let s={
    object:"",
    modifier:"",
    scale:1,
    rotate:0,
    x:1,
    y:1,
    speed:1,
    zIndex:1,
    shape:"square"
};

function clamp(v,min,max){
    const n=Number(v);
    if(!Number.isFinite(n)) return min;
    return Math.min(max,Math.max(min,n));
}

/* Factor/X/Y use a dot for decimals. Commas are deliberately rejected. */
function readDecimal(el,fallback){
    let raw=String(el.value);
    raw=raw.replace(/[^0-9.]/g,"");
    const dot=raw.indexOf(".");
    if(dot!==-1){
        raw=raw.slice(0,dot+1)+raw.slice(dot+1).replace(/\./g,"");
    }
    if(raw==="" || raw===".") return fallback;
    return clamp(Number(raw),0,1000);
}

function writeDecimal(el,value){
    el.value=String(value);
}

function summary(){
    so.textContent=s.object||"—";
    sm.textContent=s.modifier||"—";

    if(!s.object || !s.modifier){
        sf.textContent="-";
        return;
    }

    if(s.modifier==="rotate"){
        sf.textContent=s.rotate+"°";
    }else if(s.modifier==="stretch"){
        sf.textContent=`X ${s.x} × Y ${s.y}`;
    }else if(s.modifier==="speed"){
        sf.textContent=`Speed ${s.speed} / Z ${s.zIndex}`;
    }else{
        sf.textContent=String(s.scale);
    }
}

function updateControls(){
    A.classList.toggle("hidden",!s.object);
    F.classList.toggle("hidden",!s.object || !s.modifier);

    N.classList.add("hidden");
    R.classList.add("hidden");
    XY.classList.add("hidden");

    if(!s.object || !s.modifier) return;

    if(s.modifier==="scale"){
        N.classList.remove("hidden");
        writeDecimal(num,s.scale);
    }else if(s.modifier==="speed"){
        N.classList.remove("hidden");
        writeDecimal(num,s.speed);
    }else if(s.modifier==="rotate"){
        R.classList.remove("hidden");
        rotation.value=s.rotate;
        rotv.textContent=s.rotate+"°";
    }else if(s.modifier==="stretch"){
        XY.classList.remove("hidden");
        writeDecimal(x,s.x);
        writeDecimal(y,s.y);
    }
}

function draw(){
    ctx.clearRect(0,0,c.width,c.height);

    // Preview always remains visible, even when the selection is cleared.
    ctx.save();
    ctx.translate(200,200);

    // Crosshair: gray, alpha 50%.
    ctx.strokeStyle="rgba(160,160,160,.50)";
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(-200,0);
    ctx.lineTo(200,0);
    ctx.moveTo(0,-200);
    ctx.lineTo(0,200);
    ctx.stroke();

    // Green Scale 2.5 boundary, centered exactly at the origin.
    ctx.strokeStyle="rgba(0,255,80,.40)";
    ctx.strokeRect(-125,-125,250,250);

    ctx.rotate(s.rotate*Math.PI/180);

    const scale=(s.modifier==="scale") ? s.scale : 1;
    const sx=(s.modifier==="stretch") ? s.x : 1;
    const sy=(s.modifier==="stretch") ? s.y : 1;

    ctx.scale(scale*sx,scale*sy);

    const base=100;
    ctx.fillStyle="rgba(0,210,255,.60)";
    ctx.strokeStyle="rgba(0,230,255,.90)";
    ctx.lineWidth=2/Math.max(scale*sx,scale*sy,0.001);

    if(s.shape==="circle"){
        ctx.beginPath();
        ctx.arc(0,0,base/2,0,Math.PI*2);
        ctx.fill();
        ctx.stroke();
    }else if(s.shape==="triangle"){
        ctx.beginPath();
        ctx.moveTo(0,-base/2);
        ctx.lineTo(base/2,base/2);
        ctx.lineTo(-base/2,base/2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }else{
        ctx.fillRect(-base/2,-base/2,base,base);
        ctx.strokeRect(-base/2,-base/2,base,base);
    }

    ctx.restore();

    // Exact center point, drawn last.
    ctx.fillStyle="rgba(255,255,255,.95)";
    ctx.beginPath();
    ctx.arc(200,200,5,0,Math.PI*2);
    ctx.fill();
}

O.addEventListener("change",()=>{
    s.object=O.value;

    if(!s.object){
        s.modifier="";
        M.value="";
        s.scale=1;
        s.rotate=0;
        s.x=1;
        s.y=1;
        s.speed=1;
        s.zIndex=1;
    }

    updateControls();
    summary();
    draw();
});

M.addEventListener("change",()=>{
    s.modifier=M.value;

    if(s.modifier==="scale") s.scale=1;
    if(s.modifier==="rotate") s.rotate=0;
    if(s.modifier==="stretch"){s.x=1;s.y=1;}
    if(s.modifier==="speed"){s.speed=1;s.zIndex=1;}

    updateControls();
    summary();
    draw();
});

num.addEventListener("input",()=>{
    const old=s.modifier==="scale"?s.scale:s.speed;
    const v=readDecimal(num,old);

    if(s.modifier==="scale") s.scale=v;
    if(s.modifier==="speed"){
        s.speed=v;
        s.zIndex=v;
    }

    summary();
    draw();
});

num.addEventListener("blur",()=>{
    const v=readDecimal(num,s.modifier==="scale"?s.scale:s.speed);
    writeDecimal(num,v);
});

x.addEventListener("input",()=>{
    s.x=readDecimal(x,s.x);
    summary();
    draw();
});

x.addEventListener("blur",()=>writeDecimal(x,s.x));

y.addEventListener("input",()=>{
    s.y=readDecimal(y,s.y);
    summary();
    draw();
});

y.addEventListener("blur",()=>writeDecimal(y,s.y));

rotation.addEventListener("input",()=>{
    s.rotate=clamp(rotation.value,-360,360);
    rotation.value=s.rotate;
    rotv.textContent=s.rotate+"°";
    summary();
    draw();
});

shape.addEventListener("change",()=>{
    s.shape=shape.value;
    draw();
});

const FIXED_BASE64 = `F3sidiI6MCwibiI6IlVudGl0bGVkIiwicCAOCU5vcm1hbCIsImcgDAhTX05PX0dPQUwgDwFzIkAxAXQiQAUEbCI6W3tALgl7InUiOi0zNTAsQFEEMzg4fSxAKGAWATEwYBQGMTB9LCJyIkA2QG4SSWNlX1BsYW5rX1NtYWxsIiwibyBBCTEsIngiOjB9LHvgAlUCODgsYFUCNTB94BBVATkw4C9WATI14BJWAS054ClXoQQDMjEyfeAQrgAw4CetAzI3NSzhSgTAVgEyNeFFBAIyMziBswIwMH3hQgQBMDBgVQAy4BOt4ikJAzE2MixBW+BOVgMzMzh94RsDBUNpcmNsZeMYDgIxMjXiSwnAVuEUBAAt4ykOATg4YbIBMzXiEmDhKbKgVQAy4hMIAC3gKawBNTBgrAAy4EZWATEyYl8BMzDjQgwBMjViBQEyM+ISXOEpV6Cp5BS7Ay0xODDkJr4CMTEyYQEDMjYyfeMQCuADrQNTbG9wIAXmFRkBODiBreATVAAt4gME4BxVAjEwMIBWADXiErHhBQPgJVcCNzV94RADADDhAVgAU+EbAgMtMjg4YK0ANeASrOEDWOcdcsBVAS014BJWAC3hA1rgHlcCNTAsRWkn4OhAHgIyMTJiWwAt4BOr4SoCoKoBLTjoQ8sCMTc1Y7bgFKwALeEpWAIxMzjhSFgBNjLhGVfgKqoBMjVhAeJCAgExMuAZqOIrAGCn4RT/AS0x5SgKATUwYagBLTXjRFmlCuFEVAA1gP/gE6jhKFUAMalq4BRVAC3iKP8AMqoY4EL/J1iBqAA25h6y5RwBwKgBLTjkElUALeIpVQAyrB4BLTXiRFYCMzEyY1rhQlcAM60eAC3gE6niKFcAM64j4BRVAC3iKFcCNDI1YwTgQv8CNDYyYVLiRVfAqAEtOOI6VwldLCJhIjoxLCJjIPkALE+XBCIiLCJkIWUDMCwiaC/yCV0sIm0iOjAsImIgGg9iYWNrZ3JvdW5kXzAyNSJ9`;

copyBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(FIXED_BASE64);
    } catch {
        const ta = document.createElement("textarea");
        ta.value = FIXED_BASE64;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
    }

    copyToast.textContent = "✓ Base64 copied";
    copyToast.classList.add("show");

    clearTimeout(window.__copyToastTimer);

    window.__copyToastTimer = setTimeout(() => {
        copyToast.classList.remove("show");
    }, 1800);
});

updateControls();
summary();
draw();
