/* ai-bg.js
   Ultra-realistic mesh background.
   - Thin luminous lines only (no spheres)
   - Layered depth with time-modulated z (4D-like motion)
   - k-NN connections for clean mesh
   - Blue / cyan primary palette with subtle orange accents
   - Parallax on pointer, visibility handling and DPR optimizations
*/
(function(){
  'use strict';

  const canvas = document.getElementById('ai-bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  const cfg = {
    baseNodes: 120,        // base number of nodes (scaled by viewport/dpr)
    kNeighbors: 4,         // number of nearest neighbors to connect
    depth: 1400,           // maximum depth (z)
    layerCount: 3,         // visual layers for depth
    lineWidth: 0.9,        // base line width
    glow: 18,              // shadow blur for glow
    speed: 0.0009,         // base speed of z modulation
    colors: {
      blue: [12,160,255],
      cyan: [0,220,200],
      orange: [255,150,80]
    }
  };

  let width=0, height=0, dpr=1;
  let nodes = [];
  let raf = null;
  let t0 = performance.now();
  let mouse = {x:0,y:0,active:false};
  let visible = true;

  function init(){
    resize();
    buildNodes();
    attach();
    raf = requestAnimationFrame(loop);
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function buildNodes(){
    nodes = [];
    const area = width*height;
    const scale = Math.sqrt(area/(1280*720));
    const count = Math.max(60, Math.floor(cfg.baseNodes * scale * (dpr)));

    for(let i=0;i<count;i++){
      // spread a bit beyond the viewport for smooth edges
      nodes.push({
        x: Math.random() * width * 1.6 - width*0.3,
        y: Math.random() * height * 1.6 - height*0.3,
        z: Math.random() * cfg.depth,
        offset: Math.random()*Math.PI*2, // phase offset for 4D modulation
        layer: Math.floor(Math.random()*cfg.layerCount)
      });
    }
  }

  // compute K-nearest neighbors (naive O(n^2) — acceptable for moderate counts)
  function computeNeighbors(){
    const pts = nodes;
    for(let i=0;i<pts.length;i++){
      const a = pts[i];
      const dists = [];
      for(let j=0;j<pts.length;j++){
        if(i===j) continue;
        const b = pts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        dists.push({idx:j, dist: dx*dx + dy*dy});
      }
      dists.sort((u,v)=>u.dist-v.dist);
      a.neighbors = dists.slice(0, cfg.kNeighbors).map(x=>x.idx);
    }
  }

  // color helpers
  function lerp(a,b,t){ return a + (b-a)*t; }
  function mix(a,b,t){ return [Math.round(lerp(a[0],b[0],t)), Math.round(lerp(a[1],b[1],t)), Math.round(lerp(a[2],b[2],t))]; }

  function clear(){
    ctx.clearRect(0,0,width,height);
    // deep gradient background
    const g = ctx.createLinearGradient(0,0,0,height);
    g.addColorStop(0, 'rgba(4,8,18,1)');
    g.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,height);
  }

  function drawMesh(now){
    // camera parallax
    const camX = mouse.active ? (mouse.x - width/2) * 0.015 : Math.sin(now*0.00008)*12;
    const camY = mouse.active ? (mouse.y - height/2) * 0.015 : Math.cos(now*0.00006)*8;

    // precompute positions with 4D-like z modulation
    const pts = nodes.map(n => {
      // time-modulated z to create '4D' flowing effect
      const mod = Math.sin((now * cfg.speed * (0.8 + n.layer*0.25)) + n.offset);
      const z = (n.z + mod * 120) % cfg.depth; // wobble around
      const zp = z / cfg.depth; // 0..1
      const scale = 1 / (1 + zp * 1.2); // perspective
      const x = (n.x - width/2) * scale + width/2 + camX * (1 - scale);
      const y = (n.y - height/2) * scale + height/2 + camY * (1 - scale);
      return {x,y,z,zp,scale,layer:n.layer};
    });

    // draw layered thin lines
    // draw from farthest layer to closest for nicer glow stacking
    for(let layerIdx = cfg.layerCount-1; layerIdx>=0; layerIdx--){
      // set base color per layer (subtle shift)
      const layerTint = layerIdx / Math.max(1, cfg.layerCount-1);
      const baseColor = mix(cfg.colors.blue, cfg.colors.cyan, layerTint*0.6);

      ctx.lineWidth = cfg.lineWidth;
      ctx.globalCompositeOperation = 'lighter';

      for(let i=0;i<pts.length;i++){
        const A = pts[i];
        if(A.layer !== layerIdx) continue;
        const nObj = nodes[i];
        // draw lines to neighbors
        for(const idx of (nObj.neighbors || [])){
          const B = pts[idx];
          // only connect within same or adjacent layers for visual clarity
          if(Math.abs(B.layer - A.layer) > 1) continue;

          const dx = A.x - B.x, dy = A.y - B.y;
          const dist = Math.hypot(dx,dy);
          // alpha based on distance and depth
          const baseAlpha = Math.max(0, 0.95 - dist / (320 * (1 + (A.zp + B.zp))));
          if(baseAlpha < 0.02) continue;

          // color wobble based on z depth
          const wob = 0.35 + 0.65 * (1 - (A.zp + B.zp)/2);
          const color = mix(baseColor, cfg.colors.orange, (1 - wob) * 0.15);

          // stroke with controlled glow to reduce bleed
          ctx.save();
          ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${baseAlpha * 0.9})`;
          // reduce shadowBlur for less upper-layer shadowing
          ctx.shadowBlur = Math.max(0, (cfg.glow * 0.35) * (1 - Math.max(A.scale,B.scale)));
          ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},${Math.min(0.25,baseAlpha)})`;
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // draw bold connection points (tiny luminous accents) but NO spheres
    ctx.globalCompositeOperation = 'lighter';
    for(let i=0;i<pts.length;i++){
      const p = pts[i];
      // emphasize intersections where node has multiple neighbors visible
      const nObj = nodes[i];
      const visibleNeighbors = (nObj.neighbors || []).filter(idx => Math.abs(nodes[idx].layer - p.layer) <= 1).length;
      if(visibleNeighbors < 2) continue;

      const intensity = Math.min(1, 0.3 + visibleNeighbors * 0.18) * (1 - p.zp);
      if(intensity < 0.06) continue;

      const col = mix(cfg.colors.cyan, cfg.colors.blue, 0.2 + 0.6 * (1 - p.zp));
      ctx.save();
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.9 * intensity})`;
      // small accent: tiny rounded square
      const s = 1.2 + (1 - p.zp) * 1.8;
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      roundRect(ctx, -s/2, -s/2, s, s, s*0.3);
      ctx.fill();
      ctx.restore();
    }

    // subtle thin foreground weave (very faint) for richness
    ctx.globalCompositeOperation = 'source-over';
  }

  // helper for rounded rect
  function roundRect(ctx,x,y,w,h,r){
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  // simple FPS limiter for better performance
  const FPS = 30;
  const FRAME_INTERVAL = 1000 / FPS;
  let lastFrameTime = 0;

  function loop(now){
    if(!visible){ raf = requestAnimationFrame(loop); return; }
    if(now - lastFrameTime < FRAME_INTERVAL){
      raf = requestAnimationFrame(loop);
      return;
    }
    lastFrameTime = now;

    clear();
    drawMesh(now);
    raf = requestAnimationFrame(loop);
  }

  function attach(){
    window.addEventListener('resize', ()=>{ resize(); buildNodes(); computeNeighbors(); });
    window.addEventListener('mousemove', (e)=>{ mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
    window.addEventListener('mouseout', ()=>{ mouse.active = false; });
    window.addEventListener('touchmove', (e)=>{ const t = e.touches[0]; if(t){ mouse.x = t.clientX; mouse.y = t.clientY; mouse.active = true; } }, {passive:true});
    document.addEventListener('visibilitychange', ()=>{ visible = !document.hidden; });
  }

  // initialize neighbors after nodes created
  function computeAndStart(){ computeNeighbors(); }

  // Start
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', ()=>{ init(); computeAndStart(); });
  } else { init(); computeAndStart(); }

})();
