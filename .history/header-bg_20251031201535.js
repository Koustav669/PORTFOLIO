/* header-bg.js
   Lightweight 4D-like tesseract wireframe for header background.
   - Minimal vertex set, simple rotation in 4D projected to 2D
   - Hairline strokes, subtle neon colors
   - DPR-awareness and FPS cap
*/
(function(){
  'use strict';
  const canvas = document.getElementById('header-bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  const cfg = {
    size: 140,       // cube size
    rotationSpeed: 0.0009, // rotation speed
    lineWidth: 0.6,
    color: [60,180,255],
    alpha: 0.18,
    fps: 40,
    dprMax: 2
  };

  let w=0,h=0,dpr=1,last=0;
  const frameInterval = 1000/cfg.fps;

  // 4D hypercube vertices (tesseract) built from +/-1 combinations
  const verts4 = [];
  for(let i=0;i<16;i++){
    const x = (i & 1) ? 1 : -1;
    const y = (i & 2) ? 1 : -1;
    const z = (i & 4) ? 1 : -1;
    const w4 = (i & 8) ? 1 : -1;
    verts4.push([x,y,z,w4]);
  }

  // edges between vertices differ by exactly one coordinate
  const edges = [];
  for(let i=0;i<16;i++){
    for(let j=i+1;j<16;j++){
      let diff = 0;
      for(let k=0;k<4;k++) if(verts4[i][k] !== verts4[j][k]) diff++;
      if(diff === 1) edges.push([i,j]);
    }
  }

  function resize(){
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, cfg.dprMax);
    w = Math.max(1, Math.floor(rect.width || window.innerWidth));
    h = Math.max(1, Math.floor(rect.height || 160));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function rot4(v, a, b, theta){
    // rotate components a and b by theta
    const ca = Math.cos(theta), sa = Math.sin(theta);
    const va = v[a], vb = v[b];
    v[a] = va * ca - vb * sa;
    v[b] = va * sa + vb * ca;
  }

  function project4To2(v, theta){
    // copy
    const p = v.slice();
    // rotate in several planes for a tesseract-like motion
    rot4(p, 0, 1, theta * 0.7);
    rot4(p, 2, 3, theta * 0.5);
    rot4(p, 0, 2, theta * 0.35);

    // perspective projection from 4D to 3D (simple)
    const distance = 3.0;
    const wCoord = 1 / (distance - p[3] * 0.9);
    const x3 = p[0] * wCoord;
    const y3 = p[1] * wCoord;
    const z3 = p[2] * wCoord;

    // 3D to 2D projection
    const f = 1.4;
    const x2 = x3 * f * (1 + z3 * 0.08);
    const y2 = y3 * f * (1 + z3 * 0.08);
    return [x2,y2,z3];
  }

  function drawFrame(now){
    if(now - last < frameInterval){ requestAnimationFrame(drawFrame); return; }
    last = now;
    ctx.clearRect(0,0,w,h);

    // center
    const cx = w/2, cy = h/2 + 6;

    // scale
    const baseSize = cfg.size * (Math.min(w,h) / 600);

    // compute theta based on time
    const theta = now * cfg.rotationSpeed;

    // project all verts
    const proj = verts4.map(v=> project4To2(v, theta));

    // draw edges
    ctx.lineWidth = cfg.lineWidth;
    ctx.strokeStyle = `rgba(${cfg.color[0]},${cfg.color[1]},${cfg.color[2]},${cfg.alpha})`;
    ctx.beginPath();
    for(const [a,b] of edges){
      const pa = proj[a], pb = proj[b];
      const ax = cx + pa[0] * baseSize;
      const ay = cy + pa[1] * baseSize;
      const bx = cx + pb[0] * baseSize;
      const by = cy + pb[1] * baseSize;
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
    ctx.stroke();

    // thin highlight
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = `rgba(255,255,255,${cfg.alpha * 0.03})`;
    ctx.beginPath();
    for(const [a,b] of edges){
      const pa = proj[a], pb = proj[b];
      const ax = cx + pa[0] * baseSize;
      const ay = cy + pa[1] * baseSize;
      const bx = cx + pb[0] * baseSize;
      const by = cy + pb[1] * baseSize;
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
    ctx.stroke();

    requestAnimationFrame(drawFrame);
  }

  function start(){
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(drawFrame);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
