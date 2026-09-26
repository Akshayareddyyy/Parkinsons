"""
FastAPI Backend Application
Quantum Machine Learning-Based Parkinson's Disease Prediction Research Platform
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.models.quantum_engine import QuantumInferenceEngine, ANOVA12_FEATURES

# -----------------------------------------------------------------------------
# App & Engine Initialization
# -----------------------------------------------------------------------------
app = FastAPI(
    title="QML-PD Research API",
    description="Publication-grade API for Quantum Machine Learning Parkinson's Disease Severity Stratification",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for external frontend hosting (Vercel, Netlify, GitHub Pages, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = QuantumInferenceEngine()

# -----------------------------------------------------------------------------
# Request & Response Schemas
# -----------------------------------------------------------------------------
class PredictionRequest(BaseModel):
    model: str = Field(default="qnn", description="Operational quantum model ('qnn' or 'vqc')")
    features: Dict[str, float] = Field(..., description="Mapping of 12 ANOVA biomarker names to numerical values")

    class Config:
        json_schema_extra = {
            "example": {
                "model": "qnn",
                "features": {
                    "motor_UPDRS": 21.34,
                    "PPE": 0.221,
                    "RPDE": 0.542,
                    "HNR": 21.67,
                    "DFA": 0.653,
                    "Jitter(Abs)": 0.000044,
                    "Jitter(%)": 0.00612,
                    "Jitter:RAP": 0.00302,
                    "Jitter:PPQ5": 0.00311,
                    "Jitter:DDP": 0.00894,
                    "age": 64.8,
                    "sex": 1.0
                }
            }
        }


# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    """Returns system status, active simulator backend, and framework versions."""
    import torch
    import pennylane as qml
    return {
        "status": "healthy",
        "service": "QML-PD Live Inference Engine",
        "quantum_simulator": "PennyLane default.qubit (state-vector)",
        "pennylane_version": qml.__version__,
        "pytorch_version": torch.__version__,
        "features_expected": len(ANOVA12_FEATURES)
    }


@app.get("/api/models")
async def get_models():
    """Returns canonical metadata and locked-test benchmark accuracies for the quantum models."""
    return {
        "benchmark": "Oxford Telemonitoring Cohort (Subject-Wise Zero-Leakage)",
        "models": [
            {
                "id": "qnn",
                "name": "True QNN (Phase 24 · 4-Qubit PennyLane)",
                "qubits": 4,
                "encoding": "RY/RZ Angle Embedding",
                "entanglement": "Linear CNOT Topology",
                "locked_test_accuracy": "97.91%"
            },
            {
                "id": "vqc",
                "name": "Hybrid VQC (Phase 21 · 4-Qubit PennyLane)",
                "qubits": 4,
                "encoding": "RY/RZ Angle Embedding",
                "entanglement": "Ring CNOT Topology",
                "residual_skip": True,
                "locked_test_accuracy": "96.82%"
            }
        ]
    }


@app.post("/api/predict")
async def predict_severity(payload: PredictionRequest):
    """Executes live quantum forward pass on provided 12 ANOVA biomarkers."""
    try:
        result = engine.predict(
            model_type=payload.model,
            features_dict=payload.features
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quantum inference execution failed: {str(e)}")


# -----------------------------------------------------------------------------
# Static Frontend Serving (Unified Deployment)
# -----------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
    if (FRONTEND_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(str(FRONTEND_DIR / "index.html"))

# -----------------------------------------------------------------------------
# Runner (for direct python execution)
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=False)
