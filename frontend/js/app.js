/**
 * QML-PD Research Platform - Main Application Coordinator
 */

import { RealPredictor } from './predictor.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Real Predictor Engine
  const predictor = new RealPredictor();

  // 2. Setup Smooth Navigation Spy
  setupNavigationSpy();

  // 3. Setup Subtle Scroll Animation for Methodology Sequence
  setupMethodologyScrollAnimation();
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
    // Fallback if browser doesn't support IntersectionObserver
    stepNodes.forEach(node => node.classList.add('visible'));
  }
}
