import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().slice(0, 10);

    // Avoid duplicates for today
    const existing = await base44.asServiceRole.entities.DailyPrinciple.filter({ date: today });
    if (existing && existing.length > 0) {
      return Response.json({ status: 'exists', principle: existing[0] });
    }

    const prompt = `You are the PMO Agent for a project governance platform focused on large-scale engineering projects (battery gigafactories, data centers).

Generate a fresh "Principle of the Day" banner that reminds project managers of a key project management principle.

Vary the theme each day across these core areas (and others): Scope-Cost-Schedule-Quality (the Iron Triangle), Risk Management, Stakeholder Engagement, Change Control, Quality Assurance, Communication, Leadership, Lessons Learned, Value Engineering, Earned Value, Governance Gates, Assumptions & Dependencies.

Return JSON with:
- title: a punchy principle name (max 5 words)
- subtitle: a one-line explanation (max 90 chars)
- principles: an array of 3 to 4 objects each with "label" (one word, the dimension) and "color" (a hex color string). These represent the competing/related dimensions of today's principle.

Keep it concise, professional, and actionable. Do not repeat the exact same theme as yesterday.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          principles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                color: { type: 'string' }
              },
              required: ['label', 'color']
            }
          }
        },
        required: ['title', 'subtitle', 'principles']
      }
    });

    const created = await base44.asServiceRole.entities.DailyPrinciple.create({
      date: today,
      title: result.title,
      subtitle: result.subtitle || '',
      principles: JSON.stringify(result.principles || []),
      source: 'PMO Agent'
    });

    return Response.json({ status: 'created', principle: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});