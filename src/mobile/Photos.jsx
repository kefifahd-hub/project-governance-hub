import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { C } from './ui';

// Photos are uploaded as PRIVATE files: the record stores only the file URI, and a short-lived
// signed URL is created when someone who can already read the record views it. Nothing is
// reachable by a public link.

export const parsePhotos = (value) => {
  try { const v = JSON.parse(value || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
};

function useSignedUrls(uris) {
  const [urls, setUrls] = useState({});
  const key = uris.join('|');
  useEffect(() => {
    let cancelled = false;
    Promise.all(uris.map(async (uri) => {
      try {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 600 });
        return [uri, signed_url];
      } catch {
        return [uri, null];
      }
    })).then((pairs) => { if (!cancelled) setUrls(Object.fromEntries(pairs)); });
    return () => { cancelled = true; };
  }, [key]);
  return urls;
}

export function PhotoStrip({ uris, onRemove }) {
  const urls = useSignedUrls(uris);
  if (!uris.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {uris.map((uri) => (
        <div key={uri} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${C.border}` }}>
          {urls[uri] ? (
            <a href={urls[uri]} target="_blank" rel="noreferrer"><img src={urls[uri]} alt="" className="w-full h-full object-cover" /></a>
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin" style={{ color: C.muted }} /></div>
          )}
          {onRemove && (
            <button type="button" onClick={() => onRemove(uri)} aria-label="Remove photo" className="absolute top-1 right-1 rounded-full p-0.5" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** Take or pick photos; calls onChange with the updated list of private file URIs. */
export function PhotoCapture({ value, onChange }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const added = [];
      for (const file of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        added.push(file_uri);
      }
      onChange([...value, ...added]);
    } catch (e) {
      setError(e?.message || 'Upload failed — check your connection and try again.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <PhotoStrip uris={value} onRemove={(uri) => onChange(value.filter((u) => u !== uri))} />
      <input ref={input} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => handleFiles(Array.from(e.target.files || []))} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
        style={{ background: 'rgba(15,23,42,0.6)', border: `1px dashed ${C.border}`, color: C.text }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {busy ? 'Uploading…' : 'Add photo'}
      </button>
      {error && <p className="text-xs" style={{ color: C.red }}>{error}</p>}
    </div>
  );
}
