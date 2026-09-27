"""
FastAPI Backend Application
Quantum Machine Learning-Based Parkinson's Disease Prediction Research Platform
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.models.quantum_engine import QuantumInferenceEngine, ANOVA12_FEATURES
from backend.voice_extractor import VoiceFeatureExtractor, VoiceExtractionError

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
voice_extractor = VoiceFeatureExtractor()

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
# Voice Acoustic Analysis Endpoints
# -----------------------------------------------------------------------------
@app.post("/api/voice/analyze")
async def analyze_voice(file: UploadFile = File(...)):
    """
    Receives recorded or uploaded audio (WAV, MP3, M4A, OGG, WebM).
    Validates audio signal quality, voicing sufficiency, and duration.
    Extracts 16 acoustic dysphonia features (Jitter, Shimmer, HNR, NHR, RPDE, DFA, PPE)
    using Praat Parselmouth and nonlinear dynamics algorithms.
    """
    max_bytes = 25 * 1024 * 1024
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file uploaded.")
    if len(content) > max_bytes:
        raise HTTPException(status_code=400, detail="Audio file exceeds maximum 25 MB limit.")

    try:
        result = voice_extractor.extract_features(
            audio_bytes=content,
            filename=file.filename or "voice_recording.wav"
        )
        return result
    except VoiceExtractionError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice feature extraction failed: {str(e)}")


@app.post("/api/voice/predict")
async def analyze_and_predict_voice(
    file: UploadFile = File(...),
    model: str = Form("qnn"),
    age: float = Form(65.0),
    sex: float = Form(1.0),
    motor_UPDRS: float = Form(21.34)
):
    """
    End-to-end clinical workflow:
    1. Receives voice audio sample
    2. Validates and extracts 9 model-compatible acoustic biomarkers
    3. Merges with physician/clinical parameters (age, sex, motor_UPDRS)
    4. Executes trained QML/FL/ML model inference
    5. Returns unified voice analysis + severity prediction + AI guidance
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file provided.")

    try:
        # Step A: Voice feature extraction
        voice_result = voice_extractor.extract_features(
            audio_bytes=content,
            filename=file.filename or "voice_sample.wav"
        )
        mapped = voice_result["mapped_model_features"]

        # Step B: Assemble complete 12 ANOVA features
        full_features = {
            "age": float(age),
            "sex": float(sex),
            "motor_UPDRS": float(motor_UPDRS),
            **mapped
        }

        # Step C: Execute quantum / classical inference pipeline
        prediction = engine.predict(
            model_type=model or "qnn",
            features_dict=full_features
        )

        return {
            "success": True,
            "voice_analysis": voice_result,
            "prediction": prediction,
            "assembled_features": full_features
        }
    except VoiceExtractionError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio processing and prediction failed: {str(e)}")


