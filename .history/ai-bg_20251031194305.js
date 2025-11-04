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
        thickness: cfg.thickness * (0.7 + Math.random()*0.9),
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

    // central guide for easing vertical spacing
    const margin = Math.min(120, h * 0.08);
    const usable = Math.max(32, h - margin*2);

    // Draw each wave
    for(let i=0;i<waves.length;i++){
      const wv = waves[i];
      const yBase = margin + usable * wv.offsetY;
      const progress = (t * 0.001) * wv.speed;
      const phase = wv.phase + progress;

      // choose color mix based on vertical pos to add subtle depth
      const depthMix = Math.max(0, Math.min(1, 1 - Math.abs(wv.offsetY - 0.5) * 1.6));
      const col = mixColor(cfg.colorA, cfg.colorB, 0.25 + 0.75 * depthMix);
      const alpha = cfg.alpha * (0.45 + 0.55 * depthMix);

      ctx.lineWidth = wv.thickness;
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
      ctx.lineCap = 'round';

      // draw path with a lightweight sine sampling — lower samples on small screens
      const sampling = Math.max(24, Math.floor(w / 18));
      ctx.beginPath();
      for(let s=0;s<=sampling;s++){
        const x = (s / sampling) * w;
        // wavelength slightly varies per wave for organic motion
        const wl = cfg.wavelength * (0.9 + 0.25 * Math.sin(wv.phase*1.3 + i));
        const freq = (2 * Math.PI) / wl;
        const base = Math.sin(x * freq + phase);
        const wob = Math.sin(t * wv.wobble + x * 0.0006) * 0.28; // gentle 4D wobble
        const y = yBase + base * wv.amp * (1 + wob);
        if(s===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }

      ctx.stroke();

      // thin highlight: a lighter alpha stroke to give wire-like feel
      ctx.lineWidth = Math.max(0.4, wv.thickness * 0.5);
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.06})`;
      ctx.beginPath();
      for(let s=0;s<=sampling;s++){
        const x = (s / sampling) * w;
        const wl = cfg.wavelength * (0.9 + 0.25 * Math.sin(wv.phase*1.3 + i));
        const freq = (2 * Math.PI) / wl;
        const base = Math.sin(x * freq + phase);
        const wob = Math.sin(t * wv.wobble + x * 0.0006) * 0.28;
        const y = yBase + base * wv.amp * (1 + wob);
        if(s===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    requestAnimationFrame(drawFrame);
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
