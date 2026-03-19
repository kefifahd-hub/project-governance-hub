import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

export default function SCurveComments({ projectId, periods }) {
  const [draft, setDraft] = useState({ period: '', comment: '', author: '' });
  const [adding, setAdding] = useState(false);
  const qc = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['scurve-comments', projectId],
    queryFn: () => base44.entities.SCurveComment.filter({ project: projectId }, '-createdAt'),
    enabled: !!projectId,
  });

  const add = useMutation({
    mutationFn: () => base44.entities.SCurveComment.create({
      project: projectId,
      period: draft.period,
      comment: draft.comment,
      author: draft.author || 'Anonymous',
      createdAt: new Date().toISOString().slice(0, 10),
    }),
    onSuccess: () => {
      qc.invalidateQueries(['scurve-comments', projectId]);
      setDraft({ period: '', comment: '', author: '' });
      setAdding(false);
    },
  });

  const del = useMutation({
    mutationFn: (id) => base44.entities.SCurveComment.delete(id),
    onSuccess: () => qc.invalidateQueries(['scurve-comments', projectId]),
  });

  const card = { background: 'rgba(30,39,97,0.5)', border: '1px solid rgba(202,220,252,0.1)', borderRadius: 10 };
  const inp = { background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(202,220,252,0.2)', borderRadius: 6, color: '#CADCFC', fontSize: 12, padding: '6px 10px', outline: 'none', width: '100%' };

  return (
    <div style={{ ...card, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare style={{ width: 14, height: 14, color: '#00A896' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#CADCFC' }}>Chart Comments</span>
          <span style={{ fontSize: 10, color: '#334155', background: 'rgba(202,220,252,0.08)', borderRadius: 9999, padding: '1px 6px' }}>{comments.length}</span>
        </div>
        <button onClick={() => setAdding(a => !a)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#00A896', background: 'rgba(2,128,144,0.1)', border: '1px solid rgba(2,128,144,0.25)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
          <Plus style={{ width: 11, height: 11 }} /> Add Note
        </button>
      </div>

      {adding && (
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(202,220,252,0.1)', borderRadius: 8, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 4 }}>Period</label>
              <select value={draft.period} onChange={e => setDraft(d => ({ ...d, period: e.target.value }))} style={inp}>
                <option value="">— Any period —</option>
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 4 }}>Your Name</label>
              <input value={draft.author} onChange={e => setDraft(d => ({ ...d, author: e.target.value }))} placeholder="Name…" style={inp} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 4 }}>Comment</label>
            <textarea value={draft.comment} onChange={e => setDraft(d => ({ ...d, comment: e.target.value }))} placeholder="Add a note about this period…"
              style={{ ...inp, resize: 'vertical', minHeight: 60 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setAdding(false)} style={{ fontSize: 11, color: '#64748b', background: 'none', border: '1px solid rgba(202,220,252,0.1)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => add.mutate()} disabled={!draft.comment}
              style={{ fontSize: 11, color: '#F8FAFC', background: 'linear-gradient(135deg,#028090,#00A896)', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', opacity: draft.comment ? 1 : 0.4 }}>
              Save
            </button>
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <p style={{ fontSize: 11, color: '#334155', textAlign: 'center', padding: '16px 0' }}>No comments yet. Add a note to annotate specific periods.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
          {comments.map(c => (
            <div key={c.id} style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(202,220,252,0.06)', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#CADCFC' }}>{c.author || 'Anonymous'}</span>
                  {c.period && <span style={{ fontSize: 9, color: '#00A896', background: 'rgba(2,128,144,0.12)', borderRadius: 9999, padding: '1px 6px' }}>{c.period}</span>}
                  <span style={{ fontSize: 9, color: '#334155', marginLeft: 'auto' }}>{c.createdAt || ''}</span>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{c.comment}</p>
              </div>
              <button onClick={() => del.mutate(c.id)} style={{ color: '#334155', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}