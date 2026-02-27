import React, { useState, useRef, useEffect } from 'react';
import { Send, Slash } from 'lucide-react';
import { SLASH_COMMANDS, SMART_SUGGESTIONS } from './agentUtils';

export default function AgentInputBar({ onSend, isThinking, activeProject }) {
  const [text, setText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }
    if (e.key === 'Escape') setShowCommands(false);
    if (showCommands) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (val.startsWith('/')) {
      setShowCommands(true);
      setCommandFilter(val.slice(1).toLowerCase());
    } else {
      setShowCommands(false);
    }
  };

  const handleSend = () => {
    if (!text.trim() || isThinking) return;
    onSend(text.trim());
    setText('');
    setShowCommands(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleCommandSelect = (cmd) => {
    setText(cmd + ' ');
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const handleSuggestion = (s) => {
    if (!isThinking) onSend(s);
  };

  const filteredCommands = SLASH_COMMANDS.filter(c =>
    c.cmd.slice(1).startsWith(commandFilter)
  );

  return (
    <div className="flex-none px-4 pb-4 pt-2" style={{ borderTop: '1px solid rgba(202,220,252,0.07)' }}>
      {/* Smart suggestions */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {SMART_SUGGESTIONS.slice(0, 4).map((s, i) => (
          <button
            key={i}
            onClick={() => handleSuggestion(s)}
            disabled={isThinking}
            className="flex-none text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all hover:opacity-80"
            style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Slash command menu */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="mb-2 rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(167,139,250,0.25)' }}>
          {filteredCommands.map(c => (
            <button
              key={c.cmd}
              onClick={() => handleCommandSelect(c.cmd)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-violet-500/10 transition-colors"
            >
              <span className="text-xs font-mono font-bold" style={{ color: '#a78bfa' }}>{c.label}</span>
              <span className="text-xs" style={{ color: '#64748b' }}>{c.hint}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(202,220,252,0.12)' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isThinking ? 'PMO Agent is thinking…' : `Ask anything about ${activeProject?.projectName || 'the project'}… or type / for commands`}
          disabled={isThinking}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
          style={{ color: '#e2e8f0', minHeight: '24px', maxHeight: '160px', scrollbarWidth: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || isThinking}
          className="flex-none w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: text.trim() && !isThinking ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' : 'rgba(202,220,252,0.06)',
            color: text.trim() && !isThinking ? '#fff' : '#475569',
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <div className="text-[10px] mt-1.5 text-center" style={{ color: '#334155' }}>
        Enter to send · Shift+Enter for new line · / for commands
      </div>
    </div>
  );
}