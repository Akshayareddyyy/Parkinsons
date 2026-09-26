/**
 * QML-PD Research Platform - Live Prediction Engine Client
 * Interacts with FastAPI Backend (/api/predict)
 */

import { ANOVA12_FEATURES } from './data.js';

export const PRESETS = {
  mild: {
    motor_UPDRS: 12.4,
    PPE: 0.112,
    RPDE: 0.384,
    HNR: 26.8,
    DFA: 0.582,
    "Jitter(Abs)": 0.000018,
    "Jitter(%)": 0.0024,
    "Jitter:RAP": 0.0011,
    "Jitter:PPQ5": 0.0013,
    "Jitter:DDP": 0.0033,
    age: 58,
    sex: 0
  },
  moderate: {
    motor_UPDRS: 22.5,
    PPE: 0.235,
    RPDE: 0.548,
    HNR: 20.2,
    DFA: 0.658,
    "Jitter(Abs)": 0.000046,
    "Jitter(%)": 0.0064,
    "Jitter:RAP": 0.0032,
    "Jitter:PPQ5": 0.0034,
    "Jitter:DDP": 0.0096,
    age: 66,
    sex: 1
  },
  severe: {
    motor_UPDRS: 34.2,
    PPE: 0.485,
    RPDE: 0.785,
    HNR: 11.4,
    DFA: 0.782,
    "Jitter(Abs)": 0.000125,
    "Jitter(%)": 0.0185,
    "Jitter:RAP": 0.0095,
    "Jitter:PPQ5": 0.0102,
    "Jitter:DDP": 0.0285,
    age: 74,
    sex: 1
  }
};

export const SAMPLE_REPORTS = {
  mild: {
    filename: "Patient_04_Mild_UPDRS12.csv",
    size: "1.4 KB",
    content: `patient_id,motor_UPDRS,PPE,RPDE,HNR,DFA,Jitter(Abs),Jitter(%),Jitter:RAP,Jitter:PPQ5,Jitter:DDP,age,sex,status\nPT-004,12.4,0.1120,0.3840,26.8,0.5820,0.000018,0.0024,0.0011,0.0013,0.0033,58,0,RECORDED`
  },
  severe: {
    filename: "Patient_39_Severe_UPDRS34.json",
    size: "1.8 KB",
    content: JSON.stringify({
      report_metadata: {
        patient_id: "PT-039",
        cohort: "Oxford Telemonitoring Cohort",
        acquisition_protocol: "6-Month Daily Vocal Assessment",
        standardization: "ANOVA-12 Verified"
      },
      biomarkers: {
        motor_UPDRS: 34.2,
        PPE: 0.485,
        RPDE: 0.785,
        HNR: 11.4,
        DFA: 0.782,
        "Jitter(Abs)": 0.000125,
        "Jitter(%)": 0.0185,
        "Jitter:RAP": 0.0095,
        "Jitter:PPQ5": 0.0102,
        "Jitter:DDP": 0.0285,
        age: 74,
        sex: 1
      }
    }, null, 2)
  }
};

export class RealPredictor {
  constructor() {
    this.currentValues = {};
    this.activeMode = 'manual';
    this.apiBase = window.QML_API_BASE || '';
    this.initDefaults();
    this.initDOM();
  }

  initDefaults() {
    ANOVA12_FEATURES.forEach(f => {
      this.currentValues[f.id] = f.default;
    });
  }

  initDOM() {
    this.container = document.getElementById('inputsGrid');
    this.modelSelect = document.getElementById('realModelSelect');
    this.modelSelectUpload = document.getElementById('realModelSelectUpload');
    this.executeBtn = document.getElementById('executeBtn');
    this.analyzeReportBtn = document.getElementById('analyzeReportBtn');
    this.outputPanel = document.getElementById('outputPanel');
    this.presetButtons = document.querySelectorAll('.btn-preset');

    this.modeManualBtn = document.getElementById('modeManualBtn');
    this.modeUploadBtn = document.getElementById('modeUploadBtn');
    this.manualSection = document.getElementById('manualModeSection');
    this.uploadSection = document.getElementById('uploadModeSection');

    this.dropzone = document.getElementById('reportDropzone');
    this.fileInput = document.getElementById('reportFileInput');
    this.sampleReportBtns = document.querySelectorAll('.btn-sample-report');
    this.extractedCard = document.getElementById('extractedReportCard');
    this.extractedGrid = document.getElementById('extractedGrid');
    this.reportFileName = document.getElementById('reportFileName');
    this.reportFileSize = document.getElementById('reportFileSize');
    this.reportStatusBadge = document.getElementById('reportStatusBadge');
    this.reportStatusText = document.getElementById('reportStatusText');

    if (!this.container) return;

    this.renderInputs();
    this.attachEvents();
    this.attachUploadEvents();
  }

