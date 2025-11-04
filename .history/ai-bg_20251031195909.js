/* ai-bg.js
   Minimal, high-performance multi-wave background.
   - Multiple ultra-thin sine waves flowing horizontally
   - Neon blue <-> cyan gradient per line with subtle alpha
   - DPR-aware, FPS capped, visibility pause
   - No particles, no heavy glow; elegant and light
*/
(function(){
  'use strict';

  const canvas = document.getElementById('ai-bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  // Config — tuned for performance and visual quality
  const cfg = {
    waves: 10,               // number of wave lines
    amplitude: 36,           // base amplitude in px
    wavelength: 420,        // base wavelength
    speed: 0.12,             // motion speed multiplier
    thickness: 1.1,         // stroke width
    dprMax: 2,              // clamp devicePixelRatio
    fps: 45,                // target FPS (balanced)
    colorA: [0, 180, 255],  // neon blue
    colorB: [0, 230, 210],  // cyan
    alpha: 0.55             // base alpha for lines
  };

  let w = 0, h = 0, dpr = 1;
  let lastT = 0, lastFrame = 0;
  const frameInterval = 1000 / cfg.fps;

  // Debug visibility toggle: enable by adding ?dbg=1 to URL or press 'T'
  let debug = typeof window !== 'undefined' && window.location && window.location.search.indexOf('dbg=1') !== -1;
  function updateOverlayOpacity(){
    try{
      const ov = document.querySelector('.ai-bg-overlay');
      if(!ov) return;
      ov.style.transition = 'opacity 220ms linear';
      ov.style.opacity = debug ? '0.18' : '1';
    }catch(e){}
  }
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'T' || e.key === 't'){
      debug = !debug; updateOverlayOpacity();
    }
  });
  // apply initial state
  updateOverlayOpacity();

  // Per-wave params
  const waves = [];

  function initWaves(){
    waves.length = 0;
    for(let i=0;i<cfg.waves;i++){
      waves.push({
        phase: Math.random() * Math.PI * 2,
        speed: cfg.speed * (0.6 + Math.random()*0.9),
        amp: cfg.amplitude * (0.65 + Math.random()*0.85),
        offsetY: (i + 0.5) / cfg.waves, // relative vertical position
        thickness: 0.55 * (0.5 + Math.random()*0.6), // hairline style
        wobble: 0.002 + Math.random()*0.006
      });
    }
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, cfg.dprMax);
    w = Math.max(1, Math.floor(window.innerWidth));
    h = Math.max(1, Math.floor(window.innerHeight));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function lerp(a,b,t){ return a + (b-a)*t; }
  function mixColor(a,b,t){ return [Math.round(lerp(a[0],b[0],t)), Math.round(lerp(a[1],b[1],t)), Math.round(lerp(a[2],b[2],t))]; }

  function clear(){
    // subtle dark fill to keep lines readable, but allow content overlay
    ctx.clearRect(0,0,w,h);
    // a faint vignette-style fill (very subtle)
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, 'rgba(6,8,14,0.02)');
    g.addColorStop(1, 'rgba(2,4,8,0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
  }

  // Single frame draw
  function drawFrame(t){
    // FPS cap
    if(t - lastFrame < frameInterval){
      requestAnimationFrame(drawFrame);
      return;
    }
    lastFrame = t;

    clear();

  // Draw a subtle tesseract in the header region (behind header content)
  drawHeaderTesseract(t);

  // central guide for easing vertical spacing
  const margin = Math.min(120, h * 0.08);
  const usable = Math.max(32, h - margin*2);

    // Draw each wave with a lightweight 4D-like projection (simulate w axis)
    for(let i=0;i<waves.length;i++){
      const wv = waves[i];
      const yBase = margin + usable * wv.offsetY;
      const progress = (t * 0.001) * wv.speed;
      const phase = wv.phase + progress;

      // small 'w' phase to simulate 4D rotation/twist
      const wPhase = Math.sin((t * 0.0007) + i * 0.33) * 1.2;

      // depth mix for color
      const depthMix = Math.max(0, Math.min(1, 1 - Math.abs(wv.offsetY - 0.5) * 1.6));
      const col = mixColor(cfg.colorA, cfg.colorB, 0.25 + 0.75 * depthMix);
      const alpha = cfg.alpha * (0.38 + 0.62 * depthMix);

      ctx.lineWidth = Math.max(0.35, wv.thickness * 0.6); // hairline stroke in CSS pixels
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
      ctx.lineCap = 'round';

      const sampling = Math.max(20, Math.floor(w / 22));
      ctx.beginPath();
      for(let s=0;s<=sampling;s++){
        const x = (s / sampling) * w;
        // wavelength varies per wave and also slightly with wPhase for twisting
        const wl = cfg.wavelength * (0.92 + 0.24 * Math.sin(wv.phase*1.1 + i + wPhase*0.4));
        const freq = (2 * Math.PI) / wl;

        // primary sine
        const base = Math.sin(x * freq + phase + wPhase * 0.6);

        // simulate 4D perspective by modulating amplitude and small x-offset
        const perspective = 1 + Math.sin(wPhase + i * 0.6) * 0.12; // slight scale
        const xSkew = Math.sin(wPhase*0.6 + x * 0.0012) * (8 * Math.sin(i + wPhase*0.4));

        const wob = Math.sin(t * wv.wobble + x * 0.0006) * 0.22;
        const y = yBase + (base * wv.amp * perspective * (1 + wob));
        const px = x + xSkew;

        if(s===0) ctx.moveTo(px,y); else ctx.lineTo(px,y);
      }
      ctx.stroke();

      // ultra-thin specular line for crispness
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.045})`;
      ctx.beginPath();
      for(let s=0;s<=sampling;s++){
        const x = (s / sampling) * w;
        const wl = cfg.wavelength * (0.92 + 0.24 * Math.sin(wv.phase*1.1 + i + wPhase*0.4));
        const freq = (2 * Math.PI) / wl;
        const base = Math.sin(x * freq + phase + wPhase * 0.6);
        const perspective = 1 + Math.sin(wPhase + i * 0.6) * 0.12;
        const wob = Math.sin(t * wv.wobble + x * 0.0006) * 0.22;
        const y = yBase + (base * wv.amp * perspective * (1 + wob));
        const px = x + Math.sin(wPhase*0.6 + x * 0.0012) * (8 * Math.sin(i + wPhase*0.4));
        if(s===0) ctx.moveTo(px,y); else ctx.lineTo(px,y);
      }
      ctx.stroke();
    }

    requestAnimationFrame(drawFrame);
  }

  // --- Header tesseract (rendered into the same canvas, positioned in header area) ---
  // Reuse small vertex set for a light wireframe; not heavy math.
  const headerVerts4 = [];
  for(let i=0;i<16;i++){
    const x = (i & 1) ? 1 : -1;
    const y = (i & 2) ? 1 : -1;
    const z = (i & 4) ? 1 : -1;
    const w4 = (i & 8) ? 1 : -1;
    headerVerts4.push([x,y,z,w4]);
  }
  const headerEdges = [];
  for(let i=0;i<16;i++){
    for(let j=i+1;j<16;j++){
      let diff=0; for(let k=0;k<4;k++) if(headerVerts4[i][k]!==headerVerts4[j][k]) diff++;
      if(diff===1) headerEdges.push([i,j]);
    }
  }

  function project4To2_small(v, theta){
    const p = v.slice();
    const ca = Math.cos(theta), sa = Math.sin(theta);
    // small rotations
    const rot = (a,b,th)=>{ const va=p[a], vb=p[b]; p[a]=va*Math.cos(th)-vb*Math.sin(th); p[b]=va*Math.sin(th)+vb*Math.cos(th); };
    rot(0,1, theta*0.9);
    rot(2,3, theta*0.6);
    rot(0,2, theta*0.35);
    const distance = 3.2;
    const wCoord = 1 / (distance - p[3]*0.85);
    const x3 = p[0]*wCoord, y3 = p[1]*wCoord, z3 = p[2]*wCoord;
    const f = 1.0;
    const x2 = x3 * f * (1 + z3*0.06);
    const y2 = y3 * f * (1 + z3*0.06);
    return [x2,y2,z3];
  }

  function drawHeaderTesseract(now){
    // position at top area roughly matching header height
    const headerHeight = Math.min(180, Math.max(110, h * 0.18));
    const cx = w * 0.5;
    const cy = headerHeight * 0.6; // slightly above center of header
    const baseSize = Math.min(220, headerHeight * 1.05);
    const theta = now * 0.0009;

  // subtle alpha and color (brighter in debug mode)
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = debug ? `rgba(60,180,255,0.6)` : `rgba(60,180,255,0.22)`;

    const proj = headerVerts4.map(v => project4To2_small(v, theta));

    ctx.beginPath();
    for(const [a,b] of headerEdges){
      const pa = proj[a], pb = proj[b];
      const ax = cx + pa[0] * baseSize;
      const ay = cy + pa[1] * baseSize;
      const bx = cx + pb[0] * baseSize;
      const by = cy + pb[1] * baseSize;
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
    ctx.stroke();

  // faint highlight (brighter in debug)
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = debug ? `rgba(255,255,255,0.12)` : `rgba(255,255,255,0.03)`;
    ctx.beginPath();
    for(const [a,b] of headerEdges){
      const pa = proj[a], pb = proj[b];
      const ax = cx + pa[0] * baseSize;
      const ay = cy + pa[1] * baseSize;
      const bx = cx + pb[0] * baseSize;
      const by = cy + pb[1] * baseSize;
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
    }
    ctx.stroke();
  }

  // Pause when page hidden to save CPU
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) {
      // nothing to do; requestAnimationFrame won't run while hidden in some browsers
    }
  });

  // Init
  function start(){
    resize();
    initWaves();
    window.removeEventListener('resize', resize);
    window.addEventListener('resize', ()=>{ resize(); initWaves(); });
    requestAnimationFrame(drawFrame);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

})();
