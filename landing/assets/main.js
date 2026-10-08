(() => {
  const nav = document.getElementById('nav');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (nav) {
    const setPinned = () => nav.classList.toggle('nav--pinned', window.scrollY > 12);
    setPinned();
    window.addEventListener('scroll', setPinned, { passive: true });
  }

  const revealables = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(node => node.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );

  revealables.forEach((node, index) => {
    node.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
    observer.observe(node);
  });
})();
