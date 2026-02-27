import React, { useRef, useEffect, useState, useCallback } from 'react';

const CANVAS_W = 900;
const CANVAS_H = 520;

function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

export default function NeuralCanvas({ neurons, synapses, selectedNeuronId, selectedSynapseId, onNeuronClick, onSynapseClick, editMode }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const pulseRef = useRef([]);
  const [hovered, setHovered] = useState(null);

  const getPos = useCallback((neuron, w, h) => ({
    x: neuron.position_x * w,
    y: neuron.position_y * h
  }), []);

  // Initialize pulses
  useEffect(() => {
    if (!synapses.length || !neurons.length) return;
    const activeSynapses = synapses.filter(s => s.is_active && s.health_status === 'Active');
    pulseRef.current = activeSynapses.flatMap(s => {
      const count = Math.max(1, Math.floor((s.fire_count_24h || 0) / 10));
      return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
        synapseId: s.id,
        progress: (i / Math.min(count, 3)),
        speed: 0.003 + Math.random() * 0.002,
      }));
    });
  }, [synapses, neurons]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const neuronMap = {};
    neurons.forEach(n => { neuronMap[n.id] = n; });

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Background grid dots
      ctx.fillStyle = 'rgba(100,116,139,0.08)';
      for (let x = 0; x < W; x += 40) {
        for (let y = 0; y < H; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw synapses
      synapses.forEach(s => {
        const from = neuronMap[s.from_neuron_id];
        const to = neuronMap[s.to_neuron_id];
        if (!from || !to) return;
        const fp = getPos(from, W, H);
        const tp = getPos(to, W, H);
        const isSelected = s.id === selectedSynapseId;
        const isHovered = hovered?.type === 'synapse' && hovered.id === s.id;
        const isNeuronHighlighted = selectedNeuronId && (from.id === selectedNeuronId || to.id === selectedNeuronId);

        const midX = (fp.x + tp.x) / 2;
        const midY = (fp.y + tp.y) / 2 - 40;

        let opacity = 0.25;
        if (isSelected || isNeuronHighlighted) opacity = 1;
        else if (isHovered) opacity = 0.75;
        else if (!s.is_active) opacity = 0.08;

        const color = s.health_status === 'Error' || s.health_status === 'Broken' ? '#ef4444'
          : s.health_status === 'Paused' ? '#475569'
          : from.color || '#6366f1';

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        if (!s.is_active) ctx.setLineDash([6, 4]);
        if (s.synapse_type === 'Bidirectional') ctx.setLineDash([4, 2]);

        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y);
        ctx.quadraticCurveTo(midX, midY, tp.x, tp.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow at end
        const t2 = 0.9;
        const ax = (1 - t2) * (1 - t2) * fp.x + 2 * (1 - t2) * t2 * midX + t2 * t2 * tp.x;
        const ay = (1 - t2) * (1 - t2) * fp.y + 2 * (1 - t2) * t2 * midY + t2 * t2 * tp.y;
        const angle = Math.atan2(tp.y - ay, tp.x - ax);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tp.x - 10 * Math.cos(angle - 0.3), tp.y - 10 * Math.sin(angle - 0.3));
        ctx.lineTo(tp.x - 4 * Math.cos(angle), tp.y - 4 * Math.sin(angle));
        ctx.lineTo(tp.x - 10 * Math.cos(angle + 0.3), tp.y - 10 * Math.sin(angle + 0.3));
        ctx.fill();
        ctx.restore();
      });

      // Draw pulses
      pulseRef.current = pulseRef.current.map(p => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        return p;
      });

      pulseRef.current.forEach(p => {
        const s = synapses.find(s => s.id === p.synapseId);
        if (!s || !s.is_active) return;
        const from = neuronMap[s.from_neuron_id];
        const to = neuronMap[s.to_neuron_id];
        if (!from || !to) return;
        const fp = getPos(from, W, H);
        const tp = getPos(to, W, H);
        const midX = (fp.x + tp.x) / 2;
        const midY = (fp.y + tp.y) / 2 - 40;
        const t = easeInOut(p.progress);
        const x = (1 - t) * (1 - t) * fp.x + 2 * (1 - t) * t * midX + t * t * tp.x;
        const y = (1 - t) * (1 - t) * fp.y + 2 * (1 - t) * t * midY + t * t * tp.y;
        const col = from.color || '#6366f1';
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 6);
        grd.addColorStop(0, col + 'ff');
        grd.addColorStop(1, col + '00');
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // Draw neurons
      neurons.forEach(n => {
        const { x, y } = getPos(n, W, H);
        const r = 28;
        const isSelected = n.id === selectedNeuronId;
        const isHovered = hovered?.type === 'neuron' && hovered.id === n.id;
        const color = n.color || '#6366f1';
        const ringColor = n.health_status === 'Healthy' ? '#10b981'
          : n.health_status === 'Degraded' ? '#f59e0b'
          : n.health_status === 'Error' ? '#ef4444' : '#475569';

        // Glow
        if (isSelected || isHovered) {
          const glow = ctx.createRadialGradient(x, y, r, x, y, r + 20);
          glow.addColorStop(0, color + '55');
          glow.addColorStop(1, color + '00');
          ctx.beginPath();
          ctx.arc(x, y, r + 20, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Health ring
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Neuron body
        const grad = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, r);
        grad.addColorStop(0, color + 'dd');
        grad.addColorStop(1, color + '66');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#fff' : color;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Icon
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.icon || '⬡', x, y - 4);

        // Short code
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.short_code, x, y + 11);

        // Pulse badge
        if ((n.pulse_count_24h || 0) > 0) {
          ctx.font = '8px sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(x + r - 2, y - r + 2, 9, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.fillText(n.pulse_count_24h > 99 ? '99+' : n.pulse_count_24h, x + r - 2, y - r + 2);
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [neurons, synapses, selectedNeuronId, selectedSynapseId, hovered, getPos]);

  const hitTest = useCallback((clientX, clientY, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (clientX - rect.left) * scaleX;
    const my = (clientY - rect.top) * scaleY;
    const W = canvas.width;
    const H = canvas.height;

    for (const n of neurons) {
      const { x, y } = getPos(n, W, H);
      if (Math.hypot(mx - x, my - y) < 32) return { type: 'neuron', id: n.id };
    }
    for (const s of synapses) {
      const from = neurons.find(n => n.id === s.from_neuron_id);
      const to = neurons.find(n => n.id === s.to_neuron_id);
      if (!from || !to) continue;
      const fp = getPos(from, W, H);
      const tp = getPos(to, W, H);
      const midX = (fp.x + tp.x) / 2;
      const midY = (fp.y + tp.y) / 2 - 40;
      for (let t = 0; t <= 1; t += 0.05) {
        const bx = (1 - t) * (1 - t) * fp.x + 2 * (1 - t) * t * midX + t * t * tp.x;
        const by = (1 - t) * (1 - t) * fp.y + 2 * (1 - t) * t * midY + t * t * tp.y;
        if (Math.hypot(mx - bx, my - by) < 8) return { type: 'synapse', id: s.id };
      }
    }
    return null;
  }, [neurons, synapses, getPos]);

  const handleClick = (e) => {
    const hit = hitTest(e.clientX, e.clientY, canvasRef.current);
    if (hit?.type === 'neuron') onNeuronClick(hit.id);
    else if (hit?.type === 'synapse') onSynapseClick(hit.id);
    else { onNeuronClick(null); onSynapseClick(null); }
  };

  const handleMouseMove = (e) => {
    const hit = hitTest(e.clientX, e.clientY, canvasRef.current);
    setHovered(hit);
    canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHovered(null)}
      style={{ width: '100%', height: '100%', display: 'block', borderRadius: '0.5rem' }}
    />
  );
}