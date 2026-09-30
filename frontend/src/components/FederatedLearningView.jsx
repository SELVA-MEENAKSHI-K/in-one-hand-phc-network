import React, { useState } from 'react';
import {
  Cpu,
  Lock,
  Globe,
  ShieldCheck,
  Sparkles,
  Play,
  RotateCw,
  Building
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp } from '../context/AppContext';

export const FederatedLearningView = () => {
  const { recordBenchmark, isEvaluationMode } = useApp();

  const [round, setRound] = useState(4);
  const [isTraining, setIsTraining] = useState(false);
  const [lossData, setLossData] = useState([
    { round: 'R-1', loss: 0.82, accuracy: '71%' },
    { round: 'R-2', loss: 0.65, accuracy: '79%' },
    { round: 'R-3', loss: 0.48, accuracy: '86%' },
    { round: 'R-4', loss: 0.34, accuracy: '91%' }
  ]);

  const handleSimulateEpoch = () => {
    setIsTraining(true);
    const start = performance.now();

    setTimeout(() => {
      const nextRound = round + 1;
      const newLoss = Math.max(0.12, (0.34 * Math.pow(0.75, nextRound - 4)).toFixed(3));
      const newAcc = `${Math.min(96, 91 + (nextRound - 4) * 2)}%`;

      setLossData((prev) => [
        ...prev,
        { round: `R-${nextRound}`, loss: Number(newLoss), accuracy: newAcc }
      ]);
      setRound(nextRound);
      setIsTraining(false);
      recordBenchmark('Federated Epoch Aggregation', 4.0, start);
    }, 1200);
  };

  return (
    <div className="federated-page">
      {/* Prominent Architectural Showcase & Simulation Notice */}
      <div className="fl-simulation-disclaimer-banner">
        <div className="disclaimer-header">
          <Sparkles size={16} className="text-primary" />
          <strong>Future-Extension Architectural Showcase (Simulated Demo Data)</strong>
        </div>
        <p>
          This module demonstrates the prospective federated learning architecture for decentralized epidemic forecasting.
          <strong> All convergence curves, accuracy scores ({lossData[lossData.length - 1].accuracy}), differential privacy parameters (&epsilon;=0.5), and training rounds are simulated demo data.</strong>
          Real edge neural model training, homomorphic ciphertext aggregation, and active differential privacy noise injection are conceptual architecture targets and are not implemented or measured in this client prototype. No live patient health records are collected or transmitted.
        </p>
      </div>

      {/* Banner */}
      <div className="section-header-banner">
        <div>
          <h2>Federated Learning Coordinator (Architectural Showcase)</h2>
          <p>
            Architectural Concept: Collaborative machine learning designed for edge gradient aggregation without centralizing patient records.
            (Current display uses synthetic demonstration parameters).
          </p>
        </div>

        <div className="federated-actions-top">
          {isEvaluationMode && (
            <div className="benchmark-pill pass" title="Target design parameter for future edge gradient clipping">
              <Lock size={14} /> Spec: &epsilon;=0.5, &delta;=10⁻⁵
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSimulateEpoch}
            disabled={isTraining}
          >
            {isTraining ? (
              <>
                <RotateCw size={15} className="animate-spin" /> Simulating FedAvg Aggregation...
              </>
            ) : (
              <>
                <Play size={15} /> Simulate Training Epoch (Demo Visualization — Round {round + 1})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual System Architecture Diagram */}
      <div className="architecture-showcase-card">
        <h3>Proposed End-to-End System Pipeline (Design Architecture)</h3>
        <p className="arch-sub">
          Proposed edge architecture: Local PHC edge nodes would compute gradients from aggregate
          footfall &amp; disease frequencies; the central coordinator would aggregate updates via FedAvg.
        </p>

        <div className="arch-nodes-container">
          {/* Node 1: Local PHC Node */}
          <div className="arch-node-box local">
            <div className="node-box-header">
              <Building size={18} className="text-primary" />
              <span>PHC App / Local Edge Node</span>
            </div>
            <ul className="node-features-list">
              <li>Medicine Stock &amp; Bed Availability</li>
              <li>QR Scanning &amp; Local Offline Storage</li>
              <li>Aggregate Patient Counts (No PII)</li>
              <li>Local SGD Model Weight Computation (Planned)</li>
            </ul>
          </div>

          <div className="arch-connector">
            <div className="connector-line"></div>
            <div className="connector-badge">
              <Lock size={12} /> Target Design: Aggregate Sync
            </div>
            <div className="connector-line"></div>
          </div>

          {/* Node 2: National PHC Platform */}
          <div className="arch-node-box national">
            <div className="node-box-header">
              <Cpu size={18} className="text-indigo" />
              <span>National PHC Platform</span>
            </div>
            <ul className="node-features-list">
              <li>Authentication &amp; Role-based Access</li>
              <li>Real-time Dashboard &amp; Stock Graphs</li>
              <li>Demand Forecasting &amp; Recommender</li>
              <li>Gradient Noise Injection (&epsilon;-DP Target)</li>
            </ul>
          </div>

          <div className="arch-connector">
            <div className="connector-line"></div>
            <div className="connector-badge">
              <ShieldCheck size={12} /> Target Design: Gradient Aggregation
            </div>
            <div className="connector-line"></div>
          </div>

          {/* Node 3: Federated Learning Coordinator */}
          <div className="arch-node-box central">
            <div className="node-box-header">
              <Globe size={18} className="text-emerald" />
              <span>Federated Learning Coordinator</span>
            </div>
            <ul className="node-features-list">
              <li>Multi-Party FedAvg Aggregator (Planned)</li>
              <li>Global Disease Prediction Model</li>
              <li>Cross-District Trend Synthesis</li>
              <li>Model Weight Dissemination to Edge</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Model Convergence & Metrics */}
      <div className="federated-metrics-grid">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h4 className="chart-title">Global Model Loss Convergence (Simulated FedAvg)</h4>
              <p className="chart-subtitle">
                Synthetic loss curve demonstrating expected convergence across {round} simulated rounds
              </p>
            </div>
            <span className="badge badge-success" title="Synthetic visualization metric">
              Simulated Accuracy: {lossData[lossData.length - 1].accuracy} (Demo Data)
            </span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lossData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="round" stroke="#64748b" />
                <YAxis stroke="#64748b" domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(val) => [`${val} (Simulated)`, 'Loss']}
                />
                <Line
                  type="monotone"
                  dataKey="loss"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fl-guarantees-card">
          <h4>Target Privacy &amp; Security Specifications (Roadmap Design)</h4>
          <div className="guarantee-items-list">
            <div className="guarantee-item">
              <ShieldCheck size={20} className="text-emerald" />
              <div>
                <strong>Differential Privacy (&epsilon;-DP Target Specification):</strong>
                <p>
                  Architectural goal: Calibrated Gaussian noise addition to weight gradients prior to transmission, ensuring individual privacy protection.
                </p>
              </div>
            </div>
            <div className="guarantee-item">
              <Lock size={20} className="text-indigo" />
              <div>
                <strong>Homomorphic Encryption (Target Roadmap):</strong>
                <p>
                  Planned architecture: Aggregating updates in ciphertext form so central coordinator computes averages without decrypting individual centre weights.
                </p>
              </div>
            </div>
            <div className="guarantee-item">
              <Globe size={20} className="text-sky" />
              <div>
                <strong>Cross-Jurisdiction Privacy Compliance:</strong>
                <p>
                  Design specification compliant with data residency requirements (operational data remains local to centre; only mathematical model parameters are exchanged).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
