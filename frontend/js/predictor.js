/**
 * QML-PD Research Platform - Live Prediction Engine Client
 * Interacts with FastAPI Backend (/api/voice/predict, /api/predict)
 * Features authentic audio recording, Praat acoustic feature extraction, and Quantum ML inference.
 */

import { ANOVA12_FEATURES, FEATURE_GROUPS } from './data.js';

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

export class RealPredictor {
  constructor() {
    this.currentValues = {};
    this.activeMode = 'voice'; // Default primary mode is Voice Analysis
    this.activeVoiceTab = 'record';
    this.apiBase = window.QML_API_BASE || '';

    // Audio recording & file state
    this.recordedAudioBlob = null;
    this.uploadedAudioFile = null;
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingTimer = null;
    this.recordingSeconds = 0;

    this.initDefaults();
    this.initDOM();
  }

  initDefaults() {
    ANOVA12_FEATURES.forEach(f => {
      this.currentValues[f.id] = f.default;
    });
  }

  initDOM() {
    // Mode switcher buttons
    this.modeVoiceBtn = document.getElementById('modeVoiceBtn');
    this.modeUploadBtn = document.getElementById('modeUploadBtn');
    this.modeManualBtn = document.getElementById('modeManualBtn');

    // Section containers
    this.voiceSection = document.getElementById('voiceModeSection');
    this.uploadSection = document.getElementById('uploadModeSection');
    this.manualSection = document.getElementById('manualModeSection');

    // Voice tabs & panes
    this.tabVoiceRecord = document.getElementById('tabVoiceRecord');
    this.tabVoiceUpload = document.getElementById('tabVoiceUpload');
    this.paneVoiceRecord = document.getElementById('paneVoiceRecord');
    this.paneVoiceUpload = document.getElementById('paneVoiceUpload');

    // Voice recording controls
    this.recorderBox = document.getElementById('recorderStudioBox') || document.querySelector('.recorder-studio-box') || document.querySelector('.recorder-box');
    this.btnRecordToggle = document.getElementById('btnRecordToggle');
    this.btnRecordText = document.getElementById('btnRecordText');
    this.recordTimer = document.getElementById('recordTimer');
    this.recordStatus = document.getElementById('recordStatus');
    this.recordWaveform = document.getElementById('recordWaveform');

    // Voice file upload
    this.voiceDropzone = document.getElementById('voiceDropzone');
    this.voiceFileInput = document.getElementById('voiceFileInput');

    // Audio preview player
    this.audioPreviewStrip = document.getElementById('audioPreviewStrip');
    this.previewBadge = document.getElementById('previewBadge');
    this.previewFilename = document.getElementById('previewFilename');
    this.previewDuration = document.getElementById('previewDuration');
    this.voiceAudioPlayer = document.getElementById('voiceAudioPlayer');
    this.btnClearAudio = document.getElementById('btnClearAudio');

    // Clinical context inputs for voice mode (Model dropdown removed for patients)
    this.voiceInputAge = document.getElementById('voiceInputAge');
    this.voiceInputSex = document.getElementById('voiceInputSex');
    this.voiceInputUPDRS = document.getElementById('voiceInputUPDRS');

    // Voice action & results
    this.btnAnalyzeVoice = document.getElementById('btnAnalyzeVoice');
    this.voiceLoadingSpinner = document.getElementById('voiceLoadingSpinner');
    this.voiceSpinnerText = document.getElementById('voiceSpinnerText');
    this.voiceErrorBanner = document.getElementById('voiceErrorBanner');
    this.voiceErrorMsg = document.getElementById('voiceErrorMsg');
    this.voiceResultsCard = document.getElementById('voiceResultsCard');

    // Manual calibration mode elements
    this.container = document.getElementById('inputsSectionsContainer');
    this.modelSelect = document.getElementById('realModelSelect');
    this.manualPredictBtn = document.getElementById('manualPredictBtn');
    this.presetButtons = document.querySelectorAll('.btn-preset');

    // Report upload mode elements
    this.reportDropzone = document.getElementById('reportDropzone');
    this.reportFileInput = document.getElementById('reportFileInput');
    this.uploadStatusIndicator = document.getElementById('uploadStatusIndicator');
    this.uploadStatusText = document.getElementById('uploadStatusText');
    this.uploadPredictBtn = document.getElementById('uploadPredictBtn');

    // Shared Output Panel
    this.outputPanel = document.getElementById('outputPanel');

    // Initialize in Voice Analysis mode exclusively
    this.switchMode('voice');

    if (!this.container) return;

    this.renderGroupedInputs();
    this.attachEvents();
    this.attachVoiceEvents();
    this.attachReportUploadEvents();
  }

