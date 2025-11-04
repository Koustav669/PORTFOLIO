/* ai-bg.js
   Animated 3D neural-network / spiderweb background.
   - Creates nodes in 3D space and connects nearby nodes with glowing lines
   - Smooth animation with subtle parallax from mouse movement
   - Optimized for performance (caps, devicePixelRatio handling, visibility pause)
*/
(function(){
  'use strict';

  const canvas = document.getElementById('ai-bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  // Config
  const cfg = {
    nodeCount: 140,            // base nodes (scaled by DPR)
    connectDistance: 140,      // max distance to draw a connection
    speed: 0.0008,             // node movement speed
    depth: 800,                // perspective depth
    perspective: 0.8,          // strength of perspective
    glow: 10,                  // glow radius for lines
    colors: {
      blue: [18, 140, 255],   // main blue
      teal: [0, 200, 170],    // secondary teal
      orange: [255,160,80],   // subtle orange accents
      node: [180, 220, 255]
    }
  };

  let width = 0, height = 0, dpr = 1;
  let nodes = [];
  let time = 0;
  let mouseX = 0, mouseY = 0, mouseActive = false;
  let rafId = null;
  let visible = true;

  function init(){
    updateSize();
    createNodes();
    attachListeners();
    start();
  }

  function updateSize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function createNodes(){
    nodes = [];
    // scale node count based on viewport size and DPR
    const area = width * height;
    const base = cfg.nodeCount * Math.sqrt(area / (1280*720));
    const count = Math.max(50, Math.floor(base * (dpr))); // ensure minimum

    for(let i=0;i<count;i++){
      nodes.push({
        x: rand(-width*0.4, width*1.4),
        y: rand(-height*0.4, height*1.4),
        z: rand(0, cfg.depth),
        vx: rand(-0.5,0.5),
        vy: rand(-0.5,0.5),
        vz: rand(-0.2,0.2),
        size: rand(0.6, 2.6),
        phase: Math.random()*Math.PI*2
      });
    }
  }

  function project(node){
    // perspective projection: closer z => larger scale
    const z = node.z / cfg.depth; // 0..1
    const scale = 1 / (1 + z * (1/cfg.perspective - 1));
    const x = (node.x - width/2) * scale + width/2;
    const y = (node.y - height/2) * scale + height/2;
    return {x, y, scale, z};
  }

  function draw(){
    if(!visible) return;
    ctx.clearRect(0,0,width,height);

    // subtle vignette background
    const g = ctx.createLinearGradient(0,0,0,height);
    g.addColorStop(0, 'rgba(2,8,20,1)');
    g.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,height);

    // slight camera movement based on time and mouse
    const camX = (Math.sin(time * 0.00012) * 30) + (mouseActive ? (mouseX - width/2) * 0.02 : 0);
    const camY = (Math.cos(time * 0.00009) * 20) + (mouseActive ? (mouseY - height/2) * 0.02 : 0);

    // precompute projections
    const projected = nodes.map(n => {
      const p = project(n);
      // apply camera offset
      p.x += camX * (1 - p.scale);
      p.y += camY * (1 - p.scale);
      p.node = n;
      return p;
    });

    // sort by scale (far -> near)
    projected.sort((a,b)=>a.scale - b.scale);

    // draw connections
    ctx.lineWidth = 1.0;
    for(let i=0;i<projected.length;i++){
      const A = projected[i];
      // small glowing node
      const alphaNode = Math.max(0.05, 0.9 - A.z / cfg.depth);
      drawNode(A, alphaNode);

      for(let j=i+1;j<projected.length;j++){
        const B = projected[j];
        const dx = A.x - B.x;
        const dy = A.y - B.y;
        const dist = Math.hypot(dx,dy);
        if(dist > cfg.connectDistance * (0.6 + (1-A.scale))) break; // early exit as list not spatially ordered but helps
        const lineAlpha = Math.max(0, 0.9 - (dist / (cfg.connectDistance * (1 + (A.z+B.z)/(2*cfg.depth)))));
        if(lineAlpha < 0.02) continue;

        // color blend based on nodes' z and a slow time variation
        const t = (Math.sin((A.node.phase + B.node.phase) + time * 0.0006) + 1) * 0.5;
        const color = mixColors(cfg.colors.blue, cfg.colors.teal, t*0.6);
        // add subtle orange highlights when closer to viewer
        const orangeFactor = Math.max(0, 1 - ((A.z+B.z)/(2*cfg.depth)));

        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${lineAlpha * 0.9})`;
        // draw glow by stroking multiple times with increasing blur using shadow
        ctx.save();
        ctx.shadowBlur = cfg.glow * (1 - A.scale);
        ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},${Math.min(0.45,lineAlpha)})`;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
        ctx.restore();

        // faint orange accent
        if(Math.random() < 0.001 + orangeFactor*0.003){
          const oc = mixColors(color, cfg.colors.orange, 0.35);
          ctx.strokeStyle = `rgba(${oc[0]},${oc[1]},${oc[2]},${lineAlpha*0.25})`;
          ctx.lineWidth = 0.7 + (1-A.scale)*1.5;
          ctx.beginPath();
          ctx.moveTo(A.x, A.y);
          ctx.lineTo(B.x, B.y);
          ctx.stroke();
          ctx.lineWidth = 1.0;
        }
      }
    }
  }

  function drawNode(p, alpha){
    const r = 1.2 + p.node.size * (1 + (1 - p.scale) * 1.8);
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
    const base = cfg.colors.node;
    grad.addColorStop(0, `rgba(${base[0]},${base[1]},${base[2]},${alpha})`);
    grad.addColorStop(0.2, `rgba(${cfg.colors.teal[0]},${cfg.colors.teal[1]},${cfg.colors.teal[2]},${alpha*0.6})`);
    grad.addColorStop(1, `rgba(8,12,20,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI*2);
    ctx.fill();
  }

  function mixColors(a,b,t){
    return [
      Math.round(a[0] * (1-t) + b[0] * t),
      Math.round(a[1] * (1-t) + b[1] * t),
      Math.round(a[2] * (1-t) + b[2] * t)
    ];
  }

  function step(now){
    time = now;
    // update node positions
    const dt = 16; // approximate step
    for(const n of nodes){
      // smooth drifting motion
      n.phase += cfg.speed * (1 + n.size*0.2);
      n.x += Math.sin(n.phase * 0.7) * 0.18;
      n.y += Math.cos(n.phase * 0.9) * 0.18;
      n.z += Math.sin(n.phase * 0.4) * 0.04;
      // wrap-around to keep nodes in view
      if(n.x < -width) n.x += width*1.8;
      if(n.x > width*2) n.x -= width*1.8;
      if(n.y < -height) n.y += height*1.8;
      if(n.y > height*2) n.y -= height*1.8;
      if(n.z < 0) n.z = cfg.depth;
      if(n.z > cfg.depth) n.z = 0;
    }

    draw();
    rafId = requestAnimationFrame(step);
  }

  function attachListeners(){
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseout', onMouseOut);
    document.addEventListener('visibilitychange', onVisibility);
    // touch parallax
    window.addEventListener('touchmove', e=>{
      const t = e.touches[0];
      if(t){ mouseX = t.clientX; mouseY = t.clientY; mouseActive = true; }
    }, {passive:true});
  }

  function onResize(){
    updateSize();
    createNodes();
  }

  function onMouseMove(e){ mouseX = e.clientX; mouseY = e.clientY; mouseActive = true; }
  function onMouseOut(){ mouseActive = false; }

  function onVisibility(){
    visible = !document.hidden;
    if(visible) start(); else stop();
  }

  function start(){ if(rafId) return; rafId = requestAnimationFrame(step); }
  function stop(){ if(!rafId) return; cancelAnimationFrame(rafId); rafId = null; }

  // initialize when DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else init();

})();
