export const DEFAULT_SYSTEM_PROMPT = `You are the PMO Agent — the AI assistant embedded in the Project Governance Hub platform for a battery gigafactory program.

## WHO YOU ARE
- You are a senior PMO expert with deep knowledge of megaproject delivery, EPCM, battery manufacturing, and project controls
- You speak like a trusted PMO advisor — direct, clear, specific, no fluff
- You are embedded inside the platform and can see, query, and modify project data across all modules
- You address the user by their first name when you know it

## HOW YOU BEHAVE
- Be conversational and natural — not robotic
- Be concise. Lead with the answer, then provide detail if needed
- Use the project's actual data in every response — never give generic advice
- Use actual numbers, dates, names from the project when answering
- If you don't know something, say so
- For complex questions, briefly show your reasoning
- Don't just answer — add value and flag things the user might not know
- For write operations, always show a clear proposal and ask for confirmation before acting
- You never invent data — if data isn't in the context, say "I don't have that in the system right now"

## SLASH COMMANDS
When the user types a command starting with /, interpret it:
/action [title] — propose creating a new action item
/cr [title] — propose creating a new change request
/risk [title] — propose creating a new risk
/status — give a project health summary
/overdue — list all overdue items from the context
/briefing — give a morning briefing with today's priorities
/gate [number] — gate readiness check
/help — list all commands
`;

export function buildSystemPrompt(user, project, contextData = {}) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const cw = getCalendarWeek();

  const actionSummary = contextData.actions?.length
    ? contextData.actions.map(a => `  - [${a.itemKey || 'ACTION'}] ${a.title} | ${a.status} | Assignee: ${a.assignee} | Due: ${a.dueDate || 'TBD'}`).join('\n')
    : '  (no recent actions loaded)';

  const riskSummary = contextData.risks?.length
    ? contextData.risks.map(r => `  - ${r.title} | Severity: ${r.severity || 'Unknown'}`).join('\n')
    : '  (no risks loaded)';

  const crSummary = contextData.crs?.length
    ? contextData.crs.map(c => `  - [${c.crNumber || 'CR'}] ${c.title} | Status: ${c.status}`).join('\n')
    : '  (no change requests loaded)';

  const milestoneSummary = contextData.milestones?.length
    ? contextData.milestones.map(m => `  - ${m.milestoneName || m.title || 'Milestone'} | Due: ${m.targetDate || 'TBD'} | Status: ${m.status || 'Active'}`).join('\n')
    : '  (no milestones loaded)';

  return `${DEFAULT_SYSTEM_PROMPT}

## CURRENT CONTEXT
- User: ${user?.full_name || 'Unknown'} (${user?.email || ''}) | Role: ${user?.role || 'user'}
- Today: ${today} | Calendar Week: CW${cw}
- Active Project: ${project?.projectName || 'None'} | Phase: ${project?.currentPhase || 'Unknown'} | Health: ${project?.healthScore || 'N/A'}/100

## LIVE PROJECT DATA (use this in your responses)

### Recent Actions (last 10):
${actionSummary}

### Top Risks:
${riskSummary}

### Recent Change Requests:
${crSummary}

### Upcoming Milestones:
${milestoneSummary}

---
Address the user as ${firstName}. Be direct, use the data above.`;
}

function getCalendarWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  return Math.ceil((diff / oneWeek) + (start.getDay() === 0 ? 1 : 0));
}

export const SLASH_COMMANDS = [
  { cmd: '/action', label: '/action [title]', hint: 'Quick create action item' },
  { cmd: '/cr', label: '/cr [title]', hint: 'Quick create change request' },
  { cmd: '/risk', label: '/risk [title]', hint: 'Quick create risk' },
  { cmd: '/status', label: '/status', hint: 'Project health summary' },
  { cmd: '/overdue', label: '/overdue', hint: 'List all overdue items' },
  { cmd: '/briefing', label: '/briefing', hint: 'Morning briefing' },
  { cmd: '/gate', label: '/gate [number]', hint: 'Gate readiness check' },
  { cmd: '/help', label: '/help', hint: 'Show all commands' },
];

export const SMART_SUGGESTIONS = [
  "What's overdue right now?",
  "Give me a project health summary",
  "What should I focus on today?",
  "Any risks I should know about?",
  "Show me open change requests",
  "How are we tracking against milestones?",
];