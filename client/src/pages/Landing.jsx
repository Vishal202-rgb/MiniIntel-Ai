import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, FileText, Brain, BarChart2, CheckCircle2, 
  Layers, Lock, Database, ArrowRight, Activity, 
  Search, ShieldAlert, Cpu, Award, Sparkles, Sun, Moon,
  FileCheck, ChevronRight, Compass, ArrowUpRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const dashboardUrl = user?.role === 'admin' ? '/admin-dashboard' : '/dashboard';

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const capabilities = [
    {
      icon: Layers,
      title: 'Coal & Mining Intelligence',
      badge: 'CIL Subsidiaries',
      desc: 'Unified operational monitoring across Coal India subsidiaries including SECL, MCL, ECL, BCCL, WCL, CCL, NCL, and CMPDI exploration units.'
    },
    {
      icon: FileText,
      title: 'Document Intelligence',
      badge: 'Multi-Format OCR',
      desc: 'Automated ingestion and extraction of DGMS circulars, CMPDI drilling logs, mine plans, environmental clearances, and shift reports.'
    },
    {
      icon: BarChart2,
      title: 'Production & Dispatch Monitoring',
      badge: 'Real-Time Telemetry',
      desc: 'Continuous tracking of Overburden Removal (OBR), stripping ratios, rake loading logistics, and target-vs-actual variance computations.'
    },
    {
      icon: Compass,
      title: 'Geological Intelligence',
      badge: 'G1–G17 Grades',
      desc: 'Seam stratification mapping, Gross Calorific Value (GCV) band tracking, proximate moisture-ash-volatile analysis, and reserve estimation.'
    },
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      badge: 'Hybrid RAG + Engine',
      desc: 'Domain-trained vector retrieval cross-referenced with deterministic mathematical formula engines for zero-hallucination analysis.'
    },
    {
      icon: CheckCircle2,
      title: 'Evidence-Backed Reporting',
      badge: '100% Grounded',
      desc: 'Every parameter, figure, and trend is cited with document provenance, exact page references, and similarity match metrics.'
    },
    {
      icon: ShieldAlert,
      title: 'Validation & Governance',
      badge: 'Statutory Engine',
      desc: 'Automated statutory rule verification, anomaly detection, threshold breach alerts, and conflict resolution across overlapping records.'
    },
    {
      icon: FileCheck,
      title: 'Report Lifecycle & Approval',
      badge: 'Audit Trail',
      desc: 'Multi-stage operational sign-off: Drafter submission → Admin review queue → Formal approval/rejection → Immutable audit log.'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Statutory Ingestion',
      desc: 'Secure upload of multi-format operational logs, scanned maps, PDFs, and spreadsheets with SHA-256 checksum verification.'
    },
    {
      step: '02',
      title: 'Multi-Modal Extraction',
      desc: 'Deep OCR and table structure decomposition extract key-value pairs, production figures, and geological seam attributes.'
    },
    {
      step: '03',
      title: 'Statutory Validation',
      desc: 'Automated rule engine verifies consistency against historical benchmarks, DGMS safety parameters, and variance thresholds.'
    },
    {
      step: '04',
      title: 'Vector Knowledge Graph',
      desc: 'Contextual semantic chunking builds indexed embeddings for rapid natural-language RAG querying and entity discovery.'
    },
    {
      step: '05',
      title: 'Synthesis & Evidence Citations',
      desc: 'Deterministic math algorithms pair with LLM reasoning to synthesize management-ready briefings with full document citations.'
    },
    {
      step: '06',
      title: 'Admin Review & Governance',
      desc: 'Authorized reviewers approve or reject reports with structured feedback, alerting officers through persistent system notifications.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0E1117] text-slate-900 dark:text-[#F1F5F9] font-sans selection:bg-amber-600/30 selection:text-white">
      
      {/* ── TOP GOVERNMENT / INSTITUTIONAL BAR ── */}
      <div className="bg-[#161A22] text-[#94A3B8] border-b border-[#262D3A] text-[11px] px-4 py-1.5 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 tracking-wide font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-white font-semibold">MINISTRY OF COAL INITIATIVE</span>
            <span className="text-[#64748B] hidden sm:inline">|</span>
            <span className="hidden sm:inline text-[#CBD5E1]">Coal &amp; Mining Intelligence Platform (SIH-26023)</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="hidden md:inline text-[#64748B]">Official Enterprise Intelligence Console</span>
            <span className="px-2 py-0.5 rounded bg-[#262D3A] text-amber-400 font-mono text-[10px]">v2.4 Enterprise</span>
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#0E1117]/90 border-b border-slate-200 dark:border-[#262D3A] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-lg bg-[#161A22] border border-[#262D3A] flex items-center justify-center text-amber-500 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">MineIntel AI</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Operations</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-tight">Coal &amp; Mining Operations Intelligence</p>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-[#94A3B8]">
            <button onClick={() => scrollToSection('capabilities')} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Capabilities
            </button>
            <button onClick={() => scrollToSection('workflow')} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Workflow Lifecycle
            </button>
            <button onClick={() => scrollToSection('governance')} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              Statutory Governance
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#262D3A] hover:bg-slate-100 dark:hover:bg-[#161A22] text-slate-600 dark:text-[#94A3B8] transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => scrollToSection('capabilities')}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#262D3A] hover:bg-slate-100 dark:hover:bg-[#161A22] text-slate-700 dark:text-[#E2E8F0] transition-colors"
            >
              Explore Platform
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(dashboardUrl)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => logout()}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#262D3A] hover:bg-slate-100 dark:hover:bg-[#161A22] text-slate-700 dark:text-[#E2E8F0] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/admin/login')}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#262D3A] hover:bg-slate-100 dark:hover:bg-[#161A22] text-slate-700 dark:text-[#E2E8F0] transition-colors"
                >
                  Admin Portal
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden py-14 sm:py-20 border-b border-slate-200 dark:border-[#262D3A]">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl">
            
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Enterprise Coal Intelligence &amp; Statutory Ingestion</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-5">
              Autonomous Coal Intelligence, Document Ingestion &amp; Statutory Governance
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed mb-8">
              A comprehensive intelligence and decision-support infrastructure engineered for Coal India Limited (CIL), CMPDI, and mining directorates. Unifies multi-format DGMS document extraction, seam-level geological analytics, production vs target dispatch monitoring, and verifiable evidence-grounded reports with multi-stage administrative review.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <button
                onClick={() => navigate(user ? dashboardUrl : '/login')}
                className="px-5 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <span>{user ? 'Enter Console' : 'Sign In to Console'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('capabilities')}
                className="px-5 py-3 rounded-lg border border-slate-300 dark:border-[#262D3A] bg-white dark:bg-[#161A22] hover:bg-slate-50 dark:hover:bg-[#1E232E] text-slate-800 dark:text-[#F1F5F9] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <span>Explore Platform</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {!user && (
                <button
                  onClick={() => navigate('/admin/login')}
                  className="px-4 py-3 rounded-lg border border-transparent hover:border-slate-300 dark:border-[#262D3A] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-medium transition-colors"
                >
                  <span>Admin Authority Portal &rarr;</span>
                </button>
              )}
            </div>

            {/* Operational Guarantee Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200 dark:border-[#262D3A]/80">
              <div className="p-3 rounded-lg bg-white dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A]">
                <div className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-500 font-mono">G1–G17</div>
                <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">Coal Grade Taxonomy</div>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A]">
                <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-500 font-mono">100%</div>
                <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">Evidence Grounded</div>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A]">
                <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-[#F1F5F9] font-mono">DGMS</div>
                <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">Statutory Compliance</div>
              </div>
              <div className="p-3 rounded-lg bg-white dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A]">
                <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-[#F1F5F9] font-mono">4-Tier</div>
                <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-medium">Approval Governance</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 8 CORE ENTERPRISE CAPABILITIES ── */}
      <section id="capabilities" className="py-14 sm:py-20 bg-slate-50/50 dark:bg-[#0E1117] border-b border-slate-200 dark:border-[#262D3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-2xl mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">Platform Capabilities</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Enterprise Mining Intelligence &amp; Autonomous Processing
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-2 leading-relaxed">
              Engineered to replace fragmented reporting with validated, single-source-of-truth coal analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {capabilities.map((cap, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A] rounded-lg p-5 flex flex-col justify-between hover:border-amber-600/40 transition-all duration-200 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <cap.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E232E] text-slate-600 dark:text-[#94A3B8] font-semibold border border-slate-200 dark:border-[#262D3A]">
                      {cap.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-snug">{cap.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">{cap.desc}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#262D3A]/60 flex items-center justify-between text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <span>Authorized Module</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── WORKFLOW LIFECYCLE SECTION ── */}
      <section id="workflow" className="py-14 sm:py-20 bg-white dark:bg-[#12151C] border-b border-slate-200 dark:border-[#262D3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-2xl mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">Governance Pipeline</h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Ingestion to Multi-Tier Administrative Approval
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-2 leading-relaxed">
              End-to-end evidence lifecycle maintaining statutory integrity across administrative tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workflowSteps.map((ws, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A] rounded-lg p-5 relative overflow-hidden"
              >
                <div className="text-3xl font-extrabold text-amber-600/20 dark:text-amber-500/15 font-mono mb-2">
                  {ws.step}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{ws.title}</h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">{ws.desc}</p>
              </div>
            ))}
          </div>

          {/* Workflow Indicator Banner */}
          <div className="mt-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Admin Approval &amp; Notification Loop</p>
                <p className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
                  Reports submitted for review are queued in the Admin Authority console. Approved and rejected reports trigger instant persistent alerts for authors.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shrink-0 transition-colors"
            >
              Sign In to Review
            </button>
          </div>

        </div>
      </section>

      {/* ── STATUTORY COMPLIANCE & SECURITY ── */}
      <section id="governance" className="py-14 sm:py-20 bg-slate-50/50 dark:bg-[#0E1117] border-b border-slate-200 dark:border-[#262D3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-500 mb-2">Enterprise Governance</h2>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
                Statutory Grounding, Checksum Integrity &amp; Strict RBAC
              </p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed mb-6">
                MineIntel AI enforces strict computational and administrative guardrails. No AI response is generated without chunk-level citations, ensuring that operational decision-makers always operate on verifiable government records.
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">SHA-256 Checksum Ingestion: </span>
                    <span className="text-slate-600 dark:text-[#94A3B8]">Guarantees duplicate rejection and cryptographic document integrity upon ingestion.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Deterministic Arithmetic Validation: </span>
                    <span className="text-slate-600 dark:text-[#94A3B8]">Target-vs-actual variance and stripping ratio calculations are mathematically computed, never hallucinated.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Immutable Audit Logging: </span>
                    <span className="text-slate-600 dark:text-[#94A3B8]">Every query, upload, extraction, update, approval, and rejection is recorded in the central compliance audit trail.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Static Verified Preview Card */}
            <div className="bg-white dark:bg-[#161A22] border border-slate-200 dark:border-[#262D3A] rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#262D3A] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Sample Operational Query &amp; Grounding</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Verified 95% Confidence
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#0E1117] rounded border border-slate-200 dark:border-[#262D3A] text-xs font-mono">
                <span className="text-slate-400">Query: </span>
                <span className="text-slate-800 dark:text-[#E2E8F0]">"Analyze Q3 production shortfall variance vs target and identify operational bottlenecks."</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-amber-500/5 rounded border border-amber-500/20 text-slate-700 dark:text-[#CBD5E1] text-[11px] leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white">Deterministic Calculation: </span>
                  Actual (6,000 MT) - Target (7,600 MT) = -1,600 MT shortfall (78.95% achievement).
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">Source Evidence: </span>
                  MineIntel_MultiPeriod_Report.pdf (Page 2) • Excerpt: Extended haulage equipment downtime and monsoon rainfall restricted pit bench access.
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── CALL TO ACTION SECTION ── */}
      <section className="py-14 sm:py-20 bg-white dark:bg-[#12151C] border-b border-slate-200 dark:border-[#262D3A]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
            Access the Coal Operations Intelligence Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] max-w-xl mx-auto mb-8 leading-relaxed">
            Authorized personnel can sign in to access live dashboards, execute autonomous multi-modal document extraction, generate verified reports, and manage administrative approvals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate(user ? dashboardUrl : '/login')}
              className="px-6 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <span>{user ? 'Enter Console' : 'Officer Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => navigate('/admin/login')}
                className="px-6 py-3 rounded-lg border border-slate-300 dark:border-[#262D3A] hover:bg-slate-100 dark:hover:bg-[#161A22] text-slate-800 dark:text-[#F1F5F9] text-xs sm:text-sm font-semibold transition-colors"
              >
                Admin Portal
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── INSTITUTIONAL FOOTER ── */}
      <footer className="bg-[#161A22] text-[#94A3B8] text-xs py-8 border-t border-[#262D3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-white font-bold text-xs tracking-tight">MineIntel AI — Coal &amp; Mining Intelligence Platform</p>
              <p className="text-[10px] text-[#64748B]">Ministry of Coal / SIH Initiative • Strictly for Authorized Government &amp; Mining Operations</p>
            </div>
          </div>
          <div className="text-[11px] text-[#64748B] text-center sm:text-right">
            <span>Confidential &amp; Proprietary • </span>
            <span>Zero-Hallucination Evidence Guarantee • </span>
            <span className="font-mono text-amber-400">SIH-26023</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
