
let slideIndexMap = {};

function moveSlide(n, slideId, dotId) {
  const slides = document.getElementById(slideId);
  const total = slides.children.length;

  if (!(slideId in slideIndexMap)) {
    slideIndexMap[slideId] = 0;
  }

  slideIndexMap[slideId] += n;

  if (slideIndexMap[slideId] < 0) slideIndexMap[slideId] = total - 1;
  if (slideIndexMap[slideId] >= total) slideIndexMap[slideId] = 0;

  slides.style.transform = `translateX(-${slideIndexMap[slideId] * 100}%)`;

  const dots = document.querySelectorAll(`#${dotId} span`);
  dots.forEach((d, i) => {
    d.classList.toggle("active", i === slideIndexMap[slideId]);
  });
}

function initDots(slideId, dotId) {
  const slides = document.getElementById(slideId);
  const dots = document.getElementById(dotId);
  if (!slides || !dots) return;

  dots.innerHTML = '';
  const total = slides.children.length;
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    dot.onclick = () => {
      moveSlide(i - (slideIndexMap[slideId] || 0), slideId, dotId);
    };
    if (i === 0) dot.classList.add("active");
    dots.appendChild(dot);
  }

  slides.style.transform = 'translateX(0%)';
}

document.addEventListener("DOMContentLoaded", () => {
  initDots('slides3', 'dots3');
});


// ▼ キャッチコピー表示アニメーション
  const catchCopy = document.querySelector(".catch-copy");
  if (catchCopy) {
    const catchObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    catchObserver.observe(catchCopy);
  }


window.addEventListener('scroll', function () {
  const pageTop = document.querySelector('.page-top');
  if (window.scrollY > 300) {
    pageTop.style.display = 'block';
  } else {
    pageTop.style.display = 'none';
  }
});

function scrollToTop() {
  console.log("クリックされました");
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

