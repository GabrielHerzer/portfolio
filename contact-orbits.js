// Elementos decorativos: o texto e os links mantêm o mesmo eixo.
(() => {
  const scene = document.querySelector('[data-contact-orbits]');
  if (!scene) return;
  const rings = [...scene.querySelectorAll('.contact-ring')];
  const dots = [...scene.querySelectorAll('.contact-particle')];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const blue = [37, 79, 163];
  const red = [177, 60, 57];
  const purple = [117, 75, 161];
  const random = (min, max) => min + Math.random() * (max - min);
  const particles = dots.map((node, index) => ({
    node,
    angle: random(0, Math.PI * 2),
    speed: random(0.17, 0.36) * (index % 3 === 0 ? -1 : 1),
    phase: random(0, Math.PI * 2),
    track: index % 2,
    // Metade das partículas pode transitar lentamente entre as linhas.
    switchTracks: index >= 4,
    switchPeriod: random(7, 13),
    radius: random(3.2, 4.8),
    color: index % 2 ? blue : red,
    collision: 0,
    x: 0,
    y: 0,
  }));
  let elapsed = 0;
  let lastTime = null;
  let request = null;
  let inView = true;

  function draw(dt) {
    const t = elapsed;
    const tracks = [
      { rx: 226 + Math.sin(t / 3.9) * 19, ry: 224 + Math.sin(t / 4.8 + 0.6) * 17 },
      { rx: 248 + Math.sin(t / 4.9 + 1.9) * 19, ry: 249 + Math.sin(t / 4.2 + 2.2) * 17 },
    ];
    rings.forEach((ring, i) => {
      ring.setAttribute('rx', tracks[i].rx.toFixed(2));
      ring.setAttribute('ry', tracks[i].ry.toFixed(2));
    });
    particles.forEach(p => {
      p.angle += p.speed * dt * (1 + Math.sin(t / 6 + p.phase) * 0.14);
      let mix = p.track;
      if (p.switchTracks) {
        const wave = Math.sin(t / p.switchPeriod + p.phase);
        // Longos trechos sobre uma linha; transições suaves entre elas.
        const blend = Math.max(0, Math.min(1, (wave + 0.30) / 0.60));
        mix = blend * blend * (3 - 2 * blend);
      }
      const rx = tracks[0].rx + (tracks[1].rx - tracks[0].rx) * mix;
      const ry = tracks[0].ry + (tracks[1].ry - tracks[0].ry) * mix;
      p.x = 320 + Math.cos(p.angle) * rx;
      p.y = 320 + Math.sin(p.angle) * ry;
    });
    particles.forEach(p => {
      const touching = particles.some(other => other !== p &&
        Math.hypot(other.x - p.x, other.y - p.y) < p.radius + other.radius + 6);
      const target = touching ? 1 : 0;
      p.collision += (target - p.collision) * Math.min(1, dt * 9);
      const color = p.color.map((value, i) => Math.round(value + (purple[i] - value) * p.collision));
      p.node.setAttribute('cx', p.x.toFixed(2));
      p.node.setAttribute('cy', p.y.toFixed(2));
      p.node.setAttribute('r', (p.radius + p.collision * 0.5).toFixed(2));
      p.node.setAttribute('fill', `rgb(${color.join(',')})`);
    });
  }
  function shouldAnimate() {
    return !motionPreference.matches && !document.hidden && inView;
  }
  function tick(now) {
    request = null;
    if (!shouldAnimate()) { lastTime = null; return; }
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += dt;
    draw(dt);
    request = requestAnimationFrame(tick);
  }
  function updateMotion() {
    if (request !== null) cancelAnimationFrame(request);
    request = null;
    lastTime = null;
    if (shouldAnimate()) request = requestAnimationFrame(tick);
  }
  draw(0);
  document.addEventListener('visibilitychange', updateMotion);
  motionPreference.addEventListener('change', updateMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      updateMotion();
    }).observe(scene);
  }
  updateMotion();
})();
