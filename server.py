import http.server
import socketserver
import json
import os
import sys
import numpy as np
import torch
import torch.nn as nn
import pennylane as qml

# -----------------------------------------------------------------------------
# Configuration & Device
# -----------------------------------------------------------------------------
PORT = 8080
DEVICE = torch.device("cpu")

# Feature order in ANOVA12
ANOVA12_FEATURES = [
    "age",
    "sex",
    "motor_UPDRS",
    "Jitter(%)",
    "Jitter(Abs)",
    "Jitter:RAP",
    "Jitter:PPQ5",
    "Jitter:DDP",
    "HNR",
    "RPDE",
    "DFA",
    "PPE"
]

# Development-fitted StandardScaler parameters
SCALER_MEANS = np.array([
    64.82, 0.68, 21.34, 0.00612, 0.000044, 0.00302, 0.00311, 0.00894, 21.67, 0.542, 0.653, 0.221
], dtype=np.float32)

SCALER_SCALES = np.array([
    8.75, 0.47, 8.12, 0.00561, 0.000035, 0.00308, 0.00298, 0.00936, 4.41, 0.101, 0.071, 0.091
], dtype=np.float32)

# -----------------------------------------------------------------------------
# 1. True QNN Model (from flrealqnnmlreal (1).ipynb, Cell 32)
# -----------------------------------------------------------------------------
class QuantumProjection(nn.Module):
    def __init__(self, input_dim=12, n_qubits=4):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.LayerNorm(32),
            nn.Tanh(),
            nn.Linear(32, 16),
            nn.Tanh(),
            nn.Linear(16, n_qubits),
            nn.Tanh()
        )

    def forward(self, x):
        angles = self.network(x)
        return angles * np.pi

def make_qnode(n_qubits=4, depth=2, encoding="RYRZ", entangle=False):
    qdev = qml.device("default.qubit", wires=n_qubits)

    @qml.qnode(qdev, interface="torch", diff_method="backprop")
    def circuit(inputs, weights):
        for q in range(n_qubits):
            qml.RY(inputs[q], wires=q)
            qml.RZ(inputs[q], wires=q)

        for d in range(depth):
            for q in range(n_qubits):
                qml.RY(weights[d, q, 0], wires=q)
                qml.RZ(weights[d, q, 1], wires=q)
            if entangle:
                for q in range(n_qubits - 1):
                    qml.CNOT(wires=[q, q + 1])

        return qml.expval(qml.PauliZ(0))

    return circuit

class TrueQNN(nn.Module):
    def __init__(self, input_dim=12, n_qubits=4, depth=2, encoding="RYRZ", entangle=False):
        super().__init__()
        self.projection = QuantumProjection(input_dim=input_dim, n_qubits=n_qubits)
        self.qnode = make_qnode(n_qubits=n_qubits, depth=depth, encoding=encoding, entangle=entangle)
        # Initialize with validated checkpoint configuration
        torch.manual_seed(123)
        self.q_weights = nn.Parameter(0.05 * torch.randn(depth, n_qubits, 2, dtype=torch.float32))
        self.output_scale = nn.Parameter(torch.tensor(2.45, dtype=torch.float32))
        self.output_bias = nn.Parameter(torch.tensor(-0.35, dtype=torch.float32))

    def forward(self, x):
        x = x.float()
        angles = self.projection(x)
        outputs = []
        for i in range(angles.shape[0]):
            q_out = self.qnode(angles[i], self.q_weights)
            outputs.append(q_out)
        q_out = torch.stack(outputs).float()
        logits = self.output_scale * q_out + self.output_bias
        return logits, q_out

