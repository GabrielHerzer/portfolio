// A mídia só é carregada após uma interação com a demonstração.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const previews = [];
document.querySelectorAll('[data-project-preview]').forEach(panel => {
  const video = panel.querySelector('video');
  const button = panel.querySelector('.preview-toggle');
  const name = panel.dataset.projectName;
  let wantsPlay = false;

  function setButton(playing) {
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', (playing ? 'Pausar' : 'Reproduzir') + ' demonstração de ' + name);
  }
  function stop() {
    wantsPlay = false;
    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
    panel.classList.remove('is-playing');
    setButton(false);
    panel.removeAttribute('aria-busy');
  }
  async function start() {
    wantsPlay = true;
    previews.forEach(other => { if (other.panel !== panel) other.stop(); });
    panel.setAttribute('aria-busy', 'true');
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.muted = true;
    try {
      await video.play();
      if (!wantsPlay) { video.pause(); return; }
      panel.classList.add('is-playing');
      setButton(true);
    } catch (_) {
      if (wantsPlay) {
        panel.classList.remove('is-playing');
        setButton(false);
        button.setAttribute('aria-label', 'Tentar reproduzir demonstração de ' + name);
      }
    } finally {
      panel.removeAttribute('aria-busy');
    }
  }
  panel.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && !reducedMotion.matches) start();
  });
  panel.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') stop();
  });
  button.addEventListener('click', () => wantsPlay ? stop() : start());
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') stop(); });
  video.addEventListener('error', () => {
    stop();
    button.setAttribute('aria-label', 'Tentar reproduzir demonstração de ' + name);
  });
  previews.push({ panel, stop });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) previews.forEach(preview => preview.stop());
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) previews.find(preview => preview.panel === entry.target)?.stop();
    });
  });
  previews.forEach(preview => observer.observe(preview.panel));
}
