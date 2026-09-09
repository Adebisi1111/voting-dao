(function() {
  const burger = document.querySelector('.nav__burger');
  const menu = document.getElementById('mobile-menu');

  if (!burger || !menu) return;

  function toggleMenu() {
    const isOpen = menu.hidden === false;
    if (isOpen) {
      menu.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
    } else {
      menu.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
    }
  }

  burger.addEventListener('click', toggleMenu);

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.hidden === false) {
      menu.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
    }
  });
})();
