import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, FileText, Brain, BarChart2, CheckCircle2, 
  Layers, Lock, Database, ArrowRight, Activity, 
  Search, ShieldAlert, Cpu, Award, Sparkles, Sun, Moon,
  FileCheck, ChevronRight, Compass, ArrowUpRight, Check,
  AlertTriangle, Sliders, RefreshCw, Eye, Download,
  UserCheck, Menu, X, ExternalLink, Terminal, GitBranch,
  FileSpreadsheet, HardHat, FileDigit
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('all');

  const dashboardUrl = user?.role === 'admin' ? '/admin-dashboard' : '/dashboard';

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const capabilities = [
    {
      num: '01',
      icon: FileText,
      title: 'Document Intelligence',
      badge: 'Multi-Format OCR',
      desc: 'Automated ingestion and multi-engine parsing across DGMS circulars, CMPDI drilling logs, mine plans, and spreadsheets with deep Tesseract OCR.'
    },
    {
      num: '02',
      icon: Database,
      title: 'Trusted Data Fabric',
      badge: 'SHA-256 Verified',
      desc: 'Cryptographic deduplication, schema normalization, and structured extraction of operational metrics, equipment logs, and geological seam data.'
    },
    {
      num: '03',
      icon: Brain,
      title: 'AI-Powered Analysis',
      badge: 'Hybrid RAG + Engine',
      desc: 'Domain-trained Gemini Pro reasoning paired with deterministic mathematical computation for zero unsupported claims and transparent formulas.'
    },
    {
      num: '04',
      icon: ShieldAlert,
      title: 'Validation & Governance',
      badge: '7 Rule Categories',
      desc: 'Automated statutory rule verification checking unit mismatches, variance spikes, and DGMS threshold limits with dynamic quality scoring (0–100).'
    },
    {
      num: '05',
      icon: FileCheck,
      title: 'Report Generation',
      badge: 'Bilingual Export',
      desc: 'Autonomous generation of statutory compliance summaries in English and Hindi with formal Maker-Checker review queues and administrative sign-off.'
    },
    {
      num: '06',
      icon: Activity,
      title: 'Topic & Intelligence Analysis',
      badge: 'Corpus Modeling',
      desc: 'Unsupervised semantic topic modeling, topic co-occurrence graphs, and cross-subsidiary trend detection across operational mining quarters.'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Ingest',
      desc: 'Multi-format operational returns, scanned PDFs, and workbooks ingested with SHA-256 hash checks.'
    },
    {
      step: '02',
      title: 'Extract',
      desc: 'Multimodal OCR and table structure decomposition extract key metrics, entities, and coal parameters.'
    },
    {
      step: '03',
      title: 'Validate',
      desc: 'Algorithmic rule engine checks unit consistency, historical variance thresholds, and conflicting records.'
    },
    {
      step: '04',
      title: 'Analyze',
      desc: '768-dimensional vector embeddings and semantic search link data into an indexed operational knowledge base.'
    },
    {
      step: '05',
      title: 'Review',
      desc: 'Discrepancies and extracted fields reviewed by operational staff with full immutable edit history.'
    },
    {
      step: '06',
      title: 'Approve',
      desc: 'Statutory reports pass through a strict Maker-Checker review gate requiring administrative sign-off.'
    },
    {
      step: '07',
      title: 'Intelligence',
      desc: 'Validated intelligence dispatched as executive briefings, downloadable PDF/DOCX, and enterprise feeds.'
    }
  ];

  const governancePillars = [
    {
      title: 'Document Integrity',
      badge: 'SHA-256 Checked',
      desc: 'Cryptographic deduplication on upload eliminates redundancy and guarantees raw document provenance.'
    },
    {
      title: 'Algorithmic Validation',
      badge: '7 Error Categories',
      desc: 'Automated checks flag unit mismatches, out-of-bounds figures, and variance discrepancies with severity penalties.'
    },
    {
      title: 'Role-Based Access Control',
      badge: 'Strict RBAC',
      desc: 'Distinct privilege tiers for Operators, Reviewers, and System Administrators with isolated admin credentials.'
    },
    {
      title: 'Immutable Audit Trail',
      badge: 'Audit Provenance',
      desc: 'Every login, document ingestion, HITL edit, review decision, and report export is recorded permanently.'
    },
    {
      title: 'Human-in-the-Loop Review',
      badge: 'Full Edit History',
      desc: 'Operators verify and correct extracted parameters before they enter the statutory compliance pipeline.'
    },
    {
      title: 'Maker-Checker Governance',
      badge: 'Admin Barrier',
      desc: 'Mandatory two-stage operational review ensures no statutory report is finalized without formal approval.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#F1F5F9] font-sans selection:bg-[#C05621]/30 selection:text-white">
      
      {/* ── MAIN HEADER (64–72px) ── */}
      <header className="sticky top-0 z-50 bg-[#0B0E14]/95 backdrop-blur-sm border-b border-[#2B3245] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between">
          
          {/* LEFT: Branding */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group select-none" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded bg-[#161B26] border border-[#2B3245] flex items-center justify-center text-[#C05621] group-hover:border-[#C05621]/50 transition-colors">
              <HardHat className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold text-[#F1F5F9] tracking-tight leading-none group-hover:text-white transition-colors">
                MineIntel AI
              </span>
              <span className="text-[10px] text-[#94A3B8] font-normal tracking-normal mt-0.5 leading-none">
                Coal &amp; Mining Intelligence
              </span>
            </div>
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs font-medium text-[#94A3B8]">
            <button 
              onClick={() => scrollToSection('capabilities')} 
              className="hover:text-[#F1F5F9] transition-colors py-1"
            >
              Capabilities
            </button>
            <button 
              onClick={() => scrollToSection('workflow')} 
              className="hover:text-[#F1F5F9] transition-colors py-1"
            >
              Workflow
            </button>
            <button 
              onClick={() => scrollToSection('governance')} 
              className="hover:text-[#F1F5F9] transition-colors py-1"
            >
              Governance
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="hover:text-[#F1F5F9] transition-colors py-1"
            >
              About
            </button>
          </nav>

          {/* RIGHT: Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md border border-[#2B3245] hover:bg-[#161B26] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Explore Platform */}
            <button
              onClick={() => scrollToSection('capabilities')}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-[#2B3245] hover:bg-[#161B26] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              Explore Platform
            </button>

            {/* Auth Dependent CTAs */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(dashboardUrl)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#C05621] hover:bg-[#9C4115] text-white shadow-sm transition-colors"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => logout()}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-[#2B3245] hover:bg-[#161B26] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-[#C05621] hover:bg-[#9C4115] text-white shadow-sm transition-colors"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md border border-[#2B3245] bg-[#161B26] text-[#94A3B8]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md border border-[#2B3245] bg-[#161B26] text-[#94A3B8] hover:text-[#F1F5F9]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-[#12161F] border-b border-[#2B3245] px-4 py-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => scrollToSection('capabilities')} 
                className="text-left px-3 py-2 rounded bg-[#161B26] border border-[#2B3245] text-[#CBD5E1]"
              >
                Capabilities
              </button>
              <button 
                onClick={() => scrollToSection('workflow')} 
                className="text-left px-3 py-2 rounded bg-[#161B26] border border-[#2B3245] text-[#CBD5E1]"
              >
                Workflow
              </button>
              <button 
                onClick={() => scrollToSection('governance')} 
                className="text-left px-3 py-2 rounded bg-[#161B26] border border-[#2B3245] text-[#CBD5E1]"
              >
                Governance
              </button>
              <button 
                onClick={() => scrollToSection('about')} 
                className="text-left px-3 py-2 rounded bg-[#161B26] border border-[#2B3245] text-[#CBD5E1]"
              >
                About
              </button>
            </div>
            <div className="pt-2 border-t border-[#2B3245] flex items-center justify-between gap-2">
              <button
                onClick={() => navigate(user ? dashboardUrl : '/login')}
                className="w-full py-2 text-center text-xs font-semibold rounded bg-[#C05621] text-white"
              >
                {user ? 'Go to Dashboard' : 'Go to Dashboard'}
              </button>
              {user && (
                <button
                  onClick={() => logout()}
                  className="py-2 px-3 text-center text-xs font-medium rounded border border-[#2B3245] bg-[#161B26] text-[#94A3B8]"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── 1. HERO SECTION (BALANCED TWO-COLUMN COMPOSITION) ── */}
      <section className="relative overflow-hidden py-10 sm:py-16 border-b border-[#2B3245]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* LEFT COLUMN: Narrative & Value Proposition */}
            <div className="lg:col-span-7">
              
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#2B3245] bg-[#161B26] text-[#C28A74] text-[11px] font-mono mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C05621]"></span>
                <span>NATIONAL INNOVATION • SIH-26023 COAL INTELLIGENCE</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-[1.18] mb-4">
                Automated Document Ingestion, Mining Intelligence &amp; Regulatory Governance
              </h1>

              {/* Core Description */}
              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-6 max-w-2xl">
                MineIntel AI converts fragmented mining documents and operational data into validated, evidence-backed intelligence. Built for national-scale operational monitoring, statutory compliance, and transparent administrative governance across mining directorates and coal subsidiaries.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <button
                  onClick={() => navigate(user ? dashboardUrl : '/login')}
                  className="px-5 py-2.5 rounded-md bg-[#C05621] hover:bg-[#9C4115] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span>{user ? 'Enter Console' : 'Enter Console'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollToSection('capabilities')}
                  className="px-4 py-2.5 rounded-md border border-[#2B3245] bg-[#161B26] hover:bg-[#1F2430] text-[#E2E8F0] text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <span>Explore Platform</span>
                  <ChevronRight className="w-4 h-4 text-[#64748B]" />
                </button>

                {!user && (
                  <button
                    onClick={() => navigate('/admin/login')}
                    className="px-3 py-2.5 text-xs text-[#94A3B8] hover:text-white font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Admin Authority Portal</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Highlights Micro-badges */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#64748B] pt-4 border-t border-[#2B3245]/60">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>SHA-256 Checksum Ingestion</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>DGMS Compliance Validation</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Maker-Checker Review Barrier</span>
                </span>
              </div>

            </div>

            {/* RIGHT COLUMN: Mining Intelligence Snapshot (Real Data Representation) */}
            <div className="lg:col-span-5">
              <div className="rounded-lg border border-[#2B3245] bg-[#12161F] p-4 sm:p-5 shadow-sm space-y-4">
                
                {/* Snapshot Header */}
                <div className="flex items-center justify-between border-b border-[#2B3245] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-white tracking-wide">MINING INTELLIGENCE SNAPSHOT</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F2430] text-emerald-400 border border-[#2B3245]">
                    ACTIVE CONSOLE
                  </span>
                </div>

                {/* Telemetry Metric Rows */}
                <div className="space-y-2.5 text-xs font-mono">
                  
                  {/* Production */}
                  <div className="p-2.5 rounded bg-[#161B26] border border-[#2B3245] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase">Raw Coal Production</div>
                      <div className="text-sm font-bold text-white">6,000 MT</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#64748B]">Target: 7,600 MT</div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                        -21.05% Variance
                      </span>
                    </div>
                  </div>

                  {/* Dispatch */}
                  <div className="p-2.5 rounded bg-[#161B26] border border-[#2B3245] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase">Total Dispatch Volume</div>
                      <div className="text-sm font-bold text-white">5,700 MT</div>
                    </div>
                    <div className="text-right text-[10px] text-[#94A3B8]">
                      <div>Rail: 62% • MGR: 24%</div>
                      <div className="text-[#64748B]">Road: 14% Weighbridge</div>
                    </div>
                  </div>

                  {/* Validation & Quality */}
                  <div className="p-2.5 rounded bg-[#161B26] border border-[#2B3245] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase">Validation &amp; Integrity</div>
                      <div className="text-sm font-bold text-emerald-400">92 / 100 Quality</div>
                    </div>
                    <div className="text-right text-[10px]">
                      <span className="text-emerald-400 font-semibold">0 Critical</span>
                      <span className="text-[#64748B] mx-1">•</span>
                      <span className="text-amber-400 font-semibold">1 Warning</span>
                    </div>
                  </div>

                  {/* Report Status */}
                  <div className="p-2.5 rounded bg-[#161B26] border border-[#2B3245] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#64748B] uppercase">Statutory Report Lifecycle</div>
                      <div className="text-xs font-semibold text-[#E2E8F0]">Bilaspur_Q3_Return.pdf</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                        Admin Approved
                      </span>
                    </div>
                  </div>

                </div>

                {/* Evidence Note Footer */}
                <div className="p-2 rounded bg-[#0B0E14] border border-[#2B3245] text-[10px] text-[#94A3B8] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Grounding: 100% cited with source document ID, page, and snippet references.</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. HERO TRUST STRIP (COMPACT CAPABILITY HIGHLIGHTS) ── */}
      <section className="bg-[#12161F] border-b border-[#2B3245] py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            
            <div className="p-2 rounded border border-[#2B3245]/50 bg-[#161B26]/60">
              <div className="text-xs font-bold text-white tracking-tight">Evidence-Grounded</div>
              <div className="text-[10px] text-[#94A3B8] truncate">Source Page Provenance</div>
            </div>

            <div className="p-2 rounded border border-[#2B3245]/50 bg-[#161B26]/60">
              <div className="text-xs font-bold text-white tracking-tight">Multi-Format Ingestion</div>
              <div className="text-[10px] text-[#94A3B8] truncate">PDF, DOCX, XLSX, OCR</div>
            </div>

            <div className="p-2 rounded border border-[#2B3245]/50 bg-[#161B26]/60">
              <div className="text-xs font-bold text-white tracking-tight">Deterministic Math</div>
              <div className="text-[10px] text-[#94A3B8] truncate">Formula Calculation Engine</div>
            </div>

            <div className="p-2 rounded border border-[#2B3245]/50 bg-[#161B26]/60">
              <div className="text-xs font-bold text-white tracking-tight">Role-Based Access</div>
              <div className="text-[10px] text-[#94A3B8] truncate">User, Reviewer, Admin</div>
            </div>

            <div className="p-2 rounded border border-[#2B3245]/50 bg-[#161B26]/60">
              <div className="text-xs font-bold text-white tracking-tight">Immutable Audit Trail</div>
              <div className="text-[10px] text-[#94A3B8] truncate">SHA-256 Chain of Custody</div>
            </div>

            <div className="p-2 rounded border border-[#2B3245]/50 bg-[#161B26]/60">
              <div className="text-xs font-bold text-white tracking-tight">Multi-Stage Review</div>
              <div className="text-[10px] text-[#94A3B8] truncate">Maker-Checker Governance</div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. CAPABILITIES SECTION (TIGHT ENTERPRISE GRID) ── */}
      <section id="capabilities" className="py-12 sm:py-16 bg-[#0B0E14] border-b border-[#2B3245]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-3xl mb-8">
            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C05621] mb-1.5">
              Core Capabilities
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Enterprise Mining Intelligence &amp; Autonomous Processing
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 leading-relaxed">
              Six foundational modules engineered to replace fragmented spreadsheets and manual returns with validated, single-source operational intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((cap, idx) => (
              <div 
                key={idx}
                className="bg-[#12161F] border border-[#2B3245] rounded-lg p-5 flex flex-col justify-between hover:border-[#C05621]/60 transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-8 h-8 rounded bg-[#161B26] border border-[#2B3245] flex items-center justify-center text-[#C05621] group-hover:border-[#C05621]/40 transition-colors">
                      <cap.icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161B26] text-[#94A3B8] border border-[#2B3245]">
                        {cap.badge}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#64748B]">
                        {cap.num}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 leading-snug">{cap.title}</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{cap.desc}</p>
                </div>

                <div className="pt-3 mt-4 border-t border-[#2B3245]/60 flex items-center justify-between text-[11px] font-medium text-[#C28A74] group-hover:text-amber-400 transition-colors">
                  <span>Explore Module</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 5. HOW IT WORKS SECTION (7-STEP WORKFLOW PIPELINE) ── */}
      <section id="workflow" className="py-12 sm:py-16 bg-[#12161F] border-b border-[#2B3245]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-3xl mb-8">
            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C05621] mb-1.5">
              End-to-End Pipeline
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              From Raw Ingestion to Administrative Sign-Off
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 leading-relaxed">
              Every document follows an auditable 7-step journey ensuring cryptographic validation, mathematical reconciliation, and regulatory review.
            </p>
          </div>

          {/* Desktop Horizontal Process Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {workflowSteps.map((ws, idx) => (
              <div 
                key={idx}
                className="bg-[#161B26] border border-[#2B3245] rounded-md p-3.5 flex flex-col justify-between relative group hover:border-[#C05621]/50 transition-colors"
              >
                <div>
                  <div className="text-xs font-mono font-bold text-[#C05621] mb-1.5">
                    {ws.step}
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1.5">{ws.title}</h3>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">{ws.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#2B3245]/40 flex items-center text-[10px] text-[#64748B]">
                  <span>Step {idx + 1} of 7</span>
                </div>
              </div>
            ))}
          </div>

          {/* Process Summary Callout */}
          <div className="mt-6 p-3.5 rounded-md bg-[#161B26] border border-[#2B3245] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#C05621] shrink-0" />
              <span className="text-[#CBD5E1]">
                <strong className="text-white font-semibold">Strict Governance Loop: </strong>
                All draft outputs are constrained by the administrative review gate, preventing unauthorized publication of unverified returns.
              </span>
            </div>
            <button
              onClick={() => scrollToSection('preview')}
              className="text-[#C28A74] hover:text-white font-medium shrink-0 flex items-center gap-1"
            >
              <span>View Workflow Simulation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ── 6. REAL PROJECT WORKFLOW PREVIEW (MOCKUP OF ACTUAL APP DATA) ── */}
      <section id="preview" className="py-12 sm:py-16 bg-[#0B0E14] border-b border-[#2B3245]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-3xl mb-8">
            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C05621] mb-1.5">
              Console Demonstration
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Real Project Workflow Simulation
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 leading-relaxed">
              Witness how MineIntel AI processes an actual monthly operational return through extraction, validation checks, grounded LLM insight, and report sign-off.
            </p>
          </div>

          {/* Realistic Console Workflow Container */}
          <div className="rounded-lg border border-[#2B3245] bg-[#12161F] overflow-hidden shadow-sm">
            
            {/* Console Toolbar Header */}
            <div className="bg-[#161B26] px-4 py-3 border-b border-[#2B3245] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#C05621]" />
                <span className="text-xs font-mono font-bold text-white">CASE STUDY: SECL BILASPUR Q3 PRODUCTION RETURN</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-[#1F2430] text-[#94A3B8] border border-[#2B3245]">ID: DOC-7842-SECL</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">VERIFIED DATA</span>
              </div>
            </div>

            {/* 5-Stage Step-by-Step Breakdown */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              
              {/* STAGE 1: DOCUMENT */}
              <div className="p-3.5 rounded bg-[#161B26] border border-[#2B3245] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mb-2">
                    <span>STAGE 01</span>
                    <FileText className="w-3.5 h-3.5 text-[#C05621]" />
                  </div>
                  <div className="text-xs font-bold text-white mb-1">Source Document</div>
                  <p className="text-[11px] text-[#94A3B8] leading-tight mb-2">
                    SECL_Bilaspur_Q3_Return.pdf
                  </p>
                  <div className="text-[10px] font-mono text-[#64748B] space-y-1">
                    <div>Format: Scanned PDF</div>
                    <div>SHA-256: 7f9c...b412</div>
                    <div>Pages: 14 • Engine: OCR</div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#2B3245] text-[10px] text-emerald-400 font-semibold">
                  ✓ Ingestion Complete
                </div>
              </div>

              {/* STAGE 2: EXTRACTION */}
              <div className="p-3.5 rounded bg-[#161B26] border border-[#2B3245] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mb-2">
                    <span>STAGE 02</span>
                    <Database className="w-3.5 h-3.5 text-[#C05621]" />
                  </div>
                  <div className="text-xs font-bold text-white mb-1">Parameter Extraction</div>
                  <div className="space-y-1.5 text-[10px] font-mono text-[#CBD5E1]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Actual:</span>
                      <span className="font-bold text-white">6,000 MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Target:</span>
                      <span className="font-bold text-white">7,600 MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Dispatch:</span>
                      <span className="font-bold text-white">5,700 MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Stripping:</span>
                      <span className="font-bold text-white">2.14 m³/t</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#2B3245] text-[10px] text-emerald-400 font-semibold">
                  ✓ Confidence: 96.4%
                </div>
              </div>

              {/* STAGE 3: VALIDATION */}
              <div className="p-3.5 rounded bg-[#161B26] border border-[#2B3245] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mb-2">
                    <span>STAGE 03</span>
                    <ShieldAlert className="w-3.5 h-3.5 text-[#C05621]" />
                  </div>
                  <div className="text-xs font-bold text-white mb-1">Rule Validation</div>
                  <div className="text-[10px] font-mono mb-2">
                    <span className="text-emerald-400 font-bold">Quality: 92/100</span>
                  </div>
                  <p className="text-[10px] text-amber-400 leading-tight bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                    Warning: Production variance (-21.05%) exceeds standard 10% monthly threshold.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#2B3245] text-[10px] text-amber-400 font-semibold">
                  ⚠ 1 Variance Alert
                </div>
              </div>

              {/* STAGE 4: AI INSIGHT */}
              <div className="p-3.5 rounded bg-[#161B26] border border-[#2B3245] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mb-2">
                    <span>STAGE 04</span>
                    <Brain className="w-3.5 h-3.5 text-[#C05621]" />
                  </div>
                  <div className="text-xs font-bold text-white mb-1">Evidence-Grounded Insight</div>
                  <p className="text-[10px] text-[#CBD5E1] leading-tight mb-2">
                    "Shortfall of 1,600 MT tied to shovel equipment overhaul and bench waterlogging."
                  </p>
                  <div className="text-[9px] font-mono text-[#64748B] bg-[#0B0E14] p-1.5 rounded">
                    Citation: Bilaspur_Q3_Return.pdf • Page 2, Para 4
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#2B3245] text-[10px] text-emerald-400 font-semibold">
                  ✓ Grounded in Document
                </div>
              </div>

              {/* STAGE 5: REPORT & APPROVAL */}
              <div className="p-3.5 rounded bg-[#161B26] border border-[#2B3245] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mb-2">
                    <span>STAGE 05</span>
                    <FileCheck className="w-3.5 h-3.5 text-[#C05621]" />
                  </div>
                  <div className="text-xs font-bold text-white mb-1">Statutory Sign-Off</div>
                  <div className="space-y-1 text-[10px] font-mono text-[#94A3B8] mb-2">
                    <div>1. Drafted by Operator</div>
                    <div>2. Reviewed by Auditor</div>
                    <div className="text-emerald-400 font-semibold">3. Approved by Admin</div>
                  </div>
                  <div className="text-[9px] font-mono text-[#64748B]">
                    Exports: PDF • DOCX • CSV
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#2B3245] text-[10px] text-emerald-400 font-semibold">
                  ✓ Admin Certified
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── 7. EVIDENCE-FIRST SECTION ("EVIDENCE BEFORE ANSWERS") ── */}
      <section id="evidence" className="py-12 sm:py-16 bg-[#12161F] border-b border-[#2B3245]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Narrative */}
            <div className="lg:col-span-5">
              <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C05621] mb-1.5">
                Core Philosophy
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight mb-4">
                Evidence Before Answers: Zero Guesswork Guarantee
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed mb-4">
                Generic conversational models often invent operational metrics, miscalculate stripping ratios, or hallucinate nonexistent circular clauses. MineIntel AI strictly inverts this approach:
              </p>
              
              <div className="space-y-2.5 text-xs text-[#CBD5E1]">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Mathematical calculations</strong> are executed by deterministic code algorithms rather than token probability.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Every AI claim</strong> cites source document identifier, exact page number, and original text excerpt.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Insufficient evidence</strong> triggers an explicit warning rather than speculative generation.</span>
                </div>
              </div>
            </div>

            {/* Right Connected Flow Visualization */}
            <div className="lg:col-span-7">
              <div className="p-4 sm:p-5 rounded-lg border border-[#2B3245] bg-[#161B26] space-y-3">
                <div className="text-xs font-mono font-semibold text-[#94A3B8] uppercase border-b border-[#2B3245] pb-2">
                  Deterministic Evidence Chain
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  
                  <div className="p-2.5 rounded bg-[#12161F] border border-[#2B3245]">
                    <div className="text-[10px] text-[#C05621] font-bold">01 • SOURCE DOCUMENT</div>
                    <div className="text-white font-semibold mt-1">Raw Scanned PDF</div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">Ingested with SHA-256</div>
                  </div>

                  <div className="p-2.5 rounded bg-[#12161F] border border-[#2B3245]">
                    <div className="text-[10px] text-[#C05621] font-bold">02 • EXTRACTION</div>
                    <div className="text-white font-semibold mt-1">Structured Fields</div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">Key-value table cells</div>
                  </div>

                  <div className="p-2.5 rounded bg-[#12161F] border border-[#2B3245]">
                    <div className="text-[10px] text-[#C05621] font-bold">03 • COMPUTATION</div>
                    <div className="text-white font-semibold mt-1">Deterministic Math</div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">Variance &amp; Stripping</div>
                  </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  
                  <div className="p-2.5 rounded bg-[#12161F] border border-[#2B3245]">
                    <div className="text-[10px] text-[#C05621] font-bold">04 • AI SYNTHESIS</div>
                    <div className="text-white font-semibold mt-1">Grounded Reasoning</div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">Gemini 3.6 Flash engine</div>
                  </div>

                  <div className="p-2.5 rounded bg-[#12161F] border border-[#2B3245]">
                    <div className="text-[10px] text-[#C05621] font-bold">05 • CITATION LINK</div>
                    <div className="text-white font-semibold mt-1">Page Provenance</div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">Exact chunk excerpt</div>
                  </div>

                  <div className="p-2.5 rounded bg-[#12161F] border border-[#2B3245]">
                    <div className="text-[10px] text-[#C05621] font-bold">06 • GOVERNANCE</div>
                    <div className="text-white font-semibold mt-1">Admin Sign-Off</div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">Maker-Checker gate</div>
                  </div>

                </div>

                <div className="p-2.5 rounded bg-[#0B0E14] border border-[#2B3245] text-[11px] font-mono text-[#94A3B8]">
                  <span className="text-emerald-400">Response Guardrail: </span>
                  Every answer payload includes <code className="text-amber-400 font-bold">citations: [&#123; documentId, pageNumber, snippet &#125;]</code>.
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 8. GOVERNANCE SECTION (COMPACT ENTERPRISE PANEL) ── */}
      <section id="governance" className="py-12 sm:py-16 bg-[#0B0E14] border-b border-[#2B3245]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-3xl mb-8">
            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C05621] mb-1.5">
              Enterprise Governance
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Designed for Evidence-Grounded and Reviewable Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 leading-relaxed">
              Industrial operations and statutory compliance require institutional accountability. MineIntel AI integrates defensive security and verification controls throughout the data lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {governancePillars.map((gov, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-lg bg-[#12161F] border border-[#2B3245] hover:border-[#C05621]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white">{gov.title}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161B26] text-amber-400 border border-[#2B3245]">
                    {gov.badge}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{gov.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 9. JUDGE-FRIENDLY DIFFERENTIATOR SECTION ── */}
      <section id="about" className="py-12 sm:py-16 bg-[#12161F] border-b border-[#2B3245]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          <div className="max-w-3xl mb-8">
            <div className="inline-block text-[11px] font-mono font-semibold uppercase tracking-wider text-[#C05621] mb-1.5">
              Comparative Impact
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
              From Fragmented Records to Decision-Ready Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-2 leading-relaxed">
              How MineIntel AI transforms standard manual mine reporting into a high-integrity, automated intelligence infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Traditional Operational Friction */}
            <div className="p-5 rounded-lg border border-red-900/30 bg-[#161B26]/80 space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold font-mono">
                <X className="w-4 h-4" />
                <span>TRADITIONAL MINING DOCUMENT WORKFLOW</span>
              </div>
              <ul className="space-y-2 text-xs text-[#94A3B8]">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Disparate paper forms, scanned PDFs, and untracked spreadsheets scattered across site offices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Hours spent transcribing numbers manually with high risk of transposition and unit errors.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Conflicting production figures between field returns, dispatch registers, and weighbridge logs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>Manual compliance compilation requires days of multi-document cross-referencing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span>No auditable chain of custody for figures cited in statutory disclosures.</span>
                </li>
              </ul>
            </div>

            {/* MineIntel AI Solution */}
            <div className="p-5 rounded-lg border border-emerald-900/40 bg-[#161B26]/80 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
                <Check className="w-4 h-4" />
                <span>MINEINTEL AI ENTERPRISE PLATFORM</span>
              </div>
              <ul className="space-y-2 text-xs text-[#CBD5E1]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Multi-format ingestion with cryptographic SHA-256 deduplication and deep Tesseract OCR.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Automated parameter extraction with confidence scoring and human-in-the-loop auditing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>7-category rule validation engine flags unit mismatches and historical variance anomalies.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Autonomous statutory draft generation with Maker-Checker review and Admin sign-off barriers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Immutable audit logging of every query, edit, and export for complete regulatory provenance.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ── 10. CALL TO ACTION SECTION ── */}
      <section className="py-12 sm:py-16 bg-[#0B0E14] border-b border-[#2B3245]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 tracking-tight">
            Access the Coal Operations Intelligence Console
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl mx-auto mb-6 leading-relaxed">
            Authorized personnel can sign in to access live production dashboards, execute autonomous multi-modal document extraction, generate verified reports, and manage administrative approvals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate(user ? dashboardUrl : '/login')}
              className="px-5 py-2.5 rounded-md bg-[#C05621] hover:bg-[#9C4115] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <span>{user ? 'Enter Console' : 'Officer Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => navigate('/admin/login')}
                className="px-4 py-2.5 rounded-md border border-[#2B3245] bg-[#161B26] hover:bg-[#1F2430] text-[#E2E8F0] text-xs sm:text-sm font-medium transition-colors"
              >
                Admin Authority Portal
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER (COMPACT, 90–120px) ── */}
      <footer className="bg-[#0B0E14] text-[#94A3B8] text-xs py-7 sm:py-8 border-t border-[#2B3245]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-5">
          
          {/* LEFT: Branding & SIH identifier */}
          <div className="flex flex-col text-center md:text-left">
            <div className="text-sm font-bold text-[#F1F5F9] tracking-tight">
              MineIntel AI
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-0.5">
              Coal &amp; Mining Intelligence Platform
            </div>
            <div className="text-[10px] text-[#64748B] font-mono mt-1">
              SIH-26023 • Smart India Hackathon 2026
            </div>
          </div>

          {/* CENTER: Clean section links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#94A3B8]">
            <button 
              onClick={() => scrollToSection('capabilities')} 
              className="hover:text-[#F1F5F9] transition-colors"
            >
              Capabilities
            </button>
            <button 
              onClick={() => scrollToSection('workflow')} 
              className="hover:text-[#F1F5F9] transition-colors"
            >
              Workflow
            </button>
            <button 
              onClick={() => scrollToSection('governance')} 
              className="hover:text-[#F1F5F9] transition-colors"
            >
              Governance
            </button>
            <button 
              onClick={() => scrollToSection('about')} 
              className="hover:text-[#F1F5F9] transition-colors"
            >
              About
            </button>
          </div>

          {/* RIGHT: Made by CarbonBits */}
          <div className="text-center md:text-right text-xs text-[#94A3B8]">
            <span>Made with <span className="text-[#C05621]">♥</span> by </span>
            <span className="font-semibold text-[#C05621] hover:text-[#9C4115] transition-colors">
              CarbonBits
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;
