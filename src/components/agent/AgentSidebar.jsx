import React from 'react';
import { Plus, MessageSquare, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString('en-GB', { weekday: 'short' });
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function AgentSidebar({ conversations, activeConvId, onSelect, onNew, projects, currentProjectId, onProjectChange }) {
  const active = conversations.filter(c => !c.is_archived);

  return (
    <div className="flex-none flex flex-col" style={{ width: '240px', background: 'rgba(5,8,20,0.8)', borderRight: '1px solid rgba(202,220,252,0.07)' }}>
      {/* Project selector */}
      <div className="px-3 pt-4 pb-2">
        <div className="text-[10px] font-semibold mb-2 tracking-widest" style={{ color: '#475569' }}>PROJECT</div>
        <Select value={currentProjectId || ''} onValueChange={onProjectChange}>
          <SelectTrigger className="h-8 text-xs" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(202,220,252,0.12)', color: '#CADCFC' }}>
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent style={{ background: '#0f172a', borderColor: 'rgba(202,220,252,0.15)' }}>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.id} style={{ color: '#CADCFC' }}>{p.projectName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* New conversation button */}
      <div className="px-3 pb-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New conversation
        </button>
      </div>

      <div className="px-3 mb-2">
        <div className="text-[10px] font-semibold tracking-widest" style={{ color: '#475569' }}>RECENT</div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(202,220,252,0.06) transparent' }}>
        {active.length === 0 && (
          <div className="px-2 py-4 text-xs text-center" style={{ color: '#334155' }}>No conversations yet</div>
        )}
        {active.map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className="w-full flex items-start gap-2 px-2 py-2.5 rounded-lg mb-0.5 text-left transition-all hover:opacity-80"
            style={{
              background: conv.id === activeConvId ? 'rgba(167,139,250,0.12)' : 'transparent',
              border: conv.id === activeConvId ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
            }}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-none mt-0.5" style={{ color: conv.id === activeConvId ? '#a78bfa' : '#475569' }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: conv.id === activeConvId ? '#CADCFC' : '#94a3b8' }}>
                {conv.title || 'Conversation'}
              </div>
              <div className="text-[10px]" style={{ color: '#475569' }}>{formatTime(conv.last_message_at)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}