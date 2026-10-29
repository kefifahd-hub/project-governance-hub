import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useSession } from '@/lib/SessionContext';
import { MobilePage, Card, SectionTitle, Field, TextInput, TextArea, Choice, PrimaryButton, ProjectSelect, Empty, Loading, Pill, C, todayIso, myDisplayName, useMobileProjectId } from './ui';
import { PhotoCapture, parsePhotos } from './Photos';

const WEATHER = [['weatherSunny', '☀️ Sunny'], ['weatherCloudy', '☁️ Cloudy'], ['weatherRainy', '🌧️ Rain'], ['weatherSnow', '❄️ Snow'], ['weatherFrost', '🧊 Frost'], ['weatherLightning', '⚡ Storm']];
const parse = (v) => { try { const x = JSON.parse(v || '[]'); return Array.isArray(x) ? x : []; } catch { return []; } };
const num = (v) => (v === '' || v == null ? undefined : Number(v));

// Phone-first Daily Site Report. Writes the same DailySiteReport record (and JSON entry
// shapes) the desktop Reports page reads, so a report started on site can be finished there.
export default function MobileSiteReport() {
  const session = useSession();
  const initialProject = useMobileProjectId();
  const [projectId, setProjectId] = useState(initialProject);
  const [reportDate, setReportDate] = useState(todayIso());

  const { data: existing, isLoading } = useQuery({
    queryKey: ['m-dsr', projectId, reportDate],
    enabled: !!projectId && !!reportDate,
    queryFn: async () => (await base44.entities.DailySiteReport.filter({ projectId, reportDate }, '-created_date', 1))[0] || null,
  });

  return (
    <MobilePage title="Daily site report" subtitle="Capture today's site activity" back={projectId ? `/m/project?id=${projectId}` : '/m'}>
      <Card className="space-y-3">
        <Field label="Project"><ProjectSelect value={projectId} onChange={setProjectId} /></Field>
        <Field label="Date"><TextInput type="date" value={reportDate} max={todayIso()} onChange={(e) => setReportDate(e.target.value)} /></Field>
      </Card>
      {!projectId ? <Empty>Choose a project to start.</Empty> : isLoading ? <Loading /> : (
        <ReportForm key={`${projectId}-${reportDate}-${existing?.id || 'new'}`} projectId={projectId} reportDate={reportDate} existing={existing} author={myDisplayName(session)} />
      )}
    </MobilePage>
  );
}

