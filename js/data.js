/**
 * QUANTUM MACHINE LEARNING FOR PARKINSON'S DISEASE PREDICTION
 * Scientific Ground Truth Data & Benchmark Metrics
 * Extracted directly from project notebooks:
 * - vqcparkinsons.ipynb (Phases 21, 21L, 21M, 21N)
 * - flrealqnnmlreal (1).ipynb (Phases 20, 20C, 20G, 20H, 20I, 23, 24)
 */

export const RESEARCH_METADATA = {
  title: "Quantum Machine Learning-Based Parkinson's Disease Prediction",
  subtitle: "Comparative Study of Centralized, Federated, and Quantum Paradigms",
  year: "2026",
  dataset: {
    name: "Parkinson's Telemonitoring Dataset",
    source: "Oxford University / UCI Machine Learning Repository (Tsanas et al.)",
    totalRecordings: 5875,
    uniqueSubjects: 42,
    cohortProfile: "Early-stage Parkinson's disease patients with 6-month telemonitoring recordings",
    task: "Motor Severity Classification (Binary UPDRS Stratification)",
    targetColumn: "severity (0 = Mild / Low UPDRS, 1 = Moderate-to-Severe / High UPDRS)",
    criticalConstraint: "total_UPDRS excluded to prevent direct target leakage"
  },
  protocol: {
    type: "Subject-Wise Locked Test Split (Zero Subject Leakage)",
    splits: {
      development: { subjects: 26, rows: 3602, class0: 2348, class1: 1254, percent: "61.3%" },
      validation: { subjects: 7, rows: 983, class0: 589, class1: 394, percent: "16.7%" },
      lockedTest: { subjects: 9, rows: 1290, class0: 797, class1: 493, percent: "22.0%" }
    },
    leakageVerification: {
      devValOverlap: 0,
      devTestOverlap: 0,
      valTestOverlap: 0,
      status: "VERIFIED ZERO LEAKAGE"
    },
    preprocessing: "Median Imputation + Standard Scaling fitted strictly on Development set only"
  }
};

export const ANOVA12_FEATURES = [
  {
    id: "motor_UPDRS",
    name: "Motor UPDRS",
    category: "Clinical Assessment",
    unit: "score (0-108)",
    min: 5.0,
    max: 40.0,
    default: 21.2,
    step: 0.1,
    description: "Unified Parkinson's Disease Rating Scale motor subscale; clinician-assessed motor impairment severity.",
    anovaRank: 1,
    fScore: 312.4
  },
  {
    id: "PPE",
    name: "Pitch Period Entropy (PPE)",
    category: "Nonlinear Acoustic",
    unit: "dimensionless",
    min: 0.02,
    max: 0.73,
    default: 0.22,
    step: 0.01,
    description: "Nonlinear measure of dysphonia; sensitive to impaired voluntary control of vocal fold vibration frequency.",
    anovaRank: 2,
    fScore: 284.7
  },
  {
    id: "RPDE",
    name: "Recurrence Period Density Entropy",
    category: "Nonlinear Acoustic",
    unit: "entropy",
    min: 0.15,
    max: 0.95,
    default: 0.54,
    step: 0.01,
    description: "Quantifies the departure of the vocal signal from periodicity, capturing vocal fold micro-tremors.",
    anovaRank: 3,
    fScore: 241.9
  },
  {
    id: "HNR",
    name: "Harmonics-to-Noise Ratio",
    category: "Acoustic Ratio",
    unit: "dB",
    min: 1.5,
    max: 38.0,
    default: 21.7,
    step: 0.1,
    description: "Ratio of harmonic sound to acoustic noise. Lower values indicate breathiness, hoarseness, and glottal leakage.",
    anovaRank: 4,
    fScore: 218.3
  },
  {
    id: "DFA",
    name: "Detrended Fluctuation Analysis",
    category: "Fractal Scaling",
    unit: "scaling exponent",
    min: 0.50,
    max: 0.88,
    default: 0.65,
    step: 0.01,
    description: "Quantifies long-range self-similarity and fractal dynamics in speech turbulent noise.",
    anovaRank: 5,
    fScore: 189.6
  },
  {
    id: "Jitter_Abs",
    name: "Jitter (Absolute)",
    category: "Micro-Perturbation",
    unit: "seconds (µs)",
    min: 0.000003,
    max: 0.00045,
    default: 0.000044,
    step: 0.000001,
    description: "Absolute cycle-to-cycle variation in fundamental frequency (vocal fold pitch instability).",
    anovaRank: 6,
    fScore: 165.2
  },
  {
    id: "Jitter_percent",
    name: "Jitter (%)",
    category: "Micro-Perturbation",
    unit: "%",
    min: 0.0008,
    max: 0.09,
    default: 0.0061,
    step: 0.0001,
    description: "Relative cycle-to-cycle variation in fundamental frequency as a percentage of mean pitch period.",
    anovaRank: 7,
    fScore: 158.0
  },
  {
    id: "Jitter_RAP",
    name: "Jitter (RAP)",
    category: "Micro-Perturbation",
    unit: "dimensionless",
    min: 0.0003,
    max: 0.057,
    default: 0.0030,
    step: 0.0001,
    description: "Relative Amplitude Perturbation; evaluates frequency variability over 3 consecutive voice cycles.",
    anovaRank: 8,
    fScore: 147.8
  },
  {
    id: "Jitter_PPQ5",
    name: "Jitter (PPQ5)",
    category: "Micro-Perturbation",
    unit: "dimensionless",
    min: 0.0004,
    max: 0.049,
    default: 0.0031,
    step: 0.0001,
    description: "5-point Period Perturbation Quotient; smoothing variation across 5 consecutive fundamental periods.",
    anovaRank: 9,
    fScore: 142.1
  },
  {
    id: "Jitter_DDP",
    name: "Jitter (DDP)",
    category: "Micro-Perturbation",
    unit: "dimensionless",
    min: 0.0010,
    max: 0.170,
    default: 0.0090,
    step: 0.0001,
    description: "Average absolute difference of differences between consecutive cycles (3x RAP).",
    anovaRank: 10,
    fScore: 139.5
  },
  {
    id: "age",
    name: "Patient Age",
    category: "Demographic",
    unit: "years",
    min: 36,
    max: 85,
    default: 64,
    step: 1,
    description: "Chronological patient age; strongly correlates with disease duration and progressive motor deterioration.",
    anovaRank: 11,
    fScore: 98.4
  },
  {
    id: "sex",
    name: "Biological Sex",
    category: "Demographic",
    unit: "binary (0: Female, 1: Male)",
    min: 0,
    max: 1,
    default: 1,
    step: 1,
    description: "Patient biological sex; differential acoustic baseline characteristics between male and female phonation.",
    anovaRank: 12,
    fScore: 42.1
  }
];

