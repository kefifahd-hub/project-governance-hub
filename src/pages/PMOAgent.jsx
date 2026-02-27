import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import AgentChatMessages from '@/components/agent/AgentChatMessages';
import AgentInputBar from '@/components/agent/AgentInputBar';
import AgentSidebar from '@/components/agent/AgentSidebar';
import { buildSystemPrompt } from '@/components/agent/agentUtils';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PMOAgent() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvId = searchParams.get('conv');

  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.filter({ status: 'Active' }, '-created_date'),
  });
  const { data: conversations = [], refetch: refetchConvs } = useQuery({
    queryKey: ['agent-conversations'],
    queryFn: () => base44.entities.AgentConversation.filter({ user_email: user?.email || '' }, '-last_message_at', 30),
    enabled: !!user?.email,
  });

  const activeConversation = conversations.find(c => c.id === activeConvId) || null;
  const activeProject = projects.find(p => p.id === currentProjectId) || projects[0] || null;

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation?.messages) {
      try {
        setMessages(JSON.parse(activeConversation.messages));
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeConvId, activeConversation?.id]);

  // Set project from first available
  useEffect(() => {
    if (projects.length > 0 && !currentProjectId) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projects]);

  const startNewConversation = () => {
    setSearchParams({});
    setMessages([]);
  };

  const saveConversation = async (msgs, convId) => {
    const title = msgs[0]?.content?.slice(0, 60) || 'New conversation';
    const data = {
      user_email: user?.email || '',
      project_id: activeProject?.id || '',
      messages: JSON.stringify(msgs),
      last_message_at: new Date().toISOString(),
      message_count: msgs.length,
      title,
    };
    if (convId) {
      await base44.entities.AgentConversation.update(convId, data);
      return convId;
    } else {
      const created = await base44.entities.AgentConversation.create(data);
      return created.id;
    }
  };

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || isThinking) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsThinking(true);

    // Gather live project context
    let contextData = {};
    try {
      const [actions, risks, crs, milestones] = await Promise.all([
        base44.entities.ActionItem.filter({ projectId: activeProject?.id }, '-due_date', 10).catch(() => []),
        base44.entities.Risk.list('-created_date', 5).catch(() => []),
        base44.entities.ChangeRequest.filter({ projectId: activeProject?.id }, '-created_date', 5).catch(() => []),
        base44.entities.Milestone.filter({ projectId: activeProject?.id }, '-created_date', 5).catch(() => []),
      ]);
      contextData = { actions, risks, crs, milestones };
    } catch {}

    const systemPrompt = buildSystemPrompt(user, activeProject, contextData);

    // Build message history for AI (last 20 messages for context)
    const historyForAI = nextMessages.slice(-20).map(m => `${m.role === 'user' ? 'User' : 'PMO Agent'}: ${m.content}`).join('\n\n');

    let aiResponse = '';
    try {
      const fullResult = await base44.integrations.Core.InvokeLLM({
        prompt: `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n\n[CONVERSATION]\n${historyForAI}\n\nRespond as PMO Agent now. Be concise, use the project data above, lead with the answer.`,
      });
      aiResponse = typeof fullResult === 'string' ? fullResult : JSON.stringify(fullResult);
    } catch (err) {
      aiResponse = "I'm having trouble connecting right now. Please try again in a moment.";
    }

    const assistantMsg = { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() };
    const finalMessages = [...nextMessages, assistantMsg];
    setMessages(finalMessages);
    setIsThinking(false);

    // Persist
    const savedId = await saveConversation(finalMessages, activeConvId);
    if (!activeConvId) {
      setSearchParams({ conv: savedId });
    }
    refetchConvs();
  }, [messages, isThinking, user, activeProject, activeConvId]);

  const handleSelectConv = (id) => {
    setSearchParams({ conv: id });
  };

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)', background: '#080d1a' }}>
      {/* Sidebar */}
      <AgentSidebar
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={handleSelectConv}
        onNew={startNewConversation}
        projects={projects}
        currentProjectId={currentProjectId}
        onProjectChange={setCurrentProjectId}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(202,220,252,0.07)', background: 'rgba(5,8,20,0.6)' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl" style={{ filter: 'drop-shadow(0 0 6px #a78bfa)' }}>🤖</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#CADCFC' }}>PMO Agent</div>
              <div className="text-xs" style={{ color: '#64748b' }}>
                {activeProject ? `${activeProject.projectName} · ${activeProject.currentPhase}` : 'No project selected'}
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={startNewConversation} style={{ color: '#64748b', gap: '4px' }}>
            <Plus className="w-4 h-4" />New
          </Button>
        </div>

        {/* Messages */}
        <AgentChatMessages messages={messages} isThinking={isThinking} />

        {/* Input */}
        <AgentInputBar onSend={handleSend} isThinking={isThinking} activeProject={activeProject} />
      </div>
    </div>
  );
}