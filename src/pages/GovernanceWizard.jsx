import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Send, Loader2, ArrowLeft, Bot, User, CheckCircle2, FileText, Users, ListTree, Grid3x3, Mail, AlertOctagon, ShieldCheck, ClipboardList, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '../utils';

const DOC_LINKS = [
  { key: 'charter', label: 'Project Charter', icon: FileText, page: 'ProjectCharter', color: '#6366f1' },
  { key: 'stakeholders', label: 'Stakeholder Register', icon: Users, page: 'StakeholderRegister', color: '#06b6d4' },
  { key: 'wbs', label: 'WBS', icon: ListTree, page: 'WBS', color: '#f59e0b' },
  { key: 'raci', label: 'RACI Matrix', icon: Grid3x3, page: 'RaciMatrix', color: '#ec4899' },
  { key: 'communication', label: 'Communication Plan', icon: Mail, page: 'CommunicationPlan', color: '#10b981' },
  { key: 'raid', label: 'RAID Log', icon: AlertOctagon, page: 'RaidLog', color: '#ef4444' },
  { key: 'qualityGates', label: 'Quality Gates', icon: ShieldCheck, page: 'QualityGates', color: '#8b5cf6' },
  { key: 'requirements', label: 'Requirements', icon: ClipboardList, page: 'Requirements', color: '#14b8a6' },
];

export default function GovernanceWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [readyToGenerate, setReadyToGenerate] = useState(false);
  const [contextSummary, setContextSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [genError, setGenError] = useState(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const r = await base44.entities.Project.filter({ id: projectId });
      return r[0];
    },
    enabled: !!projectId,
  });

  // Initial greeting
  useEffect(() => {
    if (projectId && messages.length === 0) {
      const projectName = project?.projectName || 'your project';
      const projectType = project?.projectType || '';
      const greeting = `Hello! I'm your AI Governance Assistant. I'll help you build a complete set of governance documents for **${projectName}**${projectType ? ` (${projectType})` : ''}.

To get started, tell me about your project:
- What are you building?
- What's the scope and main objectives?
- Who are the key stakeholders?
- What's the timeline and budget?

The more you share, the better I can generate your Project Charter, Stakeholder Register, WBS, RACI Matrix, Communication Plan, RAID Log, Quality Gates, and Requirements.`;
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [projectId, project]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await base44.functions.invoke('governanceAI', {
        mode: 'interview',
        message: userMsg.content,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        projectId,
      });
      const data = response.data;
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.ready_to_generate) {
        setReadyToGenerate(true);
        setContextSummary(data.context_summary);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}. Please try again.` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const response = await base44.functions.invoke('governanceAI', {
        mode: 'generate',
        projectContext: contextSummary,
        projectId,
      });
      setGenerationResult(response.data);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
        <div className="text-center">
          <Wand2 className="w-12 h-12 mx-auto mb-4 text-purple-400" />
          <p className="mb-4" style={{ color: '#94A3B8' }}>Please select a project first to use the Governance Wizard.</p>
          <Button onClick={() => navigate(createPageUrl('Home'))} style={{ background: '#7c3aed', color: '#F8FAFC' }}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 flex flex-col" style={{ background: 'linear-gradient(135deg, #1E2761 0%, #0F172A 100%)' }}>
      {/* Header */}
      <div className="shadow-sm sticky top-14 z-30" style={{ background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(202, 220, 252, 0.1)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl(`Home?id=${projectId}`))} style={{ color: '#CADCFC' }}>
              <ArrowLeft className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg text-white">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: '#CADCFC' }}>AI Governance Wizard</h1>
                <p className="text-xs hidden sm:block" style={{ color: '#94A3B8' }}>{project?.projectName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      {!generationResult && (
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
          <div className="flex-1 space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'text-slate-100'}`}
                  style={msg.role === 'assistant' ? { background: 'rgba(30, 39, 97, 0.8)', border: '1px solid rgba(202, 220, 252, 0.1)' } : {}}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(30, 39, 97, 0.8)', border: '1px solid rgba(202, 220, 252, 0.1)' }}>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm" style={{ color: '#94A3B8' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Generate Button */}
          {readyToGenerate && (
            <Card className="mb-4" style={{ background: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(167, 139, 250, 0.3)' }}>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium" style={{ color: '#CADCFC' }}>I have enough context to generate your governance documents!</span>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', color: '#F8FAFC' }}
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" /> Generate All Documents</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {genError && (
            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              Error: {genError}
            </div>
          )}

          {/* Input Bar */}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Describe your project, scope, stakeholders..."
              rows={1}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'rgba(30, 39, 97, 0.8)', border: '1px solid rgba(202, 220, 252, 0.2)', color: '#F8FAFC', minHeight: '48px', maxHeight: '120px' }}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ background: '#7c3aed', color: '#F8FAFC' }}
              className="rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Generation Results */}
      {generationResult && (
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6">
          <Card className="mb-6" style={{ background: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(74, 222, 128, 0.3)' }}>
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <h2 className="text-xl font-bold mb-2" style={{ color: '#CADCFC' }}>Governance Documents Generated!</h2>
              <p className="text-sm" style={{ color: '#94A3B8' }}>Your project governance framework is ready. Review and refine each document below.</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {DOC_LINKS.map(doc => {
              const Icon = doc.icon;
              const count = generationResult.summary?.[doc.key] || 0;
              return (
                <Card
                  key={doc.key}
                  className="cursor-pointer hover:-translate-y-1 transition-transform"
                  style={{ background: 'rgba(30, 39, 97, 0.5)', borderColor: 'rgba(202, 220, 252, 0.1)' }}
                  onClick={() => navigate(createPageUrl(`${doc.page}?id=${projectId}`))}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2.5 rounded-lg" style={{ background: `${doc.color}20` }}>
                      <Icon className="w-5 h-5" style={{ color: doc.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold" style={{ color: '#CADCFC' }}>{doc.label}</h3>
                      <p className="text-xs" style={{ color: '#94A3B8' }}>{count} {count === 1 ? 'item' : 'items'} generated</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate(createPageUrl(`ProjectDashboard?id=${projectId}`))}
              style={{ background: '#00A896', color: '#F8FAFC' }}
            >
              Go to Project Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setGenerationResult(null);
                setReadyToGenerate(false);
                setContextSummary('');
              }}
              style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}
            >
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}