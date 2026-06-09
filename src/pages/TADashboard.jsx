import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";
import { MagBtn, LoadingSpinner, Dot } from "../components/ui";
import T, { SPRING, SPRING_LG, EASE_EXPO } from "../tokens";

// Section routing
const PATH_TO_SECTION = {
  "/ta":           "queue",
  "/ta/progress":  "progress",
  "/ta/completed": "completed",
  "/ta/flagged":   "flagged",
  "/ta/settings":  "settings",
};

const SECTION_META = {
  queue:     { title: "Review Queue",  sub: "AI-graded scripts awaiting your decision"  },
  progress:  { title: "In Progress",   sub: "Scripts you have started reviewing"         },
  completed: { title: "Completed",     sub: "Scripts you have approved or overridden"    },
  flagged:   { title: "Flagged",       sub: "Scripts flagged for senior review"          },
  settings:  { title: "Settings",      sub: "Configure your account and preferences"     },
};

// Mock Data
const MOCK_QUEUE = [
  {
    id: "q1", studentId: "STU-2847", questionRef: "Q3b",
    questionText: "Q3b: Evaluate the definite integral ∫₀^π sin(x) dx and justify each step.",
    rubric: [
      { name: "Antiderivative setup", maxPoints: 3, keywords: ["−cos(x)", "antiderivative", "FTC"] },
      { name: "Limit substitution", maxPoints: 3, keywords: ["cos(π)", "cos(0)", "−(−1)", "−1"] },
      { name: "Final answer", maxPoints: 2, keywords: ["2", "equals 2"] },
      { name: "Justification quality", maxPoints: 2, keywords: ["Fundamental Theorem", "continuity"] },
    ],
    ocrText: "∫₀^π sin(x) dx = [-cos(x)]₀^π\n= -cos(π) - (-cos(0))\n= -(-1) - (-1)\n= 1 + 1\n= 2\n\nBy FTC part 2, since sin(x) is continuous on [0,π], the integral equals the antiderivative evaluated at limits.",
    ocrConfidence: 94.2, aiScore: 9, maxScore: 10,
    aiJustification: "Student correctly identifies −cos(x) as the antiderivative and applies the Fundamental Theorem of Calculus. Limit substitution is accurate. Minor deduction: justification omits explicit mention of continuity requirement for FTC Part 2 application.",
    rubricMatch: [
      { name: "Antiderivative setup", awarded: 3, max: 3, status: "full" },
      { name: "Limit substitution", awarded: 3, max: 3, status: "full" },
      { name: "Final answer", awarded: 2, max: 2, status: "full" },
      { name: "Justification quality", awarded: 1, max: 2, status: "partial" },
    ],
    confidence: 91, status: "pending", timeAgo: "2 min ago", similarityFlag: null,
  },
  {
    id: "q2", studentId: "STU-1193", questionRef: "Q2a",
    questionText: "Q2a: Find the eigenvalues of the matrix A = [[3, 1], [0, 2]] and state their geometric multiplicity.",
    rubric: [
      { name: "Characteristic polynomial", maxPoints: 3, keywords: ["det(A−λI)", "λ²−5λ+6", "(λ−3)(λ−2)"] },
      { name: "Eigenvalue identification", maxPoints: 2, keywords: ["λ=3", "λ=2"] },
      { name: "Geometric multiplicity", maxPoints: 3, keywords: ["dim(null)", "eigenspace", "multiplicity 1"] },
      { name: "Notation correctness", maxPoints: 2, keywords: ["geom mult", "algebraic", "triangular"] },
    ],
    ocrText: "det(A - λI) = (3-λ)(2-λ) = λ² - 5λ + 6 = (λ-3)(λ-2)\nEigenvalues: λ₁ = 3, λ₂ = 2\nFor λ=3: gm=1\nFor λ=2: gm=1",
    ocrConfidence: 88.7, aiScore: 9, maxScore: 10,
    aiJustification: "Characteristic polynomial correctly derived. Both eigenvalues correctly identified. Geometric multiplicities computed correctly. Minor notation inconsistency: student writes 'gm' without defining the abbreviation.",
    rubricMatch: [
      { name: "Characteristic polynomial", awarded: 3, max: 3, status: "full" },
      { name: "Eigenvalue identification", awarded: 2, max: 2, status: "full" },
      { name: "Geometric multiplicity", awarded: 3, max: 3, status: "full" },
      { name: "Notation correctness", awarded: 1, max: 2, status: "partial" },
    ],
    confidence: 85, status: "pending", timeAgo: "5 min ago",
    similarityFlag: { count: 3, papers: ["STU-0412", "STU-2203", "STU-3301"] },
  },
  {
    id: "q3", studentId: "STU-3301", questionRef: "Q4c",
    questionText: "Q4c: Apply the Divergence Theorem to compute ∬_S F·dS where F = (x², y², z²) over the unit cube [0,1]³.",
    rubric: [
      { name: "Divergence computation", maxPoints: 3, keywords: ["div F", "2x+2y+2z", "∂F/∂x"] },
      { name: "Volume integral setup", maxPoints: 3, keywords: ["∫∫∫", "[0,1]³", "dV"] },
      { name: "Evaluation", maxPoints: 3, keywords: ["2", "correct integral", "iterated"] },
      { name: "Theorem statement", maxPoints: 1, keywords: ["Gauss", "divergence theorem", "closed surface"] },
    ],
    ocrText: "div F = 2x + 2y + 2z\nBy Divergence Theorem:\n∬_S F·dS = ∫∫∫_V div F dV = ∫₀¹∫₀¹∫₀¹ (2x+2y+2z) dz dy dx = 3",
    ocrConfidence: 76.4, aiScore: 10, maxScore: 10,
    aiJustification: "Perfect solution. Divergence computed correctly. Divergence theorem invoked with proper statement. Triple integral evaluated correctly. Final answer of 3 is correct.",
    rubricMatch: [
      { name: "Divergence computation", awarded: 3, max: 3, status: "full" },
      { name: "Volume integral setup", awarded: 3, max: 3, status: "full" },
      { name: "Evaluation", awarded: 3, max: 3, status: "full" },
      { name: "Theorem statement", awarded: 1, max: 1, status: "full" },
    ],
    confidence: 97, status: "pending", timeAgo: "8 min ago", similarityFlag: null,
  },
  {
    id: "q4", studentId: "STU-0412", questionRef: "Q1a",
    questionText: "Q1a: State and prove the Cauchy-Schwarz inequality for inner product spaces.",
    rubric: [
      { name: "Inequality statement", maxPoints: 2, keywords: ["|⟨u,v⟩|²", "≤", "‖u‖²‖v‖²"] },
      { name: "Proof setup", maxPoints: 3, keywords: ["consider", "‖u−tv‖", "quadratic in t"] },
      { name: "Discriminant argument", maxPoints: 3, keywords: ["b²−4ac≤0", "discriminant", "non-negative"] },
      { name: "Equality condition", maxPoints: 2, keywords: ["linearly dependent", "t₀", "equality iff"] },
    ],
    ocrText: "Statement: |⟨u,v⟩|² ≤ ‖u‖²‖v‖²\nProof: For t ∈ ℝ, consider f(t) = ‖u - tv‖² ≥ 0\nDiscriminant ≤ 0: hence |⟨u,v⟩|² ≤ ‖u‖²‖v‖²\n[Equality condition not addressed]",
    ocrConfidence: 91.1, aiScore: 7, maxScore: 10,
    aiJustification: "Statement is correct. Proof via discriminant argument is valid. However, equality condition is completely absent — student does not address when equality holds (u and v linearly dependent). This costs 2 full marks.",
    rubricMatch: [
      { name: "Inequality statement", awarded: 2, max: 2, status: "full" },
      { name: "Proof setup", awarded: 3, max: 3, status: "full" },
      { name: "Discriminant argument", awarded: 2, max: 3, status: "partial" },
      { name: "Equality condition", awarded: 0, max: 2, status: "none" },
    ],
    confidence: 55, status: "flagged", timeAgo: "12 min ago",
    similarityFlag: { count: 3, papers: ["STU-1193", "STU-2203", "STU-3301"] },
  },
  {
    id: "q5", studentId: "STU-5571", questionRef: "Q2b",
    questionText: "Q2b: Using Lagrange multipliers, find the extrema of f(x,y) = x²+y² subject to x+y−1 = 0.",
    rubric: [
      { name: "Lagrangian setup", maxPoints: 3, keywords: ["∇f = λ∇g", "2x=λ", "2y=λ"] },
      { name: "System solution", maxPoints: 3, keywords: ["x=y=1/2", "λ=1"] },
      { name: "Extremum classification", maxPoints: 2, keywords: ["minimum", "f=1/2"] },
      { name: "Boundary analysis", maxPoints: 2, keywords: ["no maximum", "unbounded"] },
    ],
    ocrText: "∇f = λ∇g → 2x=λ, 2y=λ → x=y\nx+y=1 → x=y=1/2, λ=1\nf(1/2,1/2)=1/2 ← minimum\nNo maximum since f is unbounded along constraint.",
    ocrConfidence: 89.3, aiScore: 10, maxScore: 10,
    aiJustification: "Flawless application of Lagrange multipliers. All steps correct. Minimum correctly identified. Boundary analysis complete.",
    rubricMatch: [
      { name: "Lagrangian setup", awarded: 3, max: 3, status: "full" },
      { name: "System solution", awarded: 3, max: 3, status: "full" },
      { name: "Extremum classification", awarded: 2, max: 2, status: "full" },
      { name: "Boundary analysis", awarded: 2, max: 2, status: "full" },
    ],
    confidence: 98, status: "completed", timeAgo: "15 min ago", similarityFlag: null,
  },
];

