import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, CheckCircle2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ENTITY_MAP = {
  stakeholders: { entity: 'Stakeholder', label: 'Stakeholder Register', isArray: true },
  wbs: { entity: 'WbsElement', label: 'WBS', isArray: true },
  raci: { entity: 'RaciAssignment', label: 'RACI Matrix', isArray: true },
  communication: { entity: 'CommunicationPlan', label: 'Communication Plan', isArray: true },
  raid: { entity: 'RaidItem', label: 'RAID Log', isArray: true },
  qualityGates: { entity: 'QualityGate', label: 'Quality Gates', isArray: true },
  requirements: { entity: 'Requirement', label: 'Requirements', isArray: true },
  swot: { entity: 'SwotItem', label: 'SWOT Analysis', isArray: true },
  charter: { entity: 'ProjectCharter', label: 'Project Charter', isArray: false },
};

export default function OptimizeWithAI({ documentType, projectId, currentData, onApplied }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const config = ENTITY_MAP[documentType];

  const handleOptimize = async () => {
    setLoading(true);
    setResult(null);
    setApplied(false);
    try {
      const response = await base44.functions.invoke('governanceAI', {
        mode: 'optimize',
        documentType,
        projectId,
        currentContent: currentData,
        optimizeInstruction: instruction || null,
      });
      setResult(response.data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result) return;
    setApplying(true);
    try {
      if (config.isArray) {
        // Add suggested new items
        if (result.new_items?.length) {
          const itemsWithProject = result.new_items.map(item => {
            const { id, created_date, updated_date, created_by_id, ...clean } = item;
            return { ...clean, projectId };
          });
          await base44.entities[config.entity].bulkCreate(itemsWithProject);
        }
      } else {
        // For single docs, call onApplied with optimized fields
        if (result.optimized_fields && onApplied) {
          onApplied(result.optimized_fields);
        }
      }
      setApplied(true);
      setTimeout(() => {
        setOpen(false);
        setResult(null);
        setInstruction('');
        setApplied(false);
      }, 1500);
    } catch (err) {
      setResult(prev => ({ ...prev, error: err.message }));
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setInstruction('');
    setApplied(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        style={{ borderColor: 'rgba(167, 139, 250, 0.4)', color: '#a78bfa' }}
        className="gap-1.5"
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Optimize with AI</span>
        <span className="sm:hidden">AI</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-2xl" style={{ background: 'rgba(15, 23, 42, 0.98)', borderColor: 'rgba(202, 220, 252, 0.2)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#CADCFC' }} className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Optimization — {config.label}
            </DialogTitle>
          </DialogHeader>

          {!result && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label style={{ color: '#94A3B8' }}>What would you like to improve? (optional)</Label>
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="e.g., Add realistic persona names, improve engagement strategies, identify missing stakeholders..."
                  rows={3}
                  className="bg-slate-900/50 border-slate-700 text-slate-100"
                />
              </div>
              <div className="rounded-lg p-3 text-sm" style={{ background: 'rgba(30, 39, 97, 0.5)', color: '#94A3B8' }}>
                {config.isArray
                  ? `The AI will review your current ${config.label.toLowerCase()} and suggest improvements + new items to add.`
                  : 'The AI will review your charter and suggest improved field values you can apply.'}
              </div>
              <Button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', color: '#F8FAFC' }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Run AI Analysis</>
                )}
              </Button>
            </div>
          )}

          {result && !result.error && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {result.changes?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: '#CADCFC' }}>Recommended Improvements</h4>
                  <ul className="space-y-1.5">
                    {result.changes.map((change, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#94A3B8' }}>
                        <span className="text-purple-400 mt-0.5">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {config.isArray && result.new_items?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: '#CADCFC' }}>
                    Suggested New Items ({result.new_items.length})
                  </h4>
                  <div className="space-y-2">
                    {result.new_items.map((item, i) => (
                      <div key={i} className="rounded-lg p-3 text-sm" style={{ background: 'rgba(30, 39, 97, 0.5)', color: '#CADCFC' }}>
                        {item.stakeholderName && <div className="font-medium">{item.stakeholderName} — {item.role || ''}</div>}
                        {item.wbsCode && <div className="font-medium">{item.wbsCode} — {item.name || ''}</div>}
                        {item.reqCode && <div className="font-medium">{item.reqCode} — {item.description || ''}</div>}
                        {item.activity && <div className="font-medium">{item.activity} → {item.roleName} ({item.responsibility})</div>}
                        {item.audience && <div className="font-medium">{item.audience} — {item.information || ''}</div>}
                        {item.title && !item.itemType && <div className="font-medium">{item.category}: {item.title}</div>}
                        {item.title && item.itemType && <div className="font-medium">{item.itemType}: {item.title}</div>}
                        {item.gateName && <div className="font-medium">Gate {item.gateNumber}: {item.gateName}</div>}
                        {item.description && <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{item.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!config.isArray && result.optimized_fields && (
                <div>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: '#CADCFC' }}>Optimized Content Preview</h4>
                  <pre className="rounded-lg p-3 text-xs overflow-x-auto max-h-60" style={{ background: 'rgba(30, 39, 97, 0.5)', color: '#94A3B8' }}>
                    {JSON.stringify(result.optimized_fields, null, 2)}
                  </pre>
                </div>
              )}

              {result.changes?.length === 0 && !result.new_items?.length && !result.optimized_fields && (
                <div className="text-center py-4" style={{ color: '#94A3B8' }}>
                  No specific improvements suggested. Your document looks comprehensive.
                </div>
              )}

              {applied && (
                <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                  <CheckCircle2 className="w-5 h-5" /> Changes applied successfully!
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleClose} style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                  Close
                </Button>
                {!applied && (
                  <Button
                    onClick={handleApply}
                    disabled={applying || (config.isArray && !result.new_items?.length) || (!config.isArray && !result.optimized_fields)}
                    style={{ background: '#7c3aed', color: '#F8FAFC' }}
                  >
                    {applying ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...</>
                    ) : config.isArray ? (
                      <><Plus className="w-4 h-4 mr-2" /> Add {result.new_items?.length || 0} New Items</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" /> Apply Optimized Content</>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}

          {result?.error && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                <X className="w-5 h-5" /> {result.error}
              </div>
              <Button onClick={handleOptimize} variant="outline" style={{ borderColor: 'rgba(202, 220, 252, 0.3)', color: '#CADCFC' }}>
                Try Again
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}