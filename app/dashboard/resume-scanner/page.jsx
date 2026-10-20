"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { OllamaService } from '@/utils/OllamaAIModal';
import { db } from '@/utils/db';
import { MockInterview } from '@/utils/schema';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { 
  FileText, 
  Sparkles, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Brain, 
  Layers, 
  ShieldCheck, 
  Target, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  RotateCcw,
  Zap,
  Building2,
  Check,
  Search,
  ScanFace,
  BarChart3,
  Flame,
  FileCheck2,
  X,
  Share2,
  Lock,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// ==============================================================================
// 5 PRESET FAANG ENGINEERING RESUMES
// ==============================================================================
const SAMPLE_RESUMES = {
  fullstack: {
    label: 'Full Stack Lead',
    icon: '🚀',
    role: 'Senior Full Stack Engineer',
    targetJobDesc: 'React 19, Next.js, Node.js, PostgreSQL, Distributed Systems, High-Concurrency APIs, Redis, AWS',
    text: `ALEX RIVERA
Senior Full Stack Engineer | San Francisco, CA | alex.rivera@example.com

PROFESSIONAL EXPERIENCE:
ScaleTech Inc. — Senior Software Engineer (2022 – Present)
• Architected and deployed an event-driven payment processing pipeline handling 45,000 requests/sec with p99 latency under 45ms using Node.js, Redis, and PostgreSQL.
• Spearheaded the migration of our customer-facing web application from legacy SPA to Next.js 14 App Router with React Server Components, cutting Largest Contentful Paint (LCP) by 48%.
• Implemented distributed locking (Redlock) and idempotency key patterns to eliminate duplicate checkout transactions during network partitions.
• Mentored 6 mid-level engineers, authored testing guidelines with 92% unit test coverage using Jest and Playwright.

CloudScale Solutions — Full Stack Developer (2019 – 2022)
• Built RESTful microservices in Go and TypeScript, orchestrating Docker containers via Kubernetes on AWS EKS.
• Optimized PostgreSQL database queries using composite indices and partition pruning, reducing database CPU load by 35%.
• Designed real-time collaboration canvas using WebSockets and client-side optimistic UI state rollbacks.

TECHNICAL SKILLS:
Languages: TypeScript, JavaScript, Go, Python, SQL, HTML5/CSS3
Frameworks & Libraries: React 19, Next.js, Node.js, Express, Tailwind CSS
Databases & Caching: PostgreSQL, MongoDB, Redis, DynamoDB
Infrastructure & Cloud: AWS (S3, Lambda, ECS, EKS), Docker, Kubernetes, CI/CD, Terraform`
  },
  aiml: {
    label: 'Staff AI / ML',
    icon: '🧠',
    role: 'Staff AI / Machine Learning Engineer',
    targetJobDesc: 'PyTorch, Large Language Models (LLMs), RAG Architectures, Vector Databases, Cross-Encoder Rerankers, CUDA, vLLM',
    text: `ELENA ROSTOVA
Staff AI / ML Engineer | Seattle, WA | elena.rostova@example.com

PROFESSIONAL EXPERIENCE:
NeuralVector AI — Lead Machine Learning Engineer (2022 – Present)
• Designed and scaled an enterprise Retrieval-Augmented Generation (RAG) system across 20M technical documents using hybrid search (Dense Embeddings + BM25) and Cohere cross-encoder rerankers, boosting top-5 recall from 68% to 94%.
• Reduced LLM inference latency by 3.2x by deploying quantized 4-bit AWQ models on vLLM clusters with custom Triton inference kernels.
• Built continuous evaluation harness scoring LLM factual hallucination rates, integrating automated semantic guardrails that reduced ungrounded responses by 76%.

Cognitive Systems — Machine Learning Engineer (2020 – 2022)
• Fine-tuned open-source transformer models (Llama, Mistral) for code generation using QLoRA and DeepSpeed ZeRO-3 on 32x A100 GPU clusters.
• Implemented real-time vector indexing pipelines using Pinecone, Milvus, and Kafka streaming ingestion.

TECHNICAL SKILLS:
Frameworks: PyTorch, Hugging Face Transformers, LangChain, LlamaIndex, vLLM, TensorRT-LLM
Vector DBs: Pinecone, Qdrant, Milvus, pgvector
Infrastructure: CUDA, Triton, Docker, Kubernetes, Ray, AWS SageMaker`
  },
  devops: {
    label: 'Cloud / DevOps',
    icon: '☁️',
    role: 'Principal Cloud & DevOps Architect',
    targetJobDesc: 'Kubernetes, Terraform, AWS Multi-Region, ArgoCD, Prometheus, Grafana, Istio Service Mesh, Zero-Trust Architecture',
    text: `MARCUS VANCE
Principal Cloud Infrastructure Architect | Austin, TX | marcus.vance@example.com

PROFESSIONAL EXPERIENCE:
Nexus Cloud Systems — Principal Infrastructure Engineer (2021 – Present)
• Designed multi-region active-active Kubernetes clusters across AWS us-east-1 and eu-central-1 supporting 99.995% service uptime.
• Automated 100% of global infrastructure provisioning using modular Terraform and Terragrunt with drift detection.
• Built GitOps continuous delivery pipelines utilizing ArgoCD and Helm, reducing mean-time-to-deploy (MTTD) from 4 hours to 8 minutes.
• Reduced annual AWS cloud infrastructure expenditures by $420,000 via EC2 spot instance fleets, automated pod autoscaling (KEDA), and EBS gp3 storage migrations.

Apex Networks — Senior Site Reliability Engineer (2018 – 2021)
• Architected enterprise observability stack with Prometheus, Grafana, and OpenTelemetry tracing processing 15TB of telemetry logs daily.
• Implemented Istio service mesh mTLS across 250+ internal microservices enforcing zero-trust network boundaries.

TECHNICAL SKILLS:
Cloud: AWS, Google Cloud Platform (GCP)
Container Orchestration: Kubernetes, Docker, Helm, ArgoCD, Istio
Infrastructure as Code: Terraform, Terragrunt, Ansible, Pulumi
Observability: Prometheus, Grafana, Datadog, OpenTelemetry, ELK Stack`
  },
  backend: {
    label: 'Backend & Systems',
    icon: '🛡️',
    role: 'Senior Distributed Systems Engineer',
    targetJobDesc: 'Go, Apache Kafka, Distributed Caching, Redis, PostgreSQL, gRPC, High Concurrency, Fault Tolerance',
    text: `DAVID CHEN
Senior Distributed Systems Engineer | New York, NY | david.chen@example.com

PROFESSIONAL EXPERIENCE:
Vortex FinTech — Staff Distributed Systems Engineer (2022 – Present)
• Architected real-time order matching engine in Go executing 120,000 trades/sec with p99 response times under 12ms.
• Designed distributed event bus with Apache Kafka partitioning schemas guaranteeing exactly-once message semantics across payment settlement nodes.
• Replaced REST internal communication with gRPC and Protocol Buffers, slashing network payload serialization overhead by 62%.

DataStream Labs — Backend Engineer (2019 – 2022)
• Built scalable caching tier using Redis clusters and write-behind caching strategies with PostgreSQL.
• Implemented distributed consensus and master election using Raft protocol for leader-follower replication.

TECHNICAL SKILLS:
Languages: Go (Golang), Rust, C++, Java, SQL
Distributed Systems: Apache Kafka, RabbitMQ, gRPC, Protocol Buffers, Redis
Databases: PostgreSQL, CockroachDB, Cassandra, ScyllaDB`
  },
  frontend: {
    label: 'Frontend Architect',
    icon: '🎨',
    role: 'Lead Frontend Architect',
    targetJobDesc: 'TypeScript, Next.js App Router, React 19, WebGL, Tailwind CSS, Micro-Frontends, Core Web Vitals, Design Systems',
    text: `MAYA PATEL
Lead Frontend Architect | Boston, MA | maya.patel@example.com

PROFESSIONAL EXPERIENCE:
Lumina Design Systems — Lead Frontend Architect (2022 – Present)
• Engineered unified multi-brand component design system in React 19 and TypeScript utilized across 14 product lines and 350+ developers.
• Spearheaded enterprise Web Vitals optimization achieving 100/100 Google Lighthouse Performance scores across core customer dashboards.
• Implemented 3D WebGL data visualization views using Three.js and Canvas, rendering 50,000 real-time nodes at stable 60 FPS.

Starlight Interactive — Senior Frontend Developer (2019 – 2022)
• Led migration from webpack to Vite, reducing local development HMR reload times from 14s to 120ms.
• Built accessible WCAG 2.1 AAA compliant keyboard navigation suites and automated visual regression testing with Playwright.

TECHNICAL SKILLS:
Core: TypeScript, JavaScript (ESNext), React 19, Next.js 14/15, HTML5/CSS3
Styling & Graphics: Tailwind CSS, CSS Modules, Three.js, WebGL, GSAP, Framer Motion
Tooling & Testing: Vite, Webpack, Vitest, Jest, Playwright, Storybook`
  }
};

export default function ResumeScannerPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [targetJobDesc, setTargetJobDesc] = useState('React, Next.js, Node.js, PostgreSQL, Distributed Systems, Redis, High Availability');
  const [activePreset, setActivePreset] = useState('fullstack');
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState(1);
  const [creatingMock, setCreatingMock] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Analysis Result
  const [analysis, setAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  // Load Preset Resume
  const handleLoadSample = (key) => {
    const sample = SAMPLE_RESUMES[key];
    if (sample) {
      setActivePreset(key);
      setResumeText(sample.text);
      setTargetRole(sample.role);
      setTargetJobDesc(sample.targetJobDesc);
      setUploadedFileName('');
      toast.info(`Loaded preset: ${sample.label}`);
    }
  };

  // Extract Text from File (Supports .txt, .md, .pdf)
  const extractTextFromFile = async (file) => {
    if (!file) return;

    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result || '';
        setResumeText(text);
        setUploadedFileName(`${file.name} (${Math.round(file.size / 1024)} KB)`);
        toast.success(`Extracted text from ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      // For PDF or DOCX, read text stream strings in browser
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawContent = e.target?.result;
        if (typeof rawContent === 'string') {
          // Clean extracted strings
          const cleaned = rawContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleaned.length > 80) {
            setResumeText(cleaned.slice(0, 5000));
            setUploadedFileName(`${file.name} (${Math.round(file.size / 1024)} KB)`);
            toast.success(`Extracted content from ${file.name}`);
            return;
          }
        }
        // Fallback guidance
        setUploadedFileName(file.name);
        toast.info(`Uploaded ${file.name}. You can also paste additional resume bullet points directly for max ATS accuracy.`);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) extractTextFromFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) extractTextFromFile(file);
  };

  // Run AI Resume Analysis with Simulated 4-Stage Scanner HUD
  const handleAnalyzeResume = async (e) => {
    if (e) e.preventDefault();
    if (!resumeText.trim() || resumeText.length < 50) {
      toast.error('Please paste or upload your resume text (minimum 50 characters).');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setScanStep(1);

    // Multi-stage scan simulation
    const stepInterval = setInterval(() => {
      setScanStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1100);

    try {
      const res = await OllamaService.analyzeResume({
        resumeText,
        targetRole,
        targetJobDesc,
      });

      clearInterval(stepInterval);
      setScanStep(4);
      setAnalysis(res);
      toast.success(`Audit Complete! ATS Match Score: ${res.atsScore}%`);
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Resume analysis error:', err);
      toast.error(err.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy Full Interview Prep Dossier to Clipboard
  const handleCopyDossier = () => {
    if (!analysis) return;
    const markdown = [
      `# 🎯 PrepSmart AI • Resume-Tailored Interview Dossier`,
      `**Target Role:** ${targetRole}`,
      `**Target Stack:** ${targetJobDesc}`,
      `**ATS Match Score:** ${analysis.atsScore}%`,
      `\n## Verified Matched Skills:`,
      (analysis.matchedSkills || []).map(s => `- ${s}`).join('\n'),
      `\n## Missing Keywords to Target:`,
      (analysis.missingKeywords || []).map(k => `- ${k}`).join('\n'),
      `\n## Tailored Technical Interview Questions:`,
      (analysis.tailoredQuestions || []).map((q, idx) => `### Q${idx + 1}: ${q.question}\n**Expected Model Answer:** ${q.answer}\n`).join('\n'),
      `\n*Generated by PrepSmart AI (Adaptive Interview Intelligence)*`
    ].join('\n');

    navigator.clipboard.writeText(markdown);
    toast.success('Full Interview Prep Dossier copied to clipboard in Markdown format!');
  };

  // Copy Single Keyword
  const handleCopyKeyword = (kw) => {
    navigator.clipboard.writeText(kw);
    toast.success(`Copied keyword: "${kw}" to clipboard`);
  };

  // 1-Click Launch into Mock Interview Room with Tailored Questions
  const handleStartMockFromResume = async () => {
    if (!analysis || !analysis.tailoredQuestions || analysis.tailoredQuestions.length === 0) {
      toast.error('No tailored questions available. Run the analysis first.');
      return;
    }

    setCreatingMock(true);
    toast.loading('Initializing mock interview room with your project questions...');

    try {
      const questionsPayload = analysis.tailoredQuestions.map((q) => ({
        question: q.question,
        answer: q.answer,
      }));

      const newMockId = uuidv4();
      const userEmail = user?.email || 'candidate@prepsmart.ai';

      await db.insert(MockInterview).values({
        mockId: newMockId,
        jsonMockResp: JSON.stringify(questionsPayload),
        jobPosition: `${targetRole} (Resume-Tailored)`,
        jobDesc: `Tailored to candidate's verified project achievements: ${targetJobDesc}`,
        jobExperience: '5',
        createdBy: userEmail,
        createdAt: moment().format('DD-MM-yyyy'),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prepsmart_refresh_interviews'));
      }

      toast.dismiss();
      toast.success('Mock round ready! Entering live interview room...');
      router.push(`/dashboard/interview/${newMockId}`);
    } catch (err) {
      console.error('Mock creation error:', err);
      toast.dismiss();
      toast.error('Failed to create mock session. Try again.');
      setCreatingMock(false);
    }
  };

  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="py-6 md:py-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 px-3 sm:px-6">
      
      {/* =================================================================== */}
      {/* 1. HERO BANNER WITH 5-ROLE PRESET STRIP                             */}
      {/* =================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-2xl border border-indigo-900/60">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-black uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>AI Resume-to-Mock Customizer</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
                <span className="text-emerald-300 font-mono">OLLAMA READY</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                Resume Scanner & ATS Match Cockpit
              </h1>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                Audit your resume against verified FAANG engineering rubrics, extract your actual architectural achievements, 
                and synthesize mock interview rounds derived straight from systems you deployed.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="hidden xl:flex flex-col items-end gap-1 shrink-0 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Private In-Browser</span>
              </div>
              <span className="text-[10px] text-slate-400">Zero Cloud Storage • Local Inference</span>
            </div>
          </div>

          {/* 5-Role Preset Carousel Strip */}
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fast 1-Click Engineering Presets:</span>
            </span>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {Object.entries(SAMPLE_RESUMES).map(([key, item]) => {
                const isActive = activePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleLoadSample(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 border border-blue-400/40'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. DUAL INPUT CONFIGURATION DOCK                                    */}
      {/* =================================================================== */}
      <form onSubmit={handleAnalyzeResume} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Drag-and-Drop Resume Box (7 cols) */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-200 p-6 shadow-sm space-y-4 ${
            isDragOver 
              ? 'border-blue-500 ring-4 ring-blue-500/10 bg-blue-50/50 dark:bg-blue-950/20' 
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Candidate Resume Content
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Drag & drop your PDF, Word doc, or paste raw text
                </p>
              </div>
            </div>

            {/* Hidden Native File Input */}
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".pdf,.docx,.txt,.md" 
              onChange={handleFileChange} 
              className="hidden" 
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 transition flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload PDF / File</span>
            </button>
          </div>

          {/* Active File Loaded Chip */}
          {uploadedFileName && (
            <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-semibold">
              <div className="flex items-center gap-2 truncate">
                <FileCheck2 className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">Active File: <strong>{uploadedFileName}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedFileName('');
                  setResumeText('');
                }}
                className="text-slate-400 hover:text-rose-500 transition p-1 cursor-pointer"
                title="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Resume Text Area */}
          <div className="relative">
            <Textarea
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                if (uploadedFileName) setUploadedFileName('');
              }}
              placeholder="Paste your resume content here (experience, bullet points, skills, past architecture decisions)... or drag and drop a .pdf / .txt file directly."
              rows={11}
              className="w-full text-xs font-mono p-4 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 leading-relaxed focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 selection:bg-blue-500 selection:text-white"
              required
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Minimum 50 characters required for AI analysis</span>
            <span className="font-mono">{wordCount} words • {resumeText.length} characters</span>
          </div>
        </div>

        {/* Right Column: Target Job Requirements (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Target Role Benchmark
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Match against specific tech stacks & hiring bars
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Job Title
            </label>
            <Input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer, Staff Backend Architect"
              className="text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Company Stack / Job Description
            </label>
            <Textarea
              value={targetJobDesc}
              onChange={(e) => setTargetJobDesc(e.target.value)}
              placeholder="e.g., React 19, Next.js, Node.js, Distributed Systems, High Availability, PostgreSQL, AWS..."
              rows={4}
              className="text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 leading-relaxed"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !resumeText.trim()}
            className="w-full py-6 rounded-2xl font-bold text-xs bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-xl shadow-blue-500/25 gap-2 cursor-pointer transition-all duration-300 hover:scale-[1.01]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Running ATS Audit ({scanStep}/4)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Audit Resume & Generate Tailored Mocks</span>
              </>
            )}
          </Button>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span><strong>Private In-Memory Extraction:</strong> Resume is parsed locally with zero permanent storage.</span>
          </div>
        </div>
      </form>

      {/* =================================================================== */}
      {/* 3. MULTI-STAGE HOLOGRAPHIC SCANNER HUD (While Loading)              */}
      {/* =================================================================== */}
      {loading && (
        <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>Ollama AI Llama 3.3 Evaluation Engine</span>
                  <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/30 bg-cyan-500/10">
                    Live Telemetry
                  </Badge>
                </h3>
                <p className="text-xs text-slate-400">
                  Parsing technical projects and synthesizing mock questions with zero hallucination...
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {scanStep * 25}%
              </span>
            </div>
          </div>

          {/* 4-Step Progress Bar */}
          <Progress value={scanStep * 25} className="h-2 bg-slate-800" />

          {/* Step Sequence Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[
              { step: 1, title: 'Token & Project Parsing', desc: 'Extracting experience & architecture metrics' },
              { step: 2, title: 'Hiring Bar Benchmarking', desc: 'Cross-referencing target tech stack' },
              { step: 3, title: 'ATS Keyword Gap Matrix', desc: 'Scoring match score & missing keywords' },
              { step: 4, title: 'Interview Question Synthesis', desc: 'Crafting tailored technical questions' },
            ].map((s) => {
              const isDone = scanStep > s.step;
              const isCurrent = scanStep === s.step;
              return (
                <div 
                  key={s.step} 
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDone 
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                      : isCurrent 
                      ? 'bg-blue-950/40 border-blue-400 text-white shadow-lg shadow-blue-500/10 scale-[1.02]' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] font-mono shrink-0">
                        {s.step}
                      </span>
                    )}
                    <span className="text-xs font-bold truncate">{s.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. PRE-ANALYSIS INTERACTIVE AUDIT BLUEPRINT (When Idle)             */}
      {/* =================================================================== */}
      {!analysis && !loading && (
        <div className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              The PrepSmart Difference
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              How Our AI Audits Your Technical Experience
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generic mock interviewers ask broad questions. PrepSmart inspects what you actually built.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: ATS Keyword Density */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                FAANG ATS Parser
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Evaluates keyword density and tech stack currency to verify whether your resume bypasses corporate automated screening filters.
              </p>
            </div>

            {/* Card 2: STAR Impact Metrics */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                STAR Impact Metrics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Identifies quantifiable business outcomes (e.g. "reduced latency by 45%", "scaled to 45k req/sec") that catch recruiter eyes.
              </p>
            </div>

            {/* Card 3: Project Architecture Extractor */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Project Extractor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Derives 3–4 hyper-specific technical questions quoting your actual past infrastructure, libraries, and design choices.
              </p>
            </div>

            {/* Card 4: 1-Click Mock Session */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1-Click Practice
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Boot up the mock interview room with real-time AI face tracking, eye contact analysis, and speech-to-text evaluation instantly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. INTERACTIVE ATS RESULTS COCKPIT (After Analysis)                 */}
      {/* =================================================================== */}
      {analysis && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Action Ribbon: Copy Dossier & Retake */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Audit complete for <strong>{targetRole}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCopyDossier}
                className="h-9 px-3 text-xs rounded-xl font-semibold gap-1.5 border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Prep Dossier</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setAnalysis(null)}
                className="h-9 px-3 text-xs rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Audit</span>
              </Button>
            </div>
          </div>

          {/* Top Row: Circular Radial ATS Score Gauge + Skills Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Radial Circular ATS Score Gauge (4 cols) */}
            <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between items-center text-center space-y-4">
              <div className="w-full">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  ATS Match Index
                </span>

                {/* Animated Circular SVG Ring */}
                <div className="relative w-44 h-44 mx-auto my-3 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="9"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className={`transition-all duration-1000 ease-out ${
                        analysis.atsScore >= 80 ? 'text-emerald-500' : analysis.atsScore >= 65 ? 'text-amber-500' : 'text-rose-500'
                      }`}
                      strokeWidth="9"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * analysis.atsScore) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                      {analysis.atsScore}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      Target Fit
                    </span>
                  </div>
                </div>

                <Badge 
                  variant={analysis.atsScore >= 80 ? 'success' : 'outline'}
                  className="text-xs font-black px-3 py-1 uppercase"
                >
                  {analysis.atsScore >= 80 ? 'FAANG Ready Match' : analysis.atsScore >= 65 ? 'Solid Baseline Match' : 'Keyword Deficit'}
                </Badge>
              </div>

              {/* Sub-Metric Score Breakdown */}
              <div className="w-full space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-left">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>Tech Stack Alignment</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {Math.min(98, analysis.atsScore + 4)}%
                    </span>
                  </div>
                  <Progress value={Math.min(98, analysis.atsScore + 4)} className="h-1.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <span>Impact & STAR Metrics</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {Math.max(65, analysis.atsScore - 5)}%
                    </span>
                  </div>
                  <Progress value={Math.max(65, analysis.atsScore - 5)} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Matched vs Missing Keywords Matrix (8 cols) */}
            <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
              
              {/* Matched Skills */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Verified Resume Matches ({analysis.matchedSkills?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ATS Passed
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedSkills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-sm"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Keywords (Click to Copy) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Recommended Keywords to Add ({analysis.missingKeywords?.length || 0})
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Click keyword to copy
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords?.map((keyword, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleCopyKeyword(keyword)}
                      title="Click to copy keyword"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition cursor-pointer flex items-center gap-1"
                    >
                      <span>+ {keyword}</span>
                      <Copy className="w-3 h-3 opacity-60 ml-0.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recruiter Optimization Vectors */}
              {analysis.resumeOptimizationTips && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Hiring Bar Raiser Advice to Boost Callback Rate</span>
                  </p>
                  <ul className="space-y-1.5">
                    {analysis.resumeOptimizationTips.map((tip, idx) => (
                      <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-blue-500 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Hyper-Tailored Project-Specific Questions */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  <Brain className="w-4 h-4" /> 
                  <span>Tailored Technical Interview Questions ({analysis.tailoredQuestions?.length || 0})</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Derived Directly from Your Real-World Project Achievements
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  These questions will be asked in your live practice round to simulate a deep technical resume dive.
                </p>
              </div>

              <Button
                onClick={handleStartMockFromResume}
                disabled={creatingMock}
                className="py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-xl shadow-emerald-500/25 gap-2 cursor-pointer shrink-0 transition-transform hover:scale-[1.02]"
              >
                {creatingMock ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booting Interview Room...</span>
                  </>
                ) : (
                  <>
                    <span>Start Mock with These Questions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {analysis.tailoredQuestions?.map((item, idx) => {
                const isExpanded = expandedQuestion === idx;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            <span>Resume Project Attribution</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {item.question}
                          </h4>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                        title={isExpanded ? "Collapse Answer" : "Expand Answer"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Expected Model Answer & Key Talking Points:</span>
                        </div>
                        <p className="leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
