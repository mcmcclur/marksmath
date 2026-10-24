(() => {
  const exhibit = document.querySelector('#math-exhibit');
  const frames = [...exhibit.querySelectorAll('iframe')];
  const attached = new WeakSet();
  let timer, hidden = false;

  function setHidden(value) {
    hidden = value;
    exhibit.classList.toggle('cursor-idle', value);
    frames.forEach(frame => {
      frame.contentDocument?.documentElement.classList.toggle('cursor-idle', value);
    });
  }
  function wake() {
    setHidden(false);
    clearTimeout(timer);
    timer = setTimeout(() => setHidden(true), 3000);
  }
  function attach(doc) {
    if (!doc || attached.has(doc)) return;
    attached.add(doc);
    // Pointer events inside an iframe do not bubble to the parent page.
    for (const type of ['pointermove', 'pointerdown', 'pointerover', 'wheel', 'keydown']) {
      doc.addEventListener(type, wake, {capture: true, passive: true});
    }
    doc.documentElement.classList.toggle('cursor-idle', hidden);
  }
  attach(document);
  frames.forEach(frame => {
    attach(frame.contentDocument);
    frame.addEventListener('load', () => attach(frame.contentDocument));
  });
  document.addEventListener('fullscreenchange', wake);
  window.addEventListener('pagehide', () => clearTimeout(timer));
  window.addEventListener('pageshow', wake);
  wake();
})();
