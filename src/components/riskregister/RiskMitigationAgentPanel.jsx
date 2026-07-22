import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, ShieldCheck, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AGENT_NAME = 'RiskMitigationAgent';

function buildChecklistContext(actionItems, checklists) {
  const byAction = {};
  checklists.forEach(c => {
    if (!byAction[c.actionItemId]) byAction[c.actionItemId] = [];
    byAction[c.actionItemId].push(c);
  });

  const lines = [];
  actionItems.forEach(a => {
    const steps = byAction[a.id] || [];
    if (steps.length === 0) return;
    lines.push(`### [${a.itemKey || 'ACTION'}] ${a.title}`);
    lines.push(`- Status: ${a.status} | Assignee: ${a.assignee || 'Unassigned'} | Due: ${a.dueDate || 'TBD'} | Priority: ${a.priority || '-'}`);
    steps
      .slice()
      .sort((x, y) => (x.sortOrder || 0) - (y.sortOrder || 0))
      .forEach(s => {
        const overdue = s.dueDate && !s.isChecked && new Date(s.dueDate) < new Date() ? ' ⚠️ OVERDUE' : '';
        lines.push(`  - [${s.isChecked ? 'x' : ' '}] ${s.checklistText}${s.assignee ? ` (owner: ${s.assignee})` : ''}${s.dueDate ? ` (due: ${s.dueDate})` : ''}${overdue}`);
      });
  });
  return lines.join('\n');
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex items-start gap-2 justify-end">
        <div className="max-w-[80%] px-3 py-2 rounded-2xl text-sm" style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(248,113,113,0.3)', color: '#e2e8f0' }}>
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none flex-shrink-0" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(248,113,113,0.3)' }}>
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
      </div>
      <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.08)', color: '#cbd5e1' }}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold" style={{ color: '#CADCFC' }}>{children}</strong>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1" style={{ color: '#f87171' }}>{children}</h3>,
            code: ({ children }) => <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>{children}</code>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default function RiskMitigationAgentPanel({ open, onClose, projectId, projectName }) {
  const qc = useQueryClient();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Pre-fetch the project's action items + all checklists to seed the agent
  const { data: actionItems = [] } = useQuery({
    queryKey: ['action-items', projectId],
    queryFn: () => base44.entities.ActionItem.filter({ projectId }, '-created_date', 50),
    enabled: open && !!projectId,
  });
  const { data: checklists = [] } = useQuery({
    queryKey: ['action-checklists'],
    queryFn: () => base44.entities.ActionChecklist.list('-created_date', 200),
    enabled: open,
  });

  const projectChecklists = React.useMemo(() => {
    const ids = new Set(actionItems.map(a => a.id));
    return checklists.filter(c => ids.has(c.actionItemId));
  }, [actionItems, checklists]);

  // Start a conversation + send the seeded review request when the panel opens
  useEffect(() => {
    if (!open || !projectId || conversation || initializing) return;
    if (actionItems.length === 0) return; // wait until action items loaded
    setInitializing(true);

    (async () => {
      try {
        const ctx = buildChecklistContext(actionItems, projectChecklists);
        const seed = `Project: ${projectName} (id: ${projectId})

Here are the current ActionChecklist items for this project:

${ctx || '(no checklist steps found on any action item)'}

Review these checklist items and provide proactive risk mitigation strategies. Identify the latent risks implied by incomplete/overdue/unassigned steps, group them by risk level (Critical → Low), and for each give a concrete mitigation plan the PMO can act on now.`;

        const conv = base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: `Risk review — ${projectName}`, projectId },
        });
        setConversation(conv);
        setIsThinking(true);
        base44.agents.addMessage(conv, { role: 'user', content: seed });
      } catch (err) {
        setInitializing(false);
      }
    })();
  }, [open, projectId, actionItems, projectChecklists, conversation, initializing, projectName]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      const last = (data.messages || [])[data.messages.length - 1];
      if (last && last.role === 'assistant') setIsThinking(false);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Reset state when panel closes
  useEffect(() => {
    if (!open) {
      setConversation(null);
      setMessages([]);
      setInput('');
      setIsThinking(false);
      setInitializing(false);
    }
  }, [open]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isThinking || !conversation) return;
    const text = input.trim();
    setInput('');
    setIsThinking(true);
    base44.agents.addMessage(conversation, { role: 'user', content: text });
  }, [input, isThinking, conversation]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Invalidate risks when the conversation has produced an assistant reply (in case the agent created risks)
  useEffect(() => {
    if (messages.some(m => m.role === 'assistant')) {
      qc.invalidateQueries({ queryKey: ['risks', projectId] });
    }
  }, [messages.length, projectId]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{ width: 'min(92vw, 520px)', background: '#080d1a', borderLeft: '1px solid rgba(202,220,252,0.1)', boxShadow: '-8px 0 30px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(202,220,252,0.08)', background: 'rgba(5,8,20,0.6)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(248,113,113,0.3)' }}>
              <ShieldCheck className="w-4 h-4" style={{ color: '#f87171' }} />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#CADCFC' }}>Risk Mitigation Advisor</div>
              <div className="text-[11px]" style={{ color: '#64748b' }}>
                Reviews action checklists · proactive risk strategies
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-opacity hover:opacity-80" style={{ color: '#64748b' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {messages.length === 0 && !isThinking && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Loader2 className="w-6 h-6 mx-auto animate-spin mb-3" style={{ color: '#f87171' }} />
                <div className="text-sm" style={{ color: '#64748b' }}>Preparing your checklist review…</div>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isThinking && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(248,113,113,0.3)' }}>
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#f87171' }} />
              </div>
              <div className="flex items-center gap-1 px-3 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.08)' }}>
                <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-none px-4 pb-4 pt-2" style={{ borderTop: '1px solid rgba(202,220,252,0.08)' }}>
          <div className="flex items-end gap-2 rounded-2xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.12)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isThinking ? 'Advisor is analyzing…' : 'Ask to refine, or say "log the top risk"…'}
              disabled={isThinking}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
              style={{ color: '#e2e8f0', minHeight: '24px', maxHeight: '120px', scrollbarWidth: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="flex-none w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: input.trim() && !isThinking ? 'linear-gradient(135deg,#dc2626,#f87171)' : 'rgba(202,220,252,0.06)',
                color: input.trim() && !isThinking ? '#fff' : '#475569',
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}