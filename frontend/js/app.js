/**
 * QML-PD Research Platform - Main Application Coordinator
 */

import { BENCHMARK_RESULTS, DATASET_SPEC } from './data.js';
import { HeroPipelineVisualizer } from './visualizations.js';
import { RealPredictor } from './predictor.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Single Focused Hero Pipeline Visualizer
  const heroVisualizer = new HeroPipelineVisualizer('heroPipelineCanvas');

  // 2. Initialize Real Predictor Engine
  const predictor = new RealPredictor();

  // 3. Render Benchmark Results Table from Canonical Data
  renderBenchmarkTable();

  // 4. Setup Smooth Nav Spy
  setupNavigationSpy();
});

function renderBenchmarkTable() {
  const tbody = document.getElementById('benchmarkTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  BENCHMARK_RESULTS.forEach(row => {
    const tr = document.createElement('tr');
    if (row.paradigmKey === 'quantum') {
      tr.className = 'highlight-quantum';
    }

    const badgeClass = row.paradigmKey === 'quantum' 
      ? 'badge-quantum' 
      : (row.paradigmKey === 'federated' ? 'badge-federated' : 'badge-central');

    tr.innerHTML = `
      <td><strong>${row.model}</strong></td>
      <td><span class="${badgeClass}">${row.paradigm}</span></td>
      <td class="acc-val">${row.accuracyStr}</td>
      <td>${row.precision}</td>
      <td>${row.recall}</td>
      <td>${row.f1}</td>
      <td><span class="note-pill">${row.framework}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function setupNavigationSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollY = window.pageYOffset + 120;

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
