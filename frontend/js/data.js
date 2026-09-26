/**
 * QML-PD Research Platform - Canonical Benchmark Data & Feature Specifications
 * Zero Subject-Leakage Evaluation on the Oxford Telemonitoring Cohort
 */

export const DATASET_SPEC = {
  totalRecordings: 5875,
  totalSubjects: 42,
  featureCount: 12,
  paradigmsCount: 3,
  splits: {
    development: { subjects: 26, recordings: 3602, percentage: "61.3%", role: "Feature ranking & client local training" },
    validation: { subjects: 7, recordings: 983, percentage: "16.7%", role: "Hyperparameter tuning" },
    locked_test: { subjects: 9, recordings: 1290, percentage: "22.0%", role: "Unseen test evaluation (zero-leakage)" }
  }
};

export const BENCHMARK_RESULTS = [
  {
    paradigm: "Quantum",
    paradigmKey: "quantum",
    model: "True QNN (Phase 24 · 4-Qubit)",
    accuracy: 97.91,
    accuracyStr: "97.91%",
    precision: "98.05%",
    recall: "97.80%",
    f1: "97.92%",
    framework: "PennyLane + PyTorch",
    notes: "Angle embedding + CNOT ring + Pauli-Z"
  },
  {
    paradigm: "Quantum",
    paradigmKey: "quantum",
    model: "Hybrid VQC (Phase 21 · 4-Qubit)",
    accuracy: 96.82,
    accuracyStr: "96.82%",
    precision: "97.10%",
    recall: "96.55%",
    f1: "96.82%",
    framework: "PennyLane + PyTorch",
    notes: "Residual classical skip + 4-qubit readout"
  },
  {
    paradigm: "Centralized",
    paradigmKey: "centralized",
    model: "Logistic Regression",
    accuracy: 99.53,
    accuracyStr: "99.53%",
    precision: "99.50%",
    recall: "99.55%",
    f1: "99.53%",
    framework: "Scikit-Learn Baseline",
    notes: "L2 regularized baseline on pooled cohort"
  },
  {
    paradigm: "Centralized",
    paradigmKey: "centralized",
    model: "Extra Trees Classifier",
    accuracy: 97.29,
    accuracyStr: "97.29%",
    precision: "97.35%",
    recall: "97.20%",
    f1: "97.27%",
    framework: "Scikit-Learn Baseline",
    notes: "Extremely randomized trees ensemble"
  },
  {
    paradigm: "Federated",
    paradigmKey: "federated",
    model: "Federated Random Forest",
    accuracy: 100.00,
    accuracyStr: "100.00%",
    precision: "100.00%",
    recall: "100.00%",
    f1: "100.00%",
    framework: "Federated Averaging (26 Clients)",
    notes: "Privacy-preserving zero raw data exchange"
  },
  {
    paradigm: "Federated",
    paradigmKey: "federated",
    model: "Federated Extra Trees",
    accuracy: 99.46,
    accuracyStr: "99.46%",
    precision: "99.48%",
    recall: "99.44%",
    f1: "99.46%",
    framework: "Federated Averaging (26 Clients)",
    notes: "Privacy-preserving ensemble aggregation"
  }
];

export const ANOVA12_FEATURES = [
  { id: "motor_UPDRS", name: "motor_UPDRS", role: "Motor UPDRS Severity Score", min: 5.0, max: 40.0, default: 21.3, step: 0.1, unit: "Score" },
  { id: "PPE", name: "PPE", role: "Pitch Period Entropy", min: 0.02, max: 0.73, default: 0.22, step: 0.01, unit: "Entropy" },
  { id: "RPDE", name: "RPDE", role: "Recurrence Period Density Entropy", min: 0.15, max: 0.95, default: 0.54, step: 0.01, unit: "Entropy" },
  { id: "HNR", name: "HNR", role: "Harmonics-to-Noise Ratio", min: 1.5, max: 38.0, default: 21.7, step: 0.1, unit: "dB" },
  { id: "DFA", name: "DFA", role: "Detrended Fluctuation Analysis", min: 0.50, max: 0.88, default: 0.65, step: 0.01, unit: "Scaling" },
  { id: "Jitter(Abs)", name: "Jitter(Abs)", role: "Absolute Vocal Jitter", min: 0.000003, max: 0.00045, default: 0.000044, step: 0.000001, unit: "µs" },
  { id: "Jitter(%)", name: "Jitter(%)", role: "Relative Vocal Jitter", min: 0.0008, max: 0.09, default: 0.0061, step: 0.0001, unit: "%" },
  { id: "Jitter:RAP", name: "Jitter:RAP", role: "Relative Amplitude Perturbation", min: 0.0003, max: 0.057, default: 0.0030, step: 0.0001, unit: "Ratio" },
  { id: "Jitter:PPQ5", name: "Jitter:PPQ5", role: "5-point Period Perturbation", min: 0.0004, max: 0.049, default: 0.0031, step: 0.0001, unit: "Ratio" },
  { id: "Jitter:DDP", name: "Jitter:DDP", role: "Average Difference of Differences", min: 0.0010, max: 0.170, default: 0.0089, step: 0.0001, unit: "Ratio" },
  { id: "age", name: "age", role: "Patient Age", min: 36, max: 85, default: 65, step: 1, unit: "Years" },
  { id: "sex", name: "sex", role: "Patient Biological Sex", min: 0, max: 1, default: 1, step: 1, unit: "0:F, 1:M" }
];
