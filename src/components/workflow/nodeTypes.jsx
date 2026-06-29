import {
  PlayCircle,
  ListTodo,
  FileText,
  Eye,
  CheckCircle2,
  GitBranch,
  ArrowRightLeft,
  StopCircle,
} from 'lucide-react';

export const NODE_TYPES = {
  start: {
    label: 'Start',
    icon: PlayCircle,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.15)',
    description: 'Workflow trigger point',
  },
  task: {
    label: 'Task',
    icon: ListTodo,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.15)',
    description: 'An action or work item',
  },
  document: {
    label: 'Document',
    icon: FileText,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.15)',
    description: 'Create or update a document',
  },
  review: {
    label: 'Review',
    icon: Eye,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    description: 'Peer or technical review',
  },
  approval: {
    label: 'Approval',
    icon: CheckCircle2,
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.15)',
    description: 'Gate requiring sign-off',
  },
  decision: {
    label: 'Decision',
    icon: GitBranch,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.15)',
    description: 'Branch based on a condition',
  },
  handover: {
    label: 'Handover',
    icon: ArrowRightLeft,
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.15)',
    description: 'Transfer ownership or deliverable',
  },
  end: {
    label: 'End',
    icon: StopCircle,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.15)',
    description: 'Workflow completion',
  },
};

export const PALETTE_ORDER = ['start', 'task', 'document', 'review', 'approval', 'decision', 'handover', 'end'];

export function makeNode(type) {
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    label: NODE_TYPES[type].label,
    assignee: '',
    description: NODE_TYPES[type].description,
    durationDays: 0,
    condition: '',
  };
}

export const WORKFLOW_TEMPLATES = [
  {
    category: 'Handover',
    name: 'Project Handover Workflow',
    description: 'Standard handover from one phase/team to another',
    nodes: [
      { type: 'start', label: 'Initiate Handover', assignee: 'Project Manager', durationDays: 0 },
      { type: 'document', label: 'Prepare Handover Document', assignee: 'PMO Lead', durationDays: 3 },
      { type: 'task', label: 'Verify Deliverables Complete', assignee: 'Quality Manager', durationDays: 2 },
      { type: 'review', label: 'Technical Review of Handover Package', assignee: 'Engineering Lead', durationDays: 2 },
      { type: 'approval', label: 'Handover Sign-off', assignee: 'Project Sponsor', durationDays: 1 },
      { type: 'handover', label: 'Transfer Ownership to Operations', assignee: 'Operations Director', durationDays: 1 },
      { type: 'end', label: 'Handover Complete', assignee: 'Project Manager', durationDays: 0 },
    ],
  },
  {
    category: 'Document Creation',
    name: 'Document Creation & Approval',
    description: 'Create, review, and approve a project document',
    nodes: [
      { type: 'start', label: 'Document Request', assignee: 'Requestor', durationDays: 0 },
      { type: 'document', label: 'Draft Document', assignee: 'Technical Writer', durationDays: 5 },
      { type: 'review', label: 'Peer Review', assignee: 'Subject Matter Expert', durationDays: 2 },
      { type: 'task', label: 'Incorporate Comments', assignee: 'Technical Writer', durationDays: 1 },
      { type: 'approval', label: 'Formal Approval', assignee: 'Document Owner', durationDays: 1 },
      { type: 'document', label: 'Publish & Archive', assignee: 'Document Controller', durationDays: 1 },
      { type: 'end', label: 'Document Released', assignee: 'Document Controller', durationDays: 0 },
    ],
  },
  {
    category: 'Design Review',
    name: 'Design Review Workflow',
    description: 'Formal design review with gates and decision points',
    nodes: [
      { type: 'start', label: 'Design Package Ready', assignee: 'Design Lead', durationDays: 0 },
      { type: 'document', label: 'Distribute Review Package', assignee: 'PMO Lead', durationDays: 1 },
      { type: 'review', label: 'Discipline Reviews (Multi)', assignee: 'Discipline Leads', durationDays: 5 },
      { type: 'task', label: 'Consolidate Review Comments', assignee: 'Design Coordinator', durationDays: 2 },
      { type: 'decision', label: 'Proceed or Rework?', assignee: 'Review Chair', durationDays: 1, condition: 'Comments resolved?' },
      { type: 'approval', label: 'Design Approval Gate', assignee: 'Engineering Manager', durationDays: 1 },
      { type: 'end', label: 'Design Released for Next Phase', assignee: 'Design Lead', durationDays: 0 },
    ],
  },
  {
    category: 'Approval Process',
    name: 'Change Request Approval',
    description: 'Multi-stage CR review and approval chain',
    nodes: [
      { type: 'start', label: 'CR Submitted', assignee: 'Requestor', durationDays: 0 },
      { type: 'review', label: 'Technical Impact Assessment', assignee: 'Engineering Lead', durationDays: 3 },
      { type: 'review', label: 'Cost & Schedule Impact', assignee: 'Project Controls', durationDays: 2 },
      { type: 'decision', label: 'CRB Decision', assignee: 'Change Review Board', durationDays: 1, condition: 'Approve / Reject / Defer' },
      { type: 'approval', label: 'Sponsor Approval', assignee: 'Project Sponsor', durationDays: 2 },
      { type: 'document', label: 'Update Project Baselines', assignee: 'PMO Lead', durationDays: 2 },
      { type: 'end', label: 'CR Implemented', assignee: 'Project Manager', durationDays: 0 },
    ],
  },
];