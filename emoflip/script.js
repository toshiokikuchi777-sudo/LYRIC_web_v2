// EmoFlip HS-07 LP — interactions

document.addEventListener('DOMContentLoaded', () => {

  // Fade-in on scroll
  const fadeTargets = document.querySelectorAll(
    '.section-title, .feature-list li, .color-card, .spec-table, .func-list, .cta, .concept-card, .voice-card, .moment-card'
  );
  fadeTargets.forEach(el => el.classList.add('fade-in'));

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  fadeTargets.forEach(el => io.observe(el));

  // Color card tilt (subtle)
  document.querySelectorAll('.color-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-6px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // Video sound toggle
  const video = document.querySelector('.product-video');
  const soundBtn = document.querySelector('.video-sound');
  if (video && soundBtn) {
    soundBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      soundBtn.classList.toggle('is-on', !video.muted);
      soundBtn.setAttribute('aria-label', video.muted ? '音を出す' : '音を消す');
      if (!video.muted) video.play().catch(() => {});
    });
  }

  // Hero flip-phone click easter egg
  const flip = document.querySelector('.flip-mock');
  if (flip) {
    flip.style.cursor = 'pointer';
    flip.addEventListener('click', () => {
      flip.classList.toggle('is-closed');
    });
  }
});
