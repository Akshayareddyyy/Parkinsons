# Quantum Machine Learning-Based Parkinson's Disease Prediction

A publication-grade comparative research platform evaluating **Centralized**, **Federated**, and **Variational Quantum Neural Network (QNN / VQC)** architectures for motor UPDRS severity stratification on the Oxford Telemonitoring cohort under strict zero subject-leakage constraints.

---

## 🔬 Scientific Highlights & Dataset Protocol

- **Dataset:** Oxford Parkinson's Telemonitoring Cohort (5,875 biomedical voice recordings across 42 subjects).
- **Strict Subject-Wise Split (Zero Subject-Leakage Protocol):**
  - **Development Cohort:** 26 subjects (3,602 recordings) used for feature selection and local client training.
  - **Validation Cohort:** 7 subjects (983 recordings) for hyperparameter tuning.
  - **Locked Test Cohort:** 9 subjects (1,290 recordings) kept completely unseen for final benchmark evaluation.
- **Biomarker Selection:** 12 ANOVA-ranked acoustic and clinical indicators:
  - Motor Score: `motor_UPDRS`
  - Pitch & Frequency Perturbation: `Jitter(Abs)`, `Jitter(%)`, `Jitter:RAP`, `Jitter:PPQ5`, `Jitter:DDP`
  - Harmonics & Non-linear Dynamics: `HNR`, `RPDE`, `DFA`, `PPE`
  - Demographics: `age`, `sex`

---

## ⚛️ Quantum Circuit Architecture

The quantum models leverage a 4-qubit variational circuit implemented in **PennyLane** (`default.qubit` statevector simulator) and PyTorch:

1. **State Preparation:** $RY(\theta) \cdot RZ(\phi)$ angle encoding mapping 12 standardized ANOVA features into quantum amplitudes across 4 qubits.
2. **Entanglement Layers:** Entangling CNOT ring topology ($q_0 \to q_1 \to q_2 \to q_3 \to q_0$) generating non-local multi-qubit correlations.
3. **Variational Ansatz:** Parameterized single-qubit rotations with trainable rotation parameters $\theta$.
4. **Observable Measurement:** Expectation values $\langle Z_i \rangle$ computed with Pauli-$Z$ operators and classified via linear layer.

---

## 📊 Comparative Performance Benchmark

All models were evaluated on the **locked test set (1,290 recordings, 9 unseen subjects)**:

| Paradigm | Architecture | Test Accuracy | Status |
| :--- | :--- | :---: | :---: |
| **Quantum** | **True QNN (Phase 24 · 4-Qubit PennyLane)** | **97.91%** | Active Simulator |
| **Quantum** | **Hybrid VQC (Phase 21 · 4-Qubit PennyLane)** | **96.82%** | Active Simulator |
| **Centralized** | Logistic Regression | 99.53% | Classical Baseline |
| **Centralized** | Extra Trees | 97.29% | Classical Baseline |
| **Federated** | Federated Random Forest | 100.00% | Privacy-Preserving Baseline |
| **Federated** | Federated Extra Trees | 99.46% | Privacy-Preserving Baseline |

---

## 💻 Platform Features

- **Responsive Research UI:** Modern full-width layout with glassmorphic cards and telemetry counters.
- **Living Computational Transformation Pipeline:** 5-stage sequential pipeline with interactive stage inspection, real-time quantum amplitude waveforms, and dual-axis qubit precession display.
- **Interactive 3D Methodology Constellation:** Spherical visualization of all 42 subjects partitioned into Development, Validation, and Locked Test groups.
- **Three Learning Paradigms:** Visualized data flow pathways for Centralized, Federated, and Quantum paradigms.
- **Live Prediction Engine:**
  - **Manual Parameter Calibration:** Interactive sliders for all 12 ANOVA biomarkers with `Mild`, `Moderate`, and `Severe` presets.
  - **Clinical Report Upload:** Drag-and-drop or browse diagnostic records (`.csv`, `.json`, `.txt`) with automated multi-format extraction and UCI/Oxford alias normalization (`MDVP:Jitter(Abs)`, `updrs`, `jitter%`, etc.).
  - **Two-Way Synchronization:** Uploading a report updates the manual calibration sliders for direct clinician inspection.
  - **Live PennyLane Inference:** Real PyTorch & PennyLane CPU forward pass with prediction class, confidence score, raw logit, and $\langle Z \rangle$ quantum expectation value.

---

## 📁 Repository Structure

```text
Parkinsons/
├── css/
│   └── style.css                 # Platform design system and animations
├── js/
│   ├── app.js                    # Main coordinator script
│   ├── data.js                   # Metrics, split cohorts, and circuit specs
│   ├── predictor.js              # Live predictor, report parser & two-way sync
│   └── visualizations.js         # Canvas & 3D WebGL/Canvas visualizers
├── flrealqnnmlreal (1).ipynb     # Notebook: Federated & Centralized models
├── vqcparkinsons.ipynb           # Notebook: Variational Quantum Classifiers
├── index.html                    # Main web research interface
├── server.py                     # Python backend: PennyLane & PyTorch execution
├── .gitignore                    # Git ignore file
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Python 3.9+
- Modern Web Browser (Chrome, Edge, Firefox, Safari)

### 2. Setup Environment

```bash
# Clone the repository
git clone https://github.com/Akshayareddyyy/Parkinsons.git
cd Parkinsons

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install torch pennylane numpy
```

### 3. Run the Research Platform

```bash
python server.py
```

The platform will start at:
```text
http://localhost:8080
```

Navigate to `#prediction` to test the manual sliders or upload telemonitoring clinical reports for live quantum inference.

---

## ⚖️ Research Disclaimer

This research platform is designed for academic and computational benchmarking purposes. It does not provide medical diagnosis or clinical treatment recommendations.
