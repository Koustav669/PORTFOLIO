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

  // Advanced rendering with bloom and effects
  class Renderer {
    constructor() {
      this.bloomBuffer = document.createElement('canvas');
      this.bloomCtx = this.bloomBuffer.getContext('2d');
      this.resize();
    }
    
    resize() {
      this.bloomBuffer.width = Math.floor(width / 2);
      this.bloomBuffer.height = Math.floor(height / 2);
    }
    
    clear(ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Rich space gradient
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, `rgb(${cfg.colors.space.top.join(',')})`);
      g.addColorStop(1, `rgb(${cfg.colors.space.bottom.join(',')})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Sophisticated bloom effect
    applyBloom(source) {
      const {bloomBuffer: target, bloomCtx: bctx} = this;
      
      // Scale down and blur for bloom base
      bctx.clearRect(0, 0, target.width, target.height);
      bctx.save();
      bctx.scale(0.5, 0.5);
      bctx.drawImage(source, 0, 0);
      bctx.restore();
      
      // Threshold and multiple blur passes
      for(let i = 0; i < cfg.quality.bloomPasses; i++) {
        this.gaussianBlur(bctx, target, i * 4 + cfg.bloom.softness);
      }
      
      // Blend back to main canvas
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = cfg.bloom.intensity;
      ctx.drawImage(target, 0, 0, width, height);
      ctx.restore();
    }
    
    // Gaussian blur implementation
    gaussianBlur(ctx, target, radius) {
      const rs = Math.ceil(radius * 2);
      const kernel = this.getGaussianKernel(radius);
      
      // Horizontal pass
      this.directionalBlur(ctx, target, kernel, rs, 0);
      // Vertical pass
      this.directionalBlur(ctx, target, kernel, 0, rs);
    }
    
    directionalBlur(ctx, target, kernel, dx, dy) {
      const temp = ctx.getImageData(0, 0, target.width, target.height);
      const output = ctx.createImageData(target.width, target.height);
      
      const {data} = temp;
      const {data: outData} = output;
      
      for(let y = 0; y < target.height; y++) {
        for(let x = 0; x < target.width; x++) {
          let r = 0, g = 0, b = 0, a = 0, weight = 0;
          
          for(let i = -kernel.length + 1; i < kernel.length; i++) {
            const px = Math.min(Math.max(x + i * dx, 0), target.width - 1);
            const py = Math.min(Math.max(y + i * dy, 0), target.height - 1);
            const idx = (py * target.width + px) * 4;
            const w = kernel[Math.abs(i)];
            
            r += data[idx] * w;
            g += data[idx+1] * w;
            b += data[idx+2] * w;
            a += data[idx+3] * w;
            weight += w;
          }
          
          const outIdx = (y * target.width + x) * 4;
          outData[outIdx] = r / weight;
          outData[outIdx+1] = g / weight;
          outData[outIdx+2] = b / weight;
          outData[outIdx+3] = a / weight;
        }
      }
      
      ctx.putImageData(output, 0, 0);
    }
    
    getGaussianKernel(radius) {
      const kernel = [];
      for(let i = 0; i <= radius; i++) {
        kernel[i] = Math.exp(-0.5 * (i * i) / (radius * radius));
      }
      return kernel;
    }
    
    // Color utilities
    getColor(base, energy, alpha = 1) {
      return `rgba(${base.join(',')},${alpha})`;
    }
    
    lerpColor(c1, c2, t) {
      return [
        c1[0] * (1-t) + c2[0] * t,
        c1[1] * (1-t) + c2[1] * t,
        c1[2] * (1-t) + c2[2] * t
      ];
    }
  }

  const renderer = new Renderer();

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

  // Main animation loop with timing control
  let lastFrame = 0;
  const frameInterval = 1000 / cfg.quality.targetFPS;
  
  function loop(now) {
    if(!visible) {
      raf = requestAnimationFrame(loop);
      return;
    }
    
    // Control frame rate
    if(now - lastFrame < frameInterval) {
      raf = requestAnimationFrame(loop);
      return;
    }
    
    const dt = Math.min(32, now - lastFrame); // Cap delta time
    lastFrame = now;
    
    // Update systems
    neuralPathways.update(now, dt);
    energyField.update(dt);
    
    // Update particles
    updateParticles(dt, now);
    
    // Render frame
    render(now);
    
    raf = requestAnimationFrame(loop);
  }
  
  function updateParticles(dt, now) {
    // Remove dead particles
    for(let i = particles.length - 1; i >= 0; i--) {
      if(!particles[i].update(dt, now)) {
        particles.splice(i, 1);
      }
    }
    
    // Add new particles
    while(particles.length < cfg.quality.particleLimit) {
      const pos = new Vector3(
        Math.random() * width,
        Math.random() * height,
        Math.random() * cfg.depth
      );
      
      const vel = new Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.2
      );
      
      particles.push(new Particle(pos, vel));
    }
    
    // Apply field forces to particles
    particles.forEach(p => {
      const field = energyField.getValue(p.pos.x, p.pos.y);
      p.applyForce(new Vector3(
        (field.x - 0.5) * cfg.fieldForce,
        (field.y - 0.5) * cfg.fieldForce,
        (field.z - 0.5) * cfg.fieldForce * 0.5
      ));
    });
  }
  
  function render(now) {
    renderer.clear(ctx);
    
    // Draw energy field
    ctx.globalCompositeOperation = 'lighter';
    const cellSize = Math.max(width, height) / cfg.fieldResolution;
    for(let i = 0; i < cfg.fieldResolution; i++) {
      for(let j = 0; j < cfg.fieldResolution; j++) {
        const x = j * cellSize;
        const y = i * cellSize;
        const value = energyField.getCellValue(i, j);
        const energy = (value.x + value.y + value.z) / 3;
        
        if(energy > cfg.bloom.threshold) {
          const color = renderer.lerpColor(
            cfg.colors.field.core,
            cfg.colors.field.outer,
            energy
          );
          
          ctx.fillStyle = renderer.getColor(color, energy * 0.4);
          ctx.beginPath();
          ctx.arc(x, y, cellSize * 0.3 * energy, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Draw neural pathways
    neuralPathways.connections.forEach((conn, key) => {
      const [fromIdx, toIdx] = key.split(':').map(Number);
      const from = neuralPathways.neurons[fromIdx];
      const to = neuralPathways.neurons[toIdx];
      
      const energy = (from.energy + to.energy + conn.energy) / 3;
      if(energy < 0.2) return;
      
      // Draw curved connection with control points
      ctx.beginPath();
      ctx.moveTo(from.pos.x, from.pos.y);
      
      const cp1 = conn.controlPoints[0].current;
      const cp2 = conn.controlPoints[1].current;
      
      const mid = new Vector3(
        (from.pos.x + to.pos.x) / 2,
        (from.pos.y + to.pos.y) / 2,
        (from.pos.z + to.pos.z) / 2
      );
      
      ctx.bezierCurveTo(
        mid.x + cp1.x, mid.y + cp1.y,
        mid.x + cp2.x, mid.y + cp2.y,
        to.pos.x, to.pos.y
      );
      
      // Dynamic color based on depth and energy
      const depth = (from.pos.z + to.pos.z) / (2 * cfg.depth);
      const baseColor = renderer.lerpColor(
        cfg.colors.synaptic.primary,
        cfg.colors.synaptic.secondary,
        depth
      );
      
      const color = renderer.lerpColor(
        baseColor,
        cfg.colors.synaptic.accent,
        energy
      );
      
      ctx.strokeStyle = renderer.getColor(color, energy * 0.8);
      ctx.lineWidth = 1 + energy;
      ctx.stroke();
      
      // Energy pulse effect
      if(energy > 0.7) {
        ctx.save();
        ctx.strokeStyle = renderer.getColor(cfg.colors.synaptic.energy, (energy - 0.7) / 0.3 * 0.5);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    });
    
    // Draw particles
    particles.forEach(p => {
      const depth = p.pos.z / cfg.depth;
      const size = 1 + (1 - depth) * 3;
      
      const baseColor = renderer.lerpColor(
        cfg.colors.particles.normal,
        cfg.colors.particles.energized,
        p.energy
      );
      
      const color = renderer.lerpColor(
        baseColor,
        cfg.colors.particles.highlight,
        (1 - depth) * 0.5
      );
      
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = renderer.getColor(color, p.life * 0.8);
      ctx.fill();
    });
    
    // Apply bloom post-processing
    renderer.applyBloom(canvas);
  }

  // Initialize systems and start animation
  function init() {
    resize();
    renderer.resize();
    
    // Start animation
    visible = true;
    lastFrame = performance.now();
    requestAnimationFrame(loop);
  }
  
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  
  // Event handling
  window.addEventListener('resize', () => {
    resize();
    renderer.resize();
  });
  
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if(visible) lastFrame = performance.now();
  });
  
  window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (width / rect.width);
    const my = (e.clientY - rect.top) * (height / rect.height);
    
    // Influence nearby particles
    particles.forEach(p => {
      const dx = p.pos.x - mx;
      const dy = p.pos.y - my;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < 100) {
        const force = (1 - dist/100) * 0.2;
        p.applyForce(new Vector3(dx/dist * force, dy/dist * force, 0));
      }
    });
  });
  
  // Start when ready
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
