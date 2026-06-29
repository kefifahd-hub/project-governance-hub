import { NODE_TYPES, PALETTE_ORDER } from './nodeTypes';
import { Plus } from 'lucide-react';

export default function NodePalette({ onAddNode }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.1)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: '#CADCFC' }}>Add Step</h3>
      <div className="grid grid-cols-2 gap-2">
        {PALETTE_ORDER.map((type) => {
          const def = NODE_TYPES[type];
          const Icon = def.icon;
          return (
            <button
              key={type}
              onClick={() => onAddNode(type)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all hover:scale-[1.03]"
              style={{ background: def.bg, borderColor: `${def.color}40`, color: def.color }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{def.label}</span>
              <Plus className="w-3 h-3 opacity-50" />
            </button>
          );
        })}
      </div>
    </div>
  );
}