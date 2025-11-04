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

  // production: no debug toggles

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

  function roundRect(ctx, x, y, w, h, r){
    const radius = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function clear(){
    // subtle dark fill to keep lines readable, but allow content overlay
    ctx.clearRect(0,0,w,h);
    // a faint vignette-style fill (very subtle)
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, 'rgba(6,8,14,0.008)');
    g.addColorStop(1, 'rgba(2,4,8,0.045)');
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

  // central guide for easing vertical spacing
  const margin = Math.min(120, h * 0.08);
  const usable = Math.max(32, h - margin*2);

    // Replace wave field with keyboard-style animated bars
  const keyCount = Math.max(12, Math.floor(w / 64));
  const keyWidth = w / keyCount;
  // place the keyboard bars anchored to the bottom of the viewport
  const bottomArea = Math.min(usable * 0.6, 380);
  const baseY = h - bottomArea - Math.min(40, margin); // top Y of the bottom area
  for(let k=0;k<keyCount;k++){
      const kx = k * keyWidth + keyWidth * 0.12;
      const kw = keyWidth * 0.76;
      // time-varying 4D-influenced height
      const nx = (k / keyCount - 0.5) * 2;
      const wPhase = Math.sin(t * 0.0008 + k * 0.25);
      const depth = Math.abs(Math.sin(t * 0.0006 + k * 0.18));
      // combine several sin layers for musical motion
      const h1 = Math.max(0, Math.sin(nx * 2.1 + t * 0.0012 + k * 0.3));
      const h2 = Math.max(0, Math.sin(nx * 1.3 + t * 0.0009 + k * 0.7 + Math.cos(t*0.0005) * 0.6));
  const height = (0.2 + 0.8 * (0.6*h1 + 0.4*h2 + depth*0.2)) * (bottomArea * 0.9);

      // color gradient per key
      const mix = 0.35 + 0.65 * (k / keyCount);
      const col = mixColor(cfg.colorA, cfg.colorB, mix);

      // main bar (ultra-crisp fill)
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.34)`;
      // top position inside bottom area
      const topY = baseY + (bottomArea - height);
      roundRect(ctx, kx, topY, kw, height, 6);
      ctx.fill();

      // thin neon top stroke
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.86)`;
      ctx.beginPath();
      ctx.moveTo(kx + 2, topY + 1);
      ctx.lineTo(kx + kw - 2, topY + 1);
      ctx.stroke();

      // subtle glow under the bar
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.035)`;
      // glow slightly below the bottom of the bar area
      ctx.fillRect(kx - 6, baseY + bottomArea + 6, kw + 12, 10);
    }

    requestAnimationFrame(drawFrame);
  }

  // header tesseract removed; only bottom bars remain

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
