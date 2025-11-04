/* ai-bg.js
   Premium Cinematic AI Background
   Combines particle systems, energy fields, and neural pathways
   for a high-end, visually stunning effect.
*/
(function(){
  'use strict';

  const canvas = document.getElementById('ai-bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true // performance hint
  });

  // Advanced configuration for cinematic effects
  const cfg = {
    // Core system
    particleCount: 220,
    neuronCount: 85,
    fieldResolution: 32,
    depth: 2400,
    
    // Motion & Physics
    baseSpeed: 0.12,
    fieldForce: 0.16,
    energyFlow: 0.08,
    turbulence: 0.4,
    
    // Visual Style
    bloom: {
      intensity: 0.85,
      threshold: 0.4,
      softness: 2.0
    },
    
    // Color Palette (cinematic sci-fi)
    colors: {
      // Deep space backdrop
      space: {
        top: [2, 8, 22],
        bottom: [0, 2, 12]
      },
      // Neural pathway colors
      synaptic: {
        primary: [0, 160, 255],    // electric blue
        secondary: [60, 200, 255], // bright cyan
        accent: [180, 90, 255],    // deep purple
        energy: [255, 130, 60]     // energy pulse
      },
      // Particle effects
      particles: {
        normal: [80, 170, 255],    // soft blue
        energized: [140, 240, 255],// bright cyan
        highlight: [255, 200, 140] // warm highlight
      },
      // Energy field gradients
      field: {
        core: [30, 150, 255],      // core blue
        outer: [100, 200, 255],    // outer glow
        accent: [255, 140, 80]     // warm accent
      }
    },
    
    // Animation Timing
    timing: {
      particleLife: 4000,    // particle lifetime in ms
      pulseInterval: 3000,   // energy pulse interval
      fieldCycle: 8000,      // field movement cycle
      neuralCycle: 6000     // neural pathway cycle
    },
    
    // Performance
    quality: {
      particleLimit: 180,    // max particles for mobile
      bloomPasses: 2,        // bloom quality
      fieldSize: 24,         // field resolution for mobile
      targetFPS: 30         // target frame rate
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

  // Sophisticated noise for flow field
  function noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X]+Y;
    const B = p[X+1]+Y;
    return lerp(v, lerp(u, grad(p[A], x, y), grad(p[B], x-1, y)),
                  lerp(u, grad(p[A+1], x, y-1), grad(p[B+1], x-1, y-1)));
  }

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  
  function grad(hash, x, y) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h == 12 || h == 14 ? x : 0;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
  }

  // Permutation table
  const p = new Array(512);
  for(let i=0; i<256; i++) p[i] = p[i+256] = Math.floor(Math.random()*256);

  function buildNodes(){
    nodes = [];
    const area = width*height;
    const scale = Math.sqrt(area/(1280*720));
    const count = Math.max(80, Math.floor(cfg.baseNodes * scale * (dpr)));
    
    // Create flow-aware nodes with energy paths
    for(let i=0; i<count; i++){
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.8 + 0.2; // avoid center clustering
      nodes.push({
        x: width/2 + Math.cos(angle) * (width/2 * rad * 1.4),
        y: height/2 + Math.sin(angle) * (height/2 * rad * 1.4),
        z: Math.random() * cfg.depth,
        vx: 0, vy: 0, // velocity for momentum
        energy: Math.random(), // energy level for pulses
        offset: Math.random() * Math.PI * 2,
        layer: Math.floor(Math.random() * cfg.layerCount),
        pathOffset: Math.random() * Math.PI * 2, // unique path variation
        lastUpdate: 0 // for time-based updates
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
    // Smooth camera motion with flow influence
    const camX = mouse.active ? (mouse.x - width/2) * 0.012 : Math.sin(now*0.00006)*15;
    const camY = mouse.active ? (mouse.y - height/2) * 0.012 : Math.cos(now*0.00004)*12;
    
    // Update node positions with flow field influence
    nodes.forEach(n => {
      if(now - n.lastUpdate > 16) { // limit updates for performance
        const nx = n.x / cfg.flowScale;
        const ny = n.y / cfg.flowScale;
        const flowAngle = noise(nx, ny) * Math.PI * 2;
        const fx = Math.cos(flowAngle) * cfg.flowStrength;
        const fy = Math.sin(flowAngle) * cfg.flowStrength;
        
        // Apply flow force with momentum
        n.vx = n.vx * 0.95 + fx;
        n.vy = n.vy * 0.95 + fy;
        n.x += n.vx;
        n.y += n.vy;
        
        // Wrap around smoothly
        if(n.x < -width*0.3) n.x = width*1.3;
        if(n.x > width*1.3) n.x = -width*0.3;
        if(n.y < -height*0.3) n.y = height*1.3;
        if(n.y > height*1.3) n.y = -height*0.3;
        
        n.lastUpdate = now;
      }
      
      // Update energy level for pulses
      n.energy = (n.energy + cfg.pulseSpeed) % 1;
    });

    // Enhanced position computation with subtle motion
    const pts = nodes.map(n => {
      const timeScale = 1 + Math.sin(n.pathOffset + now * 0.0004) * cfg.pathDeviation;
      const mod = Math.sin((now * cfg.speed * (0.7 + n.layer*0.2)) + n.offset);
      const z = (n.z + mod * 100) % cfg.depth;
      const zp = z / cfg.depth;
      const scale = 1 / (1 + zp * 1.4);
      
      // Apply camera offset with flow-aware motion
      const x = (n.x - width/2) * scale + width/2 + camX * (1 - scale * 0.8);
      const y = (n.y - height/2) * scale + height/2 + camY * (1 - scale * 0.8);
      
      return {
        x, y, z, zp, scale, 
        layer: n.layer,
        energy: n.energy,
        originalNode: n
      };
    });

    // Enhanced multi-layered rendering with energy paths
    for(let layerIdx = cfg.layerCount-1; layerIdx>=0; layerIdx--){
      const layerDepth = layerIdx / (cfg.layerCount-1);
      
      ctx.lineWidth = cfg.lineWidth * (1 + (1-layerDepth)*0.2);
      ctx.globalCompositeOperation = 'lighter';

      for(let i=0; i<pts.length; i++){
        const A = pts[i];
        if(A.layer !== layerIdx) continue;
        const nObj = A.originalNode;

        for(const idx of (nObj.neighbors || [])){
          const B = pts[idx];
          if(Math.abs(B.layer - A.layer) > 1) continue;

          const dx = A.x - B.x, dy = A.y - B.y;
          const dist = Math.hypot(dx,dy);
          
          // Enhanced distance-based alpha with energy influence
          const energyPulse = Math.sin((A.energy + B.energy) * Math.PI) * 0.5 + 0.5;
          const baseAlpha = Math.max(0, 0.92 - dist/(280 * (1 + (A.zp + B.zp))));
          if(baseAlpha < 0.02) continue;

          // Sophisticated color blending based on depth, energy, and flow
          const depthFactor = 1 - (A.zp + B.zp)/2;
          const energyFactor = Math.pow(energyPulse, 1.5);
          
          // Mix colors based on depth and energy
          let color;
          if(depthFactor > 0.7) {
            // Foreground: mix primary with accent1
            color = mix(cfg.colors.primary, cfg.colors.accent1, (depthFactor-0.7)/0.3);
          } else if(depthFactor > 0.4) {
            // Mid-range: mix accent1 with accent2
            color = mix(cfg.colors.accent1, cfg.colors.accent2, (depthFactor-0.4)/0.3);
          } else {
            // Background: mix accent2 with subtle highlight
            color = mix(cfg.colors.accent2, cfg.colors.highlight, depthFactor/0.4);
          }

          // Apply energy pulse highlight
          if(energyFactor > 0.7) {
            color = mix(color, cfg.colors.energy, (energyFactor-0.7)/0.3 * 0.8);
          }

          // Draw curved connection with enhanced glow
          ctx.save();
          
          // Base line with sophisticated alpha
          ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${baseAlpha * 0.9})`;
          
          // Controlled glow based on energy and depth
          const glowIntensity = Math.min(0.4, baseAlpha * (0.6 + energyFactor * 0.4));
          ctx.shadowBlur = cfg.glow * (0.5 + energyFactor * 0.5) * (1 - Math.max(A.scale,B.scale));
          ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},${glowIntensity})`;
          
          // Draw path with subtle curve
          const midX = (A.x + B.x)/2;
          const midY = (A.y + B.y)/2;
          const curve = (noise(midX/200, midY/200) - 0.5) * 20 * (1-depthFactor);
          
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          // Add subtle curve to the connection
          ctx.quadraticCurveTo(
            midX + dy/dist * curve,
            midY - dx/dist * curve,
            B.x, B.y
          );
          ctx.stroke();

          // Add energy highlight when pulse is strong
          if(energyFactor > 0.8) {
            ctx.globalAlpha = (energyFactor-0.8)/0.2 * 0.3;
            ctx.strokeStyle = `rgba(${cfg.colors.energy[0]},${cfg.colors.energy[1]},${cfg.colors.energy[2]},${baseAlpha})`;
            ctx.lineWidth *= 0.7;
            ctx.stroke();
          }
          
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