export const PRESET_PATIENT_PROFILES = {
  mild_control: {
    name: "Patient Alpha (Early / Mild UPDRS)",
    badge: "Class 0 · Mild Stage",
    description: "Stable phonation, minimal cycle perturbation, low tremor entropy, motor UPDRS in mild range.",
    values: {
      motor_UPDRS: 12.4,
      PPE: 0.112,
      RPDE: 0.384,
      HNR: 26.8,
      DFA: 0.582,
      Jitter_Abs: 0.000018,
      Jitter_percent: 0.0024,
      Jitter_RAP: 0.0011,
      Jitter_PPQ5: 0.0013,
      Jitter_DDP: 0.0033,
      age: 58,
      sex: 0
    },
    expectedClass: 0,
    expectedConfidence: 0.942
  },
  borderline: {
    name: "Patient Beta (Borderline / Transition)",
    badge: "Transition Zone",
    description: "Moderate perturbation, borderline HNR, emerging acoustic dysphonia under clinical investigation.",
    values: {
      motor_UPDRS: 20.8,
      PPE: 0.218,
      RPDE: 0.512,
      HNR: 21.4,
      DFA: 0.648,
      Jitter_Abs: 0.000041,
      Jitter_percent: 0.0055,
      Jitter_RAP: 0.0028,
      Jitter_PPQ5: 0.0029,
      Jitter_DDP: 0.0084,
      age: 65,
      sex: 1
    },
    expectedClass: 0,
    expectedConfidence: 0.615
  },
  moderate_severe: {
    name: "Patient Gamma (Moderate-to-Severe UPDRS)",
    badge: "Class 1 · Severe Stage",
    description: "Substantial vocal dysregulation, elevated pitch entropy, severe harmonics degradation, high motor score.",
    values: {
      motor_UPDRS: 31.6,
      PPE: 0.428,
      RPDE: 0.742,
      HNR: 13.9,
      DFA: 0.761,
      Jitter_Abs: 0.000094,
      Jitter_percent: 0.0142,
      Jitter_RAP: 0.0079,
      Jitter_PPQ5: 0.0082,
      Jitter_DDP: 0.0237,
      age: 72,
      sex: 1
    },
    expectedClass: 1,
    expectedConfidence: 0.978
  },
  advanced: {
    name: "Patient Delta (Advanced Motor Impairment)",
    badge: "Class 1 · Advanced Stage",
    description: "Profound dysphonia, severe micro-tremors, near-critical HNR degradation, high motor burden.",
    values: {
      motor_UPDRS: 38.2,
      PPE: 0.594,
      RPDE: 0.886,
      HNR: 7.8,
      DFA: 0.835,
      Jitter_Abs: 0.000185,
      Jitter_percent: 0.0285,
      Jitter_RAP: 0.0162,
      Jitter_PPQ5: 0.0171,
      Jitter_DDP: 0.0486,
      age: 78,
      sex: 1
    },
    expectedClass: 1,
    expectedConfidence: 0.994
  }
};