// Helpers
const confidenceColor = (c) => c >= 80 ? T.emerald : c >= 60 ? "#f59e0b" : T.red;
const confidenceBg    = (c) => c >= 80 ? T.emeraldDim : c >= 60 ? "rgba(245,158,11,0.10)" : "rgba(248,113,113,0.10)";
const statusColor = { pending: T.text2, flagged: "#f59e0b", completed: T.emerald };
const statusLabel = { pending: "Pending", flagged: "Flagged", completed: "Done" };
const matchColors = { full: T.emerald, partial: "#f59e0b", none: T.red };

// Toast
const Toast = ({ message, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
      transition={SPRING}
      style={{
        position: "fixed", top: 24, right: 24, zIndex: 1000,
        background: T.surface, border: `1px solid ${T.borderMid}`,
        borderRadius: 10, padding: "12px 18px 12px 14px",
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5)`, minWidth: 280,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: "0 2px 2px 0", background: T.emerald, boxShadow: `0 0 8px ${T.emeraldGlow}` }} />
      <div style={{ paddingLeft: 6 }}>
        <div style={{ fontSize: 13, color: T.text1, fontFamily: "Geist, sans-serif", fontWeight: 500 }}>{message}</div>
        <div style={{ fontSize: 11, color: T.text3, fontFamily: "Geist Mono, monospace", marginTop: 2 }}>Auto-advancing in 0.8s</div>
      </div>
    </motion.div>
  );
};

// Queue Item
const QueueItem = ({ item, selected, onClick, sessionStatuses }) => {
  const liveStatus = sessionStatuses[item.id] || item.status;
  return (
    <motion.div
      layout onClick={onClick}
      whileHover={{ backgroundColor: selected ? T.cyanDim : T.surfaceHigh }}
      whileTap={{ scale: 0.99 }}
      style={{
        padding: "12px 14px", cursor: "pointer",
        background: selected ? T.cyanDim : "transparent",
        boxShadow: selected ? `inset 2px 0 0 ${T.cyan}` : "none",
        transition: "background 0.15s, box-shadow 0.15s",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 13, fontWeight: 600, color: selected ? T.cyan : T.text1 }}>
          {item.studentId}
        </span>
        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, fontWeight: 700, color: confidenceColor(item.confidence), background: confidenceBg(item.confidence), borderRadius: 4, padding: "2px 6px" }}>
          {item.confidence}%
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: T.text2 }}>
          {item.questionRef} — {item.questionText.split(":")[1]?.split(" ").slice(0, 3).join(" ") ?? ""}...
        </span>
        <span style={{ fontSize: 10, fontFamily: "Geist Mono, monospace", color: liveStatus === "pending" ? T.text3 : statusColor[liveStatus] }}>
          {liveStatus !== "pending" ? statusLabel[liveStatus] : item.timeAgo}
        </span>
      </div>
    </motion.div>
  );
};

// Section Wrapper 
function Section({ label, title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, fontWeight: 700, color: T.cyan, background: T.cyanDim, borderRadius: 4, padding: "3px 7px", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: T.text3, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>
      {children}
    </div>
  );
}

// Section views
const sectionTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { ...SPRING_LG } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.18 } },
};

const rowStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const rowItem    = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { ...SPRING } } };

function SectionProgress({ items, sessionStatuses }) {
  const inProgress = items.filter((i) => (sessionStatuses[i.id] || i.status) === "pending");
  return (
    <motion.div key="progress" {...sectionTransition}>
      {inProgress.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 16 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" stroke={T.text3} strokeWidth="1.5"/><path d="M24 16v8l5 3" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round"/></svg>
          <div style={{ fontSize: 14, color: T.text3, textAlign: "center" }}>No scripts currently in progress</div>
        </div>
      ) : (
        <motion.div variants={rowStagger} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {inProgress.map((item) => (
            <motion.div key={item.id} variants={rowItem}
              style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <div>
                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 13, fontWeight: 700, color: T.cyan, marginBottom: 4 }}>{item.studentId}</div>
                <div style={{ fontSize: 12, color: T.text2 }}>{item.questionRef} — {item.questionText.slice(0, 60)}...</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: T.text3 }}>{item.timeAgo}</span>
                <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, fontWeight: 700,
                  color: item.confidence >= 80 ? T.emerald : item.confidence >= 60 ? "#f59e0b" : T.red,
                  backgroundColor: item.confidence >= 80 ? T.emeraldDim : item.confidence >= 60 ? "rgba(245,158,11,0.10)" : "rgba(248,113,113,0.10)",
                  borderRadius: 4, padding: "2px 8px" }}>{item.confidence}%</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

function SectionCompleted({ items, sessionStatuses }) {
  const done = items.filter((i) => (sessionStatuses[i.id] || i.status) === "completed");
  return (
    <motion.div key="completed" {...sectionTransition}>
      {done.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 16 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="18" stroke={T.text3} strokeWidth="1.5"/><polyline points="16 24 21 29 32 18" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div style={{ fontSize: 14, color: T.text3, textAlign: "center" }}>No completed reviews yet this session</div>
        </div>
      ) : (
        <motion.div variants={rowStagger} initial="hidden" animate="visible" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Student ID","Question","AI Score","Your Decision","Confidence"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text3, fontFamily: "Geist Mono, monospace", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={rowStagger} initial="hidden" animate="visible">
              {done.map((item) => (
                <motion.tr key={item.id} variants={rowItem} whileHover={{ backgroundColor: T.surfaceHigh }} style={{ transition: "background-color 0.15s" }}>
                  <td style={{ padding: "13px 20px", fontFamily: "Geist Mono, monospace", fontSize: 13, color: T.cyan, fontWeight: 600 }}>{item.studentId}</td>
                  <td style={{ padding: "13px 20px", fontSize: 12, color: T.text2 }}>{item.questionRef}</td>
                  <td style={{ padding: "13px 20px", fontFamily: "Geist Mono, monospace", fontSize: 13, color: T.text1, fontWeight: 700 }}>{item.aiScore}/{item.maxScore}</td>
                  <td style={{ padding: "13px 20px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "Geist Mono, monospace", color: T.emerald, backgroundColor: T.emeraldDim, border: `1px solid rgba(52,211,153,0.18)`, borderRadius: 5, padding: "2px 8px" }}>APPROVED</span>
                  </td>
                  <td style={{ padding: "13px 20px", fontFamily: "Geist Mono, monospace", fontSize: 12,
                    color: item.confidence >= 80 ? T.emerald : item.confidence >= 60 ? "#f59e0b" : T.red }}>{item.confidence}%</td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}

function SectionFlagged({ items, sessionStatuses }) {
  const flagged = items.filter((i) => (sessionStatuses[i.id] || i.status) === "flagged");
  return (
    <motion.div key="flagged" {...sectionTransition}>
      {flagged.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 16 }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M12 40V14s4-4 12-4 12 4 12 4v16s-4-4-12-4-12 4-12 4" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div style={{ fontSize: 14, color: T.text3, textAlign: "center" }}>No flagged scripts this session</div>
        </div>
      ) : (
        <motion.div variants={rowStagger} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {flagged.map((item) => (
            <motion.div key={item.id} variants={rowItem}
              style={{ backgroundColor: T.surface, border: `1px solid rgba(245,158,11,0.22)`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>{item.studentId}</div>
                  <div style={{ fontSize: 12, color: T.text2 }}>{item.questionRef} — {item.questionText.slice(0, 70)}...</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "Geist Mono, monospace", color: "#f59e0b", backgroundColor: "rgba(245,158,11,0.10)", border: `1px solid rgba(245,158,11,0.22)`, borderRadius: 5, padding: "2px 8px", flexShrink: 0 }}>FLAGGED</span>
              </div>
              {item.similarityFlag && (
                <div style={{ fontSize: 12, color: T.text3, fontFamily: "Geist Mono, monospace" }}>
                  Similar to: {item.similarityFlag.papers.join(", ")}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

// Main Component
export default function TADashboard() {
  const navigate = useNavigate();
  const [activeRoute,      setActiveRoute]      = useState("/ta");
  const [selectedId,       setSelectedId]       = useState(null);
  const [filter,           setFilter]           = useState("All");
  const [sessionStatuses,  setSessionStatuses]  = useState({});
  const [overrideOpen,     setOverrideOpen]     = useState(false);
  const [overrideScore,    setOverrideScore]    = useState("");
  const [overrideReason,   setOverrideReason]   = useState("");
  const [loading,          setLoading]          = useState(null);
  const [toast,            setToast]            = useState(null);
  const [sessionReviewed,  setSessionReviewed]  = useState(0);
  const [contentKey,       setContentKey]       = useState(0);
  const [screenW,          setScreenW]          = useState(typeof window !== "undefined" ? window.innerWidth : 1280);

  useEffect(() => {
    const h = () => setScreenW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const isMobile   = screenW < 768;
  const isTablet   = screenW >= 768 && screenW < 1024;
  const sidebarW   = isMobile ? 0 : isTablet ? 60 : 220;

  const filteredQueue = MOCK_QUEUE.filter((item) => {
    const liveStatus = sessionStatuses[item.id] || item.status;
    if (filter === "All") return true;
    return liveStatus.toLowerCase() === filter.toLowerCase();
  });

  const selectedItem  = MOCK_QUEUE.find((i) => i.id === selectedId) ?? null;
  const selectedIndex = filteredQueue.findIndex((i) => i.id === selectedId);
  const totalVisible  = filteredQueue.length;
  const totalSession  = MOCK_QUEUE.length;

  const selectItem = useCallback((item) => {
    setSelectedId(item.id);
    setOverrideOpen(false);
    setOverrideScore(String(item.aiScore));
    setOverrideReason("");
    setContentKey((k) => k + 1);
  }, []);

  const nextItem = useCallback(() => {
    const idx  = filteredQueue.findIndex((i) => i.id === selectedId);
    const next = filteredQueue[idx + 1];
    if (next) selectItem(next);
  }, [filteredQueue, selectedId, selectItem]);

  const prevItem = useCallback(() => {
    const idx  = filteredQueue.findIndex((i) => i.id === selectedId);
    const prev = filteredQueue[idx - 1];
    if (prev) selectItem(prev);
  }, [filteredQueue, selectedId, selectItem]);

  const handleAction = useCallback(async (type) => {
    if (!selectedItem || loading) return;
    setLoading(type);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(null);
    setSessionStatuses((prev) => ({
      ...prev,
      [selectedItem.id]: type === "flag" ? "flagged" : "completed",
    }));
    setSessionReviewed((n) => n + 1);
    setToast(type === "approve" ? "Decision approved — moving to next item" : type === "override" ? "Override saved — moving to next item" : "Flagged for senior review");
    setOverrideOpen(false);
    setTimeout(() => nextItem(), 800);
  }, [selectedItem, loading, nextItem]);

  const handleApprove = useCallback(() => handleAction("approve"), [handleAction]);
  const handleFlag    = useCallback(() => handleAction("flag"),    [handleAction]);

  const handleOverrideSubmit = useCallback(() => {
    if (!overrideReason.trim()) return;
    handleAction("override");
  }, [overrideReason, handleAction]);

  const toggleOverride = useCallback(() => {
    setOverrideOpen((v) => !v);
    if (selectedItem) setOverrideScore(String(selectedItem.aiScore));
  }, [selectedItem]);

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "a" || e.key === "A") handleApprove();
      if (e.key === "o" || e.key === "O") toggleOverride();
      if (e.key === "f" || e.key === "F") handleFlag();
      if (e.key === "ArrowRight") nextItem();
      if (e.key === "ArrowLeft")  prevItem();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleApprove, handleFlag, toggleOverride, nextItem, prevItem]);

  useEffect(() => {
    if (filteredQueue.length > 0 && !filteredQueue.find((i) => i.id === selectedId)) {
      selectItem(filteredQueue[0]);
    }
  }, [filter]);

  const progressPct = totalSession > 0 ? (sessionReviewed / totalSession) * 100 : 0;

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: T.bg, fontFamily: "Geist, sans-serif", color: T.text1, overflow: "hidden" }}>

      {/* Sidebar */}
      <Sidebar activeRoute={activeRoute} onNavigate={(path) => {
        setActiveRoute(path);
        navigate(path, { replace: true });
      }} />

      {/* Content — offset by sidebar width */}
      <div style={{ display: "flex", flex: 1, marginLeft: sidebarW, overflow: "hidden", height: "100dvh", flexDirection: "column" }}>

        {/* ── Top bar (non-queue sections) ── */}
        {PATH_TO_SECTION[activeRoute] !== "queue" && (
          <div style={{ height: 56, backgroundColor: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", flexShrink: 0 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.text1, letterSpacing: "-0.02em" }}>{SECTION_META[PATH_TO_SECTION[activeRoute] || "queue"].title}</div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{SECTION_META[PATH_TO_SECTION[activeRoute] || "queue"].sub}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Dot color={T.emerald} />
              <span style={{ fontSize: 12, color: T.text3, fontFamily: "Geist Mono, monospace" }}>Live</span>
            </div>
          </div>
        )}

        {/* ── Section rendering ── */}
        <AnimatePresence mode="wait">
          {PATH_TO_SECTION[activeRoute] === "queue" && (
            <motion.div key="queue" style={{ display: "flex", flex: 1, overflow: "hidden", height: "100%" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

              {/* Queue Panel */}
              <div style={{ width: 280, minWidth: 280, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
                <div style={{ padding: "18px 16px 12px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.text1, letterSpacing: "-0.01em" }}>Review Queue</span>
                    <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, fontWeight: 700, color: T.cyan, background: T.cyanDim, borderRadius: 5, padding: "3px 8px" }}>
                      {MOCK_QUEUE.filter((i) => (sessionStatuses[i.id] || i.status) === "pending").length} pending
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 8, padding: 3 }}>
                    {["All", "Pending", "Flagged", "Completed"].map((tab) => (
                      <button key={tab} onClick={() => setFilter(tab)} style={{ flex: 1, padding: "5px 0", fontSize: 11, fontFamily: "Geist Mono, monospace", fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", background: filter === tab ? T.cyanDim : "transparent", color: filter === tab ? T.cyan : T.text3, transition: "all 0.15s" }}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
                  <AnimatePresence>
                    {filteredQueue.map((item) => (
                      <QueueItem key={item.id} item={item} selected={item.id === selectedId} onClick={() => selectItem(item)} sessionStatuses={sessionStatuses} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right grading panel */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: T.bg }}>
                <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: T.text3, whiteSpace: "nowrap" }}>Session progress</span>
                  <div style={{ flex: 1, height: 2, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                    <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.6, ease: EASE_EXPO }} style={{ height: "100%", background: T.cyan, boxShadow: `0 0 6px ${T.cyanGlow}`, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: T.text2, whiteSpace: "nowrap" }}>{sessionReviewed} / {totalSession} reviewed</span>
                </div>

                {!selectedItem ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="6" y="10" width="36" height="30" rx="4" stroke={T.text3} strokeWidth="1.5" />
                      <path d="M14 20h20M14 27h14" stroke={T.text3} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div style={{ textAlign: "center", maxWidth: 260 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.text2, marginBottom: 6 }}>Select an item to begin reviewing</div>
                      <div style={{ fontSize: 12, color: T.text3 }}>Press [→] to jump to the first pending item</div>
                    </div>
                    <MagBtn variant="primary" size="md" onClick={() => filteredQueue.length > 0 && selectItem(filteredQueue[0])}>Start from top</MagBtn>
                  </div>
                ) : (
                  <>
                    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 14, fontWeight: 700, color: T.cyan }}>{selectedItem.studentId}</span>
                        <span style={{ fontSize: 12, color: T.text3 }}>·</span>
                        <span style={{ fontSize: 13, color: T.text2 }}>Advanced Mathematics — Midterm II</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: T.text3 }}>{selectedIndex + 1} of {totalVisible}</span>
                        {[{ label: "←", fn: prevItem, disabled: selectedIndex === 0 }, { label: "→", fn: nextItem, disabled: selectedIndex === totalVisible - 1 }].map(({ label, fn, disabled }) => (
                          <motion.button key={label} onClick={fn} whileHover={{ scale: disabled ? 1 : 1.05 }} whileTap={{ scale: disabled ? 1 : 0.95 }} disabled={disabled}
                            style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${disabled ? T.border : T.borderMid}`, background: "transparent", cursor: disabled ? "not-allowed" : "pointer", color: disabled ? T.text3 : T.text1, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Geist Mono, monospace" }}>
                            {label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "20px 24px 40px" }}>
                      <AnimatePresence mode="wait">
                        <motion.div key={contentKey} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>

                          <Section label="A" title="Question & Rubric">
                            <div style={{ fontSize: 15, color: T.text1, fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>{selectedItem.questionText}</div>
                            <div style={{ borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 1fr", padding: "7px 12px", background: T.surfaceHigh, borderBottom: `1px solid ${T.border}` }}>
                                {["Criterion", "Pts", "Keywords"].map((h) => (
                                  <span key={h} style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{h}</span>
                                ))}
                              </div>
                              {selectedItem.rubric.map((r, i) => (
                                <div key={r.name} style={{ display: "grid", gridTemplateColumns: "1fr 70px 1fr", padding: "9px 12px", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", borderBottom: i < selectedItem.rubric.length - 1 ? `1px solid ${T.border}` : "none" }}>
                                  <span style={{ fontSize: 12, color: T.text1 }}>{r.name}</span>
                                  <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 12, color: T.text2 }}>{r.maxPoints}</span>
                                  <span style={{ fontSize: 11, color: T.text3, fontFamily: "Geist Mono, monospace" }}>{r.keywords.join(", ")}</span>
                                </div>
                              ))}
                            </div>
                          </Section>

                          <Section label="B" title="Student's Answer">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                              <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase" }}>Extracted Answer</span>
                              <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, fontWeight: 700, color: selectedItem.ocrConfidence >= 80 ? T.emerald : selectedItem.ocrConfidence >= 60 ? "#f59e0b" : T.red, background: selectedItem.ocrConfidence >= 80 ? T.emeraldDim : selectedItem.ocrConfidence >= 60 ? "rgba(245,158,11,0.10)" : "rgba(248,113,113,0.10)", borderRadius: 4, padding: "2px 7px" }}>OCR {selectedItem.ocrConfidence}%</span>
                            </div>
                            <pre style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14, fontFamily: "Geist Mono, monospace", fontSize: 12, color: T.text1, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>
                              {selectedItem.ocrText}
                            </pre>
                          </Section>

                          <Section label="C" title="AI Grading Decision">
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Awarded</div>
                                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 36, fontWeight: 700, color: T.cyan, lineHeight: 1 }}>
                                  {selectedItem.aiScore}<span style={{ fontSize: 18, color: T.text3 }}> / {selectedItem.maxScore}</span>
                                </div>
                              </div>
                              <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>AI Confidence</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                                    <div style={{ width: `${selectedItem.confidence}%`, height: "100%", background: selectedItem.confidence >= 80 ? T.emerald : selectedItem.confidence >= 60 ? "#f59e0b" : T.red, borderRadius: 2 }} />
                                  </div>
                                  <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 12, fontWeight: 700, color: selectedItem.confidence >= 80 ? T.emerald : selectedItem.confidence >= 60 ? "#f59e0b" : T.red }}>{selectedItem.confidence}%</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.65, marginBottom: 16, padding: "12px 14px", background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
                              {selectedItem.aiJustification}
                            </div>
                            <div style={{ borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: selectedItem.similarityFlag ? 12 : 0 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 80px", padding: "7px 12px", background: T.surfaceHigh, borderBottom: `1px solid ${T.border}` }}>
                                {["Criterion", "Pts", "Max", "Status"].map((h) => (
                                  <span key={h} style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{h}</span>
                                ))}
                              </div>
                              {selectedItem.rubricMatch.map((r, i) => (
                                <div key={r.name} style={{ display: "grid", gridTemplateColumns: "1fr 50px 50px 80px", padding: "9px 12px", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", borderBottom: i < selectedItem.rubricMatch.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center" }}>
                                  <span style={{ fontSize: 12, color: T.text1 }}>{r.name}</span>
                                  <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 12, color: matchColors[r.status], fontWeight: 700 }}>{r.awarded}</span>
                                  <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 12, color: T.text3 }}>{r.max}</span>
                                  <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, fontWeight: 700, color: matchColors[r.status], background: r.status === "full" ? T.emeraldDim : r.status === "partial" ? "rgba(245,158,11,0.10)" : "rgba(248,113,113,0.10)", borderRadius: 4, padding: "2px 7px", textTransform: "uppercase", display: "inline-block" }}>{r.status}</span>
                                </div>
                              ))}
                            </div>
                            {selectedItem.similarityFlag && (
                              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(245,158,11,0.07)", border: `1px solid rgba(245,158,11,0.20)`, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5L14.5 13H1.5L8 1.5Z" stroke="#f59e0b" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 6v3.5M8 11h.01" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round" /></svg>
                                <span style={{ fontSize: 12, color: "#f59e0b" }}>Similar logic in <strong>{selectedItem.similarityFlag.count}</strong> other papers — <span style={{ fontFamily: "Geist Mono, monospace", fontSize: 11 }}>{selectedItem.similarityFlag.papers.join(", ")}</span></span>
                              </div>
                            )}
                          </Section>

                          <Section label="D" title="TA Decision">
                            <AnimatePresence>
                              {overrideOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING_LG} style={{ overflow: "hidden" }}>
                                  <div style={{ padding: 14, background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 8, marginBottom: 16 }}>
                                    <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 10, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Override Score</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setOverrideScore((s) => String(Math.max(0, Number(s) - 1)))}
                                        style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${T.borderMid}`, background: T.surfaceHigh, color: T.text1, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</motion.button>
                                      <div style={{ minWidth: 70, textAlign: "center", fontFamily: "Geist Mono, monospace", fontSize: 22, fontWeight: 700, color: T.cyan }}>
                                        {overrideScore}<span style={{ fontSize: 13, color: T.text3 }}>/{selectedItem.maxScore}</span>
                                      </div>
                                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setOverrideScore((s) => String(Math.min(selectedItem.maxScore, Number(s) + 1)))}
                                        style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${T.borderMid}`, background: T.surfaceHigh, color: T.text1, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</motion.button>
                                    </div>
                                    <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Override reason (required)..." rows={3}
                                      style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: "10px 12px", fontFamily: "Geist, sans-serif", fontSize: 13, color: T.text1, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.55 }}
                                      onFocus={(e) => (e.target.style.borderColor = T.cyan)}
                                      onBlur={(e) => (e.target.style.borderColor = T.border)} />
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <MagBtn variant="primary" size="md" onClick={overrideOpen ? handleOverrideSubmit : handleApprove}>
                                {loading === "approve" || (overrideOpen && loading === "override") ? <LoadingSpinner /> : overrideOpen ? "Submit Override" : "Approve"}
                              </MagBtn>
                              {!overrideOpen && <MagBtn variant="white" size="md" onClick={toggleOverride}>Override</MagBtn>}
                              {overrideOpen  && <MagBtn variant="ghost" size="md" onClick={toggleOverride}>Cancel</MagBtn>}
                              <MagBtn variant="danger" size="md" onClick={handleFlag}>
                                {loading === "flag" ? <LoadingSpinner /> : "Flag for Review"}
                              </MagBtn>
                            </div>
                            <div style={{ marginTop: 12, fontFamily: "Geist Mono, monospace", fontSize: 11, color: T.text3, display: "flex", gap: 16, flexWrap: "wrap" }}>
                              {[["A","Approve"],["O","Override"],["F","Flag"],["→","Next"],["←","Prev"]].map(([key, label]) => (
                                <span key={key}>
                                  <span style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: "1px 5px", fontSize: 10, color: T.text2, background: T.surface }}>{key}</span> {label}
                                </span>
                              ))}
                            </div>
                          </Section>

                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {PATH_TO_SECTION[activeRoute] === "progress" && (
            <div key="progress" style={{ flex: 1, overflowY: "auto", padding: 28 }}>
              <SectionProgress items={MOCK_QUEUE} sessionStatuses={sessionStatuses} />
            </div>
          )}

          {PATH_TO_SECTION[activeRoute] === "completed" && (
            <div key="completed" style={{ flex: 1, overflowY: "auto", padding: 28 }}>
              <SectionCompleted items={MOCK_QUEUE} sessionStatuses={sessionStatuses} />
            </div>
          )}

          {PATH_TO_SECTION[activeRoute] === "flagged" && (
            <div key="flagged" style={{ flex: 1, overflowY: "auto", padding: 28 }}>
              <SectionFlagged items={MOCK_QUEUE} sessionStatuses={sessionStatuses} />
            </div>
          )}

          {PATH_TO_SECTION[activeRoute] === "settings" && (
            <motion.div key="settings" {...sectionTransition} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.text3, fontSize: 14 }}>
              Settings coming soon.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast} message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}