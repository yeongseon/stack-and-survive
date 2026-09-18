const slides = [...document.querySelectorAll('.slide')];
const controls = document.querySelector('.deck-controls');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const position = document.querySelector('#position');
let current = 0;

function show(index, focus = false) {
  current = Math.min(slides.length - 1, Math.max(0, index));
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
  position.textContent = `${current + 1} / ${slides.length}`;
  history.replaceState(null, '', `#slide-${current + 1}`);
  if (focus) slides[current].querySelector('h1,h2').focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function fromHash() {
  const match = location.hash.match(/^#slide-(\d+)$/);
  show(match ? Number(match[1]) - 1 : 0);
}

previous.addEventListener('click', () => show(current - 1, true));
next.addEventListener('click', () => show(current + 1, true));
document.querySelector('#print').addEventListener('click', () => window.print());
window.addEventListener('hashchange', fromHash);
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a,[contenteditable]')) return;
  const destinations = { ArrowLeft: current - 1, PageUp: current - 1, ArrowRight: current + 1, PageDown: current + 1, Home: 0, End: slides.length - 1 };
  if (!(event.key in destinations)) return;
  event.preventDefault();
  show(destinations[event.key], true);
});
controls.hidden = false;
fromHash();
