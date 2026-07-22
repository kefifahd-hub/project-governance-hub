import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Calculator, Loader2, X, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AGENT_NAME = 'FinanceModelingAgent';

function buildOverheadContext(overheads) {
  if (!overheads || overheads.length === 0) return '(no overhead assumption lines on this model)';
  const lines = overheads.map((o, i) =>
    `${i + 1}. [${o.category || '-'}] ${o.lineItem} — basis: ${o.costBasis || '-'}, amount: ${o.amount ?? '-'} (id: ${o.id})`
  );
  return lines.join('\n');
}

function buildScenarioContext(scenarios) {
  if (!scenarios || scenarios.length === 0) return '(no saved NPV scenarios)';
  const lines = scenarios.map((s, i) =>
    `${i + 1}. ${s.scenarioName} — capex €${s.capexEurM ?? '-'}M, opex €${s.annualOpexEurM ?? '-'}M, revenue €${s.annualRevenueEurM ?? '-'}M, disc ${s.discountRatePercent ?? '-'}%, ${s.projectDurationYears ?? '-'}y → NPV €${s.npvResultEurM?.toFixed?.(1) ?? '-'}M, payback ${s.paybackPeriodYears?.toFixed?.(1) ?? '-'}y, viable ${s.isViable} (id: ${s.id})`
  );
  return lines.join('\n');
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex items-start gap-2 justify-end">
        <div className="max-w-[80%] px-3 py-2 rounded-2xl text-sm" style={{ background: 'rgba(2,128,144,0.2)', border: '1px solid rgba(0,168,150,0.3)', color: '#e2e8f0' }}>
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none flex-shrink-0" style={{ background: 'rgba(0,168,150,0.15)', border: '1px solid rgba(0,168,150,0.3)' }}>
        <Calculator className="w-3.5 h-3.5" style={{ color: '#5eead4' }} />
      </div>
      <div className="max-w-[85%] px-3 py-2 rounded-2xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.08)', color: '#cbd5e1' }}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold" style={{ color: '#CADCFC' }}>{children}</strong>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1" style={{ color: '#5eead4' }}>{children}</h3>,
            table: ({ children }) => <table className="w-full text-xs my-2 border-collapse">{children}</table>,
            th: ({ children }) => <th className="border px-2 py-1 text-left" style={{ borderColor: 'rgba(202,220,252,0.15)', color: '#CADCFC' }}>{children}</th>,
            td: ({ children }) => <td className="border px-2 py-1" style={{ borderColor: 'rgba(202,220,252,0.1)' }}>{children}</td>,
            code: ({ children }) => <code className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(0,168,150,0.15)', color: '#5eead4' }}>{children}</code>,
          }}
        >
          {message.content}
        </ReactMarkdown>
        {message.tool_calls?.map((tc, idx) => (
          <div key={idx} className="mt-1 text-[11px]" style={{ color: '#64748b' }}>
            ⟳ {tc.name} — {tc.status}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FinanceModelingAgentPanel({ open, onClose, projectId, projectName, modelId, modelName }) {
  const qc = useQueryClient();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: overheads = [] } = useQuery({
    queryKey: ['overheads', modelId],
    queryFn: () => base44.entities.OverheadAssumptions.filter({ financeModelId: modelId }),
    enabled: open && !!modelId,
  });
  const { data: scenarios = [] } = useQuery({
    queryKey: ['scenarios', projectId],
    queryFn: () => base44.entities.NPVScenario.filter({ projectId }),
    enabled: open && !!projectId,
  });

  const ready = !!projectId && (!modelId || overheads.length >= 0);

  useEffect(() => {
    if (!open || !projectId || conversation || initializing) return;
    if (modelId && overheads === undefined) return;
    if (scenarios === undefined) return;
    setInitializing(true);

    (async () => {
      try {
        const seed = `Project: ${projectName || '-'} (id: ${projectId})
Finance Model: ${modelName || '(none — NPV Calculator context)'}${modelId ? ` (id: ${modelId})` : ''}

## Current OverheadAssumptions
${buildOverheadContext(overheads)}

## Existing NPVScenarios
${buildScenarioContext(scenarios)}

Help me model financial outcomes. You can modify OverheadAssumptions (cost lines) and NPVScenario records. Summarize the current state briefly, then ask what I'd like to model (e.g. cut opex 10%, stress-test discount rate, build an optimistic/conservative scenario, improve NPV).`;

        const conv = base44.agents.createConversation({
          agent_name: AGENT_NAME,
          metadata: { name: `Finance modeling — ${projectName || projectId}`, projectId },
        });
        setConversation(conv);
        setIsThinking(true);
        base44.agents.addMessage(conv, { role: 'user', content: seed });
      } catch (err) {
        setInitializing(false);
      }
    })();
  }, [open, projectId, modelId, overheads, scenarios, conversation, initializing, projectName, modelName]);

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

  useEffect(() => {
    if (!open) {
      setConversation(null);
      setMessages([]);
      setInput('');
      setIsThinking(false);
      setInitializing(false);
    }
  }, [open]);

  // Invalidate finance data when the agent has replied (it may have written records)
  useEffect(() => {
    if (messages.some(m => m.role === 'assistant')) {
      if (modelId) qc.invalidateQueries({ queryKey: ['overheads', modelId] });
      qc.invalidateQueries({ queryKey: ['scenarios', projectId] });
    }
  }, [messages.length, modelId, projectId]);

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

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{ width: 'min(92vw, 520px)', background: '#080d1a', borderLeft: '1px solid rgba(202,220,252,0.1)', boxShadow: '-8px 0 30px rgba(0,0,0,0.5)' }}
      >
        <div className="flex-none flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(202,220,252,0.08)', background: 'rgba(5,8,20,0.6)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,168,150,0.15)', border: '1px solid rgba(0,168,150,0.3)' }}>
              <TrendingUp className="w-4 h-4" style={{ color: '#5eead4' }} />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#CADCFC' }}>Finance Modeling Assistant</div>
              <div className="text-[11px]" style={{ color: '#64748b' }}>
                Models overheads &amp; NPV scenarios · AI-driven
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-opacity hover:opacity-80" style={{ color: '#64748b' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {messages.length === 0 && !isThinking && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Loader2 className="w-6 h-6 mx-auto animate-spin mb-3" style={{ color: '#5eead4' }} />
                <div className="text-sm" style={{ color: '#64748b' }}>Loading your finance model context…</div>
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
          {isThinking && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none" style={{ background: 'rgba(0,168,150,0.15)', border: '1px solid rgba(0,168,150,0.3)' }}>
                <Calculator className="w-3.5 h-3.5" style={{ color: '#5eead4' }} />
              </div>
              <div className="flex items-center gap-1 px-3 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.08)' }}>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex-none px-4 pb-4 pt-2" style={{ borderTop: '1px solid rgba(202,220,252,0.08)' }}>
          <div className="flex items-end gap-2 rounded-2xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.12)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isThinking ? 'Modeling…' : 'e.g. "Cut opex 10% and show the new NPV", then "apply"'}
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
                background: input.trim() && !isThinking ? 'linear-gradient(135deg,#028090,#00A896)' : 'rgba(202,220,252,0.06)',
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