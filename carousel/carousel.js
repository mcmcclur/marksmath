(() => {
  const exhibit = document.querySelector('#math-exhibit');
  const element = document.querySelector('#math-carousel');
  const frames = [...element.querySelectorAll('iframe')];
  const loading = document.querySelector('#slides-loading');
  const readyFrames = new Set();
  let loaded = false;
  let readyCheck;
  let startupNote = '';
  let startupTimeout;
  function showSlides(note = '') {
    loaded = true;
    loading.hidden = true;
    startupNote = note;
    clearTimeout(startupTimeout);
    clearInterval(readyCheck);
    last = performance.now();
  }
  const toggle = document.querySelector('#tour-toggle');
  const status = document.querySelector('#tour-status');
  const fullscreen = document.querySelector('#fullscreen-toggle');
  const carousel = bootstrap.Carousel.getOrCreateInstance(element, {
    interval: false, ride: false, pause: false, keyboard: true, touch: true
  });
  const dwell = 30000;
  let running = true, remaining = dwell, last = performance.now(), visit = 1, completed = false;
  function update() {
    const index = [...element.querySelectorAll('.carousel-item')].findIndex(slide => slide.classList.contains('active'));
    frames.forEach((frame, i) => frame.contentWindow.postMessage({
      type: 'math-carousel-state', active: loaded && i === index && !document.hidden, auto: running, visit, theme: document.body.classList.contains('quarto-dark') ? 'dark' : 'light'
    }, location.origin));
    toggle.textContent = running ? 'Pause to explore' : 'Resume automatic tour';
    toggle.setAttribute('aria-pressed', String(!running));
    status.textContent = `${running ? 'Automatic tour' : 'Explore freely'} · ${index + 1} / ${frames.length}${startupNote ? ` · ${startupNote}` : ''}`;
  }
  function advanceIfComplete() {
    if (completed && running && !document.hidden) { completed = false; carousel.next(); }
  }
  toggle.addEventListener('click', () => {
    running = !running; last = performance.now(); update(); advanceIfComplete();
  });
  element.addEventListener('slid.bs.carousel', () => { visit++; completed = false; remaining = dwell; update(); });
  function requestReady(frame) {
    frame.contentWindow.postMessage({type: 'math-demo-ready-request'}, location.origin);
  }
  frames.forEach(frame => frame.addEventListener('load', () => { requestReady(frame); update(); }));
  window.addEventListener('message', event => {
    if (event.origin !== location.origin) return;
    const frame = frames.find(frame => frame.contentWindow === event.source);
    if (!frame) return;
    if (event.data?.type === 'math-demo-ready') {
      readyFrames.add(frame);
      // Background slides must not hold the opening slide behind the loader.
      if (!loaded && readyFrames.has(frames[0])) {
        showSlides();
      }
      if (readyFrames.size === frames.length) {
        startupNote = '';
        clearInterval(readyCheck);
      }
      update();
    }
    if (event.data?.type === 'math-demo-error' && frame === frames[0] && !loaded) {
      showSlides('Opening demo could not load; use Next to explore');
      update();
    }
    if (event.data?.type === 'math-demo-complete' && event.data.visit === visit &&
        frame.closest('.carousel-item').classList.contains('active') && frame.dataset.sequence === 'true') {
      completed = true; advanceIfComplete();
    }
  });
  document.addEventListener('visibilitychange', () => {
    last = performance.now(); update(); advanceIfComplete();
  });
  fullscreen.hidden = !document.fullscreenEnabled;
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await exhibit.requestFullscreen();
    } catch (error) { status.textContent = `Full screen unavailable: ${error.message}`; }
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen';
  });
  function tick(now) {
    const frame = element.querySelector('.carousel-item.active iframe');
    if (loaded && running && !document.hidden && frame?.dataset.sequence !== 'true') {
      remaining -= Math.min(1000, now - last);
      if (remaining <= 0) { remaining = dwell; carousel.next(); }
    }
    last = now;
    requestAnimationFrame(tick);
  }
  new MutationObserver(update).observe(document.body, {attributes: true, attributeFilter: ['class']});
  frames.forEach(requestReady);
  // Recover readiness even when an iframe or parent script came from cache.
  readyCheck = setInterval(() => frames.filter(frame => !readyFrames.has(frame)).forEach(requestReady), 500);
  // A blocked dependency or browser graphics error must never trap the visitor.
  startupTimeout = setTimeout(() => {
    if (!loaded) { showSlides('Some slides are still loading'); update(); }
    clearInterval(readyCheck);
  }, 15000);
  window.addEventListener('pagehide', () => {
    clearInterval(readyCheck); clearTimeout(startupTimeout);
  }, {once: true});
  update(); requestAnimationFrame(tick);
})();
