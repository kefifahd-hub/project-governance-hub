import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowRight, ExternalLink, AlertTriangle } from 'lucide-react';
import {
  FRAMEWORK_NAME, WORKSTREAMS, GATES, KIND_STYLE, KNOWN_GAPS,
} from '../components/processframework/batteryIndustrialisationProcesses';

const panelBg = { background: 'rgba(30, 39, 97, 0.4)', border: '1px solid rgba(202, 220, 252, 0.1)' };

export default function IndustrialisationProcesses() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');
  const [selected, setSelected] = useState(WORKSTREAMS[0]);

  const valueChain = WORKSTREAMS.filter(w => w.kind !== 'enabler');
  const enablers = WORKSTREAMS.filter(w => w.kind === 'enabler');

  const goTo = (page) => {
    const suffix = projectId ? `${page}?id=${projectId}` : page;
    navigate(createPageUrl(suffix));
  };

  const Card = ({ w }) => {
    const style = KIND_STYLE[w.kind];
    const active = selected.code === w.code;
    return (
      <button
        onClick={() => setSelected(w)}
        className="text-left rounded-lg p-3 shrink-0 transition-all"
        style={{
          width: 150,
          background: active ? 'rgba(0,168,150,0.15)' : 'rgba(15,23,42,0.6)',
          border: `1px solid ${active ? '#00A896' : 'rgba(202,220,252,0.12)'}`,
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold" style={{ color: style.color }}>{w.code}</span>
          {w.gate !== '—' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', fontSize: 9 }}>{w.gate}</span>}
        </div>
        <div className="text-sm font-medium leading-tight" style={{ color: '#CADCFC' }}>{w.name}</div>
        <div className="mt-1 text-xs" style={{ color: style.color, fontSize: 9 }}>{style.label}</div>
      </button>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ color: '#E2E8F0' }}>
      <div className="mb-1 text-2xl font-bold" style={{ color: '#CADCFC' }}>{FRAMEWORK_NAME}</div>
      <p className="mb-6 text-sm" style={{ color: '#94A3B8' }}>
        End-to-end industrialisation framework (workstreams 2.1–2.9) with quality-gate overlay and links to the platform tools that operate each stage.
      </p>

      {/* Value chain */}
      <div className="rounded-lg p-4 mb-4" style={panelBg}>
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Value chain (demand → handover)</div>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
          {valueChain.map((w, i) => (
            <div key={w.code} className="flex items-center gap-2">
              <Card w={w} />
              {i < valueChain.length - 1 && <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#475569' }} />}
            </div>
          ))}
        </div>
        <div className="text-xs uppercase tracking-wider mt-4 mb-3" style={{ color: '#475569' }}>Cross-cutting enablers</div>
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
          {enablers.map(w => <Card key={w.code} w={w} />)}
        </div>
      </div>

      {/* Gate overlay */}
      <div className="rounded-lg p-4 mb-4" style={panelBg}>
        <div className="text-xs uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Quality-gate overlay</div>
        <div className="flex flex-wrap gap-2">
          {GATES.map(g => (
            <div key={g.id} className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)' }}>
              <span className="font-bold" style={{ color: '#ec4899' }}>{g.id}</span>
              <span style={{ color: '#94A3B8' }}> — {g.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected workstream detail */}
      <div className="rounded-lg p-5" style={panelBg}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-lg font-bold" style={{ color: KIND_STYLE[selected.kind].color }}>{selected.code}</span>
          <span className="text-lg font-semibold" style={{ color: '#CADCFC' }}>{selected.name}</span>
          {selected.gate !== '—' && <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899' }}>Gate {selected.gate}</span>}
        </div>
        <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>{selected.summary}</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Sub-processes</div>
            <ul className="space-y-1">
              {selected.subProcesses.map(s => (
                <li key={s} className="text-sm flex items-center gap-2" style={{ color: '#CBD5E1' }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: KIND_STYLE[selected.kind].color }} />{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Inputs</div>
              {selected.inputs.map(s => <div key={s} className="text-sm" style={{ color: '#CBD5E1' }}>← {s}</div>)}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Outputs</div>
              {selected.outputs.map(s => <div key={s} className="text-sm" style={{ color: '#CBD5E1' }}>→ {s}</div>)}
            </div>
            {selected.feeds.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Feeds workstreams</div>
                <div className="flex flex-wrap gap-1">
                  {selected.feeds.map(code => {
                    const target = WORKSTREAMS.find(w => w.code === code);
                    return (
                      <button key={code} onClick={() => target && setSelected(target)}
                        className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,168,150,0.1)', color: '#00A896' }}>
                        {code} {target?.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Key KPIs</div>
          <div className="flex flex-wrap gap-2">
            {selected.kpis.map(k => (
              <span key={k} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(15,23,42,0.6)', color: '#94A3B8', border: '1px solid rgba(202,220,252,0.1)' }}>{k}</span>
            ))}
          </div>
        </div>

        {/* Linked platform modules */}
        {selected.modules.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Operate this stage in</div>
            <div className="flex flex-wrap gap-2">
              {selected.modules.map(m => (
                <button key={m} onClick={() => goTo(m)}
                  className="text-xs px-2.5 py-1 rounded flex items-center gap-1.5 transition-all"
                  style={{ background: 'rgba(0,168,150,0.12)', color: '#00A896', border: '1px solid rgba(0,168,150,0.3)' }}>
                  {m} <ExternalLink className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Known gaps */}
      <div className="rounded-lg p-4 mt-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div className="text-xs uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: '#F59E0B' }}>
          <AlertTriangle className="w-3.5 h-3.5" /> Known gaps (from knowledge-base review)
        </div>
        <ul className="space-y-1">
          {KNOWN_GAPS.map(g => <li key={g} className="text-xs" style={{ color: '#94A3B8' }}>• {g}</li>)}
        </ul>
      </div>
    </div>
  );
}