@app.post("/api/report/extract")
async def extract_report_endpoint(file: UploadFile = File(...)):
    """
    Robust clinical report extractor supporting PDF, CSV, JSON, and plain text.
    Extracts 12-ANOVA Parkinson's biomarkers including motor_UPDRS, demographic baselines,
    and acoustic telemetry with multi-table extraction, inline/multiline parsing, and alias normalization.
    """
    import json, io, re
    content = await file.read()
    filename = (file.filename or "").lower()

    CANONICAL_ALIASES = {
        # motor_UPDRS
        "motorupdrs": "motor_UPDRS",
        "updrsmotor": "motor_UPDRS",
        "mdsupdrs": "motor_UPDRS",
        "mdsupdrsiii": "motor_UPDRS",
        "updrsiii": "motor_UPDRS",
        "motor": "motor_UPDRS",
        "updrs": "motor_UPDRS",
        # Total_UPDRS
        "totalupdrs": "Total_UPDRS",
        "updrstotal": "Total_UPDRS",
        "overallupdrs": "Total_UPDRS",
        # PPE
        "ppe": "PPE",
        "pitchperiodentropy": "PPE",
        # RPDE
        "rpde": "RPDE",
        "recurrenceperioddensityentropy": "RPDE",
        # HNR
        "hnr": "HNR",
        "harmonicstonoise": "HNR",
        "harmonicstonoiseratio": "HNR",
        # DFA
        "dfa": "DFA",
        "detrendedfluctuationanalysis": "DFA",
        # Jitter(%)
        "jitter%": "Jitter(%)",
        "jitterpercent": "Jitter(%)",
        "jitterpercentage": "Jitter(%)",
        "jitterpct": "Jitter(%)",
        "mdvpjitter%": "Jitter(%)",
        "mdvpjitterpct": "Jitter(%)",
        "jitter": "Jitter(%)",
        # Jitter(Abs)
        "mdvpabsolutejitter": "Jitter(Abs)",
        "absolutejitter": "Jitter(Abs)",
        "jitterabs": "Jitter(Abs)",
        "jitter(abs)": "Jitter(Abs)",
        "mdvpjitterabs": "Jitter(Abs)",
        "absjitter": "Jitter(Abs)",
        # Jitter:RAP
        "jitterrap": "Jitter:RAP",
        "mdvprap": "Jitter:RAP",
        "rap": "Jitter:RAP",
        "relativeaverageperturbation": "Jitter:RAP",
        # Jitter:PPQ5
        "jitterppq5": "Jitter:PPQ5",
        "jitterppq": "Jitter:PPQ5",
        "mdvpppq": "Jitter:PPQ5",
        "ppq5": "Jitter:PPQ5",
        "ppq": "Jitter:PPQ5",
        # Jitter:DDP
        "jitterddp": "Jitter:DDP",
        "ddp": "Jitter:DDP",
        # Shimmer metrics
        "shimmer": "Shimmer",
        "shimmerdb": "Shimmer(dB)",
        "shimmerapq3": "Shimmer:APQ3",
        "shimmerapq5": "Shimmer:APQ5",
        "shimmerapq11": "Shimmer:APQ11",
        "shimmerdda": "Shimmer:DDA",
        # NHR
        "nhr": "NHR",
        # Age & Sex
        "age": "age",
        "patientage": "age",
        "chronologicalage": "age",
        "sex": "sex",
        "gender": "sex",
        "biologicalsex": "sex",
    }

    def clean_key(raw: str) -> str:
        if not raw:
            return ""
        return re.sub(r'[^a-z0-9%]', '', str(raw).lower())

    def match_canonical(raw_key: str):
        cleaned = clean_key(raw_key)
        if not cleaned:
            return None
        if cleaned in CANONICAL_ALIASES:
            return CANONICAL_ALIASES[cleaned]
        for alias in sorted(CANONICAL_ALIASES.keys(), key=len, reverse=True):
            if len(alias) >= 4 and alias in cleaned:
                return CANONICAL_ALIASES[alias]
        return None

    def parse_val(raw_val: str, canon: str):
        if raw_val is None:
            return None
        s = str(raw_val).strip()
        if not s:
            return None
        if canon == "sex":
            s_low = s.lower()
            if "female" in s_low or s_low in ["0", "0.0", "f"]:
                return 0.0
            if "male" in s_low or s_low in ["1", "1.0", "m"]:
                return 1.0
        m = re.search(r'[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?', s)
        if m:
            try:
                return float(m.group(0))
            except ValueError:
                pass
        return None

    extracted = {}
    full_text = ""

    try:
        if filename.endswith(".pdf"):
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                pages_text = []
                for page in pdf.pages:
                    pages_text.append(page.extract_text() or "")
                    # 1. Structured table extraction
                    for tbl in (page.extract_tables() or []):
                        if not tbl:
                            continue
                        for row in tbl:
                            if not row or len(row) < 2:
                                continue
                            cell0 = str(row[0] or "").strip()
                            canon = match_canonical(cell0)
                            if canon and canon not in extracted:
                                val = parse_val(row[1], canon)
                                if val is not None:
                                    extracted[canon] = val
                            if len(row) >= 3 and (not canon or canon in extracted):
                                cell1 = str(row[1] or "").strip()
                                canon1 = match_canonical(cell1)
                                if canon1 and canon1 not in extracted:
                                    val = parse_val(row[2], canon1)
                                    if val is not None:
                                        extracted[canon1] = val
                        # Check header-row column orientation
                        if len(tbl) >= 2:
                            headers = [str(c or "").strip() for c in tbl[0]]
                            values = [str(c or "").strip() for c in tbl[1]]
                            for h, v in zip(headers, values):
                                canon = match_canonical(h)
                                if canon and canon not in extracted:
                                    val = parse_val(v, canon)
                                    if val is not None:
                                        extracted[canon] = val
                full_text = "\n".join(pages_text)

        elif filename.endswith(".json"):
            try:
                parsed = json.loads(content.decode("utf-8", errors="ignore"))
                flat = parsed.get("biomarkers") or parsed.get("features") or parsed.get("data") or parsed
                if isinstance(flat, dict):
                    for k, v in flat.items():
                        canon = match_canonical(k)
                        if canon and canon not in extracted:
                            val = parse_val(v, canon)
                            if val is not None:
                                extracted[canon] = val
                    full_text = "\n".join(f"{k}: {v}" for k, v in flat.items())
                else:
                    full_text = json.dumps(flat)
            except Exception:
                full_text = content.decode("utf-8", errors="ignore")

        elif filename.endswith(".csv"):
            full_text = content.decode("utf-8", errors="ignore")
            lines = [l.strip() for l in full_text.splitlines() if l.strip()]
            delimiter = "," if "," in (lines[0] if lines else "") else ("\t" if "\t" in (lines[0] if lines else "") else ";")
            if len(lines) >= 2 and delimiter in lines[0]:
                headers = [h.strip().strip('"\'') for h in lines[0].split(delimiter)]
                values = [v.strip().strip('"\'') for v in lines[1].split(delimiter)]
                for h, v in zip(headers, values):
                    canon = match_canonical(h)
                    if canon and canon not in extracted:
                        val = parse_val(v, canon)
                        if val is not None:
                            extracted[canon] = val
        else:
            full_text = content.decode("utf-8", errors="ignore")

        # 2. Line-by-Line & Multiline Analysis across text
        lines = [l.strip() for l in full_text.splitlines() if l.strip()]
        for i, line in enumerate(lines):
            # 2A. Same-line parameter + value (separated by space, tab, colon, equal)
            for alias, canon in CANONICAL_ALIASES.items():
                if canon not in extracted:
                    pattern = re.compile(rf'(?:^|\b){re.escape(alias)}\b\s*[:=,\t\s]\s*([A-Za-z0-9.]+)', re.IGNORECASE)
                    m = pattern.search(line)
                    if m:
                        val = parse_val(m.group(1), canon)
                        if val is not None:
                            extracted[canon] = val

            # 2B. Multiline: parameter on line i, numeric value on line i+1 / i+2
            for alias, canon in CANONICAL_ALIASES.items():
                if canon not in extracted:
                    clean_l = clean_key(line)
                    if clean_l == alias or (len(alias) >= 5 and clean_l.startswith(alias)):
                        for offset in [1, 2]:
                            if i + offset < len(lines):
                                candidate = lines[i + offset]
                                val = parse_val(candidate, canon)
                                if val is not None:
                                    extracted[canon] = val
                                    break

        # 2C. Fallback full-text regex
        for alias, canon in CANONICAL_ALIASES.items():
            if canon not in extracted:
                pat = re.compile(rf'(?:^|\b){re.escape(alias)}\b\s*[:=,\t\s\n\r]+\s*([A-Za-z0-9.]+)', re.IGNORECASE)
                m = pat.search(full_text)
                if m:
                    val = parse_val(m.group(1), canon)
                    if val is not None:
                        extracted[canon] = val

        REQUIRED_FEATURES = [
            "motor_UPDRS", "age", "sex", "PPE", "RPDE", "HNR", "DFA",
            "Jitter(%)", "Jitter(Abs)", "Jitter:RAP", "Jitter:PPQ5", "Jitter:DDP"
        ]
        missing = [f for f in REQUIRED_FEATURES if f not in extracted]

        # Console debug logging as specified in prompt section 10
        print(f"[PDF] Extracted text length: {len(full_text)}")
        print(f"[PDF] Detected motor_UPDRS: {extracted.get('motor_UPDRS', 'NOT FOUND')}")
        print(f"[PDF] Detected Total_UPDRS: {extracted.get('Total_UPDRS', 'NOT FOUND')}")
        print(f"[PDF] Required features found: {12 - len(missing)}/12")
        print(f"[PDF] Missing features: {missing}")

        return {
            "success": True,
            "filename": file.filename,
            "extracted_features": extracted,
            "count": len(extracted),
            "required_count": 12 - len(missing),
            "missing_required": missing,
            "detected_motor_updrs": extracted.get("motor_UPDRS"),
            "detected_total_updrs": extracted.get("Total_UPDRS"),
            "text_preview": full_text[:400] if full_text else "No text extracted"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse report file: {str(e)}")




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