export const BENCHMARK_MODELS = [
  {
    id: "qnn_true",
    name: "True QNN (Phase 24)",
    paradigm: "Quantum",
    category: "Quantum Neural Network",
    framework: "PennyLane + PyTorch",
    qubits: 4,
    depth: 2,
    encoding: "RYRZ Angle Embedding",
    entanglement: "CNOT (Ring/Linear)",
    metrics: {
      accuracy: 0.9791,
      balancedAccuracy: 0.9761,
      f1: 0.9724,
      rocAuc: 0.9985,
      prAuc: 0.9974,
      mcc: 0.9556,
      precision: 0.9814,
      recall: 0.9635
    },
    confusionMatrix: {
      tn: 788,
      fp: 9,
      fn: 18,
      tp: 475,
      total: 1290
    },
    status: "Published Locked Test",
    note: "Evaluated strictly on locked test set after validation selection. 12->4 classical projection with parameterized quantum variational layers."
  },
  {
    id: "vqc_hybrid",
    name: "Hybrid VQC (Phase 21)",
    paradigm: "Quantum",
    category: "Variational Quantum Classifier",
    framework: "PennyLane + PyTorch",
    qubits: 4,
    depth: 2,
    encoding: "RYRZ Angle Embedding",
    entanglement: "CNOT Full Entangler",
    metrics: {
      accuracy: 0.9682,
      balancedAccuracy: 0.9584,
      f1: 0.9566,
      rocAuc: 0.9993,
      prAuc: 0.9989,
      mcc: 0.9338,
      precision: 0.9612,
      recall: 0.9521
    },
    confusionMatrix: {
      tn: 778,
      fp: 19,
      fn: 22,
      tp: 471,
      total: 1290
    },
    status: "Published Locked Test",
    note: "High-convergence variational classifier with Adam optimization on development split. Strict zero subject leakage."
  },
  {
    id: "centralized_lr",
    name: "Centralized Logistic Regression",
    paradigm: "Centralized",
    category: "Linear Probabilistic",
    framework: "scikit-learn (Phase 20)",
    qubits: null,
    depth: null,
    encoding: "Direct ANOVA12",
    entanglement: null,
    metrics: {
      accuracy: 0.9953,
      balancedAccuracy: 0.9962,
      f1: 0.9940,
      rocAuc: 0.9999,
      prAuc: 0.9999,
      mcc: 0.9902,
      precision: 0.9880,
      recall: 1.0000
    },
    confusionMatrix: {
      tn: 791,
      fp: 6,
      fn: 0,
      tp: 493,
      total: 1290
    },
    status: "Published Locked Test",
    note: "Baseline centralized benchmark trained over all 26 development subjects with liblinear solver and L2 regularization."
  },
  {
    id: "centralized_et",
    name: "Centralized Extra Trees",
    paradigm: "Centralized",
    category: "Extremely Randomized Trees",
    framework: "scikit-learn (Phase 20)",
    qubits: null,
    depth: null,
    encoding: "Direct ANOVA12",
    entanglement: null,
    metrics: {
      accuracy: 0.9729,
      balancedAccuracy: 0.9645,
      f1: 0.9632,
      rocAuc: 0.9990,
      prAuc: 0.9987,
      mcc: 0.9434,
      precision: 1.0000,
      recall: 0.9290
    },
    confusionMatrix: {
      tn: 797,
      fp: 0,
      fn: 35,
      tp: 458,
      total: 1290
    },
    status: "Published Locked Test",
    note: "Centralized tree ensemble with randomized cut points. 100% precision with zero false positives on locked test."
  },
  {
    id: "federated_rf",
    name: "Federated Random Forest",
    paradigm: "Federated",
    category: "Decentralized Ensemble",
    framework: "Subject-Wise FL (Phase 20G)",
    qubits: null,
    depth: null,
    encoding: "Distributed ANOVA12",
    entanglement: null,
    metrics: {
      accuracy: 1.0000,
      balancedAccuracy: 1.0000,
      f1: 1.0000,
      rocAuc: 1.0000,
      prAuc: 1.0000,
      mcc: 1.0000,
      precision: 1.0000,
      recall: 1.0000
    },
    confusionMatrix: {
      tn: 797,
      fp: 0,
      fn: 0,
      tp: 493,
      total: 1290
    },
    status: "Published Locked Test",
    note: "Local client Random Forests trained per subject-node, aggregated via sample-count weighted probability ensemble."
  },
  {
    id: "federated_et",
    name: "Federated Extra Trees",
    paradigm: "Federated",
    category: "Decentralized Ensemble",
    framework: "Subject-Wise FL (Phase 20H)",
    qubits: null,
    depth: null,
    encoding: "Distributed ANOVA12",
    entanglement: null,
    metrics: {
      accuracy: 0.9946,
      balancedAccuracy: 0.9952,
      f1: 0.9929,
      rocAuc: 0.9999,
      prAuc: 0.9999,
      mcc: 0.9886,
      precision: 0.9880,
      recall: 0.9980
    },
    confusionMatrix: {
      tn: 791,
      fp: 6,
      fn: 1,
      tp: 492,
      total: 1290
    },
    status: "Published Locked Test",
    note: "Federated ensemble of decentralized Extra Trees clients with weighted voting scheme."
  },
  {
    id: "federated_hgb",
    name: "Federated HistGradientBoosting",
    paradigm: "Federated",
    category: "Decentralized Boosting",
    framework: "Subject-Wise FL (Phase 20I)",
    qubits: null,
    depth: null,
    encoding: "Distributed ANOVA12",
    entanglement: null,
    metrics: {
      accuracy: 0.6674,
      balancedAccuracy: 0.5649,
      f1: 0.2298,
      rocAuc: 0.9965,
      prAuc: 0.9945,
      mcc: 0.2905,
      precision: 1.0000,
      recall: 0.1298
    },
    confusionMatrix: {
      tn: 797,
      fp: 0,
      fn: 429,
      tp: 64,
      total: 1290
    },
    status: "Published Locked Test",
    note: "Demonstrates distribution drift challenge in gradient boosting under non-IID subject partitioning."
  },
  {
    id: "vqc_frozen_21m",
    name: "Frozen Hybrid VQC (Zero-Adaptation Phase 21M)",
    paradigm: "Quantum",
    category: "Frozen Weights Baseline",
    framework: "PennyLane (Phase 21M)",
    qubits: 4,
    depth: 2,
    encoding: "RYRZ Angle Embedding",
    entanglement: "CNOT",
    metrics: {
      accuracy: 0.5504,
      balancedAccuracy: 0.4814,
      f1: 0.2428,
      rocAuc: 0.5887,
      prAuc: 0.4576,
      mcc: -0.0443,
      precision: 0.3407,
      recall: 0.1886
    },
    confusionMatrix: {
      tn: 617,
      fp: 180,
      fn: 400,
      tp: 93,
      total: 1290
    },
    status: "Negative Control Baseline",
    note: "Evaluated with frozen checkpoint without retraining to highlight the necessity of proper quantum-classical parameter tuning."
  }
];

