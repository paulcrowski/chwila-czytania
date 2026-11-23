export function mountReaderScroll() {
  const progress = document.querySelector('#scroll-progress');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  return {
    setProgress(value) {
      progress.hidden = false;
      progress.style.setProperty('--scroll-progress', Math.min(1, Math.max(0, value)));
    },
    scrollTo(target, behavior = 'smooth') {
      target.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'instant' : behavior });
    },
  };
}
