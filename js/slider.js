/* ==========================================================================
   Generic slider/carousel — powers hero, testimonials, and featured content
   ========================================================================== */

(function () {
  'use strict';

  function initSlider(root) {
    var track = root.querySelector('.testimonial-track');
    var slides = root.querySelectorAll('.testimonial-slide');
    var prevBtn = root.querySelector('.slider-prev');
    var nextBtn = root.querySelector('.slider-next');
    var dotsWrap = root.querySelector('.slider-dots');
    var index = 0;
    var autoplayMs = parseInt(root.getAttribute('data-autoplay'), 10) || 0;
    var timer = null;

    if (!track || !slides.length) return;

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
      });
    }

    function update() {
      track.style.transform = 'translateX(-' + index * 100 + '%)';
      if (dotsWrap) {
        dotsWrap.querySelectorAll('.slider-dot').forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
        });
      }
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      update();
      restartAutoplay();
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function restartAutoplay() {
      if (!autoplayMs) return;
      window.clearInterval(timer);
      timer = window.setInterval(next, autoplayMs);
    }

    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);

    /* touch swipe */
    var touchStartX = 0;
    track.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', function (e) {
      var delta = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(delta) > 40) {
        delta < 0 ? next() : prev();
      }
    }, { passive: true });

    update();
    restartAutoplay();

    root.addEventListener('mouseenter', function () { window.clearInterval(timer); });
    root.addEventListener('mouseleave', restartAutoplay);
  }

  document.querySelectorAll('.testimonial-slider').forEach(initSlider);
})();
