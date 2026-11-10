// ===== Default cards: [title, width, height]. Card size = these pixel ratios. =====
// To show a picture permanently: put the file in images/ named 01, 02, 03 ... (.jpg/.png/.webp)
const DEFAULTS = [
  ["Cartoon portrait",1440,1796],["Character poster",1440,1800],["Halloween art",1440,1800],["Character design",1440,1785],
  ["Fluffy mascot",380,640],["Chibi character",445,574],["Chibi character 2",251,329],["Idol character",331,547],
  ["Expression sheet",426,251],["Mascot character",193,320],["Furry character",1440,1661],["Reference sheet",1371,1638],
  ["Reference sheet wide",1808,1008],["VTuber model",1920,1080]
];
let cards = DEFAULTS.map((d,i)=>({id:"c"+(i+1),title:d[0],w:d[1],h:d[2],base:"images/"+String(i+1).padStart(2,"0")}));

const grid = document.getElementById("grid"), file = document.getElementById("file");
const lb = document.getElementById("lb"), urls = new Map();
let target = null; // card to put the picked picture on; null = create a new card

// ----- storage (browser IndexedDB: keeps your edits + uploaded pictures) -----
const open = () => new Promise((ok,no)=>{const r=indexedDB.open("elite-gallery",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
async function load(){try{const db=await open();return await new Promise(ok=>{const q=db.transaction("kv").objectStore("kv").get("cards");q.onsuccess=()=>ok(q.result);q.onerror=()=>ok(null)})}catch(e){return null}}
async function save(){try{const db=await open();db.transaction("kv","readwrite").objectStore("kv").put(cards,"cards")}catch(e){}}

function blobUrl(c){ if(!c.blob) return null; if(!urls.has(c.id)) urls.set(c.id,URL.createObjectURL(c.blob)); return urls.get(c.id); }

function image(c, media){
  const img = new Image(); img.alt = c.title; img.loading = "lazy";
  const u = blobUrl(c);
  if (u) { img.src = u; return img; }
  if (!c.base) { media.classList.add("empty"); return null; }
  const ex = [".jpg",".png",".webp",".jpeg"]; let i = 0;
  img.onerror = () => { if (++i < ex.length) img.src = c.base + ex[i]; else { img.remove(); media.classList.add("empty"); } };
  img.src = c.base + ex[0];
  return img;
}

function render(){
  grid.textContent = "";
  cards.forEach(c=>{
    const el = document.createElement("article"); el.className = "card";
    const media = document.createElement("div"); media.className = "media";
    media.style.aspectRatio = c.w + " / " + c.h;
    const img = image(c, media); if (img) media.append(img);
    media.onclick = () => {
      const empty = media.classList.contains("empty");
      if (document.body.classList.contains("edit")) {
        // Edit mode: clicking an empty card (+) opens the file picker
        if (empty) { target = c; file.click(); }
        return;
      }
      if (!empty) { lb.querySelector("img").src = media.querySelector("img").src; lb.showModal(); }
    };
    const meta = document.createElement("div"); meta.className = "meta";
    meta.innerHTML = "<h3></h3><span>" + c.w + " × " + c.h + " px</span>"; meta.querySelector("h3").textContent = c.title;
    const tools = document.createElement("div"); tools.className = "tools";
    tools.append(btn("Upload picture",()=>{target=c;file.click()}), btn("Rename",()=>{const t=prompt("Card title",c.title); if(t){c.title=t;save();render()}}), btn("Delete",()=>{if(confirm("Delete this card?")){cards=cards.filter(x=>x!==c);save();render()}},"del"));
    el.append(media, meta, tools); grid.append(el);
  });

  // "+" tile at the end (visible only in edit mode): pick a picture -> new card is created
  const add = document.createElement("div"); add.className = "addtile";
  const plus = document.createElement("button"); plus.type = "button"; plus.setAttribute("aria-label","Add new artwork");
  plus.innerHTML = "<span>+</span><small>Add artwork</small>";
  plus.onclick = () => { target = null; file.click(); };
  add.append(plus); grid.append(add);
}
function btn(t, fn, cls){ const b=document.createElement("button"); b.textContent=t; b.onclick=fn; if(cls) b.className=cls; return b; }

// read the real pixel size of a picked image so the card matches it (no cropping)
function imgSize(f){ return new Promise(ok=>{ const u=URL.createObjectURL(f), i=new Image(); i.onload=()=>{ok({w:i.naturalWidth,h:i.naturalHeight});URL.revokeObjectURL(u)}; i.onerror=()=>{ok(null);URL.revokeObjectURL(u)}; i.src=u; }); }

file.onchange = async () => {
  const f = file.files[0]; file.value = "";
  if (!f) return;
  const d = await imgSize(f);
  if (target) {
    target.blob = f; urls.delete(target.id);
    if (d) { target.w = d.w; target.h = d.h; }
  } else {
    cards.push({id:"n"+Date.now(), title:"New artwork", w:d?d.w:1080, h:d?d.h:1080, blob:f});
  }
  target = null; save(); render();
};
document.getElementById("add").onclick = () => { const [w,h] = document.getElementById("preset").value.split("x").map(Number); cards.push({id:"n"+Date.now(),title:"New artwork",w,h}); save(); render(); scrollTo({top:document.body.scrollHeight,behavior:"smooth"}); };
document.getElementById("close").onclick = () => lb.close();
lb.onclick = e => { if (e.target === lb) lb.close(); };

// Edit mode: open the site with  #edit  at the end of the address (index.html#edit)
function mode(){ const on = location.hash === "#edit"; document.body.classList.toggle("edit", on); document.getElementById("editbar").hidden = !on; }
addEventListener("hashchange", mode); mode();

load().then(saved => { if (Array.isArray(saved) && saved.length) cards = saved; render(); });


/* =====================================================================
   ✨ ANIMATION ENGINE (added) — original code above untouched
   ===================================================================== */
(function(){
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none)").matches;
  const body = document.body;
  const mk = (tag,id,cls) => { const e=document.createElement(tag); if(id) e.id=id; if(cls) e.className=cls; body.prepend(e); return e; };

  // background: floating glow orbs + drifting particles
  const orbs = mk("div",null,"orbs"); orbs.innerHTML = "<i></i><i></i><i></i>";
  const bar = mk("div","progress");
  const glow = mk("div","cursor-glow");

  if (!still) {
    const cv = mk("canvas","fx-canvas"), cx = cv.getContext("2d");
    let W,H,P=[],mx=-999,my=-999;
    const size = () => { W=cv.width=innerWidth; H=cv.height=innerHeight; P=Array.from({length:Math.min(70,Math.floor(W*H/22000))},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.6+.6})); };
    size(); addEventListener("resize", size);
    addEventListener("pointermove", e => { mx=e.clientX; my=e.clientY; });
    (function tick(){
      cx.clearRect(0,0,W,H);
      for (const p of P) {
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W) p.vx*=-1; if(p.y<0||p.y>H) p.vy*=-1;
        const dm=Math.hypot(p.x-mx,p.y-my);
        if(dm<140){ p.x+=(p.x-mx)/dm*1.2; p.y+=(p.y-my)/dm*1.2; }   // particles flee the cursor
        cx.beginPath(); cx.arc(p.x,p.y,p.r,0,6.283); cx.fillStyle="rgba(4,217,255,.75)"; cx.shadowColor="#04D9FF"; cx.shadowBlur=10; cx.fill();
      }
      cx.shadowBlur=0;
      for (let i=0;i<P.length;i++) for (let j=i+1;j<P.length;j++) {
        const d=Math.hypot(P[i].x-P[j].x,P[i].y-P[j].y);
        if(d<120){ cx.strokeStyle="rgba(4,217,255,"+(.16*(1-d/120))+")"; cx.beginPath(); cx.moveTo(P[i].x,P[i].y); cx.lineTo(P[j].x,P[j].y); cx.stroke(); }
      }
      requestAnimationFrame(tick);
    })();
  }

  // scroll progress + hero parallax
  const hero = document.querySelector(".hero");
  function onScroll(){
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (max>0 ? y/max : 0) + ")";
    if (hero && !still) { hero.style.setProperty("--sy", y*.25); hero.style.setProperty("--ho", Math.max(0,1-y/650)); }
  }
  addEventListener("scroll", onScroll, {passive:true}); onScroll();

  // smooth cursor glow
  if (!touch && !still) {
    let tx=innerWidth/2, ty=innerHeight/2, cx2=tx, cy2=ty;
    addEventListener("pointermove", e => { tx=e.clientX; ty=e.clientY; });
    (function follow(){ cx2+=(tx-cx2)*.12; cy2+=(ty-cy2)*.12; glow.style.transform="translate("+cx2+"px,"+cy2+"px)"; requestAnimationFrame(follow); })();
  }

  // scroll reveal (staggered)
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target; io.unobserve(el);
    el.style.setProperty("--d", (el._i||0)*110 + "ms");
    el.classList.add("in");
    if (el.tagName === "FOOTER") el.classList.add("line");
    setTimeout(() => el.style.setProperty("--d","0ms"), 1400 + (el._i||0)*110);
  }), {threshold:.12, rootMargin:"0px 0px -6% 0px"});

  // 3D tilt + spotlight on cards (not in edit mode)
  function enhance(card, idx){
    if (card._fx) return; card._fx = true;
    card._i = idx % 3;
    card.classList.add("reveal"); io.observe(card);
    if (!card.classList.contains("card")) return;
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect(), px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
      card.style.setProperty("--mx", px*100+"%"); card.style.setProperty("--my", py*100+"%");
      if (touch || still || body.classList.contains("edit")) return;
      card.style.setProperty("--ry", ((px-.5)*10)+"deg"); card.style.setProperty("--rx", ((.5-py)*10)+"deg");
    });
    card.addEventListener("pointerleave", () => { card.style.setProperty("--rx","0deg"); card.style.setProperty("--ry","0deg"); });
  }
  const g = document.getElementById("grid");
  const scan = () => [...g.children].forEach(enhance);
  new MutationObserver(scan).observe(g, {childList:true}); scan();

  // footer reveal
  const ft = document.querySelector("footer");
  if (ft) { ft._i = 0; ft.classList.add("reveal"); io.observe(ft); }

  // magnetic buttons + click ripple
  document.addEventListener("pointermove", e => {
    if (touch || still) return;
    document.querySelectorAll(".contact-links .btn").forEach(b => {
      const r=b.getBoundingClientRect(), dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
      b.style.translate = Math.hypot(dx,dy) < 110 ? (dx*.25)+"px "+(dy*.35)+"px" : "0 0";
    });
  });
  document.addEventListener("click", e => {
    const b = e.target.closest(".btn,button"); if (!b) return;
    const r=b.getBoundingClientRect(), s=Math.max(r.width,r.height), sp=document.createElement("span");
    sp.className="ripple"; sp.style.cssText="width:"+s+"px;height:"+s+"px;left:"+(e.clientX-r.left-s/2)+"px;top:"+(e.clientY-r.top-s/2)+"px";
    b.append(sp); setTimeout(()=>sp.remove(),650);
  });
})();
