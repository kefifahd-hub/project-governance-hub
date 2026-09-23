import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f97316', '#ef4444', '#eab308', '#ec4899', '#6b7280', '#1e3a8a', '#028090'];

export default function BucketEditDialog({ open, onClose, onSave, bucket, existingNames = [] }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(bucket?.bucketName || '');
      setColor(bucket?.bucketColor || COLORS[0]);
      setError('');
    }
  }, [open, bucket]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required'); return; }
    if (existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase() && n !== bucket?.bucketName)) {
      setError('A bucket with this name already exists');
      return;
    }
    onSave({ bucketName: trimmed, bucketColor: color });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent style={{ background: 'rgba(10,15,40,0.99)', borderColor: 'rgba(202,220,252,0.1)' }} className="max-w-sm">
        <DialogHeader>
          <DialogTitle style={{ color: '#CADCFC' }}>{bucket ? 'Edit bucket' : 'New bucket'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label style={{ color: '#94A3B8' }}>Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{ background: 'rgba(30,39,97,0.5)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }}
            />
            {error && <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>{error}</p>}
          </div>
          <div>
            <Label style={{ color: '#94A3B8' }}>Color</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{ background: c, border: color === c ? '2px solid #F8FAFC' : '2px solid transparent', transform: color === c ? 'scale(1.1)' : 'none' }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#94A3B8' }}>Cancel</Button>
          <Button onClick={handleSave} style={{ background: 'linear-gradient(135deg,#028090,#00A896)', color: '#F8FAFC' }}>{bucket ? 'Save' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}