  renderInputs() {
    this.container.innerHTML = '';

    ANOVA12_FEATURES.forEach(f => {
      const box = document.createElement('div');
      box.className = 'input-box';

      box.innerHTML = `
        <div class="input-label-row">
          <span class="input-name" title="${f.role}">${f.name}</span>
          <span class="input-val-badge" id="val_${this.safeId(f.id)}">${this.formatVal(f.id, this.currentValues[f.id])}</span>
        </div>
        <input 
          type="range" 
          class="input-slider" 
          id="range_${this.safeId(f.id)}" 
          min="${f.min}" 
          max="${f.max}" 
          step="${f.step}" 
          value="${this.currentValues[f.id]}"
          aria-label="${f.name}"
        />
        <div class="input-limits">
          <span>${f.min}</span>
          <span>${f.unit}</span>
          <span>${f.max}</span>
        </div>
      `;

      this.container.appendChild(box);
    });
  }

  safeId(id) {
    return id.replace(/[^a-zA-Z0-9]/g, '_');
  }

  formatVal(id, val) {
    if (id === 'Jitter(Abs)') return Number(val).toFixed(6);
    if (id.includes('Jitter') || id === 'PPE' || id === 'RPDE' || id === 'DFA') return Number(val).toFixed(4);
    if (id === 'motor_UPDRS' || id === 'HNR') return Number(val).toFixed(1);
    return Math.round(val);
  }

  canonicalFeatureId(rawKey) {
    if (!rawKey) return null;
    const clean = String(rawKey).trim().toLowerCase().replace(/[\s_\-:]+/g, '');
    const ALIAS_MAP = {
      "motorupdrs": "motor_UPDRS",
      "updrs": "motor_UPDRS",
      "motor": "motor_UPDRS",
      "ppe": "PPE",
      "rpde": "RPDE",
      "hnr": "HNR",
      "dfa": "DFA",
      "jitterabs": "Jitter(Abs)",
      "jitter(abs)": "Jitter(Abs)",
      "mdvpjitterabs": "Jitter(Abs)",
      "jitter%": "Jitter(%)",
      "jitter(%)": "Jitter(%)",
      "jitterpercent": "Jitter(%)",
      "jitterpct": "Jitter(%)",
      "mdvpjitter%": "Jitter(%)",
      "jitterrap": "Jitter:RAP",
      "jitter:rap": "Jitter:RAP",
      "mdvprap": "Jitter:RAP",
      "jitterppq5": "Jitter:PPQ5",
      "jitter:ppq5": "Jitter:PPQ5",
      "jitterppq": "Jitter:PPQ5",
      "mdvpppq": "Jitter:PPQ5",
      "jitterddp": "Jitter:DDP",
      "jitter:ddp": "Jitter:DDP",
      "age": "age",
      "sex": "sex",
      "gender": "sex"
    };
    return ALIAS_MAP[clean] || null;
  }

