/**
 * QUANTUM MACHINE LEARNING FOR PARKINSON'S DISEASE PREDICTION
 * Main Application Coordinator:
 * - Initializes Hero Living Transformation Pipeline
 * - Initializes 3D Methodology Interactive Subject Constellation
 * - Initializes Three Paradigms Connected Pathways
 * - Initializes Live PennyLane/PyTorch Prediction Engine
 */

import { HeroPipelineVisualizer, Methodology3DVisualizer, ParadigmPathwaysVisualizer } from './visualizations.js?v=20260924_upload_v2';
import { RealPredictor } from './predictor.js?v=20260924_upload_v2';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Hero Living Pipeline Visualizer
  const heroVisualizer = new HeroPipelineVisualizer('heroPipelineCanvas');

  // 2. Initialize 3D Methodology Subject Cluster
  const methodology3D = new Methodology3DVisualizer('methodology3DCanvas');

  // 3. Initialize Three Paradigms Pathways Visualizer
  const paradigmVisualizer = new ParadigmPathwaysVisualizer('paradigmCanvas');

  // 4. Initialize Live Predictor Engine (PennyLane API)
  const predictor = new RealPredictor();

  // 5. Paradigm Switcher Buttons
  const paradigmTabs = document.querySelectorAll('.paradigm-tab-btn');
  paradigmTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      paradigmTabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const paradigm = btn.dataset.paradigm;
      paradigmVisualizer.setParadigm(paradigm);
    });
  });

  // 6. Sticky Header Scroll Effect
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 7. Navigation Active Section Spy
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section-block, .hero-section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, { threshold: 0.2 });

  sections.forEach(sec => observer.observe(sec));

  // 8. Animated Number Counters (0 -> Target)
  initNumberCounters();

  // 9. Scroll Reveal Animations
  initScrollReveal();
});

/**
 * Smooth Animated Number Counters (0 -> Target) with Glow Pulse
 */
function initNumberCounters() {
  const counters = document.querySelectorAll('.counter-value[data-target]');
  if (!counters.length) return;

  const easeOutCubic = (t) => (--t) * t * t + 1;
  const duration = 1500; // ms

  const animateCounter = (el) => {
    if (el.dataset.animating === 'true') return;
    el.dataset.animating = 'true';
    const target = parseInt(el.dataset.target, 10);
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = Math.round(eased * target);

      el.textContent = current.toLocaleString('en-US');

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString('en-US');
        el.classList.add('counter-finished');
      }
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  counters.forEach(c => {
    const rect = c.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      animateCounter(c);
    } else {
      observer.observe(c);
    }
  });
}

/**
 * Scroll Reveal Animations
 */
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.section-header, .hero-visual-card, .canvas-3d-card, .split-card, .pathway-card, .paradigm-card, .circuit-container-card, .results-table-card, .prediction-card, .limitation-box'
  );

  targets.forEach((el, index) => {
    el.classList.add('reveal-on-scroll');
    const delayClass = `reveal-delay-${(index % 3) + 1}`;
    el.classList.add(delayClass);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
}
