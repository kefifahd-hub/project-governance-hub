import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, subDays, isWeekend, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { HardHat, Plus, Save, Send, CheckCircle2, Loader2, Trash2 } from 'lucide-react';

function buildWorkingDays(count = 30) {
  const days = [];
  let d = new Date();
  while (days.length < count) {
    if (!isWeekend(d)) days.push(new Date(d));
    d = subDays(d, 1);
  }
  return days;
}

const STATUS_BADGE = {
  Draft: { bg: 'rgba(59,130,246,0.2)', color: '#3b82f6', label: '📝 Draft' },
  Submitted: { bg: 'rgba(167,139,250,0.2)', color: '#a855f7', label: '📤 Submitted' },
  Reviewed: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b', label: '🔍 Reviewed' },
  Approved: { bg: 'rgba(16,185,129,0.2)', color: '#10b981', label: '✅ Approved' },
};

function WeatherCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} className="accent-teal-500" />
      <span className="text-sm" style={{ color: '#CBD5E1' }}>{label}</span>
    </label>
  );
}

function DSRForm({ report, projectId, onSaved }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(report ? { ...report } : {
    projectId,
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    preparedBy: '',
    status: 'Draft',
    weatherSunny: false, weatherCloudy: false, weatherRainy: false,
    weatherSnow: false, weatherFrost: false, weatherLightning: false,
    tempMinC: '', tempMaxC: '', windSpeedMaxMs: '',
    weatherImpactOnWork: false, weatherImpactDescription: '',
    additionalNotes: '', totalWorkers: 0, totalHours: 0,
  });

  const [manpower, setManpower] = useState(() => {
    try { return JSON.parse(report?.manpowerEntries || '[]'); } catch { return []; }
  });
  const [equipment, setEquipment] = useState(() => {
    try { return JSON.parse(report?.equipmentEntries || '[]'); } catch { return []; }
  });
  const [events, setEvents] = useState(() => {
    try { return JSON.parse(report?.remarkableEvents || '[]'); } catch { return []; }
  });

  const saveMutation = useMutation({
    mutationFn: (data) => report ? base44.entities.DailySiteReport.update(report.id, data) : base44.entities.DailySiteReport.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dsrs', projectId] }); if (onSaved) onSaved(); },
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  function buildPayload(status) {
    const totalWorkers = manpower.reduce((s, r) => s + (Number(r.workforce_count) || 0), 0);
    const totalHours = manpower.reduce((s, r) => s + (Number(r.worked_hours) || 0), 0);
    return {
      ...form, status,
      manpowerEntries: JSON.stringify(manpower),
      equipmentEntries: JSON.stringify(equipment),
      remarkableEvents: JSON.stringify(events),
      totalWorkers, totalHours,
      reportRef: `DSR-${(form.reportDate || '').replace(/-/g, '')}`,
    };
  }

  function addManpowerRow() { setManpower(p => [...p, { zone: '', contractor_name: '', activity_description: '', workforce_count: '', worked_hours: '', day_shift: true }]); }
  function addEquipmentRow() { setEquipment(p => [...p, { equipment_type: '', quantity: '', operational: '', in_repair: '', out_of_order: '' }]); }
  function addEventRow() { setEvents(p => [...p, { event_time: '', zone: '', event_description: '', event_type: 'Other', severity: 'Info' }]); }

  const sb = STATUS_BADGE[form.status] || STATUS_BADGE.Draft;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#CADCFC' }}>
            🏗️ Daily Site Report — {form.reportDate}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>DSR-{(form.reportDate || '').replace(/-/g, '')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge style={{ background: sb.bg, color: sb.color, border: `1px solid ${sb.color}33` }}>{sb.label}</Badge>
          <Button size="sm" variant="outline" onClick={() => saveMutation.mutate(buildPayload('Draft'))} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}>
            <Save className="w-4 h-4 mr-1" /> Save Draft
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate(buildPayload('Submitted'))} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
            <Send className="w-4 h-4 mr-1" /> Submit
          </Button>
        </div>
      </div>

      {/* Basic info */}
      <div className="p-4 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div>
          <Label className="text-xs" style={{ color: '#94A3B8' }}>Date</Label>
          <Input type="date" value={form.reportDate} onChange={e => set('reportDate', e.target.value)} className="mt-1 h-8 text-sm" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: '#94A3B8' }}>Prepared By</Label>
          <Input value={form.preparedBy || ''} onChange={e => set('preparedBy', e.target.value)} className="mt-1 h-8 text-sm" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </div>
        <div>
          <Label className="text-xs" style={{ color: '#94A3B8' }}>Contractor</Label>
          <Input value={form.contractorName || ''} onChange={e => set('contractorName', e.target.value)} className="mt-1 h-8 text-sm" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
        </div>
      </div>

      {/* Weather */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <h3 className="font-semibold" style={{ color: '#CADCFC' }}>☀️ Weather Conditions / Conditions Climatiques</h3>
        <div className="flex flex-wrap gap-4">
          <WeatherCheckbox label="☀️ Sunny" checked={form.weatherSunny} onChange={v => set('weatherSunny', v)} />
          <WeatherCheckbox label="☁️ Cloudy" checked={form.weatherCloudy} onChange={v => set('weatherCloudy', v)} />
          <WeatherCheckbox label="🌧️ Rainy" checked={form.weatherRainy} onChange={v => set('weatherRainy', v)} />
          <WeatherCheckbox label="❄️ Snow" checked={form.weatherSnow} onChange={v => set('weatherSnow', v)} />
          <WeatherCheckbox label="🧊 Frost" checked={form.weatherFrost} onChange={v => set('weatherFrost', v)} />
          <WeatherCheckbox label="⚡ Lightning" checked={form.weatherLightning} onChange={v => set('weatherLightning', v)} />
        </div>
        <div className="flex gap-3 flex-wrap">
          <div><Label className="text-xs" style={{ color: '#94A3B8' }}>Min °C</Label><Input type="number" value={form.tempMinC || ''} onChange={e => set('tempMinC', e.target.value)} className="mt-1 h-8 w-20 text-sm" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} /></div>
          <div><Label className="text-xs" style={{ color: '#94A3B8' }}>Max °C</Label><Input type="number" value={form.tempMaxC || ''} onChange={e => set('tempMaxC', e.target.value)} className="mt-1 h-8 w-20 text-sm" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} /></div>
          <div><Label className="text-xs" style={{ color: '#94A3B8' }}>Wind (m/s)</Label><Input type="number" value={form.windSpeedMaxMs || ''} onChange={e => set('windSpeedMaxMs', e.target.value)} className="mt-1 h-8 w-24 text-sm" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} /></div>
          <div className="flex items-end gap-2 pb-0.5">
            <WeatherCheckbox label="Weather impact on work" checked={form.weatherImpactOnWork} onChange={v => set('weatherImpactOnWork', v)} />
          </div>
        </div>
        {form.weatherImpactOnWork && <Input value={form.weatherImpactDescription || ''} onChange={e => set('weatherImpactDescription', e.target.value)} placeholder="Describe impact..." style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />}
      </div>

      {/* Manpower */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: '#CADCFC' }}>👷 Manpower / Main d'Œuvre</h3>
          <Button size="sm" variant="outline" onClick={addManpowerRow} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}><Plus className="w-3 h-3 mr-1" /> Add Row</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
              {['Zone', 'Contractor', 'Activity', '#Workers', 'Hours', ''].map(h => <th key={h} className="text-left py-1.5 pr-2 font-medium" style={{ color: '#64748b' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {manpower.map((row, i) => (
                <tr key={i}>
                  {['zone','contractor_name','activity_description','workforce_count','worked_hours'].map(key => (
                    <td key={key} className="pr-2 py-1">
                      <Input value={row[key] || ''} onChange={e => setManpower(p => p.map((r,j) => j===i ? {...r, [key]: e.target.value} : r))} className="h-7 text-xs" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC', minWidth: key === 'activity_description' ? 140 : 70 }} />
                    </td>
                  ))}
                  <td><button onClick={() => setManpower(p => p.filter((_,j) => j!==i))}><Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {manpower.length > 0 && (
            <div className="mt-2 text-xs font-medium" style={{ color: '#94A3B8' }}>
              Total: {manpower.reduce((s,r) => s+(Number(r.workforce_count)||0),0)} workers · {manpower.reduce((s,r) => s+(Number(r.worked_hours)||0),0)} hours
            </div>
          )}
        </div>
      </div>

      {/* Equipment */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: '#CADCFC' }}>🚜 Equipment / Équipements</h3>
          <Button size="sm" variant="outline" onClick={addEquipmentRow} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}><Plus className="w-3 h-3 mr-1" /> Add</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: '1px solid rgba(202,220,252,0.1)' }}>
              {['Type', 'Total', 'Operational', 'In Repair', 'Out of Order', ''].map(h => <th key={h} className="text-left py-1.5 pr-2 font-medium" style={{ color: '#64748b' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {equipment.map((row, i) => (
                <tr key={i}>
                  {['equipment_type','quantity','operational','in_repair','out_of_order'].map(key => (
                    <td key={key} className="pr-2 py-1">
                      <Input value={row[key] || ''} onChange={e => setEquipment(p => p.map((r,j) => j===i ? {...r, [key]: e.target.value} : r))} className="h-7 text-xs" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC', minWidth: key==='equipment_type' ? 120 : 60 }} />
                    </td>
                  ))}
                  <td><button onClick={() => setEquipment(p => p.filter((_,j) => j!==i))}><Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events */}
      <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: '#CADCFC' }}>⚡ Remarkable Events / Événements Remarquables</h3>
          <Button size="sm" variant="outline" onClick={addEventRow} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}><Plus className="w-3 h-3 mr-1" /> Add</Button>
        </div>
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <Input value={ev.event_time||''} onChange={e => setEvents(p=>p.map((r,j)=>j===i?{...r,event_time:e.target.value}:r))} placeholder="HH:MM" className="col-span-1 h-7 text-xs" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }} />
              <Input value={ev.zone||''} onChange={e => setEvents(p=>p.map((r,j)=>j===i?{...r,zone:e.target.value}:r))} placeholder="Zone" className="col-span-2 h-7 text-xs" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }} />
              <Input value={ev.event_description||''} onChange={e => setEvents(p=>p.map((r,j)=>j===i?{...r,event_description:e.target.value}:r))} placeholder="Description..." className="col-span-6 h-7 text-xs" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }} />
              <Select value={ev.severity||'Info'} onValueChange={v => setEvents(p=>p.map((r,j)=>j===i?{...r,severity:v}:r))}>
                <SelectTrigger className="col-span-2 h-7 text-xs" style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.15)', color: '#F8FAFC' }}><SelectValue /></SelectTrigger>
                <SelectContent>{['Info','Minor','Major','Critical'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <button className="col-span-1" onClick={() => setEvents(p=>p.filter((_,j)=>j!==i))}><Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(30,39,97,0.4)', border: '1px solid rgba(202,220,252,0.1)' }}>
        <h3 className="font-semibold" style={{ color: '#CADCFC' }}>📝 Additional Notes / Notes Supplémentaires</h3>
        <Textarea value={form.additionalNotes||''} onChange={e => set('additionalNotes', e.target.value)} rows={3} style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(202,220,252,0.2)', color: '#F8FAFC' }} />
      </div>

      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => saveMutation.mutate(buildPayload('Draft'))} style={{ borderColor: 'rgba(202,220,252,0.2)', color: '#CADCFC' }}><Save className="w-4 h-4 mr-1" /> Save Draft</Button>
        <Button onClick={() => saveMutation.mutate(buildPayload('Submitted'))} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}><Send className="w-4 h-4 mr-1" /> Submit</Button>
      </div>
    </div>
  );
}

