/**
 * QML-PD Research Platform - Main Application Coordinator
 * Handles Navigation, Real Inference Engine, Dynamic Stat Counters, and Kinetic Text Animations
 */

import { RealPredictor } from './predictor.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Real Predictor Engine
  const predictor = new RealPredictor();

  // 2. Setup Smooth Navigation Spy
  setupNavigationSpy();

  // 3. Setup Methodology Sequence Scroll Animation
  setupMethodologyScrollAnimation();

  // 4. Setup Dynamic Stat Count-Up Animations
  setupStatCounterAnimations();

  // 5. Setup Scroll Text & Card Reveals
  setupScrollTextRevealAnimations();
});

function setupNavigationSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollY = window.pageYOffset + 140;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('active');
        }
      });
    }
  }, { passive: true });
}

function setupMethodologyScrollAnimation() {
  const stepNodes = document.querySelectorAll('.method-step-node');
  if (!stepNodes.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      root: null,
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px"
    });

    stepNodes.forEach((node, index) => {
      node.style.transitionDelay = `${index * 60}ms`;
      observer.observe(node);
    });
  } else {
    stepNodes.forEach(node => node.classList.add('visible'));
  }
}

/**
 * Unique Animated Dynamic Number Roll-Up on Scroll
 * Smooth cubic-ease counter for verified benchmark metrics and project stats
 */
function setupStatCounterAnimations() {
  const counterElements = document.querySelectorAll('[data-counter]');
  if (!counterElements.length) return;

  const animateCount = (el) => {
    const target = parseFloat(el.getAttribute('data-counter'));
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1600; // ms
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = (target * ease).toFixed(decimals);
      el.textContent = `${currentVal}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${target.toFixed(decimals)}${suffix}`;
      }
    };

    requestAnimationFrame(update);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    counterElements.forEach(el => observer.observe(el));
  } else {
    counterElements.forEach(el => {
      const target = parseFloat(el.getAttribute('data-counter'));
      const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      const suffix = el.getAttribute('data-suffix') || '';
      el.textContent = `${target.toFixed(decimals)}${suffix}`;
    });
  }
}

/**
 * Scroll Text & Card Stagger Reveals
 * Adds fluid micro-interactions as sections enter the viewport
 */
function setupScrollTextRevealAnimations() {
  const revealElements = document.querySelectorAll(
    '.section-header-clean, .info-card, .paradigm-clean-card, .spec-card, .resource-link-card'
  );
  if (!revealElements.length) return;

  revealElements.forEach(el => el.classList.add('reveal-text'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    }, {
      root: null,
      threshold: 0.08,
      rootMargin: '0px 0px -25px 0px'
    });

    revealElements.forEach((el, idx) => {
      el.style.transitionDelay = `${(idx % 4) * 70}ms`;
      observer.observe(el);
    });
  } else {
    revealElements.forEach(el => el.classList.add('is-revealed'));
  }
}