function ReportForm({ projectId, reportDate, existing, author }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const locked = existing && existing.status !== 'Draft';
  const [form, setForm] = useState(() => ({
    contractorName: '', tempMinC: '', tempMaxC: '', windSpeedMaxMs: '', weatherImpactOnWork: false, weatherImpactDescription: '', additionalNotes: '',
    ...Object.fromEntries(WEATHER.map(([k]) => [k, false])),
    ...(existing || {}),
  }));
  const [manpower, setManpower] = useState(() => parse(existing?.manpowerEntries));
  const [equipment, setEquipment] = useState(() => parse(existing?.equipmentEntries));
  const [events, setEvents] = useState(() => parse(existing?.remarkableEvents));
  const [photos, setPhotos] = useState(() => parsePhotos(existing?.photos));
  useEffect(() => { if (!existing && manpower.length === 0) setManpower([{ zone: '', contractor_name: '', activity_description: '', workforce_count: '', worked_hours: '', day_shift: true }]); }, []);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async (status) => {
      const totalWorkers = manpower.reduce((s, r) => s + (Number(r.workforce_count) || 0), 0);
      const totalHours = manpower.reduce((s, r) => s + (Number(r.worked_hours) || 0), 0);
      const payload = {
        projectId, reportDate, status,
        preparedBy: existing?.preparedBy || author,
        contractorName: form.contractorName,
        ...Object.fromEntries(WEATHER.map(([k]) => [k, !!form[k]])),
        tempMinC: num(form.tempMinC), tempMaxC: num(form.tempMaxC), windSpeedMaxMs: num(form.windSpeedMaxMs),
        weatherImpactOnWork: !!form.weatherImpactOnWork, weatherImpactDescription: form.weatherImpactDescription,
        additionalNotes: form.additionalNotes,
        manpowerEntries: JSON.stringify(manpower), equipmentEntries: JSON.stringify(equipment), remarkableEvents: JSON.stringify(events),
        photos: JSON.stringify(photos), totalWorkers, totalHours,
        reportRef: `DSR-${reportDate.replace(/-/g, '')}`,
      };
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      return existing ? base44.entities.DailySiteReport.update(existing.id, payload) : base44.entities.DailySiteReport.create(payload);
    },
    onSuccess: (_, status) => {
      qc.invalidateQueries({ queryKey: ['m-dsr'] });
      toast({ title: status === 'Submitted' ? 'Report submitted' : 'Draft saved' });
      if (status === 'Submitted') navigate(`/m/project?id=${projectId}`);
    },
    onError: (e) => toast({ title: 'Could not save the report', description: e?.message || 'Check your connection and try again.', variant: 'destructive' }),
  });

  if (locked) {
    return (
      <Card>
        <div className="flex items-center gap-2"><Pill color={C.green}>{existing.status}</Pill><span className="text-sm" style={{ color: C.text }}>Report already {existing.status.toLowerCase()} for this date.</span></div>
        <p className="text-sm mt-2" style={{ color: C.muted }}>{existing.totalWorkers || 0} workers · {existing.totalHours || 0} hours · prepared by {existing.preparedBy}</p>
      </Card>
    );
  }

  const row = (setter, i, patch) => setter((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (setter, i) => setter((rows) => rows.filter((_, j) => j !== i));

  return (
    <>
      <SectionTitle>Weather</SectionTitle>
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {WEATHER.map(([k, label]) => (
            <button key={k} type="button" onClick={() => set(k, !form[k])} className="px-3 py-2 rounded-xl text-sm"
              style={{ background: form[k] ? C.accentSoft : 'rgba(15,23,42,0.6)', border: `1px solid ${form[k] ? C.accent : C.border}`, color: form[k] ? '#5eead4' : C.muted }}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Min °C"><TextInput inputMode="decimal" value={form.tempMinC ?? ''} onChange={(e) => set('tempMinC', e.target.value)} /></Field>
          <Field label="Max °C"><TextInput inputMode="decimal" value={form.tempMaxC ?? ''} onChange={(e) => set('tempMaxC', e.target.value)} /></Field>
          <Field label="Wind m/s"><TextInput inputMode="decimal" value={form.windSpeedMaxMs ?? ''} onChange={(e) => set('windSpeedMaxMs', e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
          <input type="checkbox" className="w-5 h-5 accent-teal-500" checked={!!form.weatherImpactOnWork} onChange={(e) => set('weatherImpactOnWork', e.target.checked)} />
          Weather affected work
        </label>
        {form.weatherImpactOnWork && <TextArea rows={2} placeholder="What was affected?" value={form.weatherImpactDescription || ''} onChange={(e) => set('weatherImpactDescription', e.target.value)} />}
      </Card>

      <SectionTitle action={<AddButton onClick={() => setManpower((r) => [...r, { zone: '', contractor_name: '', activity_description: '', workforce_count: '', worked_hours: '', day_shift: true }])} />}>Manpower</SectionTitle>
      {manpower.map((m, i) => (
        <Card key={i} className="space-y-2">
          <RowHeader label={`Crew ${i + 1}`} onRemove={() => remove(setManpower, i)} />
          <TextInput placeholder="Contractor" value={m.contractor_name} onChange={(e) => row(setManpower, i, { contractor_name: e.target.value })} />
          <TextInput placeholder="Activity" value={m.activity_description} onChange={(e) => row(setManpower, i, { activity_description: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput placeholder="Zone" value={m.zone} onChange={(e) => row(setManpower, i, { zone: e.target.value })} />
            <TextInput placeholder="Workers" inputMode="numeric" value={m.workforce_count} onChange={(e) => row(setManpower, i, { workforce_count: e.target.value })} />
            <TextInput placeholder="Hours" inputMode="decimal" value={m.worked_hours} onChange={(e) => row(setManpower, i, { worked_hours: e.target.value })} />
          </div>
        </Card>
      ))}

      <SectionTitle action={<AddButton onClick={() => setEquipment((r) => [...r, { equipment_type: '', quantity: '', operational: '', in_repair: '', out_of_order: '' }])} />}>Equipment</SectionTitle>
      {equipment.length === 0 && <Empty>No equipment logged.</Empty>}
      {equipment.map((q, i) => (
        <Card key={i} className="space-y-2">
          <RowHeader label={`Equipment ${i + 1}`} onRemove={() => remove(setEquipment, i)} />
          <TextInput placeholder="Type (e.g. Mobile crane)" value={q.equipment_type} onChange={(e) => row(setEquipment, i, { equipment_type: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <TextInput placeholder="Qty" inputMode="numeric" value={q.quantity} onChange={(e) => row(setEquipment, i, { quantity: e.target.value })} />
            <TextInput placeholder="Working" inputMode="numeric" value={q.operational} onChange={(e) => row(setEquipment, i, { operational: e.target.value })} />
            <TextInput placeholder="In repair" inputMode="numeric" value={q.in_repair} onChange={(e) => row(setEquipment, i, { in_repair: e.target.value })} />
          </div>
        </Card>
      ))}

      <SectionTitle action={<AddButton onClick={() => setEvents((r) => [...r, { event_time: new Date().toTimeString().slice(0, 5), zone: '', event_description: '', event_type: 'Other', severity: 'Info' }])} />}>Notable events</SectionTitle>
      {events.length === 0 && <Empty>No events logged.</Empty>}
      {events.map((ev, i) => (
        <Card key={i} className="space-y-2">
          <RowHeader label={`Event ${i + 1}`} onRemove={() => remove(setEvents, i)} />
          <div className="grid grid-cols-2 gap-2">
            <TextInput type="time" value={ev.event_time} onChange={(e) => row(setEvents, i, { event_time: e.target.value })} />
            <TextInput placeholder="Zone" value={ev.zone} onChange={(e) => row(setEvents, i, { zone: e.target.value })} />
          </div>
          <TextArea rows={2} placeholder="What happened?" value={ev.event_description} onChange={(e) => row(setEvents, i, { event_description: e.target.value })} />
          <Choice options={['Info', 'Minor', 'Major', 'Critical']} value={ev.severity} colors={{ Info: C.blue, Minor: C.amber, Major: C.red, Critical: C.red }} onChange={(v) => row(setEvents, i, { severity: v })} />
        </Card>
      ))}

      <SectionTitle>Photos & notes</SectionTitle>
      <Card className="space-y-3">
        <PhotoCapture value={photos} onChange={setPhotos} />
        <TextInput placeholder="Main contractor" value={form.contractorName || ''} onChange={(e) => set('contractorName', e.target.value)} />
        <TextArea placeholder="Other notes" value={form.additionalNotes || ''} onChange={(e) => set('additionalNotes', e.target.value)} />
      </Card>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button type="button" disabled={save.isPending} onClick={() => save.mutate('Draft')} className="py-3.5 rounded-xl text-base font-semibold disabled:opacity-50" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${C.border}`, color: C.text }}>
          Save draft
        </button>
        <PrimaryButton disabled={save.isPending} onClick={() => save.mutate('Submitted')}>{save.isPending ? 'Saving…' : 'Submit'}</PrimaryButton>
      </div>
    </>
  );
}

function AddButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 text-sm font-medium" style={{ color: C.accent }}>
      <Plus className="w-4 h-4" /> Add
    </button>
  );
}

function RowHeader({ label, onRemove }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium" style={{ color: C.muted }}>{label}</span>
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="p-1" style={{ color: C.faint }}><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}
