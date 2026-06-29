import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { NODE_TYPES } from './nodeTypes';
import { GripVertical, Trash2, Pencil, ChevronDown } from 'lucide-react';

const ARROW = '↓';

export default function WorkflowCanvas({ nodes, onReorder, onSelect, onDelete, selectedId }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...nodes];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onReorder(reordered);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="workflow-canvas">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-0">
            {nodes.length === 0 && (
              <div className="text-center py-16 rounded-xl border-2 border-dashed" style={{ borderColor: 'rgba(202,220,252,0.15)' }}>
                <p className="text-sm" style={{ color: '#64748b' }}>Add steps from the palette to build your workflow</p>
              </div>
            )}
            {nodes.map((node, index) => {
              const def = NODE_TYPES[node.type] || NODE_TYPES.task;
              const Icon = def.icon;
              const isSelected = node.id === selectedId;
              return (
                <Draggable key={node.id} draggableId={node.id} index={index}>
                  {(pDrag) => (
                    <div ref={pDrag.innerRef} {...pDrag.draggableProps}>
                      {index > 0 && (
                        <div className="flex justify-center py-1">
                          <ChevronDown className="w-4 h-4" style={{ color: '#475569' }} />
                        </div>
                      )}
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                        style={{
                          background: isSelected ? def.bg : 'rgba(15,23,42,0.6)',
                          borderColor: isSelected ? def.color : 'rgba(202,220,252,0.1)',
                          borderWidth: isSelected ? 2 : 1,
                        }}
                        onClick={() => onSelect(node.id)}
                      >
                        <div {...pDrag.dragHandleProps} onClick={(e) => e.stopPropagation()}>
                          <GripVertical className="w-4 h-4" style={{ color: '#475569' }} />
                        </div>
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: def.bg }}>
                          <Icon className="w-4 h-4" style={{ color: def.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: '#CADCFC' }}>{node.label}</div>
                          <div className="text-xs truncate flex items-center gap-2" style={{ color: '#64748b' }}>
                            <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(202,220,252,0.08)', color: def.color }}>{def.label}</span>
                            {node.assignee && <span>· {node.assignee}</span>}
                            {node.durationDays > 0 && <span>· {node.durationDays}d</span>}
                          </div>
                          {node.condition && (
                            <div className="text-xs mt-0.5 italic" style={{ color: '#06B6D4' }}>⚡ {node.condition}</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                          className="p-1.5 rounded hover:bg-red-500/10 transition-colors shrink-0"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}