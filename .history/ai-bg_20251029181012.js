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

  // Utility for smooth interpolation
  const ease = {
    inOut: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
    exp: t => Math.min(1, 1 - Math.pow(2, -10 * t)),
    elastic: t => {
      const p = 0.3;
      return Math.pow(2,-10*t) * Math.sin((t-p/4)*(2*Math.PI)/p) + 1;
    }
  };

  // 3D Vector for particles and fields
  class Vector3 {
    constructor(x=0, y=0, z=0) {
      this.x = x; this.y = y; this.z = z;
    }
    
    add(v) {
      this.x += v.x; this.y += v.y; this.z += v.z;
      return this;
    }
    
    sub(v) {
      this.x -= v.x; this.y -= v.y; this.z -= v.z;
      return this;
    }
    
    mul(s) {
      this.x *= s; this.y *= s; this.z *= s;
      return this;
    }
    
    dist(v) {
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      const dz = this.z - v.z;
      return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    clone() {
      return new Vector3(this.x, this.y, this.z);
    }
  }

  // Enhanced Perlin noise for flow fields
  class ImprovedNoise {
    constructor() {
      this.p = new Uint8Array(512);
      for(let i=0; i<256; i++) this.p[i] = i;
      
      for(let i=255; i>0; i--) {
        const r = Math.floor(Math.random() * (i + 1));
        [this.p[i], this.p[r]] = [this.p[r], this.p[i]];
      }
      
      for(let i=0; i<256; i++) {
        this.p[i + 256] = this.p[i];
      }
    }
    
    noise(x, y, z) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      
      const u = this.fade(x);
      const v = this.fade(y);
      const w = this.fade(z);
      
      const A = this.p[X] + Y;
      const AA = this.p[A] + Z;
      const AB = this.p[A + 1] + Z;
      const B = this.p[X + 1] + Y;
      const BA = this.p[B] + Z;
      const BB = this.p[B + 1] + Z;
      
      return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z),
        this.grad(this.p[BA], x-1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y-1, z),
        this.grad(this.p[BB], x-1, y-1, z))),
        this.lerp(v, this.lerp(u, this.grad(this.p[AA+1], x, y, z-1),
        this.grad(this.p[BA+1], x-1, y, z-1)),
        this.lerp(u, this.grad(this.p[AB+1], x, y-1, z-1),
        this.grad(this.p[BB+1], x-1, y-1, z-1))));
    }
    
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    
    grad(hash, x, y, z) {
      const h = hash & 15;
      const u = h<8 ? x : y;
      const v = h<4 ? y : h==12||h==14 ? x : z;
      return ((h&1) == 0 ? u : -u) + ((h&2) == 0 ? v : -v);
    }
  }

  // Particle system with physics and life cycle
  class Particle {
    constructor(pos, vel) {
      this.pos = pos || new Vector3();
      this.vel = vel || new Vector3();
      this.acc = new Vector3();
      this.force = new Vector3();
      this.energy = Math.random();
      this.life = 1.0;
      this.decay = 0.001 + Math.random() * 0.002;
      this.init();
    }
    
    init() {
      this.birthTime = performance.now();
      this.lifetime = cfg.timing.particleLife * (0.7 + Math.random() * 0.6);
    }
    
    update(dt, time) {
      // Apply forces
      this.vel.add(this.acc.mul(dt));
      this.pos.add(this.vel.mul(dt));
      this.acc.mul(0);
      
      // Energy cycle
      this.energy = (Math.sin(time * 0.001 + this.birthTime * 0.01) + 1) * 0.5;
      
      // Life cycle
      const age = time - this.birthTime;
      this.life = Math.max(0, 1 - age / this.lifetime);
      
      return this.life > 0;
    }
    
    applyForce(force) {
      this.acc.add(force);
    }
  }

  // Neural pathway system
  class NeuralPathway {
    constructor() {
      this.neurons = [];
      this.connections = new Map();
      this.noise = new ImprovedNoise();
      this.init();
    }
    
    init() {
      // Create neurons
      for(let i = 0; i < cfg.neuronCount; i++) {
        const pos = new Vector3(
          Math.random() * width * 1.4 - width * 0.2,
          Math.random() * height * 1.4 - height * 0.2,
          Math.random() * cfg.depth
        );
        
        this.neurons.push({
          pos,
          energy: Math.random(),
          phase: Math.random() * Math.PI * 2,
          connections: [],
          lastUpdate: 0
        });
      }
      
      // Create connections (using nearest neighbors + random long-range)
      this.neurons.forEach((n, i) => {
        // Find nearest neighbors
        const neighbors = this.neurons
          .map((other, j) => ({ dist: n.pos.dist(other.pos), index: j }))
          .filter(x => x.index !== i)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3 + Math.floor(Math.random() * 2));
        
        // Add some random long-range connections
        if(Math.random() < 0.3) {
          const far = this.neurons[Math.floor(Math.random() * this.neurons.length)];
          if(far !== n) neighbors.push({ dist: n.pos.dist(far.pos), index: this.neurons.indexOf(far) });
        }
        
        neighbors.forEach(({ index }) => {
          const key = [Math.min(i, index), Math.max(i, index)].join(':');
          if(!this.connections.has(key)) {
            this.connections.set(key, {
              from: i,
              to: index,
              energy: Math.random(),
              phase: Math.random() * Math.PI * 2,
              controlPoints: Array(2).fill().map(() => ({
                offset: new Vector3(
                  (Math.random() - 0.5) * 100,
                  (Math.random() - 0.5) * 100,
                  (Math.random() - 0.5) * 100
                ),
                phase: Math.random() * Math.PI * 2
              }))
            });
          }
        });
      });
    }
    
    update(time, dt) {
      // Update neuron positions and energy
      this.neurons.forEach(n => {
        const t = time * 0.001;
        // Smooth orbital motion
        const orbit = this.noise.noise(
          n.pos.x * 0.001 + t * 0.1,
          n.pos.y * 0.001 + t * 0.15,
          n.pos.z * 0.001 + t * 0.2
        );
        
        n.phase += dt * 0.001 * cfg.baseSpeed * (0.8 + Math.random() * 0.4);
        n.energy = (Math.sin(n.phase) + 1) * 0.5;
        
        // Apply smooth motion
        n.pos.x += Math.cos(orbit * Math.PI * 2) * dt * 0.05;
        n.pos.y += Math.sin(orbit * Math.PI * 2) * dt * 0.05;
        n.pos.z = (n.pos.z + dt * 0.02) % cfg.depth;
        
        // Wrap around edges smoothly
        if(n.pos.x < -width * 0.2) n.pos.x = width * 1.2;
        if(n.pos.x > width * 1.2) n.pos.x = -width * 0.2;
        if(n.pos.y < -height * 0.2) n.pos.y = height * 1.2;
        if(n.pos.y > height * 1.2) n.pos.y = -height * 0.2;
      });
      
      // Update connection energy and control points
      this.connections.forEach(conn => {
        conn.phase += dt * 0.001 * cfg.baseSpeed;
        conn.energy = (Math.sin(conn.phase) + 1) * 0.5;
        
        conn.controlPoints.forEach(cp => {
          cp.phase += dt * 0.001 * cfg.baseSpeed * 0.7;
          const scale = Math.sin(cp.phase) * 0.5 + 0.5;
          cp.current = cp.offset.clone().mul(scale);
        });
      });
    }
  }

  // Energy field system
  class EnergyField {
    constructor() {
      this.resolution = cfg.fieldResolution;
      this.cells = new Float32Array(this.resolution * this.resolution * 3);
      this.noise = new ImprovedNoise();
      this.time = 0;
    }
    
    update(dt) {
      this.time += dt * 0.001;
      
      // Update field values
      for(let i = 0; i < this.resolution; i++) {
        for(let j = 0; j < this.resolution; j++) {
          const idx = (i * this.resolution + j) * 3;
          
          // Create smooth flowing energy patterns
          const nx = j / this.resolution;
          const ny = i / this.resolution;
          const nz = this.time * 0.1;
          
          this.cells[idx] = this.noise.noise(nx * 3, ny * 3, nz) * 0.5 + 0.5;
          this.cells[idx+1] = this.noise.noise(nx * 5 + 100, ny * 5 + 100, nz * 1.1) * 0.5 + 0.5;
          this.cells[idx+2] = this.noise.noise(nx * 4 - 50, ny * 4 - 50, nz * 0.9) * 0.5 + 0.5;
        }
      }
    }
    
    // Get interpolated field value at position
    getValue(x, y) {
      const nx = (x / width) * this.resolution;
      const ny = (y / height) * this.resolution;
      
      const i0 = Math.floor(ny);
      const i1 = (i0 + 1) % this.resolution;
      const j0 = Math.floor(nx);
      const j1 = (j0 + 1) % this.resolution;
      
      const fx = nx - j0;
      const fy = ny - i0;
      
      const v00 = this.getCellValue(i0, j0);
      const v10 = this.getCellValue(i1, j0);
      const v01 = this.getCellValue(i0, j1);
      const v11 = this.getCellValue(i1, j1);
      
      return new Vector3(
        this.bilerp(v00.x, v10.x, v01.x, v11.x, fx, fy),
        this.bilerp(v00.y, v10.y, v01.y, v11.y, fx, fy),
        this.bilerp(v00.z, v10.z, v01.z, v11.z, fx, fy)
      );
    }
    
    getCellValue(i, j) {
      i = Math.min(Math.max(i, 0), this.resolution - 1);
      j = Math.min(Math.max(j, 0), this.resolution - 1);
      const idx = (i * this.resolution + j) * 3;
      return new Vector3(
        this.cells[idx],
        this.cells[idx+1],
        this.cells[idx+2]
      );
    }
    
    bilerp(v00, v10, v01, v11, x, y) {
      return (v00 * (1-x) + v01 * x) * (1-y) + (v10 * (1-x) + v11 * x) * y;
    }
  }

  // Initialize systems
  const neuralPathways = new NeuralPathway();
  const energyField = new EnergyField();
  const particles = [];

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
