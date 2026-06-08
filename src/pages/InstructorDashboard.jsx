import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import T, { SPRING, SPRING_LG, EASE_EXPO } from "../tokens";
import { MagBtn, FLInput, FLSelect, LoadingSpinner, Dot } from "../components/ui";
import { UserContext } from "../context/UserContext";
import Sidebar from "../components/Sidebar";

/* ══════════════════════════════════════════════════════════════
   INLINE ICONS
══════════════════════════════════════════════════════════════ */
const Ico = {
  Upload: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  Trend: ({ up }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={up ? T.emerald : T.red} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {up ? <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/> : <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>}
      {up ? <polyline points="17 6 23 6 23 12"/> : <polyline points="17 18 23 18 23 12"/>}
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  X: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Check: ({ color }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color || T.emerald} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Copy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Edit: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  Filter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  Release: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Chevron: ({ dir = "down" }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: dir === "up" ? "rotate(180deg)" : "none" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

/* ══════════════════════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════════════════════ */
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

function useBreakpoint() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 768, isTablet: w >= 768 && w < 1024 };
}

/* ══════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════ */
const MOCK_EXAMS = [
  { id: 1, name: "CS301 – Midterm Exam",       uploaded: "Jun 04, 2026", scripts: 182, graded: 182, status: "Completed" },
  { id: 2, name: "MATH201 – Linear Algebra",   uploaded: "Jun 05, 2026", scripts: 210, graded: 147, status: "In Review" },
  { id: 3, name: "PHY101 – Mechanics Final",   uploaded: "Jun 06, 2026", scripts: 96,  graded: 31,  status: "Processing" },
  { id: 4, name: "CS401 – Algorithms Quiz 3",  uploaded: "Jun 07, 2026", scripts: 64,  graded: 64,  status: "Released"  },
  { id: 5, name: "ECON101 – Micro Economics",  uploaded: "Jun 07, 2026", scripts: 145, graded: 0,   status: "Processing" },
];

const MOCK_RUBRICS = [
  { id: 1, name: "CS301 Standard Rubric",     questions: 8,  modified: "Jun 03, 2026", exams: 3 },
  { id: 2, name: "Math Proof Evaluator",       questions: 5,  modified: "May 28, 2026", exams: 2 },
  { id: 3, name: "Physics Short Answer",       questions: 12, modified: "Jun 01, 2026", exams: 1 },
  { id: 4, name: "Essay & Argument Rubric",    questions: 6,  modified: "May 22, 2026", exams: 4 },
];

const MOCK_GRADES = [
  { id: "STU-0041", exam: "CS301 – Midterm",      score: 87, max: 100, released: true  },
  { id: "STU-0082", exam: "CS301 – Midterm",      score: 54, max: 100, released: true  },
  { id: "STU-0113", exam: "MATH201 – Lin. Alg.",  score: 91, max: 100, released: false },
  { id: "STU-0124", exam: "MATH201 – Lin. Alg.",  score: 43, max: 100, released: false },
  { id: "STU-0057", exam: "CS301 – Midterm",      score: 76, max: 100, released: true  },
  { id: "STU-0198", exam: "CS401 – Algo Quiz 3",  score: 95, max: 100, released: true  },
  { id: "STU-0203", exam: "CS401 – Algo Quiz 3",  score: 62, max: 100, released: false },
  { id: "STU-0211", exam: "MATH201 – Lin. Alg.",  score: 38, max: 100, released: false },
];

const MOCK_AUDIT = [
  { id: 1, ts: "2026-06-07 22:41", actor: "dr.adeyemi@uni.edu",    type: "RELEASED",   desc: "Released grades for CS301 – Midterm Exam (182 scripts)" },
  { id: 2, ts: "2026-06-07 19:08", actor: "ta.priya@uni.edu",      type: "OVERRIDDEN", desc: "Overrode AI score for STU-0082 Q4 — from 6/10 to 8/10" },
  { id: 3, ts: "2026-06-07 17:22", actor: "ta.raj@uni.edu",        type: "FLAGGED",    desc: "Flagged STU-0113 Q2 for plagiarism similarity 94%" },
  { id: 4, ts: "2026-06-06 14:55", actor: "dr.adeyemi@uni.edu",    type: "UPLOADED",   desc: "Uploaded PHY101 – Mechanics Final (96 scripts)" },
  { id: 5, ts: "2026-06-06 11:30", actor: "system",                type: "GRADED",     desc: "AI grading completed MATH201 – Linear Algebra batch 2/3" },
  { id: 6, ts: "2026-06-05 09:10", actor: "dr.adeyemi@uni.edu",    type: "UPLOADED",   desc: "Uploaded MATH201 – Linear Algebra (210 scripts)" },
  { id: 7, ts: "2026-06-04 16:44", actor: "ta.priya@uni.edu",      type: "OVERRIDDEN", desc: "Overrode AI score for STU-0041 Q7 — from 9/10 to 10/10" },
  { id: 8, ts: "2026-06-04 08:00", actor: "system",                type: "GRADED",     desc: "AI grading completed CS301 – Midterm Exam (182 scripts)" },
];

const RUBRIC_PLACEHOLDER = `{
  "exam": "CS301 Midterm",
  "questions": [
    {
      "id": "Q1",
      "text": "Explain time complexity of quicksort.",
      "points": 10,
      "keywords": ["O(n log n)", "average case", "pivot"],
      "partial_credit": true
    },
    {
      "id": "Q2",
      "text": "Define a binary search tree.",
      "points": 8,
      "keywords": ["left subtree", "right subtree", "ordering"],
      "partial_credit": true
    }
  ]
}`;

/* ══════════════════════════════════════════════════════════════
   SMALL SHARED COMPONENTS
══════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status }) => {
  const map = {
    Processing: { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)" },
    "In Review": { color: T.cyan,    bg: T.cyanDim,               border: "rgba(34,211,238,0.18)"  },
    Completed:  { color: T.emerald,  bg: T.emeraldDim,            border: "rgba(52,211,153,0.18)"  },
    Released:   { color: T.text3,    bg: "rgba(69,85,95,0.15)",   border: T.border                 },
  };
  const s = map[status] || map["Released"];
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, fontFamily: "Geist Mono, monospace",
      letterSpacing: "0.07em", color: s.color, backgroundColor: s.bg,
      border: `1px solid ${s.border}`, borderRadius: "5px", padding: "2px 8px",
      whiteSpace: "nowrap",
    }}>
      {status.toUpperCase()}
    </span>
  );
};

const AuditBadge = ({ type }) => {
  const map = {
    GRADED:     { color: T.cyan,    bg: T.cyanDim    },
    OVERRIDDEN: { color: "#f59e0b", bg: "rgba(245,158,11,0.10)" },
    FLAGGED:    { color: T.red,     bg: "rgba(248,113,113,0.10)" },
    RELEASED:   { color: T.emerald, bg: T.emeraldDim  },
    UPLOADED:   { color: T.text2,   bg: "rgba(136,150,164,0.10)" },
  };
  const s = map[type] || map["UPLOADED"];
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, fontFamily: "Geist Mono, monospace",
      letterSpacing: "0.09em", color: s.color, backgroundColor: s.bg,
      borderRadius: "4px", padding: "2px 7px", whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {type}
    </span>
  );
};

const PctColor = (pct) => {
  if (pct >= 85) return T.emerald;
  if (pct >= 70) return T.cyan;
  if (pct >= 50) return "#f59e0b";
  return T.red;
};

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: "4px", borderRadius: "2px", backgroundColor: T.surfaceHigh, overflow: "hidden", width: "100%" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ ...SPRING_LG, delay: 0.1 }}
        style={{ height: "100%", borderRadius: "2px", backgroundColor: color || T.cyan }}
      />
    </div>
  );
}

const sectionTransition = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0,  transition: { ...SPRING_LG } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.18 } },
};

const rowStagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const rowItem = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
};

/* ══════════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════════ */
function StatCard({ label, value, trend, trendUp, accent }) {
  const displayed = useCountUp(value);
  return (
    <motion.div
      variants={rowItem}
      style={{
        backgroundColor: T.surface, border: `1px solid ${T.border}`,
        borderRadius: "14px", padding: "24px",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.text3, marginBottom: "12px", fontFamily: "Geist Mono, monospace" }}>
        {label}
      </div>
      <div style={{ fontFamily: "Geist Mono, monospace", fontWeight: 700, fontSize: "clamp(28px,3vw,40px)", color: accent || T.text1, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "10px" }}>
        {displayed.toLocaleString()}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <Ico.Trend up={trendUp} />
        <span style={{ fontSize: "12px", color: trendUp ? T.emerald : T.red, fontFamily: "Geist Mono, monospace" }}>
          {trend}
        </span>
        <span style={{ fontSize: "12px", color: T.text3 }}>vs last week</span>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 1 — OVERVIEW
══════════════════════════════════════════════════════════════ */
function SectionOverview() {
  return (
    <motion.div key="overview" {...sectionTransition}>
      {/* stats grid */}
      <motion.div
        variants={rowStagger} initial="hidden" animate="visible"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}
      >
        <StatCard label="Total Exams"    value={12}  trend="+2"   trendUp />
        <StatCard label="Exams Graded"   value={847} trend="+134" trendUp />
        <StatCard label="Pending Review" value={234} trend="+18"  trendUp accent={T.cyan} />
        <StatCard label="Flagged"        value={18}  trend="+3"   trendUp={false} accent={T.red} />
      </motion.div>

      {/* recent exams table */}
      <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: T.text1, letterSpacing: "-0.02em" }}>Recent Exams</span>
          <Dot color={T.cyan} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Exam Name","Uploaded","Scripts","Graded","Status","Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text3, fontFamily: "Geist Mono, monospace", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={rowStagger} initial="hidden" animate="visible">
              {MOCK_EXAMS.map((exam) => (
                <motion.tr
                  key={exam.id} variants={rowItem}
                  whileHover={{ backgroundColor: T.surfaceHigh }}
                  style={{ transition: "background-color 0.15s", cursor: "default" }}
                >
                  <td style={{ padding: "14px 20px", fontSize: "13.5px", color: T.text1, fontWeight: 500 }}>{exam.name}</td>
                  <td style={{ padding: "14px 20px", fontSize: "12px", color: T.text2, fontFamily: "Geist Mono, monospace", whiteSpace: "nowrap" }}>{exam.uploaded}</td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: T.text2, fontFamily: "Geist Mono, monospace" }}>{exam.scripts}</td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: T.text2, fontFamily: "Geist Mono, monospace" }}>{exam.graded}</td>
                  <td style={{ padding: "14px 20px" }}><StatusBadge status={exam.status} /></td>
                  <td style={{ padding: "14px 20px" }}>
                    <MagBtn variant="ghost" size="md">
                      <Ico.Eye />&nbsp;View
                    </MagBtn>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 2 — UPLOAD EXAM
══════════════════════════════════════════════════════════════ */
function SectionExams() {
  const [dragOver,   setDragOver]   = useState(false);
  const [files,      setFiles]      = useState([]);
  const [rubricJson, setRubricJson] = useState(RUBRIC_PLACEHOLDER);
  const [jsonValid,  setJsonValid]  = useState(null); // null | true | false
  const [uploading,  setUploading]  = useState(false);
  const fileRef = useRef();

  const addFiles = (incoming) => {
    const arr = Array.from(incoming).filter(f => f.type === "application/pdf");
    setFiles(prev => [...prev, ...arr.map(f => ({ file: f, name: f.name, size: f.size, progress: 0, id: Math.random() }))]);
    // simulate progress
    arr.forEach((_, i) => {
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 18 + 4;
        if (p >= 100) { p = 100; clearInterval(iv); }
        setFiles(prev => prev.map((x, xi) => xi === prev.length - arr.length + i ? { ...x, progress: Math.floor(p) } : x));
      }, 120);
    });
  };

  const validateJson = () => {
    try { JSON.parse(rubricJson); setJsonValid(true); }
    catch { setJsonValid(false); }
  };

  const handleUpload = async () => {
    setUploading(true);
    await new Promise(r => setTimeout(r, 2000));
    setUploading(false);
    setFiles([]);
  };

  return (
    <motion.div key="exams" {...sectionTransition}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* drop zone */}
          <motion.div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            animate={{ scale: dragOver ? 1.01 : 1, borderColor: dragOver ? T.cyan : T.border, backgroundColor: dragOver ? T.cyanDim : "transparent" }}
            transition={{ ...SPRING }}
            style={{
              border: `2px dashed ${T.border}`, borderRadius: "16px",
              padding: "48px 24px", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "12px",
              cursor: "pointer", color: T.text3,
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
            <Ico.Upload />
            <div style={{ fontSize: "14px", color: T.text2, fontWeight: 500 }}>Drop PDF files here</div>
            <div style={{ fontSize: "12px", color: T.text3 }}>or <span style={{ color: T.cyan }}>browse</span> to select</div>
          </motion.div>

          {/* file list */}
          <AnimatePresence>
            {files.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: T.text1, fontWeight: 500 }}>{f.name}</div>
                    <div style={{ fontSize: "11px", color: T.text3, fontFamily: "Geist Mono, monospace" }}>{(f.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "11px", fontFamily: "Geist Mono, monospace", color: f.progress === 100 ? T.emerald : T.cyan }}>{f.progress}%</span>
                    <motion.button onClick={() => setFiles(p => p.filter(x => x.id !== f.id))}
                      whileHover={{ color: T.red }} whileTap={{ scale: 0.9 }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, display: "flex" }}>
                      <Ico.X />
                    </motion.button>
                  </div>
                </div>
                <ProgressBar pct={f.progress} color={f.progress === 100 ? T.emerald : T.cyan} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* rubric editor */}
          <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", color: T.text3, fontFamily: "Geist Mono, monospace", marginBottom: "12px" }}>RUBRIC DEFINITION</div>
            <textarea
              value={rubricJson}
              onChange={(e) => { setRubricJson(e.target.value); setJsonValid(null); }}
              style={{
                width: "100%", minHeight: "220px", resize: "vertical",
                backgroundColor: T.surfaceHigh, border: `1px solid ${T.border}`,
                borderRadius: "8px", padding: "14px", color: T.text1,
                fontFamily: "Geist Mono, monospace", fontSize: "12px", lineHeight: 1.7,
                outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = T.cyan}
              onBlur={(e) => e.target.style.borderColor = T.border}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
              <MagBtn variant="ghost" size="md" onClick={validateJson}>Validate JSON</MagBtn>
              <AnimatePresence mode="wait">
                {jsonValid === true && (
                  <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ fontSize: "12px", color: T.emerald, display: "flex", alignItems: "center", gap: "5px" }}>
                    <Ico.Check />&nbsp;Valid JSON
                  </motion.span>
                )}
                {jsonValid === false && (
                  <motion.span key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ fontSize: "12px", color: T.red }}>
                    Parse error — check syntax
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* submit */}
          <MagBtn variant="primary" size="lg" onClick={handleUpload} style={{ width: "100%", justifyContent: "center" }}>
            {uploading ? <><LoadingSpinner />&nbsp;&nbsp;Processing…</> : "Upload & Start Grading"}
          </MagBtn>
        </div>

        {/* RIGHT — uploaded exam list */}
        <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontSize: "13px", fontWeight: 600, color: T.text1 }}>Uploaded Batches</div>
          <motion.div variants={rowStagger} initial="hidden" animate="visible" style={{ padding: "12px" }}>
            {MOCK_EXAMS.map((exam) => {
              const pct = Math.round((exam.graded / exam.scripts) * 100);
              return (
                <motion.div key={exam.id} variants={rowItem}
                  style={{ padding: "14px", borderRadius: "10px", marginBottom: "8px", backgroundColor: T.surfaceHigh }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: T.text1, marginBottom: "2px" }}>{exam.name}</div>
                      <div style={{ fontSize: "11px", color: T.text3, fontFamily: "Geist Mono, monospace" }}>{exam.uploaded} · {exam.scripts} scripts</div>
                    </div>
                    <StatusBadge status={exam.status} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1 }}><ProgressBar pct={pct} /></div>
                    <span style={{ fontSize: "11px", fontFamily: "Geist Mono, monospace", color: T.text3, flexShrink: 0 }}>{pct}%</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                    <MagBtn variant="ghost" size="md"><Ico.Eye />&nbsp;View</MagBtn>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 3 — RUBRICS
══════════════════════════════════════════════════════════════ */
function SectionRubrics() {
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newJson, setNewJson] = useState(RUBRIC_PLACEHOLDER);

  return (
    <motion.div key="rubrics" {...sectionTransition}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
        <MagBtn variant="primary" size="md" onClick={() => setShowNew(p => !p)}>
          <Ico.Plus />&nbsp;&nbsp;New Rubric
        </MagBtn>
      </div>

      {/* new rubric inline panel */}
      <AnimatePresence>
        {showNew && (
          <motion.div
            key="new-rubric"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ ...SPRING_LG }}
            style={{ overflow: "hidden", marginBottom: "24px" }}
          >
            <div style={{ backgroundColor: T.surface, border: `1px solid ${T.cyan}`, borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: T.cyan, letterSpacing: "0.04em", fontFamily: "Geist Mono, monospace" }}>NEW RUBRIC</div>
              <FLInput id="rname" label="Rubric Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <FLInput id="rdesc" label="Description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              <textarea
                value={newJson} onChange={(e) => setNewJson(e.target.value)}
                style={{ width: "100%", minHeight: "180px", resize: "vertical", backgroundColor: T.surfaceHigh, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "14px", color: T.text1, fontFamily: "Geist Mono, monospace", fontSize: "12px", lineHeight: 1.7, outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => e.target.style.borderColor = T.cyan}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <MagBtn variant="primary" size="md">Save Rubric</MagBtn>
                <MagBtn variant="ghost" size="md" onClick={() => setShowNew(false)}>Cancel</MagBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* rubric cards grid */}
      <motion.div variants={rowStagger} initial="hidden" animate="visible"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {MOCK_RUBRICS.map((r) => (
          <motion.div key={r.id} variants={rowItem}
            whileHover={{ borderColor: T.borderMid, scale: 1.01 }}
            style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "20px", transition: "border-color 0.15s", cursor: "default" }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: T.text1, marginBottom: "6px", letterSpacing: "-0.01em" }}>{r.name}</div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", color: T.text3, fontFamily: "Geist Mono, monospace" }}>{r.questions} questions</span>
              <span style={{ fontSize: "11px", color: T.text3, fontFamily: "Geist Mono, monospace" }}>{r.exams} exams</span>
            </div>
            <div style={{ fontSize: "11px", color: T.text3, marginBottom: "14px" }}>Modified {r.modified}</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <MagBtn variant="ghost" size="md"><Ico.Edit />&nbsp;Edit</MagBtn>
              <MagBtn variant="ghost" size="md"><Ico.Copy />&nbsp;Duplicate</MagBtn>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 4 — GRADES
══════════════════════════════════════════════════════════════ */
function SectionGrades() {
  const [search,      setSearch]      = useState("");
  const [releasing,   setReleasing]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [released,    setReleased]    = useState(false);

  const filtered = MOCK_GRADES.filter(g =>
    g.id.toLowerCase().includes(search.toLowerCase()) ||
    g.exam.toLowerCase().includes(search.toLowerCase())
  );

  const doRelease = async () => {
    setReleasing(true);
    await new Promise(r => setTimeout(r, 1500));
    setReleasing(false);
    setReleased(true);
    setShowConfirm(false);
  };

  return (
    <motion.div key="grades" {...sectionTransition}>
      {/* filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: T.text3, pointerEvents: "none" }}><Ico.Search /></span>
          <input
            placeholder="Search student ID or exam…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "9px 12px 9px 36px", color: T.text1, fontFamily: "Geist, sans-serif", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
            onFocus={(e) => e.target.style.borderColor = T.cyan}
            onBlur={(e) => e.target.style.borderColor = T.border}
          />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <MagBtn variant="primary" size="md" onClick={() => setShowConfirm(p => !p)}>
            <Ico.Release />&nbsp;&nbsp;Release Grades
          </MagBtn>
        </div>
      </div>

      {/* release confirmation */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ ...SPRING_LG }} style={{ overflow: "hidden", marginBottom: "20px" }}
          >
            <div style={{ backgroundColor: T.emeraldDim, border: `1px solid ${T.emeraldGlow}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: T.emerald, marginBottom: "2px" }}>Release grades to students?</div>
                <div style={{ fontSize: "12px", color: T.text2 }}>This will publish all completed grades. This action cannot be undone.</div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <MagBtn variant="primary" size="md" onClick={doRelease}>
                  {releasing ? <><LoadingSpinner />&nbsp;Releasing…</> : "Confirm Release"}
                </MagBtn>
                <MagBtn variant="ghost" size="md" onClick={() => setShowConfirm(false)}>Cancel</MagBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* grades table */}
      <div style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Student ID","Exam","Score","Max","Percentage","Status","Released"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: T.text3, fontFamily: "Geist Mono, monospace", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={rowStagger} initial="hidden" animate="visible">
              {filtered.map((g) => {
                const pct = Math.round((g.score / g.max) * 100);
                return (
                  <motion.tr key={g.id} variants={rowItem}
                    whileHover={{ backgroundColor: T.surfaceHigh }}
                    style={{ transition: "background-color 0.15s" }}>
                    <td style={{ padding: "13px 20px", fontFamily: "Geist Mono, monospace", fontSize: "12.5px", color: T.cyan }}>{g.id}</td>
                    <td style={{ padding: "13px 20px", fontSize: "13px", color: T.text2 }}>{g.exam}</td>
                    <td style={{ padding: "13px 20px", fontFamily: "Geist Mono, monospace", fontSize: "13px", color: T.text1, fontWeight: 600 }}>{g.score}</td>
                    <td style={{ padding: "13px 20px", fontFamily: "Geist Mono, monospace", fontSize: "13px", color: T.text3 }}>{g.max}</td>
                    <td style={{ padding: "13px 20px" }}>
                      <span style={{ fontFamily: "Geist Mono, monospace", fontSize: "13px", fontWeight: 700, color: PctColor(pct) }}>{pct}%</span>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <StatusBadge status={pct >= 50 ? "Completed" : "Processing"} />
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      {(g.released || released)
                        ? <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: T.emerald }}><Ico.Check /> Released</span>
                        : <span style={{ fontSize: "12px", color: T.text3 }}>Pending</span>}
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION 5 — AUDIT LOG
══════════════════════════════════════════════════════════════ */
function SectionAudit() {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const types = ["ALL","GRADED","OVERRIDDEN","FLAGGED","RELEASED","UPLOADED"];
  const filtered = typeFilter === "ALL" ? MOCK_AUDIT : MOCK_AUDIT.filter(e => e.type === typeFilter);

  return (
    <motion.div key="audit" {...sectionTransition}>
      {/* filter bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {types.map((t) => (
          <motion.button key={t} onClick={() => setTypeFilter(t)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            style={{
              padding: "6px 14px", borderRadius: "6px", border: `1px solid ${typeFilter === t ? T.cyan : T.border}`,
              backgroundColor: typeFilter === t ? T.cyanDim : "transparent",
              color: typeFilter === t ? T.cyan : T.text3,
              fontSize: "11px", fontWeight: 600, fontFamily: "Geist Mono, monospace",
              letterSpacing: "0.07em", cursor: "pointer", transition: "all 0.15s",
            }}>
            {t}
          </motion.button>
        ))}
      </div>

      {/* timeline */}
      <motion.div variants={rowStagger} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {filtered.map((ev, i) => (
          <motion.div key={ev.id} variants={rowItem}
            whileHover={{ backgroundColor: T.surfaceHigh }}
            style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "16px", borderRadius: "10px", transition: "background-color 0.15s" }}>
            {/* timeline line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <Dot color={ev.type === "FLAGGED" ? T.red : ev.type === "RELEASED" ? T.emerald : T.cyan} />
              {i < filtered.length - 1 && <div style={{ width: "1px", height: "100%", minHeight: "24px", backgroundColor: T.border, marginTop: "6px" }} />}
            </div>
            {/* content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                <AuditBadge type={ev.type} />
                <span style={{ fontFamily: "Geist Mono, monospace", fontSize: "11px", color: T.text3 }}>{ev.ts}</span>
                <span style={{ fontSize: "12px", color: T.cyan }}>{ev.actor}</span>
              </div>
              <div style={{ fontSize: "13.5px", color: T.text2, lineHeight: 1.5 }}>{ev.desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION TITLES
══════════════════════════════════════════════════════════════ */
const SECTION_META = {
  overview:  { title: "Overview",  sub: "Your grading workspace at a glance"         },
  exams:     { title: "Exams",     sub: "Upload and manage exam batches"              },
  rubrics:   { title: "Rubrics",   sub: "Define and manage grading rubrics"           },
  grades:    { title: "Grades",    sub: "Review scores and release to students"       },
  audit:     { title: "Audit Log", sub: "Full activity trail for this workspace"      },
  settings:  { title: "Settings",  sub: "Configure your account and preferences"      },
};

const PATH_TO_SECTION = {
  "/instructor":          "overview",
  "/instructor/exams":    "exams",
  "/instructor/rubrics":  "rubrics",
  "/instructor/grades":   "grades",
  "/instructor/audit":    "audit",
  "/instructor/settings": "settings",
};

/* ══════════════════════════════════════════════════════════════
   INSTRUCTOR DASHBOARD
══════════════════════════════════════════════════════════════ */
export default function InstructorDashboard() {
  const navigate         = useNavigate();
  const { user }         = useContext(UserContext);
  const { isMobile, isTablet } = useBreakpoint();
  const [activeRoute, setActiveRoute] = useState("/instructor");

  const section = PATH_TO_SECTION[activeRoute] || "overview";
  const meta    = SECTION_META[section];

  /* redirect if wrong role */
  useEffect(() => {
    if (!user) { navigate("/login", { replace: true }); return; }
    if (user.role !== "instructor") navigate("/ta", { replace: true });
  }, [user, navigate]);

  const sidebarW = 220;

  const handleNavigate = (path) => {
    setActiveRoute(path);
    navigate(path, { replace: true });
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", backgroundColor: T.bg, fontFamily: "Geist, sans-serif" }}>
      <Sidebar activeRoute={activeRoute} onNavigate={handleNavigate} />

      {/* main */}
      <div style={{ flex: 1, marginLeft: sidebarW, display: "flex", flexDirection: "column", minHeight: "100dvh", overflow: "hidden" }}>

        {/* top bar */}
        <div style={{
          height: "56px", backgroundColor: T.surface, borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `0 ${isMobile ? "64px" : "28px"} 0 28px`, flexShrink: 0,
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: T.text1, letterSpacing: "-0.02em" }}>{meta.title}</div>
            <div style={{ fontSize: "11px", color: T.text3, marginTop: "1px" }}>{meta.sub}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Dot color={T.emerald} />
            <span style={{ fontSize: "12px", color: T.text3, fontFamily: "Geist Mono, monospace" }}>Live</span>
          </div>
        </div>

        {/* scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
          <AnimatePresence mode="wait">
            {section === "overview"  && <SectionOverview  key="overview"  />}
            {section === "exams"     && <SectionExams     key="exams"     />}
            {section === "rubrics"   && <SectionRubrics   key="rubrics"   />}
            {section === "grades"    && <SectionGrades    key="grades"    />}
            {section === "audit"     && <SectionAudit     key="audit"     />}
            {section === "settings"  && (
              <motion.div key="settings" {...sectionTransition}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px", color: T.text3, fontSize: "14px" }}>
                Settings coming soon.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}