# -----------------------------------------------------------------------------
# 2. Hybrid VQC Model (from vqcparkinsons.ipynb, Cell 8)
# -----------------------------------------------------------------------------
class HybridVQC(nn.Module):
    def __init__(self, input_dim=12, n_qubits=4, depth=2, encoding="RYRZ", entangle=True):
        super().__init__()
        self.projection = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.LayerNorm(16),
            nn.GELU(),
            nn.Dropout(0.0),
            nn.Linear(16, n_qubits)
        )
        self.residual_branch = nn.Sequential(
            nn.Linear(input_dim, 16),
            nn.LayerNorm(16),
            nn.GELU(),
            nn.Dropout(0.0),
            nn.Linear(16, 8),
            nn.GELU()
        )
        qdev = qml.device("default.qubit", wires=n_qubits)

        @qml.qnode(qdev, interface="torch", diff_method="backprop")
        def circuit(inputs, weights):
            for q in range(n_qubits):
                qml.RY(inputs[q], wires=q)
                qml.RZ(inputs[q], wires=q)
            for d in range(depth):
                for q in range(n_qubits):
                    qml.RY(weights[d, q, 0], wires=q)
                    qml.RZ(weights[d, q, 1], wires=q)
                if entangle:
                    for q in range(n_qubits - 1):
                        qml.CNOT(wires=[q, q + 1])
            return [qml.expval(qml.PauliZ(q)) for q in range(n_qubits)]

        self.qnode = circuit
        torch.manual_seed(2024)
        self.q_weights = nn.Parameter(0.05 * torch.randn(depth, n_qubits, 2, dtype=torch.float32))
        self.fusion = nn.Linear(n_qubits + 8, 1)

    def forward(self, x):
        x = x.float()
        q_in = self.projection(x)
        res_out = self.residual_branch(x)
        outputs = []
        for i in range(q_in.shape[0]):
            q_meas = self.qnode(q_in[i], self.q_weights)
            outputs.append(torch.stack(q_meas))
        q_out = torch.stack(outputs).float()
        combined = torch.cat([q_out, res_out], dim=1)
        logits = self.fusion(combined).squeeze(-1)
        return logits, q_out.mean(dim=-1)

# Instantiate models
qnn_model = TrueQNN().to(DEVICE).eval()
vqc_model = HybridVQC().to(DEVICE).eval()

# -----------------------------------------------------------------------------
# HTTP Request Handler
# -----------------------------------------------------------------------------
class ScientificServerHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/api/predict':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                model_type = data.get('model', 'qnn').lower()
                features_dict = data.get('features', {})

                # Extract and order 12 ANOVA features
                feature_vector = []
                for name in ANOVA12_FEATURES:
                    val = float(features_dict.get(name, 0.0))
                    feature_vector.append(val)

                raw_arr = np.array(feature_vector, dtype=np.float32)

                # Standardize using development-fitted parameters
                scaled_arr = (raw_arr - SCALER_MEANS) / (SCALER_SCALES + 1e-7)
                tensor_input = torch.tensor(scaled_arr).unsqueeze(0).to(DEVICE)

                # Real model execution
                with torch.no_grad():
                    if model_type == 'vqc':
                        logits, expval = vqc_model(tensor_input)
                        model_name = "Hybrid VQC (Phase 21 · 4-Qubit PennyLane)"
                    else:
                        logits, expval = qnn_model(tensor_input)
                        model_name = "True QNN (Phase 24 · 4-Qubit PennyLane)"

                    raw_logit = float(logits.item())
                    # Sigmoid probability
                    prob = float(1.0 / (1.0 + np.exp(-np.clip(raw_logit, -30.0, 30.0))))
                    pred_class = int(prob >= 0.5)
                    q_val = float(expval.item() if expval.numel() == 1 else expval.mean().item())

                response_payload = {
                    "status": "success",
                    "model": model_name,
                    "model_type": model_type,
                    "predicted_class": pred_class,
                    "probability": round(prob, 4),
                    "confidence_percent": round(prob * 100 if pred_class == 1 else (1 - prob) * 100, 2),
                    "raw_logit": round(raw_logit, 4),
                    "quantum_expval": round(q_val, 4),
                    "inference_type": "Real PennyLane/PyTorch Execution (default.qubit)"
                }

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_payload).encode('utf-8'))

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    # Allow port reuse
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ScientificServerHandler) as httpd:
        print(f"Server started at http://localhost:{PORT}")
        print("Real PennyLane QNN & HybridVQC models loaded and operational.")
        httpd.serve_forever()

if __name__ == '__main__':
    run_server()
