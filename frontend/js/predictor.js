/**
 * QML-PD Research Platform - Live Prediction Engine Client
 * Interacts with FastAPI Backend (/api/voice/predict, /api/voice/analyze, /api/predict, /api/report/extract)
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
    this.selectedReportFile = null;
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingTimer = null;
    this.recordingSeconds = 0;

    this.initDefaults();
    this.initDOM();

    // Expose instance globally for inline event handlers and console access
    window.predictor = this;
    window.switchPredictionMode = (mode) => this.switchMode(mode);
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
    this.recorderBox = document.getElementById('recorderStudioBox') || document.querySelector('.recorder-studio-box');
    this.btnRecordToggle = document.getElementById('btnRecordToggle');
    this.btnRecordText = document.getElementById('btnRecordText');
    this.recordTimer = document.getElementById('recordTimer');
    this.recordStatus = document.getElementById('recordStatus');
    this.recordWaveform = document.getElementById('recordWaveform');

    // Voice file upload
    this.voiceDropzone = document.getElementById('voiceDropzone');
    this.voiceFileInput = document.getElementById('voiceFileInput');
    this.btnVoiceUploadTrigger = document.getElementById('btnVoiceUploadTrigger');
    this.voiceBrowseSpan = document.getElementById('voiceBrowseSpan');

    // Audio preview player
    this.audioPreviewStrip = document.getElementById('audioPreviewStrip');
    this.previewBadge = document.getElementById('previewBadge');
    this.previewFilename = document.getElementById('previewFilename');
    this.previewDuration = document.getElementById('previewDuration');
    this.voiceAudioPlayer = document.getElementById('voiceAudioPlayer');
    this.btnClearAudio = document.getElementById('btnClearAudio');

    // Clinical context inputs for voice mode
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
    this.btnReportUploadTrigger = document.getElementById('btnReportUploadTrigger');
    this.reportBrowseSpan = document.getElementById('reportBrowseSpan');
    this.reportFileMetaCard = document.getElementById('reportFileMetaCard');
    this.reportMetaName = document.getElementById('reportMetaName');
    this.reportMetaType = document.getElementById('reportMetaType');
    this.reportMetaSize = document.getElementById('reportMetaSize');
    this.uploadStatusIndicator = document.getElementById('uploadStatusIndicator');
    this.uploadStatusText = document.getElementById('uploadStatusText');
    this.uploadErrorBanner = document.getElementById('uploadErrorBanner');
    this.uploadErrorMsg = document.getElementById('uploadErrorMsg');
    this.uploadPredictBtn = document.getElementById('uploadPredictBtn');

    // Shared Output Panel
    this.outputPanel = document.getElementById('outputPanel');

    // 1. Attach top-level mode and action events immediately (Guaranteed execution)
    this.attachModeEvents();
    this.attachVoiceEvents();
    this.attachReportUploadEvents();
    this.attachManualEvents();

    // 2. Render manual input sliders if container is present
    if (this.container) {
      this.renderGroupedInputs();
      this.attachSliderEvents();
    }

    // 3. Set default initial view to 'voice'
    this.switchMode('voice');
  }

  /* =========================================================================
     Mode Switching (Voice, Clinical Report, Manual Calibration)
     ========================================================================= */
  attachModeEvents() {
    if (this.modeVoiceBtn) {
      this.modeVoiceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('voice');
      });
    }
    if (this.modeUploadBtn) {
      this.modeUploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('upload');
      });
    }
    if (this.modeManualBtn) {
      this.modeManualBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchMode('manual');
      });
    }
  }

  switchMode(mode) {
    this.activeMode = mode;
    console.log(`[QML-PD] Switched mode to: ${mode}`);

    // Update Mode Buttons Active State
    [
      { btn: this.modeVoiceBtn, key: 'voice' },
      { btn: this.modeUploadBtn, key: 'upload' },
      { btn: this.modeManualBtn, key: 'manual' }
    ].forEach(({ btn, key }) => {
      if (btn) {
        if (mode === key) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    // Toggle Panels with high specificity
    if (this.voiceSection) {
      if (mode === 'voice') {
        this.voiceSection.classList.add('active');
        this.voiceSection.style.setProperty('display', 'block', 'important');
      } else {
        this.voiceSection.classList.remove('active');
        this.voiceSection.style.setProperty('display', 'none', 'important');
      }
    }

    if (this.uploadSection) {
      if (mode === 'upload') {
        this.uploadSection.classList.add('active');
        this.uploadSection.style.setProperty('display', 'block', 'important');
      } else {
        this.uploadSection.classList.remove('active');
        this.uploadSection.style.setProperty('display', 'none', 'important');
      }
    }

    if (this.manualSection) {
      if (mode === 'manual') {
        this.manualSection.classList.add('active');
        this.manualSection.style.setProperty('display', 'block', 'important');
        this.syncSlidersWithValues();
      } else {
        this.manualSection.classList.remove('active');
        this.manualSection.style.setProperty('display', 'none', 'important');
      }
    }

    // Clean up temporary alert banners on mode switch
    this.hideVoiceError();
    this.hideUploadError();

    // Hide previous prediction results on tab switch so user has a fresh view
    if (this.outputPanel) {
      this.outputPanel.style.display = 'none';
    }
    if (this.voiceResultsCard) {
      this.voiceResultsCard.style.display = 'none';
    }
  }

  /* =========================================================================
     Voice Analysis & Recording Studio
     ========================================================================= */
  attachVoiceEvents() {
    // Voice Sub-tabs: Live Microphone vs Upload Audio File
    if (this.tabVoiceRecord) {
      this.tabVoiceRecord.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchVoiceTab('record');
      });
    }

    if (this.tabVoiceUpload) {
      this.tabVoiceUpload.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchVoiceTab('upload');
        // Automatically open the file selector when clicking the upload tab
        if (this.voiceFileInput) {
          this.voiceFileInput.click();
        }
      });
    }

    // Explicit "Upload Audio File" button inside the upload pane
    if (this.btnVoiceUploadTrigger) {
      this.btnVoiceUploadTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.voiceFileInput) {
          this.voiceFileInput.click();
        }
      });
    }

    // Click on browse span inside dropzone
    if (this.voiceBrowseSpan) {
      this.voiceBrowseSpan.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.voiceFileInput) {
          this.voiceFileInput.click();
        }
      });
    }

    // Voice file input change & click propagation prevention
    if (this.voiceFileInput) {
      this.voiceFileInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      this.voiceFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.handleVoiceFile(file);
        }
      });
    }

    // Voice Dropzone click & drag-and-drop
    if (this.voiceDropzone) {
      this.voiceDropzone.addEventListener('click', (e) => {
        if (e.target !== this.voiceFileInput && e.target !== this.btnVoiceUploadTrigger) {
          if (this.voiceFileInput) this.voiceFileInput.click();
        }
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

    // Start / Stop Recording Button
    if (this.btnRecordToggle) {
      this.btnRecordToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleRecording();
      });
    }

    // Clear / Retake Audio Button
    if (this.btnClearAudio) {
      this.btnClearAudio.addEventListener('click', (e) => {
        e.preventDefault();
        this.clearAudio();
      });
    }

    // Analyze Voice Action Button
    if (this.btnAnalyzeVoice) {
      this.btnAnalyzeVoice.addEventListener('click', (e) => {
        e.preventDefault();
        this.analyzeVoiceAndPredict();
      });
    }
  }

  switchVoiceTab(tab) {
    this.activeVoiceTab = tab;

    if (tab === 'record') {
      if (this.tabVoiceRecord) this.tabVoiceRecord.classList.add('active');
      if (this.tabVoiceUpload) this.tabVoiceUpload.classList.remove('active');
      if (this.paneVoiceRecord) {
        this.paneVoiceRecord.classList.add('active');
        this.paneVoiceRecord.style.setProperty('display', 'block', 'important');
      }
      if (this.paneVoiceUpload) {
        this.paneVoiceUpload.classList.remove('active');
        this.paneVoiceUpload.style.setProperty('display', 'none', 'important');
      }
    } else {
      if (this.tabVoiceUpload) this.tabVoiceUpload.classList.add('active');
      if (this.tabVoiceRecord) this.tabVoiceRecord.classList.remove('active');
      if (this.paneVoiceUpload) {
        this.paneVoiceUpload.classList.add('active');
        this.paneVoiceUpload.style.setProperty('display', 'block', 'important');
      }
      if (this.paneVoiceRecord) {
        this.paneVoiceRecord.classList.remove('active');
        this.paneVoiceRecord.style.setProperty('display', 'none', 'important');
      }
    }
  }

  /* =========================================================================
     Microphone Recording Implementation
     ========================================================================= */
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
      this.showVoiceError("Live audio recording requires a browser with microphone support (Chrome, Edge, Firefox, Safari) and a secure context (https:// or localhost). Please use 'Upload Audio File' instead.");
      return;
    }

    try {
      this.audioChunks = [];
      this.recordedAudioBlob = null;
      this.recordingSeconds = 0;

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
        console.warn("Raw constraints rejected, falling back to standard audio stream:", strictErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      this.mediaStream = stream;

      // Select supported MediaRecorder MIME type
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
      } catch (err) {
        this.mediaRecorder = new MediaRecorder(stream);
      }

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        // Validation: Minimum recording duration is 5 seconds
        if (this.recordingSeconds < 5) {
          this.showVoiceError("Recording is too short. Please record for at least 5 seconds.");
          this.clearAudio(false);
          return;
        }

        const rawMime = (this.mediaRecorder && this.mediaRecorder.mimeType) || 'audio/webm';
        const rawBlob = new Blob(this.audioChunks, { type: rawMime });
        this.uploadedAudioFile = null;

        try {
          // Convert browser WebM / Opus to true standard 16-bit PCM WAV for Praat
          this.recordedAudioBlob = await this.convertBlobToWav(rawBlob);
        } catch (convErr) {
          console.warn("PCM WAV conversion fallback to raw blob:", convErr);
          this.recordedAudioBlob = rawBlob;
        }

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

      if (this.recordTimer) this.recordTimer.textContent = '00:00';

      this.recordingTimer = setInterval(() => {
        this.recordingSeconds++;
        const mins = String(Math.floor(this.recordingSeconds / 60)).padStart(2, '0');
        const secs = String(this.recordingSeconds % 60).padStart(2, '0');
        if (this.recordTimer) this.recordTimer.textContent = `${mins}:${secs}`;

        if (this.recordStatus) {
          if (this.recordingSeconds < 5) {
            this.recordStatus.textContent = `🔴 Recording... (${this.recordingSeconds}s / min 5s) — Keep sustaining steady "aaah"`;
          } else {
            this.recordStatus.textContent = `🟢 Optimal phonation reached (${this.recordingSeconds}s / max 10s) — Stop now or hold to 10s`;
          }
        }

        // Auto-stop after 10 seconds of phonation
        if (this.recordingSeconds >= 10) {
          this.stopRecording();
        }
      }, 1000);

    } catch (err) {
      console.error("Microphone access failed:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.showVoiceError("Microphone access was denied. Please allow microphone permission in your browser settings or use Upload Audio File instead.");
      } else {
        this.showVoiceError(`Microphone error: ${err.message || 'Device unavailable'}. Please use Upload Audio File instead.`);
      }
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

  async convertBlobToWav(audioBlob) {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return audioBlob;
    const audioCtx = new AudioContextClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const wavBlob = this.audioBufferToWav(audioBuffer);
    if (audioCtx.close) audioCtx.close();
    return wavBlob;
  }

  audioBufferToWav(buffer) {
    const numChannels = 1;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let channelData;
    if (buffer.numberOfChannels === 1) {
      channelData = buffer.getChannelData(0);
    } else {
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      channelData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        channelData[i] = (left[i] + right[i]) / 2;
      }
    }

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = channelData.length * bytesPerSample;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    /* RIFF descriptor */
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');

    /* "fmt " sub-chunk */
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    /* "data" sub-chunk */
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      let s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
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

  /* =========================================================================
     Audio File Upload Handling
     ========================================================================= */
  handleVoiceFile(file) {
    this.hideVoiceError();

    if (!file) {
      this.showVoiceError("No audio file was selected.");
      return;
    }

    const validExtensions = ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aac', '.webm'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => lowerName.endsWith(ext));
    const hasValidMime = file.type.startsWith('audio/') || file.type === '';

    if (!hasValidExt && !hasValidMime) {
      this.showVoiceError(`Unsupported audio format (${file.name}). Please select a valid WAV, MP3, M4A, OGG, or FLAC audio file.`);
      return;
    }

    const maxSize = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxSize) {
      this.showVoiceError(`The selected file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload an audio sample under 25 MB.`);
      return;
    }

    if (file.size < 100) {
      this.showVoiceError("The selected file is empty or corrupted. Please provide a valid voice recording.");
      return;
    }

    this.uploadedAudioFile = file;
    this.recordedAudioBlob = null;
    const url = URL.createObjectURL(file);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    // Attempt to read audio duration via AudioContext
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      file.arrayBuffer().then(buf => audioCtx.decodeAudioData(buf)).then(decoded => {
        const durationSec = decoded.duration;
        this.showAudioPreview(url, file.name, durationSec, false, sizeStr);
        if (audioCtx.close) audioCtx.close();
      }).catch(err => {
        console.warn("Could not pre-decode audio duration:", err);
        this.showAudioPreview(url, file.name, 0, false, sizeStr);
        if (audioCtx.close) audioCtx.close();
      });
    } else {
      this.showAudioPreview(url, file.name, 0, false, sizeStr);
    }
  }

  showAudioPreview(url, filename, durationSec, isRecorded = true, sizeStr = '') {
    if (!this.audioPreviewStrip || !this.voiceAudioPlayer) return;

    this.voiceAudioPlayer.src = url;

    if (this.previewBadge) {
      this.previewBadge.textContent = isRecorded ? 'VOICE SAMPLE' : 'VOICE SAMPLE';
    }

    if (this.previewFilename) {
      this.previewFilename.textContent = filename;
    }

    if (this.previewDuration) {
      if (durationSec > 0) {
        this.previewDuration.textContent = `Duration: ${durationSec.toFixed(1)} seconds`;
      } else {
        this.previewDuration.textContent = sizeStr ? `Size: ${sizeStr}` : 'Audio sample ready';
      }
    }

    this.audioPreviewStrip.style.display = 'flex';
    this.hideVoiceError();
  }

  clearAudio(resetErrors = true) {
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
    if (this.recordStatus) this.recordStatus.textContent = 'Click "Start Recording" & sustain vowel "aaah" (5–10s)';
    if (this.recorderBox) this.recorderBox.classList.remove('recording');
    if (this.btnRecordToggle) {
      this.btnRecordToggle.classList.remove('recording');
      if (this.btnRecordText) this.btnRecordText.textContent = 'Start Recording';
    }

    if (this.voiceResultsCard) this.voiceResultsCard.style.display = 'none';
    if (resetErrors) this.hideVoiceError();
  }

  showVoiceError(message) {
    if (this.voiceErrorBanner && this.voiceErrorMsg) {
      this.voiceErrorMsg.innerHTML = `<strong>Acoustic Notice:</strong> ${message}`;
      this.voiceErrorBanner.style.display = 'flex';
      this.voiceErrorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  hideVoiceError() {
    if (this.voiceErrorBanner) this.voiceErrorBanner.style.display = 'none';
  }

  /* =========================================================================
     Voice Inference Pipeline
     ========================================================================= */
  async analyzeVoiceAndPredict() {
    const audioData = this.recordedAudioBlob || this.uploadedAudioFile;
    if (!audioData) {
      this.showVoiceError("No voice sample provided. Please click <strong>Start Recording</strong> to speak or <strong>Upload Audio File</strong> to select a recording.");
      return;
    }

    this.hideVoiceError();

    const age = parseFloat(this.voiceInputAge ? this.voiceInputAge.value : 65);
    const sex = parseFloat(this.voiceInputSex ? this.voiceInputSex.value : 1.0);
    const motorUPDRS = parseFloat(this.voiceInputUPDRS ? this.voiceInputUPDRS.value : 21.34);

    // Show loading state
    if (this.btnAnalyzeVoice) {
      this.btnAnalyzeVoice.disabled = true;
      this.btnAnalyzeVoice.style.display = 'none';
    }
    if (this.voiceLoadingSpinner) {
      this.voiceLoadingSpinner.style.display = 'flex';
      if (this.voiceSpinnerText) {
        this.voiceSpinnerText.textContent = 'Processing audio & extracting Praat Jitter/Shimmer...';
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
    formData.append('model', 'qnn');
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

        <!-- 3. Spectral & Nonlinear Dynamics -->
        <div class="voice-cat-col">
          <div class="voice-cat-title">
            <span>Harmonicity &amp; Complexity</span>
            <small>SPECTRAL DYNAMICS</small>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">HNR</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.hnr} dB</span>
              <span class="voice-status-tag ${f.hnr > 20 ? 'normal' : 'elevated'}">
                ${f.hnr > 20 ? 'Optimal' : 'Low'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">NHR</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.nhr}</span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">RPDE</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.rpde}</span>
              <span class="voice-status-tag ${isNormal(f.rpde, 0.55) ? 'normal' : 'elevated'}">
                ${isNormal(f.rpde, 0.55) ? 'Normal' : 'Elevated'}
              </span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">DFA</span>
            <div class="voice-metric-val-wrap">
              <span class="voice-metric-val">${f.dfa}</span>
            </div>
          </div>
          <div class="voice-metric-item">
            <span class="voice-metric-name">PPE</span>
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
     Clinical Report Upload & Processing
     ========================================================================= */
  attachReportUploadEvents() {
    if (this.reportFileInput) {
      this.reportFileInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      this.reportFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.handleReportFile(file);
      });
    }

    if (this.btnReportUploadTrigger) {
      this.btnReportUploadTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.reportFileInput) this.reportFileInput.click();
      });
    }

    if (this.reportBrowseSpan) {
      this.reportBrowseSpan.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.reportFileInput) this.reportFileInput.click();
      });
    }

    if (this.reportDropzone) {
      this.reportDropzone.addEventListener('click', (e) => {
        if (e.target !== this.reportFileInput && e.target !== this.btnReportUploadTrigger) {
          if (this.reportFileInput) this.reportFileInput.click();
        }
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

    if (this.uploadPredictBtn) {
      this.uploadPredictBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.processReportAndPredict();
      });
    }
  }

  handleReportFile(file) {
    this.hideUploadError();
    if (!file) return;

    this.selectedReportFile = file;
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    let fileType = 'Clinical Document';
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.pdf')) fileType = 'PDF Medical Report';
    else if (lowerName.endsWith('.csv')) fileType = 'CSV Data Table';
    else if (lowerName.endsWith('.json')) fileType = 'JSON Clinical Record';
    else if (lowerName.endsWith('.txt')) fileType = 'Clinical Text Export';

    if (this.reportFileMetaCard) {
      if (this.reportMetaName) this.reportMetaName.textContent = file.name;
      if (this.reportMetaType) this.reportMetaType.textContent = fileType;
      if (this.reportMetaSize) this.reportMetaSize.textContent = sizeStr;
      this.reportFileMetaCard.style.display = 'block';
    }

    if (this.uploadStatusIndicator && this.uploadStatusText) {
      this.uploadStatusIndicator.style.display = 'flex';
      this.uploadStatusText.textContent = `Report selected: ${file.name} (${sizeStr}). Click "Process Clinical Report" below.`;
    }
  }

  async processReportAndPredict() {
    this.hideUploadError();
    const extractedCard = document.getElementById('reportExtractedCard');
    if (extractedCard) extractedCard.style.display = 'none';

    if (!this.selectedReportFile) {
      this.showUploadError("Please select a clinical report file (PDF, CSV, JSON, or TXT) first.");
      return;
    }

    const file = this.selectedReportFile;

    if (this.uploadPredictBtn) {
      this.uploadPredictBtn.disabled = true;
      this.uploadPredictBtn.innerHTML = '<span>Processing clinical report...</span>';
    }

    try {
      let extracted = {};

      // 1. Send all report files to backend endpoint for unified multi-table/multiline parsing
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${this.apiBase}/api/report/extract`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.extracted_features) {
          extracted = data.extracted_features;
        } else {
          throw new Error(data.detail || 'Server extraction failed');
        }
      } catch (backendErr) {
        console.warn('Backend endpoint extraction fallback to client-side parser:', backendErr);
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          const text = await file.text();
          extracted = this.parseReportText(text);
        } else {
          throw backendErr;
        }
      }

      // STRICT VALIDATION: Do NOT fabricate missing values!
      const REQUIRED_FEATURES = [
        "motor_UPDRS", "age", "sex", "PPE", "RPDE", "HNR", "DFA",
        "Jitter(%)", "Jitter(Abs)", "Jitter:RAP", "Jitter:PPQ5", "Jitter:DDP"
      ];

      const missing = REQUIRED_FEATURES.filter(f => extracted[f] === undefined || isNaN(extracted[f]));

      if (missing.length > 0) {
        throw new Error(`Required feature "${missing[0]}" not found in the uploaded report. Please ensure the clinical report contains standardized telemonitoring values.`);
      }

      // All 12 required features are present!
      this.currentValues = { ...this.currentValues, ...extracted };
      this.syncSlidersWithValues();

      if (this.uploadStatusIndicator && this.uploadStatusText) {
        this.uploadStatusIndicator.style.display = 'flex';
        this.uploadStatusText.textContent = `Clinical report processed successfully (${file.name}): 12/12 Biomarkers verified. Running prediction...`;
      }

      // Render parsed data card for clinical review / debugging (Prompt Section 7)
      this.renderReportExtractedFeatures(extracted);

      // Execute prediction with True QNN model
      const predRes = await fetch(`${this.apiBase}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qnn',
          features: this.currentValues
        })
      });

      const predData = await predRes.json();
      if (!predRes.ok) throw new Error(predData.detail || 'Prediction failed');

      this.renderOutput(predData);

      if (this.outputPanel) {
        this.outputPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (err) {
      console.error('Report processing error:', err);
      this.showUploadError(err.message || "Failed to process clinical report.");
      if (extractedCard) extractedCard.style.display = 'none';
    } finally {
      if (this.uploadPredictBtn) {
        this.uploadPredictBtn.disabled = false;
        this.uploadPredictBtn.innerHTML = '<span>Process Clinical Report</span><span class="btn-arrow">→</span>';
      }
    }
  }

  renderReportExtractedFeatures(extracted) {
    const card = document.getElementById('reportExtractedCard');
    const grid = document.getElementById('reportExtractedGrid');
    const badge = document.getElementById('reportExtractedBadge');
    if (!card || !grid) return;

    grid.innerHTML = '';
    const featureDisplayOrder = [
      { key: 'age', label: 'Age', unit: 'yrs' },
      { key: 'sex', label: 'Sex', format: (v) => (Number(v) === 1.0 ? 'Male' : 'Female') },
      { key: 'motor_UPDRS', label: 'motor_UPDRS', highlight: true },
      { key: 'Total_UPDRS', label: 'Total_UPDRS', highlight: true },
      { key: 'Jitter(%)', label: 'Jitter(%)' },
      { key: 'Jitter(Abs)', label: 'Jitter(Abs)' },
      { key: 'Jitter:RAP', label: 'Jitter:RAP' },
      { key: 'Jitter:PPQ5', label: 'Jitter:PPQ5' },
      { key: 'Jitter:DDP', label: 'Jitter:DDP' },
      { key: 'Shimmer', label: 'Shimmer' },
      { key: 'HNR', label: 'HNR', unit: 'dB' },
      { key: 'RPDE', label: 'RPDE' },
      { key: 'DFA', label: 'DFA' },
      { key: 'PPE', label: 'PPE' }
    ];

    let count = 0;
    const handledKeys = new Set();

    featureDisplayOrder.forEach(item => {
      if (extracted[item.key] !== undefined && !isNaN(extracted[item.key])) {
        count++;
        handledKeys.add(item.key);
        const val = extracted[item.key];
        const displayVal = item.format ? item.format(val) : (item.unit ? `${val} ${item.unit}` : val);
        const chip = document.createElement('div');
        chip.className = `extracted-chip ${item.highlight ? 'extracted-chip-highlight' : ''}`;
        chip.innerHTML = `<span class="chip-label">${item.label}:</span> <span class="chip-val">${displayVal}</span>`;
        grid.appendChild(chip);
      }
    });

    // Also display any additional extracted metadata (e.g. NHR, Shimmer variants)
    Object.keys(extracted).forEach(k => {
      if (!handledKeys.has(k) && !isNaN(extracted[k])) {
        count++;
        const chip = document.createElement('div');
        chip.className = 'extracted-chip';
        chip.innerHTML = `<span class="chip-label">${k}:</span> <span class="chip-val">${extracted[k]}</span>`;
        grid.appendChild(chip);
      }
    });

    if (badge) {
      badge.textContent = `${count} Verified`;
    }
    card.style.display = 'block';
  }

  parseReportText(text) {
    const extracted = {};

    const parseValue = (raw, canon) => {
      if (!raw) return null;
      const s = String(raw).trim();
      if (canon === 'sex') {
        const sLow = s.toLowerCase();
        if (sLow.includes('female') || sLow === '0' || sLow === 'f') return 0.0;
        if (sLow.includes('male') || sLow === '1' || sLow === 'm') return 1.0;
      }
      const m = s.match(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/);
      return m ? parseFloat(m[0]) : null;
    };

    try {
      const json = JSON.parse(text);
      const dataObj = json.biomarkers || json.features || json.data || json;
      Object.keys(dataObj).forEach(k => {
        const canonical = this.canonicalFeatureId(k);
        if (canonical && dataObj[k] !== undefined) {
          const val = parseValue(dataObj[k], canonical);
          if (val !== null && !isNaN(val)) extracted[canonical] = val;
        }
      });
      return extracted;
    } catch (_) {
      // Plain text or CSV parsing
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      // CSV parsing
      if (lines.length >= 2 && lines[0].includes(',')) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const values = lines[1].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));

        headers.forEach((h, idx) => {
          const canonical = this.canonicalFeatureId(h);
          if (canonical && values[idx] !== undefined) {
            const val = parseValue(values[idx], canonical);
            if (val !== null && !isNaN(val)) extracted[canonical] = val;
          }
        });
      }

      // Line-by-line inline and multiline parsing
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Inline match (same line)
        ANOVA12_FEATURES.forEach(f => {
          if (extracted[f.id] === undefined) {
            const escapedName = f.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`(?:^|[\\s,;])(?:${escapedName}|${f.id})\\s*[:=,\\t\\s]\\s*([A-Za-z0-9.]+)`, 'i');
            const match = line.match(regex);
            if (match && match[1]) {
              const val = parseValue(match[1], f.id);
              if (val !== null && !isNaN(val)) extracted[f.id] = val;
            }
          }
        });

        // Multiline match (feature on line i, value on line i+1 / i+2)
        ANOVA12_FEATURES.forEach(f => {
          if (extracted[f.id] === undefined) {
            const cleanL = line.toLowerCase().replace(/[^a-z0-9%]/g, '');
            const cleanF = f.id.toLowerCase().replace(/[^a-z0-9%]/g, '');
            if (cleanL === cleanF || cleanL.startsWith(cleanF)) {
              for (let offset = 1; offset <= 2; offset++) {
                if (i + offset < lines.length) {
                  const val = parseValue(lines[i + offset], f.id);
                  if (val !== null && !isNaN(val)) {
                    extracted[f.id] = val;
                    break;
                  }
                }
              }
            }
          }
        });
      }

      return extracted;
    }
  }

  canonicalFeatureId(rawKey) {
    if (!rawKey) return null;
    const clean = String(rawKey).trim().toLowerCase().replace(/[^a-z0-9%]/g, '');
    const ALIAS_MAP = {
      "motorupdrs": "motor_UPDRS",
      "updrs": "motor_UPDRS",
      "motor": "motor_UPDRS",
      "totalupdrs": "Total_UPDRS",
      "ppe": "PPE",
      "rpde": "RPDE",
      "hnr": "HNR",
      "dfa": "DFA",
      "mdvpabsolutejitter": "Jitter(Abs)",
      "absolutejitter": "Jitter(Abs)",
      "jitterabs": "Jitter(Abs)",
      "jitter(abs)": "Jitter(Abs)",
      "mdvpjitterabs": "Jitter(Abs)",
      "jitter%": "Jitter(%)",
      "jitter(%)": "Jitter(%)",
      "jitterpercent": "Jitter(%)",
      "jitterpct": "Jitter(%)",
      "mdvpjitter%": "Jitter(%)",
      "jitter": "Jitter(%)",
      "jitterrap": "Jitter:RAP",
      "jitter:rap": "Jitter:RAP",
      "mdvprap": "Jitter:RAP",
      "jitterppq5": "Jitter:PPQ5",
      "jitter:ppq5": "Jitter:PPQ5",
      "jitterppq": "Jitter:PPQ5",
      "mdvpppq": "Jitter:PPQ5",
      "jitterddp": "Jitter:DDP",
      "jitter:ddp": "Jitter:DDP",
      "shimmer": "Shimmer",
      "age": "age",
      "sex": "sex",
      "gender": "sex"
    };
    return ALIAS_MAP[clean] || null;
  }

  showUploadError(msg) {
    if (this.uploadErrorBanner && this.uploadErrorMsg) {
      this.uploadErrorMsg.textContent = msg;
      this.uploadErrorBanner.style.display = 'flex';
    }
  }

  hideUploadError() {
    if (this.uploadErrorBanner) {
      this.uploadErrorBanner.style.display = 'none';
    }
  }

  /* =========================================================================
     Research / Manual Calibration
     ========================================================================= */
  attachManualEvents() {
    if (this.presetButtons) {
      this.presetButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const key = btn.dataset.preset;
          if (PRESETS[key]) {
            this.loadPreset(key);
            this.presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
          }
        });
      });
    }

    if (this.manualPredictBtn) {
      this.manualPredictBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.executeInference();
      });
    }
  }

  renderGroupedInputs() {
    if (!this.container) return;
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

  attachSliderEvents() {
    ANOVA12_FEATURES.forEach(f => {
      const input = document.getElementById(`range_${this.safeId(f.id)}`);
      const badge = document.getElementById(`val_${this.safeId(f.id)}`);

      if (input && badge) {
        input.addEventListener('input', (e) => {
          const num = parseFloat(e.target.value);
          this.currentValues[f.id] = num;
          badge.textContent = this.formatVal(f.id, num);
          if (this.presetButtons) {
            this.presetButtons.forEach(b => b.classList.remove('active'));
          }
        });
      }
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
     Prediction Execution (Manual Calibration)
     ========================================================================= */
  async executeInference() {
    const selectedModel = this.modelSelect ? this.modelSelect.value : 'qnn';

    if (this.manualPredictBtn) {
      this.manualPredictBtn.disabled = true;
      this.manualPredictBtn.innerHTML = '<span>Running prediction...</span>';
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
      if (this.manualPredictBtn) {
        this.manualPredictBtn.disabled = false;
        this.manualPredictBtn.innerHTML = '<span>Run Prediction</span><span class="btn-arrow">→</span>';
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

    // Render AI Diagnostic Analysis
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
