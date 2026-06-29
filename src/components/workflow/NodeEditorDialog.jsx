import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { NODE_TYPES, PALETTE_ORDER } from './nodeTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NodeEditorDialog({ node, open, onClose, onSave }) {
  if (!node) return null;
  const def = NODE_TYPES[node.type];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>Edit Workflow Step</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label style={{ color: '#94A3B8' }}>Step Label</Label>
            <Input
              value={node.label}
              onChange={(e) => onSave({ ...node, label: e.target.value })}
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
            />
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#94A3B8' }}>Step Type</Label>
            <Select value={node.type} onValueChange={(v) => onSave({ ...node, type: v })}>
              <SelectTrigger style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PALETTE_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>{NODE_TYPES[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Assignee / Owner</Label>
              <Input
                value={node.assignee || ''}
                onChange={(e) => onSave({ ...node, assignee: e.target.value })}
                placeholder="e.g. Engineering Lead"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Duration (days)</Label>
              <Input
                type="number"
                value={node.durationDays || 0}
                onChange={(e) => onSave({ ...node, durationDays: parseInt(e.target.value) || 0 })}
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
              />
            </div>
          </div>
          {node.type === 'decision' && (
            <div className="space-y-2">
              <Label style={{ color: '#94A3B8' }}>Decision Condition</Label>
              <Input
                value={node.condition || ''}
                onChange={(e) => onSave({ ...node, condition: e.target.value })}
                placeholder="e.g. Comments resolved?"
                style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label style={{ color: '#94A3B8' }}>Description</Label>
            <Textarea
              value={node.description || ''}
              onChange={(e) => onSave({ ...node, description: e.target.value })}
              rows={2}
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={onClose} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}