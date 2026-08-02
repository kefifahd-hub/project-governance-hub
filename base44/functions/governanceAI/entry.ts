import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SYSTEM_PROMPT = `You are an expert PMO governance assistant for large-scale process engineering and capital projects (battery gigafactories, data centers, industrial plants).
You help project managers create professional governance documents: Project Charter, Stakeholder Register, WBS, RACI Matrix, Communication Plan, RAID Log, Quality Gates, and Requirements.
When interviewing, ask focused questions ONE AT A TIME to understand: project type, scope, objectives, key deliverables, timeline, budget, stakeholders, risks, quality requirements, and team structure.
Keep responses concise and professional. After 3-5 exchanges, suggest generating the full governance document set.
Use realistic, industry-appropriate stakeholder names and roles (e.g., "Dr. Sarah Chen - VP Engineering", "Marcus Weber - Construction Director").`;

const DOC_LABELS = {
  charter: 'Project Charter',
  stakeholders: 'Stakeholder Register',
  wbs: 'Work Breakdown Structure',
  raci: 'RACI Matrix',
  communication: 'Communication Plan',
  raid: 'RAID Log',
  qualityGates: 'Quality Gates',
  requirements: 'Requirements Register',
  swot: 'SWOT Analysis',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { mode, message, conversationHistory, projectContext, projectId, documentType, currentContent, optimizeInstruction } = body;

    // ── INTERVIEW MODE ──
    if (mode === 'interview') {
      const historyText = (conversationHistory || [])
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const prompt = `${SYSTEM_PROMPT}

Conversation so far:
${historyText}

User: ${message}

Respond as the PMO assistant. If you have gathered enough context to generate governance documents (project type, scope, key stakeholders, timeline, budget, main risks), set ready_to_generate to true and briefly summarize the key context you've gathered. Otherwise, ask the next most important question. Ask only ONE question at a time.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            reply: { type: 'string', description: 'Your conversational response to the user' },
            ready_to_generate: { type: 'boolean', description: 'Whether enough context has been gathered to generate governance documents' },
            context_summary: { type: 'string', description: 'Structured summary of gathered project context for generation' },
          },
          required: ['reply', 'ready_to_generate', 'context_summary'],
        },
      });

      return Response.json(result);
    }

    // ── GENERATE MODE ──
    if (mode === 'generate') {
      const projectInfo = projectId
        ? await base44.asServiceRole.entities.Project.filter({ id: projectId }).then(r => r[0])
        : null;

      const fullContext = `Project from database: ${JSON.stringify(projectInfo || {})}
Additional context from user interview:
${projectContext}`;

      const prompt = `${SYSTEM_PROMPT}

Based on the project context below, generate a complete set of governance documents. Return structured JSON.
Generate realistic, professional content appropriate for the project type.
- Charter: comprehensive single document with all fields filled
- Stakeholders: 5-8 stakeholders with realistic names, roles, companies, influence/interest levels, engagement strategies
- WBS: 6-10 elements with proper hierarchical codes (1, 1.1, 1.2, 2, 2.1, etc.), types, owners, budgets
- RACI: 8-15 assignments mapping roles to activities with R/A/C/I responsibility
- Communication: 5-8 plan entries with audience, info, frequency, channel
- RAID: 5-10 items (mix of assumptions, issues, dependencies) with impact, status, owner
- Quality Gates: 6-8 gates (Gate 0 through Gate 7) with names, owners, criteria
- Requirements: 5-10 requirements with codes (REQ-001, etc.), types, priorities, acceptance criteria

Project Context:
${fullContext}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            charter: {
              type: 'object',
              properties: {
                purpose: { type: 'string' },
                objectives: { type: 'string' },
                successCriteria: { type: 'string' },
                scopeIncluded: { type: 'string' },
                scopeExcluded: { type: 'string' },
                deliverables: { type: 'string' },
                milestonesSummary: { type: 'string' },
                estimatedBudgetEurM: { type: 'number' },
                assumptions: { type: 'string' },
                constraints: { type: 'string' },
                risksSummary: { type: 'string' },
                sponsor: { type: 'string' },
                projectManager: { type: 'string' },
                stakeholdersSummary: { type: 'string' },
              },
            },
            stakeholders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stakeholderName: { type: 'string' },
                  role: { type: 'string' },
                  company: { type: 'string' },
                  category: { type: 'string', enum: ['Internal', 'External'] },
                  influence: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                  interest: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                  engagementCurrent: { type: 'string', enum: ['Unaware', 'Resistant', 'Neutral', 'Supportive', 'Leading'] },
                  engagementDesired: { type: 'string', enum: ['Unaware', 'Resistant', 'Neutral', 'Supportive', 'Leading'] },
                  engagementStrategy: { type: 'string' },
                  contact: { type: 'string' },
                },
              },
            },
            wbs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  wbsCode: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  elementType: { type: 'string', enum: ['Phase', 'Deliverable', 'Work Package'] },
                  owner: { type: 'string' },
                  status: { type: 'string', enum: ['Not Started', 'In Progress', 'Complete'] },
                  budgetEurK: { type: 'number' },
                },
              },
            },
            raci: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  activity: { type: 'string' },
                  wbsCode: { type: 'string' },
                  roleName: { type: 'string' },
                  responsibility: { type: 'string', enum: ['R', 'A', 'C', 'I'] },
                  notes: { type: 'string' },
                },
              },
            },
            communication: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  audience: { type: 'string' },
                  information: { type: 'string' },
                  purpose: { type: 'string' },
                  frequency: { type: 'string', enum: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Milestone', 'Ad-hoc'] },
                  channel: { type: 'string', enum: ['Email', 'Meeting', 'Report', 'Dashboard', 'Call', 'Workshop'] },
                  format: { type: 'string' },
                  owner: { type: 'string' },
                },
              },
            },
            raid: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  itemType: { type: 'string', enum: ['Assumption', 'Issue', 'Dependency'] },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  impact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                  status: { type: 'string', enum: ['Open', 'In Progress', 'Closed'] },
                  owner: { type: 'string' },
                  dueDate: { type: 'string' },
                  resolution: { type: 'string' },
                },
              },
            },
            qualityGates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  gateNumber: { type: 'number' },
                  gateName: { type: 'string' },
                  owner: { type: 'string' },
                  decisionAuthority: { type: 'string' },
                  decisionNotes: { type: 'string' },
                  nextGateCriteria: { type: 'string' },
                },
              },
            },
            requirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  reqCode: { type: 'string' },
                  description: { type: 'string' },
                  reqType: { type: 'string', enum: ['Functional', 'Non-functional', 'Business', 'Technical', 'Regulatory'] },
                  priority: { type: 'string', enum: ['Must', 'Should', 'Could', "Won't"] },
                  source: { type: 'string' },
                  status: { type: 'string', enum: ['Proposed', 'Approved', 'Implemented', 'Verified', 'Deferred'] },
                  acceptanceCriteria: { type: 'string' },
                },
              },
            },
          },
          required: ['charter', 'stakeholders', 'wbs', 'raci', 'communication', 'raid', 'qualityGates', 'requirements'],
        },
      });

      // Persist to entities
      const created = {};

      if (result.charter) {
        // Delete existing charter for this project first
        const existing = await base44.asServiceRole.entities.ProjectCharter.filter({ projectId });
        for (const e of existing) await base44.asServiceRole.entities.ProjectCharter.delete(e.id);
        created.charter = await base44.asServiceRole.entities.ProjectCharter.create({ ...result.charter, projectId, approvalStatus: 'Draft' });
      }

      if (result.stakeholders?.length) {
        const existing = await base44.asServiceRole.entities.Stakeholder.filter({ projectId });
        for (const e of existing) await base44.asServiceRole.entities.Stakeholder.delete(e.id);
        created.stakeholders = await base44.asServiceRole.entities.Stakeholder.bulkCreate(result.stakeholders.map(s => ({ ...s, projectId })));
      }

      if (result.wbs?.length) {
        const existing = await base44.asServiceRole.entities.WbsElement.filter({ projectId });
        for (const e of existing) await base44.asServiceRole.entities.WbsElement.delete(e.id);
        created.wbs = await base44.asServiceRole.entities.WbsElement.bulkCreate(result.wbs.map(w => ({ ...w, projectId })));
      }

      if (result.raci?.length) {
        const existing = await base44.asServiceRole.entities.RaciAssignment.filter({ projectId });
        for (const e of existing) await base44.asServiceRole.entities.RaciAssignment.delete(e.id);
        created.raci = await base44.asServiceRole.entities.RaciAssignment.bulkCreate(result.raci.map(r => ({ ...r, projectId })));
      }

      if (result.communication?.length) {
        const existing = await base44.asServiceRole.entities.CommunicationPlan.filter({ projectId });
        for (const e of existing) await base44.asServiceRole.entities.CommunicationPlan.delete(e.id);
        created.communication = await base44.asServiceRole.entities.CommunicationPlan.bulkCreate(result.communication.map(c => ({ ...c, projectId })));
      }

      if (result.raid?.length) {
        const existing = await base44.asServiceRole.entities.RaidItem.filter({ projectId });
        for (const e of existing) await base44.asServiceRole.entities.RaidItem.delete(e.id);
        created.raid = await base44.asServiceRole.entities.RaidItem.bulkCreate(result.raid.map(r => ({ ...r, projectId })));
      }

      if (result.qualityGates?.length) {
        const existing = await base44.asServiceRole.entities.QualityGate.filter({ projectId });
        for (const e of existing) await base44.asServiceRole.entities.QualityGate.delete(e.id);
        created.qualityGates = await base44.asServiceRole.entities.QualityGate.bulkCreate(result.qualityGates.map(q => ({ ...q, projectId, status: 'Not Reached' })));
      }

      if (result.requirements?.length) {
        const existing = await base44.asServiceRole.entities.Requirement.filter({ projectId });
        for (const e of existing) await base44.asServiceRole.entities.Requirement.delete(e.id);
        created.requirements = await base44.asServiceRole.entities.Requirement.bulkCreate(result.requirements.map(r => ({ ...r, projectId })));
      }

      return Response.json({
        success: true,
        summary: {
          charter: created.charter ? 1 : 0,
          stakeholders: created.stakeholders?.length || 0,
          wbs: created.wbs?.length || 0,
          raci: created.raci?.length || 0,
          communication: created.communication?.length || 0,
          raid: created.raid?.length || 0,
          qualityGates: created.qualityGates?.length || 0,
          requirements: created.requirements?.length || 0,
        },
      });
    }

    // ── OPTIMIZE MODE ──
    if (mode === 'optimize') {
      const label = DOC_LABELS[documentType] || documentType;
      const isArray = ['stakeholders', 'wbs', 'raci', 'communication', 'raid', 'qualityGates', 'requirements', 'swot'].includes(documentType);

      const instructionText = optimizeInstruction
        ? `Specific instruction from user: ${optimizeInstruction}`
        : 'Focus on completeness, professional wording, identifying gaps, and ensuring realistic personas/names.';

      if (isArray) {
        const prompt = `${SYSTEM_PROMPT}

You are optimizing a ${label} for a project. Review the current items and suggest improvements.
${instructionText}

Current items:
${JSON.stringify(currentContent, null, 2)}

Return:
- "changes": list of specific improvements you recommend for existing items
- "new_items_json": a JSON string array of new items to add that are missing (same field structure as current items, WITHOUT projectId/id/created_date). Return a valid JSON array string.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              changes: { type: 'array', items: { type: 'string' } },
              new_items_json: { type: 'string', description: 'JSON array string of new items to add' },
            },
            required: ['changes', 'new_items_json'],
          },
        });

        let new_items = [];
        try { new_items = JSON.parse(result.new_items_json || '[]'); } catch { /* keep empty */ }
        return Response.json({ changes: result.changes, new_items });
      } else {
        const prompt = `${SYSTEM_PROMPT}

You are optimizing a ${label} for a project. Review the current content and return an improved version.
${instructionText}

Current content:
${JSON.stringify(currentContent, null, 2)}

Return:
- "optimized_fields_json": a JSON string object of the full optimized document with all fields improved (same field names as input, WITHOUT projectId/id/created_date). Return a valid JSON object string.
- "changes": list of specific changes you made`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              optimized_fields_json: { type: 'string', description: 'JSON object string of optimized field values' },
              changes: { type: 'array', items: { type: 'string' } },
            },
            required: ['optimized_fields_json', 'changes'],
          },
        });

        let optimized_fields = {};
        try { optimized_fields = JSON.parse(result.optimized_fields_json || '{}'); } catch { /* keep empty */ }
        return Response.json({ optimized_fields, changes: result.changes });
      }
    }

    // ── GENERATE FROM STORY MODE ──
    // Creates a new Project + all governance docs from a free-text project story
    if (mode === 'generateFromStory') {
      const story = body.story || '';
      if (!story.trim()) return Response.json({ error: 'Story text is required' }, { status: 400 });

      // Step 1: Extract project metadata from the story
      const extractResult = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

From the following project description, extract structured project metadata.
If a field isn't mentioned, infer a sensible default for the project type.

Project description:
${story}`,
        response_json_schema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', description: 'A concise, professional project name' },
            clientName: { type: 'string', description: 'Client or parent organization name (infer if not stated)' },
            projectType: { type: 'string', enum: ['Battery Gigafactory', 'Data Center', 'Other'] },
            totalBudgetEurM: { type: 'number', description: 'Total budget in EUR millions (estimate if not stated)' },
            currentPhase: { type: 'string', enum: ['Feasibility', 'Pre-FEED', 'FEED', 'Investment Decision', 'Project Setup', 'Detailed Engineering', 'Procurement', 'Construction', 'Commissioning', 'SOP'] },
            startDate: { type: 'string', description: 'ISO date or empty' },
            targetCompletion: { type: 'string', description: 'ISO date or empty' },
            projectOwner: { type: 'string', description: 'Project owner / director name (infer a realistic persona if not stated)' },
            notes: { type: 'string', description: 'Key details from the story' },
          },
          required: ['projectName', 'clientName', 'projectType', 'totalBudgetEurM', 'currentPhase', 'projectOwner', 'notes'],
        },
      });

      // Step 2: Create the Project entity
      const project = await base44.asServiceRole.entities.Project.create({
        projectName: extractResult.projectName,
        clientName: extractResult.clientName,
        projectType: extractResult.projectType,
        totalBudgetEurM: extractResult.totalBudgetEurM,
        currentPhase: extractResult.currentPhase,
        startDate: extractResult.startDate || undefined,
        targetCompletion: extractResult.targetCompletion || undefined,
        projectOwner: extractResult.projectOwner,
        status: 'Active',
        healthScore: 75,
        notes: extractResult.notes,
      });

      const newProjectId = project.id;

      // Step 3: Generate all governance documents (reuse generate logic)
      const fullContext = `Project from database: ${JSON.stringify(project)}
User's project story:
${story}`;

      const genResult = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