export const QUANTUM_CIRCUIT_SPECS = {
  framework: "PennyLane v0.45.1 with PyTorch Autograd Interface",
  qubits: 4,
  device: "default.qubit (CPU state-vector simulator)",
  circuitStages: [
    {
      stage: "Classical Projection",
      symbol: "P_12→4",
      description: "12-dimensional ANOVA input passed through Linear(12→16) → LayerNorm → GELU → Dropout(0.2) → Linear(16→4) to map feature space into 4 qubit rotation parameters."
    },
    {
      stage: "Quantum Encoding (RY)",
      symbol: "RY(x_q)",
      gate: "RY",
      description: "Single-qubit rotation around Y-axis: R_Y(θ) = exp(-i θ σ_y / 2). Encodes the projected continuous biomarker values into superposition amplitudes."
    },
    {
      stage: "Quantum Encoding (RZ)",
      symbol: "RZ(x_q)",
      gate: "RZ",
      description: "Single-qubit rotation around Z-axis: R_Z(φ) = exp(-i φ σ_z / 2). Introduces phase rotations on each qubit for dual-parameter state space coverage."
    },
    {
      stage: "Variational Ansatz (Depth 2)",
      symbol: "U(w)",
      gate: "Parametric",
      description: "Trainable parameterized single-qubit rotations RY(w_d,q,0) and RZ(w_d,q,1) optimized via backpropagation on quantum expectation gradients."
    },
    {
      stage: "Entanglement Layer",
      symbol: "CNOT",
      gate: "CNOT",
      description: "Controlled-NOT two-qubit operations applied across adjacent wire pairs (wires=[q, (q+1)%4]), establishing quantum entanglement and non-local correlations."
    },
    {
      stage: "Observable Measurement",
      symbol: "⟨Z_q⟩",
      gate: "Measurement",
      description: "Expectation value measurement of Pauli-Z operator: ⟨ψ| σ_z^q |ψ⟩ ∈ [-1, +1] on each wire, generating 4 continuous quantum observable features."
    },
    {
      stage: "Readout Classification",
      symbol: "W_out · ⟨Z⟩ + b",
      description: "Classical linear readout mapping 4 expectation values to class logit, followed by sigmoid activation for binary severity probability."
    }
  ]
};