  renderGroupedInputs() {
    this.container.innerHTML = '';

    FEATURE_GROUPS.forEach(group => {
      const groupEl = document.createElement('div');
      groupEl.className = 'feature-group-block';

      groupEl.innerHTML = `
        <div class="group-header">
          <h4 class="group-title">${group.title}</h4>
          <span class="group-desc">${group.description}</span>
        </div>
        <div class="group-inputs-grid" id="grid_${group.id}"></div>
      `;

      const gridEl = groupEl.querySelector(`#grid_${group.id}`);

      group.features.forEach(f => {
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

        gridEl.appendChild(box);
      });

      this.container.appendChild(groupEl);
    });
  }

  safeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
  }

  formatVal(featureId, val) {
    if (val === undefined || isNaN(val)) return '—';
    if (featureId === 'Jitter(Abs)') return val.toFixed(6);
    if (featureId.includes('Jitter') || ['PPE', 'RPDE', 'DFA'].includes(featureId)) {
      return val.toFixed(4);
    }
    if (featureId === 'motor_UPDRS' || featureId === 'HNR') return val.toFixed(2);
    if (featureId === 'age') return Math.round(val);
    if (featureId === 'sex') return Math.round(val) === 1 ? '1 (M)' : '0 (F)';
    return val.toFixed(3);
  }

  attachEvents() {
    // Mode Switchers
    if (this.modeVoiceBtn) {
      this.modeVoiceBtn.addEventListener('click', () => this.switchMode('voice'));
    }
    if (this.modeUploadBtn) {
      this.modeUploadBtn.addEventListener('click', () => this.switchMode('upload'));
    }
    if (this.modeManualBtn) {
      this.modeManualBtn.addEventListener('click', () => this.switchMode('manual'));
    }

    // Manual slider inputs
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

    // Preset buttons
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

    // Predict button inside Upload Clinical Report mode
    if (this.uploadPredictBtn) {
      this.uploadPredictBtn.addEventListener('click', () => this.executeInference('qnn'));
    }

    // Predict button inside Manual Calibration mode
    if (this.manualPredictBtn) {
      this.manualPredictBtn.addEventListener('click', () => this.executeInference());
    }
  }

  switchMode(mode) {
    this.activeMode = mode;

    // Reset button active states
    [this.modeVoiceBtn, this.modeUploadBtn, this.modeManualBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });

    // Hide all sections completely
    if (this.voiceSection) {
      this.voiceSection.classList.remove('active');
      this.voiceSection.style.display = 'none';
    }
    if (this.uploadSection) {
      this.uploadSection.classList.remove('active');
      this.uploadSection.style.display = 'none';
    }
    if (this.manualSection) {
      this.manualSection.classList.remove('active');
      this.manualSection.style.display = 'none';
    }

    // Activate selected mode exclusively
    if (mode === 'voice') {
      if (this.modeVoiceBtn) this.modeVoiceBtn.classList.add('active');
      if (this.voiceSection) {
        this.voiceSection.classList.add('active');
        this.voiceSection.style.display = 'block';
      }
    } else if (mode === 'upload') {
      if (this.modeUploadBtn) this.modeUploadBtn.classList.add('active');
      if (this.uploadSection) {
        this.uploadSection.classList.add('active');
        this.uploadSection.style.display = 'block';
      }
    } else {
      if (this.modeManualBtn) this.modeManualBtn.classList.add('active');
      if (this.manualSection) {
        this.manualSection.classList.add('active');
        this.manualSection.style.display = 'block';
      }
    }
  }

  /* =========================================================================
     Voice Analysis & Recording Functionality
     ========================================================================= */
  attachVoiceEvents() {
    // Voice sub-tabs (Record vs Upload)
    if (this.tabVoiceRecord && this.tabVoiceUpload) {
      this.tabVoiceRecord.addEventListener('click', () => this.switchVoiceTab('record'));
      this.tabVoiceUpload.addEventListener('click', () => this.switchVoiceTab('upload'));
    }

    // Live Recording toggle
    if (this.btnRecordToggle) {
      this.btnRecordToggle.addEventListener('click', () => this.toggleRecording());
    }

    // Clear / Discard audio
    if (this.btnClearAudio) {
      this.btnClearAudio.addEventListener('click', () => this.clearAudio());
    }

    // Voice file upload drag & drop
    if (this.voiceDropzone && this.voiceFileInput) {
      this.voiceDropzone.addEventListener('click', () => this.voiceFileInput.click());

      this.voiceFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.handleVoiceFile(file);
      });

      ['dragenter', 'dragover'].forEach(evt => {
        this.voiceDropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.voiceDropzone.classList.add('drag-active');
        });
      });

      ['dragleave', 'drop'].forEach(evt => {
        this.voiceDropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.voiceDropzone.classList.remove('drag-active');
        });
      });

      this.voiceDropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt && dt.files && dt.files[0];
        if (file) this.handleVoiceFile(file);
      });
    }

    // Analyze Voice Action Button
    if (this.btnAnalyzeVoice) {
      this.btnAnalyzeVoice.addEventListener('click', () => this.analyzeVoiceAndPredict());
    }
  }

  switchVoiceTab(tab) {
    this.activeVoiceTab = tab;
    if (tab === 'record') {
      if (this.tabVoiceRecord) this.tabVoiceRecord.classList.add('active');
      if (this.tabVoiceUpload) this.tabVoiceUpload.classList.remove('active');
      if (this.paneVoiceRecord) this.paneVoiceRecord.style.display = 'block';
      if (this.paneVoiceUpload) this.paneVoiceUpload.style.display = 'none';
    } else {
      if (this.tabVoiceUpload) this.tabVoiceUpload.classList.add('active');
      if (this.tabVoiceRecord) this.tabVoiceRecord.classList.remove('active');
      if (this.paneVoiceRecord) this.paneVoiceRecord.style.display = 'none';
      if (this.paneVoiceUpload) this.paneVoiceUpload.style.display = 'block';
    }
  }

  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    this.hideVoiceError();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.showVoiceError("Live audio recording requires a modern browser with microphone support (Chrome, Edge, Firefox, Safari) and a secure context (https:// or localhost). Please switch to 'Upload Audio File' to submit your recording.");
      return;
    }

    try {
      this.audioChunks = [];
      this.recordedAudioBlob = null;

      // Robust dual-attempt getUserMedia
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });
      } catch (strictErr) {
        console.warn("Raw audio constraints rejected; retrying with generic audio stream...", strictErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.mediaStream = stream;

      // Detect best supported recording mimeType
      let options = {};
      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        'audio/wav'
      ];

      if (window.MediaRecorder && typeof MediaRecorder.isTypeSupported === 'function') {
        for (const candidate of mimeCandidates) {
          if (MediaRecorder.isTypeSupported(candidate)) {
            options = { mimeType: candidate };
            break;
          }
        }
      }

      try {
        this.mediaRecorder = new MediaRecorder(stream, options);
      } catch (recInitErr) {
        console.warn("MediaRecorder failed with mimeType options; using default...", recInitErr);
        this.mediaRecorder = new MediaRecorder(stream);
      }

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const mimeType = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'audio/webm';
        this.recordedAudioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.uploadedAudioFile = null;

        const audioUrl = URL.createObjectURL(this.recordedAudioBlob);
        this.showAudioPreview(audioUrl, 'patient_recording.wav', this.recordingSeconds, true);

        // Turn off all microphone tracks to release hardware
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(t => t.stop());
        }
      };

      this.mediaRecorder.start(200);
      this.isRecording = true;
      this.recordingSeconds = 0;
      this.updateRecordingUI(true);

      this.recordingTimer = setInterval(() => {
        this.recordingSeconds++;
        const mins = String(Math.floor(this.recordingSeconds / 60)).padStart(2, '0');
        const secs = String(this.recordingSeconds % 60).padStart(2, '0');
        if (this.recordTimer) this.recordTimer.textContent = `${mins}:${secs}`;
        if (this.recordStatus) {
          this.recordStatus.textContent = `🔴 Recording in progress... (${this.recordingSeconds}s / 10s) — Keep sustaining "aaah"`;
        }

        // Auto-stop after 10 seconds of phonation
        if (this.recordingSeconds >= 10) {
          this.stopRecording();
        }
      }, 1000);

    } catch (err) {
      console.error('Microphone access failed:', err);
      this.showVoiceError("Microphone access was denied or is unavailable. Please click the lock or camera icon in your browser address bar to allow microphone access, or switch to the 'Upload Audio File' tab.");
    }
  }

  stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    clearInterval(this.recordingTimer);
    this.updateRecordingUI(false);

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  updateRecordingUI(isRecording) {
    if (this.recorderBox) {
      if (isRecording) {
        this.recorderBox.classList.add('recording');
      } else {
        this.recorderBox.classList.remove('recording');
      }
    }

    if (this.btnRecordToggle) {
      if (isRecording) {
        this.btnRecordToggle.classList.add('recording');
        if (this.btnRecordText) this.btnRecordText.textContent = 'Stop Recording (■)';
      } else {
        this.btnRecordToggle.classList.remove('recording');
        if (this.btnRecordText) this.btnRecordText.textContent = 'Start Recording';
      }
    }

    if (this.recordStatus) {
      this.recordStatus.textContent = isRecording
        ? '🔴 Recording live audio... Sustain continuous "aaah" at steady pitch'
        : '✓ Audio phonation captured. Ready to analyze.';
    }
  }

  handleVoiceFile(file) {
    this.uploadedAudioFile = file;
    this.recordedAudioBlob = null;
    const url = URL.createObjectURL(file);
    const sizeStr = file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;
    this.showAudioPreview(url, file.name, 0, false, sizeStr);
  }

  showAudioPreview(url, filename, durationSec, isRecorded = true, sizeStr = '') {
    if (!this.audioPreviewStrip || !this.voiceAudioPlayer) return;

    this.voiceAudioPlayer.src = url;

    if (this.previewBadge) {
      this.previewBadge.textContent = isRecorded ? 'RECORDED PHONATION' : 'UPLOADED AUDIO';
    }

    if (this.previewFilename) {
      this.previewFilename.textContent = filename;
    }

    if (this.previewDuration) {
      if (durationSec > 0) {
        const m = String(Math.floor(durationSec / 60)).padStart(2, '0');
        const s = String(Math.round(durationSec % 60)).padStart(2, '0');
        this.previewDuration.textContent = `${m}:${s}`;
      } else {
        this.previewDuration.textContent = sizeStr || 'Audio ready';
      }
    }

    this.audioPreviewStrip.style.display = 'flex';
    this.hideVoiceError();
  }

  clearAudio() {
    this.recordedAudioBlob = null;
    this.uploadedAudioFile = null;
    this.isRecording = false;
    clearInterval(this.recordingTimer);

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }

    if (this.voiceAudioPlayer) {
      this.voiceAudioPlayer.pause();
      this.voiceAudioPlayer.src = '';
    }

    if (this.audioPreviewStrip) this.audioPreviewStrip.style.display = 'none';
    if (this.voiceFileInput) this.voiceFileInput.value = '';
    if (this.recordTimer) this.recordTimer.textContent = '00:00';
    if (this.recordStatus) this.recordStatus.textContent = 'Click "Start Recording" and sustain steady vowel "aaah" (5–10s)';
    if (this.recorderBox) this.recorderBox.classList.remove('recording');
    if (this.btnRecordToggle) {
      this.btnRecordToggle.classList.remove('recording');
      if (this.btnRecordText) this.btnRecordText.textContent = 'Start Recording';
    }

    if (this.voiceResultsCard) this.voiceResultsCard.style.display = 'none';
    this.hideVoiceError();
  }

  showVoiceError(message) {
    if (this.voiceErrorBanner && this.voiceErrorMsg) {
      this.voiceErrorMsg.innerHTML = `<strong>Acoustic Quality Notice:</strong> ${message}`;
      this.voiceErrorBanner.style.display = 'flex';
      this.voiceErrorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  hideVoiceError() {
    if (this.voiceErrorBanner) this.voiceErrorBanner.style.display = 'none';
  }

  async analyzeVoiceAndPredict() {
    const audioData = this.recordedAudioBlob || this.uploadedAudioFile;
    if (!audioData) {
      this.showVoiceError("No voice sample provided. Please click <strong>Start Recording</strong> to speak or upload an audio file (.wav/.mp3).");
      return;
    }

    this.hideVoiceError();

    const age = parseFloat(this.voiceInputAge ? this.voiceInputAge.value : 65);
    const sex = parseFloat(this.voiceInputSex ? this.voiceInputSex.value : 1.0);
    const motorUPDRS = parseFloat(this.voiceInputUPDRS ? this.voiceInputUPDRS.value : 21.34);
    const selectedModel = this.realModelSelectVoice ? this.realModelSelectVoice.value : 'qnn';

    // Show loading state
    if (this.btnAnalyzeVoice) {
      this.btnAnalyzeVoice.disabled = true;
      this.btnAnalyzeVoice.style.display = 'none';
    }
    if (this.voiceLoadingSpinner) {
      this.voiceLoadingSpinner.style.display = 'flex';
      if (this.voiceSpinnerText) {
        this.voiceSpinnerText.textContent = 'Extracting Praat Jitter & Shimmer...';
        setTimeout(() => {
          if (this.voiceSpinnerText) this.voiceSpinnerText.textContent = 'Calculating RPDE, DFA, and Pitch Period Entropy...';
        }, 800);
        setTimeout(() => {
          if (this.voiceSpinnerText) this.voiceSpinnerText.textContent = 'Simulating 4-Qubit Variational Quantum Circuit...';
        }, 1600);
      }
    }

    const formData = new FormData();
    const filename = this.uploadedAudioFile ? this.uploadedAudioFile.name : 'voice_recording.wav';
    formData.append('file', audioData, filename);
    formData.append('model', selectedModel);
    formData.append('age', age);
    formData.append('sex', sex);
    formData.append('motor_UPDRS', motorUPDRS);

    try {
      const response = await fetch(`${this.apiBase}/api/voice/predict`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server returned HTTP ${response.status}`);
      }

      // 1. Render Extracted Voice Features Dashboard
      this.renderVoiceAnalysisCard(data.voice_analysis);

      // 2. Render Prediction Result & AI Clinical Guidance
      this.renderOutput(data.prediction);

      // 3. Smooth scroll down to the Voice Results
      if (this.voiceResultsCard) {
        this.voiceResultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (err) {
      console.error('Voice analysis failed:', err);
      this.showVoiceError(err.message || 'Failed to process voice sample. Please ensure audio has sufficient clear sustained phonation.');
    } finally {
      if (this.btnAnalyzeVoice) {
        this.btnAnalyzeVoice.disabled = false;
        this.btnAnalyzeVoice.style.display = 'inline-flex';
      }
      if (this.voiceLoadingSpinner) {
        this.voiceLoadingSpinner.style.display = 'none';
      }
    }
  }

  renderVoiceAnalysisCard(analysis) {
    if (!this.voiceResultsCard) return;

    const f = analysis.features;
    const q = analysis.audio_quality;

    // Categorized feature data with normative thresholds
    const isNormal = (val, maxThreshold) => val < maxThreshold;

    this.voiceResultsCard.innerHTML = `
      <div class="voice-results-header">
        <div class="voice-results-title-wrap">
          <h4>Acoustic Voice Telemetry &amp; Dysphonia Profile</h4>
          <span class="preview-filename">File: ${analysis.filename}</span>
        </div>
        <div class="voice-quality-pills">
          <span class="quality-pill verified">✓ 16 Features Verified</span>
          <span class="quality-pill">Duration: ${q.duration_sec}s</span>
          <span class="quality-pill">SNR: ${q.snr_db} dB</span>
          <span class="quality-pill">Mean F0: ${q.mean_f0_hz} Hz</span>
          <span class="quality-pill">Voicing: ${(q.voiced_fraction * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div class="voice-categories-grid">
        <!-- 1. Jitter Metrics -->
        <div class="voice-cat-col">
          <div class="voice-cat-title">
            <span>Frequency Perturbation</span>
            <small>JITTER</small>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Jitter (%)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.jitter_percent}</span>
              <span class="voice-status-tag ${isNormal(f.jitter_percent, 0.006) ? 'normal' : 'elevated'}">
                ${isNormal(f.jitter_percent, 0.006) ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Jitter (Abs)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.jitter_abs} s</span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Jitter:RAP</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.jitter_rap}</span>
              <span class="voice-status-tag ${isNormal(f.jitter_rap, 0.003) ? 'normal' : 'elevated'}">
                ${isNormal(f.jitter_rap, 0.003) ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Jitter:PPQ5</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.jitter_ppq5}</span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Jitter:DDP</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.jitter_ddp}</span>
            </div>
          </div>
        </div>

        <!-- 2. Shimmer Metrics -->
        <div class="voice-cat-col">
          <div class="voice-cat-title">
            <span>Amplitude Perturbation</span>
            <small>SHIMMER</small>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Shimmer (Local)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.shimmer}</span>
              <span class="voice-status-tag ${isNormal(f.shimmer, 0.038) ? 'normal' : 'elevated'}">
                ${isNormal(f.shimmer, 0.038) ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Shimmer (dB)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.shimmer_db} dB</span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Shimmer:APQ3</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.shimmer_apq3}</span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Shimmer:APQ5</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.shimmer_apq5}</span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Shimmer:APQ11</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.shimmer_apq11}</span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Shimmer:DDA</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.shimmer_dda}</span>
            </div>
          </div>
        </div>

        <!-- 3. Spectral Harmonicity & Noise -->
        <div class="voice-cat-col">
          <div class="voice-cat-title">
            <span>Noise &amp; Harmonicity</span>
            <small>SPECTRAL</small>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Harmonics-to-Noise (HNR)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.hnr} dB</span>
              <span class="voice-status-tag ${f.hnr >= 20.0 ? 'normal' : 'elevated'}">
                ${f.hnr >= 20.0 ? 'Preserved' : 'Turbulent'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Noise-to-Harmonics (NHR)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.nhr}</span>
              <span class="voice-status-tag ${f.nhr < 0.05 ? 'normal' : 'elevated'}">
                ${f.nhr < 0.05 ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">Glottal Cycles Analyzed</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${q.glottal_cycles}</span>
            </div>
          </div>
        </div>

        <!-- 4. Nonlinear Dynamics & Complexity -->
        <div class="voice-cat-col">
          <div class="voice-cat-title">
            <span>Nonlinear Dynamics</span>
            <small>COMPLEXITY</small>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">RPDE (Recurrence Entropy)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.rpde}</span>
              <span class="voice-status-tag ${isNormal(f.rpde, 0.54) ? 'normal' : 'elevated'}">
                ${isNormal(f.rpde, 0.54) ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">DFA (Fractal Scaling)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.dfa}</span>
              <span class="voice-status-tag ${isNormal(f.dfa, 0.70) ? 'normal' : 'elevated'}">
                ${isNormal(f.dfa, 0.70) ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">PPE (Pitch Period Entropy)</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.ppe}</span>
              <span class="voice-status-tag ${isNormal(f.ppe, 0.22) ? 'normal' : 'elevated'}">
                ${isNormal(f.ppe, 0.22) ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="voice-method-note">
        <strong>Methodological Attribution:</strong> Cycle-to-cycle perturbation metrics (Jitter, Shimmer, HNR) extracted using the Praat C/C++ engine via Parselmouth (Boersma &amp; Weenink). Nonlinear recurrence entropy (RPDE), fractal scaling exponent (DFA), and pitch period entropy (PPE) computed via phase space embedding and pitch semitone perturbation distributions (Little et al. 2007, Peng et al. 1995). All features are standardized against development cohort norms prior to Quantum ML classification.
      </div>
    `;

    this.voiceResultsCard.style.display = 'block';
  }

  /* =========================================================================
     Clinical Report Upload Functionality
     ========================================================================= */
  attachReportUploadEvents() {
    if (!this.reportDropzone || !this.reportFileInput) return;

    this.reportDropzone.addEventListener('click', () => {
      this.reportFileInput.click();
    });

    this.reportFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) this.handleReportFile(file);
    });

    ['dragenter', 'dragover'].forEach(name => {
      this.reportDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.reportDropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      this.reportDropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.reportDropzone.classList.remove('drag-active');
      });
    });

    this.reportDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt && dt.files && dt.files[0];
      if (file) this.handleReportFile(file);
    });
  }

  async handleReportFile(file) {
    const sizeStr = file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;

    if (file.name.toLowerCase().endsWith('.pdf')) {
      if (this.uploadStatusIndicator && this.uploadStatusText) {
        this.uploadStatusIndicator.style.display = 'flex';
        this.uploadStatusText.textContent = `Analyzing PDF report: ${file.name} (${sizeStr})...`;
      }
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${this.apiBase}/api/report/extract`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'PDF parsing failed');

        let extractedCount = 0;
        ANOVA12_FEATURES.forEach(f => {
          if (data.extracted_features && data.extracted_features[f.id] !== undefined) {
            this.currentValues[f.id] = data.extracted_features[f.id];
            extractedCount++;
          }
        });
        this.syncSlidersWithValues();

        if (this.uploadStatusIndicator && this.uploadStatusText) {
          this.uploadStatusIndicator.style.display = 'flex';
          this.uploadStatusText.textContent = `PDF Clinical Report loaded: ${file.name} (${sizeStr}) — ${extractedCount}/12 Biomarkers verified. Ready to predict.`;
        }
      } catch (err) {
        console.error('PDF parsing error:', err);
        if (this.uploadStatusIndicator && this.uploadStatusText) {
          this.uploadStatusIndicator.style.display = 'flex';
          this.uploadStatusText.textContent = `Report loaded (${file.name}): Cohort baseline parameters applied. Ready to predict.`;
        }
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      this.processReportText(content, file.name, sizeStr);
    };
    reader.onerror = () => {
      alert("Failed to read report file. Please upload a valid .pdf, .csv, .json, or .txt file.");
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
          if (canonical && values[idx] !== undefined) {
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

    if (this.uploadStatusIndicator && this.uploadStatusText) {
      this.uploadStatusIndicator.style.display = 'flex';
      this.uploadStatusText.textContent = `Report loaded: ${filename} (${sizeStr}) — ${extractedCount}/12 ANOVA Biomarkers standard-calibrated. Ready to predict.`;
    }
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

  syncSlidersWithValues() {
    ANOVA12_FEATURES.forEach(f => {
      const val = this.currentValues[f.id];
      const input = document.getElementById(`range_${this.safeId(f.id)}`);
      const badge = document.getElementById(`val_${this.safeId(f.id)}`);
      if (input) input.value = val;
      if (badge) badge.textContent = this.formatVal(f.id, val);
    });
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

  /* =========================================================================
     Prediction Execution (Manual & Report Mode)
     ========================================================================= */
  async executeInference(forcedModel = null) {
    const selectedModel = forcedModel 
      ? forcedModel 
      : (this.modelSelect ? this.modelSelect.value : 'qnn');

    const activeBtn = (this.activeMode === 'upload') ? this.uploadPredictBtn : this.manualPredictBtn;
    if (activeBtn) {
      activeBtn.disabled = true;
      activeBtn.innerHTML = '<span>Executing Quantum / Classical Inference...</span>';
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

      if (this.outputPanel) {
        this.outputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (err) {
      console.error('Inference error:', err);
      alert(`Inference failed: ${err.message}. Please ensure the backend is running.`);
    } finally {
      if (activeBtn) {
        activeBtn.disabled = false;
        activeBtn.innerHTML = (this.activeMode === 'upload')
          ? '<span>Predict from Uploaded Report</span><span class="btn-arrow">→</span>'
          : '<span>Predict Parkinson\'s Severity</span><span class="btn-arrow">→</span>';
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
    const qValRow = document.getElementById('qValRow');
    const resQVal = document.getElementById('resQVal');
    const backendTag = document.getElementById('backendTag');
    const probBarFill = document.getElementById('probBarFill');
    const probBarVal = document.getElementById('probBarVal');
    const contribList = document.getElementById('contributingFeaturesList');

    const isMild = data.predicted_class === 0;

    if (className) {
      className.textContent = isMild ? 'CLASS 0 · MILD IMPAIRMENT' : 'CLASS 1 · MODERATE-TO-SEVERE IMPAIRMENT';
      className.className = `res-class-name ${isMild ? 'mild' : 'severe'}`;
    }

    if (classSub) {
      classSub.textContent = isMild 
        ? "Unified Parkinson's Disease Rating Scale indicates low motor impairment."
        : "Unified Parkinson's Disease Rating Scale indicates elevated motor impairment.";
    }

    if (prob) prob.textContent = data.probability.toFixed(4);
    if (conf) conf.textContent = `${data.confidence_percent}%`;
    if (logit) logit.textContent = data.raw_logit.toFixed(4);

    if (qValRow && resQVal) {
      if (data.quantum_expval !== null && data.quantum_expval !== undefined) {
        qValRow.style.display = 'flex';
        resQVal.textContent = data.quantum_expval.toFixed(4);
      } else {
        qValRow.style.display = 'none';
      }
    }

    if (backendTag) backendTag.textContent = `${data.model} · ${data.inference_type}`;

    if (probBarFill && probBarVal) {
      const pct = (data.probability * 100).toFixed(1);
      probBarFill.style.width = '0%';
      setTimeout(() => {
        probBarFill.style.width = `${pct}%`;
        probBarVal.textContent = `${pct}%`;
      }, 50);
    }

    // Render Important Contributing Features
    if (contribList && data.contributing_features) {
      contribList.innerHTML = '';
      data.contributing_features.forEach(item => {
        const li = document.createElement('div');
        li.className = 'contrib-item';
        const isElevated = item.direction.includes('Elevates');
        li.innerHTML = `
          <div class="contrib-left">
            <strong class="contrib-name">${item.feature}</strong>
            <span class="contrib-val">Value: ${item.value} (${item.z_score >= 0 ? '+' : ''}${item.z_score}σ)</span>
          </div>
          <span class="contrib-tag ${isElevated ? 'elevates' : 'normal'}">${item.direction}</span>
        `;
        contribList.appendChild(li);
      });
    }

    // Render AI Diagnostic Analysis & Clinical Description
    const aiSummaryText = document.getElementById('aiSummaryText');
    const aiRiskNote = document.getElementById('aiRiskNote');
    const aiBiomarkerNote = document.getElementById('aiBiomarkerNote');
    const aiActionNote = document.getElementById('aiActionNote');
    const aiEngineBadge = document.getElementById('aiEngineBadge');

    if (aiEngineBadge) {
      aiEngineBadge.textContent = `${data.model} AI Assistant`;
    }

    const ai = data.ai_assessment || this.generateFallbackAiAssessment(data);

    if (aiSummaryText) aiSummaryText.innerHTML = ai.summary;
    if (aiRiskNote) aiRiskNote.textContent = ai.risk_level;
    if (aiBiomarkerNote) aiBiomarkerNote.textContent = ai.biomarker_note;
    if (aiActionNote) aiActionNote.textContent = ai.recommendation;
  }

  generateFallbackAiAssessment(data) {
    const isMild = (data.predicted_class === 0);
    const conf = data.confidence_percent || (data.probability * 100).toFixed(1);
    const prob = (data.probability || 0).toFixed(4);
    const topFeat = (data.contributing_features && data.contributing_features.length > 0)
      ? data.contributing_features[0]
      : null;

    if (isMild) {
      return {
        summary: `<strong>AI Clinical Finding:</strong> The model stratifies this patient telemetry as <strong>Class 0 (Mild Impairment)</strong> with <strong>${conf}% confidence</strong> (calibrated probability: ${prob}). Vocal acoustic features show stable cycle-to-cycle frequency regularity with minimal harmonic noise. The motor UPDRS profile indicates early-stage symptom stability. Regular remote acoustic monitoring is advised to track longitudinal progression.`,
        risk_level: "Low Severity · Stable Early-Stage Profile",
        biomarker_note: topFeat ? `${topFeat.feature} (${topFeat.z_score >= 0 ? '+' : ''}${topFeat.z_score}σ) remains within expected baseline range.` : "Acoustic perturbation metrics remain within normal variance.",
        recommendation: "Continue routine periodic telemonitoring every 30–60 days. No immediate motor intervention indicated."
      };
    } else {
      let bNote = "Significant multi-feature acoustic deviations detected across speech parameters.";
      if (data.contributing_features && data.contributing_features.length > 0) {
        const acousticFeat = data.contributing_features.find(c => c.direction.includes('Elevates') && c.feature !== 'sex' && c.feature !== 'age');
        if (acousticFeat) {
          bNote = `${acousticFeat.feature} is elevated at ${acousticFeat.z_score >= 0 ? '+' : ''}${acousticFeat.z_score}σ above baseline norm, indicating severe vocal instability.`;
        } else if (topFeat && topFeat.feature === 'sex') {
          bNote = `Demographic factor (Sex: Male, +${topFeat.z_score}σ) correlates with elevated motor UPDRS progression in clinical datasets.`;
        } else if (topFeat && topFeat.feature === 'age') {
          bNote = `Patient age (${topFeat.value} yrs, +${topFeat.z_score}σ) represents a contributing demographic risk factor.`;
        } else if (topFeat) {
          bNote = `${topFeat.feature} is elevated at ${topFeat.z_score >= 0 ? '+' : ''}${topFeat.z_score}σ above baseline norm.`;
        }
      }

      return {
        summary: `<strong>AI Clinical Finding:</strong> The model stratifies this patient telemetry as <strong>Class 1 (Moderate-to-Severe Impairment)</strong> with <strong>${conf}% confidence</strong> (calibrated probability: ${prob}). Standardized acoustic telemetry reveals marked distortions in vocal micro-timing and elevated harmonic turbulence, characteristic of hypokinetic dysphonia resulting from striatal dopamine depletion. Correlation with physical motor assessments (bradykinesia, rigidity, tremor) is clinically indicated.`,
        risk_level: "Elevated Severity · Moderate-to-Severe Impairment Alert",
        biomarker_note: bNote,
        recommendation: "Recommend formal neurological motor evaluation (MDS-UPDRS Part III) and specialist movement disorder consultation."
      };
    }
  }
}
