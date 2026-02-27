import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-none" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
        <span className="text-sm">🤖</span>
      </div>
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.08)' }}>
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[75%] px-4 py-3 rounded-2xl text-sm" style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.3)', color: '#e2e8f0' }}>
          {message.content}
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-none text-xs font-bold" style={{ background: 'rgba(202,220,252,0.1)', color: '#CADCFC' }}>
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-none" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
        <span className="text-sm">🤖</span>
      </div>
      <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.08)', color: '#cbd5e1' }}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold" style={{ color: '#CADCFC' }}>{children}</strong>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            h1: ({ children }) => <h1 className="text-base font-bold mb-2" style={{ color: '#CADCFC' }}>{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm font-bold mb-1" style={{ color: '#CADCFC' }}>{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1" style={{ color: '#a78bfa' }}>{children}</h3>,
            code: ({ inline, children }) =>
              inline
                ? <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>{children}</code>
                : <pre className="p-3 rounded-lg text-xs overflow-x-auto mb-2" style={{ background: 'rgba(0,0,0,0.3)', color: '#94a3b8' }}><code>{children}</code></pre>,
            blockquote: ({ children }) => <blockquote className="border-l-2 border-violet-500 pl-3 italic" style={{ color: '#94a3b8' }}>{children}</blockquote>,
            table: ({ children }) => (
              <div className="overflow-x-auto mb-2">
                <table className="w-full text-xs border-collapse">{children}</table>
              </div>
            ),
            th: ({ children }) => <th className="text-left px-2 py-1 font-semibold" style={{ color: '#CADCFC', borderBottom: '1px solid rgba(202,220,252,0.15)' }}>{children}</th>,
            td: ({ children }) => <td className="px-2 py-1" style={{ borderBottom: '1px solid rgba(202,220,252,0.06)', color: '#94a3b8' }}>{children}</td>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default function AgentChatMessages({ messages, isThinking }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 0 12px #a78bfa)' }}>🤖</div>
          <div className="text-xl font-bold mb-2" style={{ color: '#CADCFC' }}>PMO Agent</div>
          <div className="text-sm mb-6" style={{ color: '#64748b' }}>
            Your AI advisor for this program. Ask me anything — actions, risks, finance, schedule, change requests, gate readiness.
          </div>
          <div className="text-xs" style={{ color: '#475569' }}>Type a message or use / for commands</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(202,220,252,0.1) transparent' }}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {isThinking && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}