Based on the project context below, generate a complete set of governance documents. Return structured JSON.
Generate realistic, professional content appropriate for the project type.
- Charter: comprehensive single document with all fields filled
- Stakeholders: 5-8 stakeholders with realistic names, roles, companies, influence/interest levels, engagement strategies
- WBS: 6-10 elements with proper hierarchical codes (1, 1.1, 1.2, 2, 2.1, etc.), types, owners, budgets
- RACI: 8-15 assignments mapping roles to activities with R/A/C/I responsibility
- Communication: 5-8 plan entries with audience, info, frequency, channel
- RAID: 5-10 items (mix of assumptions, issues, dependencies) with impact, status, owner
- Quality Gates: 6-8 gates (Gate 0 through Gate 7) with names, owners, criteria
- Requirements: 5-10 requirements with codes (REQ-001, etc.), types, priorities, acceptance criteria

Project Context:
${fullContext}`,
        response_json_schema: {
          type: 'object',
          properties: {
            charter: { type: 'object', properties: { purpose: { type: 'string' }, objectives: { type: 'string' }, successCriteria: { type: 'string' }, scopeIncluded: { type: 'string' }, scopeExcluded: { type: 'string' }, deliverables: { type: 'string' }, milestonesSummary: { type: 'string' }, estimatedBudgetEurM: { type: 'number' }, assumptions: { type: 'string' }, constraints: { type: 'string' }, risksSummary: { type: 'string' }, sponsor: { type: 'string' }, projectManager: { type: 'string' }, stakeholdersSummary: { type: 'string' } } },
            stakeholders: { type: 'array', items: { type: 'object', properties: { stakeholderName: { type: 'string' }, role: { type: 'string' }, company: { type: 'string' }, category: { type: 'string', enum: ['Internal', 'External'] }, influence: { type: 'string', enum: ['High', 'Medium', 'Low'] }, interest: { type: 'string', enum: ['High', 'Medium', 'Low'] }, engagementCurrent: { type: 'string', enum: ['Unaware', 'Resistant', 'Neutral', 'Supportive', 'Leading'] }, engagementDesired: { type: 'string', enum: ['Unaware', 'Resistant', 'Neutral', 'Supportive', 'Leading'] }, engagementStrategy: { type: 'string' }, contact: { type: 'string' } } } },
            wbs: { type: 'array', items: { type: 'object', properties: { wbsCode: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, elementType: { type: 'string', enum: ['Phase', 'Deliverable', 'Work Package'] }, owner: { type: 'string' }, status: { type: 'string', enum: ['Not Started', 'In Progress', 'Complete'] }, budgetEurK: { type: 'number' } } } },
            raci: { type: 'array', items: { type: 'object', properties: { activity: { type: 'string' }, wbsCode: { type: 'string' }, roleName: { type: 'string' }, responsibility: { type: 'string', enum: ['R', 'A', 'C', 'I'] }, notes: { type: 'string' } } } },
            communication: { type: 'array', items: { type: 'object', properties: { audience: { type: 'string' }, information: { type: 'string' }, purpose: { type: 'string' }, frequency: { type: 'string', enum: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Quarterly', 'Milestone', 'Ad-hoc'] }, channel: { type: 'string', enum: ['Email', 'Meeting', 'Report', 'Dashboard', 'Call', 'Workshop'] }, format: { type: 'string' }, owner: { type: 'string' } } } },
            raid: { type: 'array', items: { type: 'object', properties: { itemType: { type: 'string', enum: ['Assumption', 'Issue', 'Dependency'] }, title: { type: 'string' }, description: { type: 'string' }, impact: { type: 'string', enum: ['High', 'Medium', 'Low'] }, status: { type: 'string', enum: ['Open', 'In Progress', 'Closed'] }, owner: { type: 'string' }, dueDate: { type: 'string' }, resolution: { type: 'string' } } } },
            qualityGates: { type: 'array', items: { type: 'object', properties: { gateNumber: { type: 'number' }, gateName: { type: 'string' }, owner: { type: 'string' }, decisionAuthority: { type: 'string' }, decisionNotes: { type: 'string' }, nextGateCriteria: { type: 'string' } } } },
            requirements: { type: 'array', items: { type: 'object', properties: { reqCode: { type: 'string' }, description: { type: 'string' }, reqType: { type: 'string', enum: ['Functional', 'Non-functional', 'Business', 'Technical', 'Regulatory'] }, priority: { type: 'string', enum: ['Must', 'Should', 'Could', "Won't"] }, source: { type: 'string' }, status: { type: 'string', enum: ['Proposed', 'Approved', 'Implemented', 'Verified', 'Deferred'] }, acceptanceCriteria: { type: 'string' } } } },
          },
          required: ['charter', 'stakeholders', 'wbs', 'raci', 'communication', 'raid', 'qualityGates', 'requirements'],
        },
      });

      // Persist all documents
      const created = {};
      if (genResult.charter) created.charter = await base44.asServiceRole.entities.ProjectCharter.create({ ...genResult.charter, projectId: newProjectId, approvalStatus: 'Draft' });
      if (genResult.stakeholders?.length) created.stakeholders = await base44.asServiceRole.entities.Stakeholder.bulkCreate(genResult.stakeholders.map(s => ({ ...s, projectId: newProjectId })));
      if (genResult.wbs?.length) created.wbs = await base44.asServiceRole.entities.WbsElement.bulkCreate(genResult.wbs.map(w => ({ ...w, projectId: newProjectId })));
      if (genResult.raci?.length) created.raci = await base44.asServiceRole.entities.RaciAssignment.bulkCreate(genResult.raci.map(r => ({ ...r, projectId: newProjectId })));
      if (genResult.communication?.length) created.communication = await base44.asServiceRole.entities.CommunicationPlan.bulkCreate(genResult.communication.map(c => ({ ...c, projectId: newProjectId })));
      if (genResult.raid?.length) created.raid = await base44.asServiceRole.entities.RaidItem.bulkCreate(genResult.raid.map(r => ({ ...r, projectId: newProjectId })));
      if (genResult.qualityGates?.length) created.qualityGates = await base44.asServiceRole.entities.QualityGate.bulkCreate(genResult.qualityGates.map(q => ({ ...q, projectId: newProjectId, status: 'Not Reached' })));
      if (genResult.requirements?.length) created.requirements = await base44.asServiceRole.entities.Requirement.bulkCreate(genResult.requirements.map(r => ({ ...r, projectId: newProjectId })));

      return Response.json({
        success: true,
        projectId: newProjectId,
        projectName: project.projectName,
        summary: {
          charter: created.charter ? 1 : 0,
          stakeholders: created.stakeholders?.length || 0,
          wbs: created.wbs?.length || 0,
          raci: created.raci?.length || 0,
          communication: created.communication?.length || 0,
          raid: created.raid?.length || 0,
          qualityGates: created.qualityGates?.length || 0,
          requirements: created.requirements?.length || 0,
        },
      });
    }

    return Response.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});