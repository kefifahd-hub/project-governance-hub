import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, Wrench, BrainCircuit, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '../utils';

const FEATURE_GROUPS = [
  {
    group: 'Initiation & Planning',
    items: [
      { name: 'Project Charter', desc: 'Define purpose, objectives, scope, deliverables, sponsor, PM and approval status for a project.' },
      { name: 'Stakeholder Register', desc: 'Map stakeholders with influence/interest, current vs desired engagement, and engagement strategy.' },
      { name: 'WBS', desc: 'Build the Work Breakdown Structure — phases, deliverables and work packages with owners and budgets.' },
      { name: 'RACI Matrix', desc: 'Assign Responsible, Accountable, Consulted and Informed roles per activity or deliverable.' },
      { name: 'Requirements', desc: 'Capture and track requirements (functional, technical, regulatory) with priority and acceptance criteria.' },
      { name: 'Communications Plan', desc: 'Define who receives what information, how often, via which channel, and who owns it.' },
      { name: 'Quality Gates', desc: 'Manage the 0–7 quality gate lifecycle: status, decision authority, checklists, reserves and evidence.' },
      { name: 'SWOT Analysis', desc: 'Run a 2×2 Strengths / Weaknesses / Opportunities / Threats analysis per project.' },
    ],
  },
  {
    group: 'Execution & Control',
    items: [
      { name: 'Action Tracker', desc: 'Track actions, issues, decisions, RFIs and punch-list items across buckets, phases and assignees.' },
      { name: 'Risk Register', desc: 'Log risks with probability × impact scoring, category, owner, mitigation plan and target closure date.' },
      { name: 'RAID Log', desc: 'Maintain Assumptions, Issues and Dependencies with impact, owner, due date and resolution.' },
      { name: 'Change Management', desc: 'Raise and route change requests through review (technical, finance, schedule) to approval and implementation.' },
      { name: 'Change Workflow / Workflow Builder', desc: 'Design visual approval workflows with configurable node types and stages.' },
      { name: 'Budget Tracking', desc: 'Track planned vs actual spend by category and month, with variance status.' },
      { name: 'QA/QC', desc: 'Manage FAT, SAT, inspections and audits, plus non-conformities and their corrective actions.' },
      { name: 'Schedule Monitoring', desc: 'Monitor schedule activities, critical path, float, S-curve progress and Monte Carlo risk.' },
      { name: 'Schedule Sync', desc: 'Register Primavera P6 / MS Project sources, import versions, map WBS and review deltas.' },
      { name: 'Weekly Reports', desc: 'Produce structured weekly reports with RAG status across schedule, cost, risk and quality.' },
    ],
  },
  {
    group: 'Strategy & Finance',
    items: [
      { name: 'Site Selection', desc: 'Score candidate sites against weighted criteria (ownership, plot, utilities, infrastructure, workforce, incentives).' },
      { name: 'Feasibility Study', desc: 'Run the 11-tab feasibility assessment and produce a go / no-go recommendation with NPV and IRR.' },
      { name: 'Finance Model', desc: 'Build the full gigafactory financial model — capex, BOM, revenue, headcount, overheads, DCF and P&L.' },
      { name: 'FEED Tracker', desc: 'Track Front-End Engineering Design items across the five FEED phases.' },
      { name: 'NPV Calculator', desc: 'Run NPV scenarios (base, optimistic, conservative) with payback and viability checks.' },
      { name: 'Client Briefing', desc: 'Generate a one-page executive briefing and download it for stakeholders.' },
    ],
  },
  {
    group: 'AI & Automation',
    items: [
      { name: 'Brainiac', desc: 'Visual neural-network canvas mapping the platform modules, synapses and processing rules.' },
      { name: 'PMO Agent', desc: 'Conversational PMO advisor that reads live project data and can create actions, risks and change requests.' },
      { name: 'AI Governance Wizard', desc: 'Guided AI assistant to set up and optimise the governance framework for a project.' },
    ],
  },
];

export default function UserManual() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      <div style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl('Home'))} className="mb-4" style={{ color: '#CADCFC' }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex items-center gap-3">
            <Wrench className="w-7 h-7" style={{ color: '#00A896' }} />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#CADCFC' }}>Feature User Manual</h1>
              <p className="mt-1 text-sm" style={{ color: '#94A3B8' }}>A guide to every tool in the PMO Governance Platform.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Highlighted new feature */}
        <Card className="ring-1 ring-red-500/30" style={{ background: 'rgba(220,38,38,0.08)', borderColor: 'rgba(248,113,113,0.3)' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" style={{ color: '#f87171' }} />
              <CardTitle className="flex items-center gap-2" style={{ color: '#CADCFC' }}>
                Risk Mitigation Advisor
                <Badge className="animate-pulse" style={{ background: 'rgba(248,113,113,0.2)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}>
                  <Sparkles className="w-3 h-3 mr-1" /> New
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm" style={{ color: '#cbd5e1' }}>
            <p>
              An AI risk advisor built into the <strong style={{ color: '#CADCFC' }}>Risk Register</strong>. Open any project's
              Risk Register and tap the red <em>Mitigation Advisor</em> button (look for the pulsing notification dot).
            </p>
            <p><strong style={{ color: '#CADCFC' }}>What it does:</strong></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Reads the project's <strong>ActionChecklist</strong> steps (the checklists attached to your action items).</li>
              <li>Surfaces latent risks implied by incomplete, overdue or unassigned checklist steps.</li>
              <li>Groups findings by risk level (Critical → Low) with a category, probability × impact, and rationale for each.</li>
              <li>Delivers a concrete, <strong>proactive mitigation plan</strong> the PMO can act on now — before the risk materialises.</li>
              <li>Can log a proposed risk straight into the register when you confirm it.</li>
            </ul>
            <p><strong style={{ color: '#CADCFC' }}>How to use:</strong></p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Open the Risk Register for a project.</li>
              <li>Tap <em>Mitigation Advisor</em> — a chat panel slides in and auto-reviews your current checklists.</li>
              <li>Read the prioritised risk findings and mitigation strategies.</li>
              <li>Ask it to refine, or say "log the top risk" to add it to the register.</li>
            </ol>
          </CardContent>
        </Card>

        {/* Other features */}
        {FEATURE_GROUPS.map((grp) => (
          <div key={grp.group}>
            <div className="flex items-center gap-2 mb-3">
              {grp.group === 'AI & Automation' ? <Bot className="w-4 h-4" style={{ color: '#a78bfa' }} /> : <Wrench className="w-4 h-4" style={{ color: '#00A896' }} />}
              <h2 className="text-lg font-semibold" style={{ color: '#CADCFC' }}>{grp.group}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grp.items.map((item) => (
                <Card key={item.name} style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}>
                  <CardContent className="p-4">
                    <div className="font-medium mb-1" style={{ color: '#CADCFC' }}>{item.name}</div>
                    <div className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{item.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center text-xs pt-4" style={{ color: '#475569' }}>
          PMO Governance Platform · Feature User Manual
        </div>
      </div>
    </div>
  );
}