  attachEvents() {
    if (this.modeManualBtn && this.modeUploadBtn) {
      this.modeManualBtn.addEventListener('click', () => this.switchMode('manual'));
      this.modeUploadBtn.addEventListener('click', () => this.switchMode('upload'));
    }

    if (this.modelSelect && this.modelSelectUpload) {
      this.modelSelect.addEventListener('change', () => {
        this.modelSelectUpload.value = this.modelSelect.value;
      });
      this.modelSelectUpload.addEventListener('change', () => {
        this.modelSelect.value = this.modelSelectUpload.value;
      });
    }

    ANOVA12_FEATURES.forEach(f => {
      const input = document.getElementById(`range_${this.safeId(f.id)}`);
      const badge = document.getElementById(`val_${this.safeId(f.id)}`);

      if (input && badge) {
        input.addEventListener('input', (e) => {
          const num = parseFloat(e.target.value);
          this.currentValues[f.id] = num;
          badge.textContent = this.formatVal(f.id, num);
          this.presetButtons.forEach(b => b.classList.remove('active'));
        });
      }
    });

    this.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.preset;
        if (PRESETS[key]) {
          this.loadPreset(key);
          this.presetButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    if (this.executeBtn) {
      this.executeBtn.addEventListener('click', () => this.executeInference());
    }

    if (this.analyzeReportBtn) {
      this.analyzeReportBtn.addEventListener('click', () => this.executeInference());
    }
  }

  attachUploadEvents() {
    if (!this.dropzone || !this.fileInput) return;

    this.dropzone.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        this.handleReportFile(file);
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      this.dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      this.dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropzone.classList.remove('drag-active');
      });
    });

    this.dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt && dt.files && dt.files[0];
      if (file) {
        this.handleReportFile(file);
      }
    });

    this.sampleReportBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sampleKey = btn.dataset.sample;
        const sample = SAMPLE_REPORTS[sampleKey];
        if (sample) {
          this.processReportText(sample.content, sample.filename, sample.size);
        }
      });
    });
  }

  switchMode(mode) {
    this.activeMode = mode;
    if (mode === 'manual') {
      this.modeManualBtn.classList.add('active');
      this.modeUploadBtn.classList.remove('active');
      this.manualSection.style.display = 'block';
      this.uploadSection.style.display = 'none';
      if (this.executeBtn) this.executeBtn.parentElement.style.display = 'flex';
    } else {
      this.modeUploadBtn.classList.add('active');
      this.modeManualBtn.classList.remove('active');
      this.manualSection.style.display = 'none';
      this.uploadSection.style.display = 'block';
      if (this.executeBtn) this.executeBtn.parentElement.style.display = 'none';
    }
  }

  handleReportFile(file) {
    const sizeStr = file.size > 1024 
      ? `${(file.size / 1024).toFixed(1)} KB` 
      : `${file.size} B`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      this.processReportText(content, file.name, sizeStr);
    };
    reader.onerror = () => {
      alert("Failed to read report file. Please upload a valid .csv, .json, or .txt file.");
    };
    reader.readAsText(file);
  }

  processReportText(text, filename, sizeStr) {
    const extracted = {};

    try {
      const json = JSON.parse(text);
      const dataObj = json.biomarkers || json.features || json.data || json;
      Object.keys(dataObj).forEach(k => {
        const canonical = this.canonicalFeatureId(k);
        if (canonical && dataObj[k] !== undefined) {
          const val = parseFloat(dataObj[k]);
          if (!isNaN(val)) extracted[canonical] = val;
        }
      });
    } catch (_) {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      if (lines.length >= 2 && lines[0].includes(',')) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const values = lines[1].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));

        headers.forEach((h, idx) => {
          const canonical = this.canonicalFeatureId(h);
          if (canonical) {
            const val = parseFloat(values[idx]);
            if (!isNaN(val)) extracted[canonical] = val;
          }
        });
      }

      ANOVA12_FEATURES.forEach(f => {
        if (extracted[f.id] === undefined) {
          const escapedName = f.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`(?:${escapedName}|${f.id})\\s*[:=,]\\s*([0-9.]+)`, 'i');
          const match = text.match(regex);
          if (match && match[1]) {
            extracted[f.id] = parseFloat(match[1]);
          }
        }
      });
    }

    let extractedCount = 0;
    ANOVA12_FEATURES.forEach(f => {
      if (extracted[f.id] !== undefined && !isNaN(extracted[f.id])) {
        extractedCount++;
      } else {
        extracted[f.id] = f.default;
      }
    });

    this.currentValues = { ...extracted };
    this.syncSlidersWithValues();
    this.renderExtractedCard(filename, sizeStr, extracted, extractedCount);
  }

  syncSlidersWithValues() {
    ANOVA12_FEATURES.forEach(f => {
      const val = this.currentValues[f.id];
      const input = document.getElementById(`range_${this.safeId(f.id)}`);
      const badge = document.getElementById(`val_${this.safeId(f.id)}`);
      if (input) input.value = val;
      if (badge) badge.textContent = this.formatVal(f.id, val);
    });
  }

  renderExtractedCard(filename, sizeStr, extracted, extractedCount = 12) {
    if (!this.extractedCard || !this.extractedGrid) return;

    if (this.reportFileName) this.reportFileName.textContent = filename;
    if (this.reportFileSize) this.reportFileSize.textContent = sizeStr;

    if (this.reportStatusBadge && this.reportStatusText) {
      if (extractedCount === 12) {
        this.reportStatusBadge.className = 'report-status-badge success';
        this.reportStatusText.textContent = '12/12 ANOVA Biomarkers Verified';
      } else {
        this.reportStatusBadge.className = 'report-status-badge warning';
        this.reportStatusText.textContent = `${extractedCount}/12 Extracted · ${12 - extractedCount} Default(s) Applied`;
      }
    }

    this.extractedGrid.innerHTML = '';
    ANOVA12_FEATURES.forEach(f => {
      const item = document.createElement('div');
      item.className = 'extracted-item';
      item.innerHTML = `
        <span class="extracted-k">${f.name}:</span>
        <span class="extracted-v">${this.formatVal(f.id, extracted[f.id])} <small class="text-muted">${f.unit}</small></span>
      `;
      this.extractedGrid.appendChild(item);
    });

    this.extractedCard.style.display = 'block';
  }

  loadPreset(key) {
    const profile = PRESETS[key];
    if (!profile) return;

    Object.entries(profile).forEach(([id, val]) => {
      this.currentValues[id] = val;
      const input = document.getElementById(`range_${this.safeId(id)}`);
      const badge = document.getElementById(`val_${this.safeId(id)}`);
      if (input) input.value = val;
      if (badge) badge.textContent = this.formatVal(id, val);
    });
  }

  async executeInference() {
    const selectedModel = (this.activeMode === 'upload' && this.modelSelectUpload) 
      ? this.modelSelectUpload.value 
      : (this.modelSelect ? this.modelSelect.value : 'qnn');

    if (this.executeBtn) {
      this.executeBtn.disabled = true;
      this.executeBtn.innerHTML = '<span>Executing PennyLane Inference...</span>';
    }

    if (this.analyzeReportBtn) {
      this.analyzeReportBtn.disabled = true;
      this.analyzeReportBtn.innerHTML = '<span>Analyzing with PennyLane...</span>';
    }

    try {
      const url = `${this.apiBase}/api/predict`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          features: this.currentValues
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      this.renderOutput(data);

    } catch (err) {
      console.error('Inference error:', err);
      alert(`Inference failed: ${err.message}. Please ensure the backend is running.`);
    } finally {
      if (this.executeBtn) {
        this.executeBtn.disabled = false;
        this.executeBtn.innerHTML = '<span>Execute Model Inference</span><span>→</span>';
      }
      if (this.analyzeReportBtn) {
        this.analyzeReportBtn.disabled = false;
        this.analyzeReportBtn.innerHTML = '<span>Analyze Report with Quantum Model</span><span>→</span>';
      }
    }
  }

  renderOutput(data) {
    if (!this.outputPanel) return;

    this.outputPanel.style.display = 'block';

    const className = document.getElementById('resClassName');
    const classSub = document.getElementById('resClassSub');
    const prob = document.getElementById('resProb');
    const conf = document.getElementById('resConf');
    const logit = document.getElementById('resLogit');
    const qVal = document.getElementById('resQVal');
    const backendTag = document.getElementById('backendTag');
    const probBarFill = document.getElementById('probBarFill');
    const probBarVal = document.getElementById('probBarVal');

    const isMild = data.predicted_class === 0;

    if (className) {
      className.textContent = isMild ? 'CLASS 0 · MILD' : 'CLASS 1 · MODERATE-TO-SEVERE';
      className.className = `res-class-name ${isMild ? 'mild' : 'severe'}`;
    }

    if (classSub) {
      classSub.textContent = isMild 
        ? "Unified Parkinson's Disease Rating Scale below high-severity threshold."
        : "Unified Parkinson's Disease Rating Scale indicates elevated motor impairment.";
    }

    if (prob) prob.textContent = data.probability.toFixed(4);
    if (conf) conf.textContent = `${data.confidence_percent}%`;
    if (logit) logit.textContent = data.raw_logit.toFixed(4);
    if (qVal) qVal.textContent = data.quantum_expval.toFixed(4);
    if (backendTag) backendTag.textContent = `${data.model} · ${data.inference_type}`;

    if (probBarFill && probBarVal) {
      const pct = (data.probability * 100).toFixed(1);
      probBarFill.style.width = '0%';
      setTimeout(() => {
        probBarFill.style.width = `${pct}%`;
        probBarVal.textContent = `${pct}%`;
      }, 50);
    }

    this.outputPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