export default function DailySiteReportView({ projectId }) {
  const { data: dsrs = [], isLoading } = useQuery({
    queryKey: ['dsrs', projectId],
    queryFn: () => base44.entities.DailySiteReport.filter({ projectId }),
    enabled: !!projectId,
  });

  const workingDays = buildWorkingDays(30);
  const dsrMap = {};
  dsrs.forEach(d => { dsrMap[d.reportDate] = d; });

  const [selectedDate, setSelectedDate] = useState(format(workingDays[0], 'yyyy-MM-dd'));
  const [creating, setCreating] = useState(false);

  const selectedDSR = dsrMap[selectedDate];

  const STATUS_ICON = { Draft: '📝', Submitted: '📤', Reviewed: '🔍', Approved: '✅' };

  return (
    <div className="flex h-[calc(100vh-160px)]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 overflow-y-auto border-r" style={{ background: 'rgba(15,23,42,0.98)', borderColor: 'rgba(202,220,252,0.1)' }}>
        <div className="p-3 space-y-0.5">
          {workingDays.map(d => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const dsr = dsrMap[dateStr];
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
            return (
              <button
                key={dateStr}
                onClick={() => { setSelectedDate(dateStr); setCreating(false); }}
                className="w-full text-left px-2 py-2 rounded-lg transition-all"
                style={{ background: isSelected ? 'rgba(0,168,150,0.15)' : 'transparent', border: isSelected ? '1px solid rgba(0,168,150,0.3)' : '1px solid transparent' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: isToday ? '#f97316' : '#CADCFC' }}>{format(d, 'EEE d MMM')}{isToday && <span className="ml-1 text-[9px] bg-orange-500 text-white rounded px-1">TODAY</span>}</span>
                  <span className="text-xs">{dsr ? STATUS_ICON[dsr.status] || '📝' : '⬜'}</span>
                </div>
                {dsr && <div className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>DSR-{dateStr.replace(/-/g,'')}</div>}
              </button>
            );
          })}
        </div>
        <div className="sticky bottom-0 p-3" style={{ background: 'rgba(15,23,42,0.98)', borderTop: '1px solid rgba(202,220,252,0.1)' }}>
          <Button className="w-full text-sm" onClick={() => { setSelectedDate(format(workingDays[0],'yyyy-MM-dd')); setCreating(true); }} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>
            <Plus className="w-4 h-4 mr-2" /> New Daily Report
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6">
        {creating || selectedDSR ? (
          <DSRForm report={creating ? null : selectedDSR} projectId={projectId} onSaved={() => setCreating(false)} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <HardHat className="w-12 h-12" style={{ color: '#334155' }} />
            <p className="text-lg font-medium" style={{ color: '#64748b' }}>No report for {selectedDate}</p>
            <Button onClick={() => setCreating(true)} style={{ background: 'linear-gradient(135deg, #028090 0%, #00A896 100%)', color: '#F8FAFC' }}>Create Report</Button>
          </div>
        )}
      </div>
    </div>
  );
}