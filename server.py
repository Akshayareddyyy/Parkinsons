"""
Quantum Machine Learning Parkinson's Disease Prediction - Development & Production Server
Delegates to FastAPI backend (backend.app:app) with Uvicorn.
"""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting QML-PD FastAPI platform on http://localhost:{port}")
    print("Serving frontend from /frontend and API endpoints at /api/*")
    print(f"Interactive Swagger documentation available at http://localhost:{port}/docs")
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=False)
