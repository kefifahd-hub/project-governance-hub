/**
 * Schedule file parser — supports XER (P6), XML (P6/MSP), MPP-as-XML, CSV
 * Returns { tasks, milestones, summary } suitable for preview + DB import
 */

export async function parseScheduleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const text = await file.text();

  if (ext === 'xer') return parseXER(text, file.name);
  if (ext === 'xml') return parseXML(text, file.name);
  if (ext === 'csv') return parseCSV(text, file.name);
  if (ext === 'mpp') throw new Error('Binary .MPP files cannot be parsed in the browser. Please export to XML from Microsoft Project instead.');
  throw new Error(`Unsupported file format: .${ext}`);
}

/**
 * Parse Primavera P6 XER file
 * XER format: tab-separated tables starting with %T tablename, then %F fields, then %R rows, then %E
 */
function parseXER(text, fileName) {
  const tables = {};
  let currentTable = null;
  let fields = [];

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('%T\t')) {
      currentTable = line.slice(3).trim();
      tables[currentTable] = [];
      fields = [];
    } else if (line.startsWith('%F\t')) {
      fields = line.slice(3).split('\t');
    } else if (line.startsWith('%R\t')) {
      const vals = line.slice(3).split('\t');
      const obj = {};
      fields.forEach((f, i) => { obj[f] = vals[i] || ''; });
      tables[currentTable]?.push(obj);
    }
  }

  const activities = tables['TASK'] || [];
  const wbsTable = tables['PROJWBS'] || [];
  const projTable = tables['PROJECT'] || [];
  const relationships = tables['TASKPRED'] || [];

  const proj = projTable[0] || {};
  const dataDate = proj['last_recalc_date'] ? proj['last_recalc_date'].split(' ')[0] : null;
  const projectStart = activities.length ? activities.reduce((a, b) => (a.target_start_date < b.target_start_date ? a : b)).target_start_date?.split(' ')[0] : null;
  const projectFinish = activities.length ? activities.reduce((a, b) => (a.target_end_date > b.target_end_date ? a : b)).target_end_date?.split(' ')[0] : null;

  const wbsMap = Object.fromEntries(wbsTable.map(w => [w.wbs_id, w]));

  const tasks = activities.map(a => {
    const wbs = wbsMap[a.wbs_id] || {};
    const isMilestone = a.task_type === 'TT_Mile' || a.task_type === 'TT_FinMile' || a.task_type === 'TT_StartMile';
    const isSummary = a.task_type === 'TT_WBS';
    const isCritical = a.total_float_hr_cnt && parseFloat(a.total_float_hr_cnt) <= 0;
    const pct = parseFloat(a.phys_complete_pct || a.target_drtn_hr_cnt === '0' ? '100' : a.act_work_qty || '0');

    return {
      externalId: a.task_code || a.task_id,
      externalWbs: wbs.wbs_short_name || wbs.wbs_name || a.wbs_id,
      taskName: a.task_name,
      taskType: isMilestone ? 'Milestone' : isSummary ? 'Summary' : 'Task',
      wbsLevel: parseInt(wbs.seq_num || '0'),
      plannedStart: a.target_start_date?.split(' ')[0] || a.early_start_date?.split(' ')[0],
      plannedFinish: a.target_end_date?.split(' ')[0] || a.early_end_date?.split(' ')[0],
      actualStart: a.act_start_date?.split(' ')[0] || null,
      actualFinish: a.act_end_date?.split(' ')[0] || null,
      durationDays: Math.round(parseFloat(a.target_drtn_hr_cnt || '0') / 8),
      remainingDuration: Math.round(parseFloat(a.remain_drtn_hr_cnt || '0') / 8),
      percentComplete: parseFloat(a.phys_complete_pct || '0'),
      totalFloat: Math.round(parseFloat(a.total_float_hr_cnt || '0') / 8),
      freeFloat: Math.round(parseFloat(a.free_float_hr_cnt || '0') / 8),
      isCritical: isCritical,
      status: a.status_code === 'TK_Complete' ? 'Complete' : a.status_code === 'TK_Active' ? 'In Progress' : a.status_code === 'TK_Suspend' ? 'Suspended' : 'Not Started',
      resourceNames: a.rsrc_id || '',
      notes: a.task_memo || '',
    };
  });

  const milestoneCount = tasks.filter(t => t.taskType === 'Milestone').length;
  const criticalCount = tasks.filter(t => t.isCritical).length;
  const wbsLevels = tasks.reduce((max, t) => Math.max(max, t.wbsLevel || 0), 0);

  return {
    tasks,
    summary: {
      taskCount: tasks.length,
      milestoneCount,
      wbsLevels: wbsLevels || 5,
      projectStart: projectStart || '',
      projectFinish: projectFinish || '',
      dataDate: dataDate || '',
      criticalPathLength: criticalCount,
      totalFloatMin: Math.min(...tasks.filter(t => t.totalFloat !== undefined).map(t => t.totalFloat), 999),
      importLog: `Parsed ${tasks.length} activities, ${milestoneCount} milestones, ${relationships.length} relationships from ${fileName}`,
    },
  };
}

/**
 * Parse XML (both P6 XML and MSP XML format)
 */
function parseXML(text, fileName) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');

  // Try MSP format first (Tasks element)
  const mspTasks = doc.querySelectorAll('Task');
  if (mspTasks.length > 0) {
    return parseMSPXML(doc, fileName);
  }

  // Try P6 XML format
  const p6Activities = doc.querySelectorAll('Activity');
  if (p6Activities.length > 0) {
    return parseP6XML(doc, fileName);
  }

  throw new Error('Could not detect XML format (no Task or Activity elements found)');
}

function parseMSPXML(doc, fileName) {
  const taskEls = Array.from(doc.querySelectorAll('Task'));
  const tasks = taskEls.map(el => {
    const get = (tag) => el.querySelector(tag)?.textContent || '';
    const isMilestone = get('Milestone') === '1';
    const isSummary = get('Summary') === '1';
    const pct = parseFloat(get('PercentComplete') || '0');
    const start = get('Start')?.split('T')[0];
    const finish = get('Finish')?.split('T')[0];

    return {
      externalId: get('ID') || get('UID'),
      externalWbs: get('WBS') || get('OutlineNumber'),
      taskName: get('Name'),
      taskType: isMilestone ? 'Milestone' : isSummary ? 'Summary' : 'Task',
      wbsLevel: parseInt(get('OutlineLevel') || '1'),
      plannedStart: start,
      plannedFinish: finish,
      actualStart: get('ActualStart')?.split('T')[0] || null,
      actualFinish: get('ActualFinish')?.split('T')[0] || null,
      baselineStart: get('BaselineStart')?.split('T')[0] || null,
      baselineFinish: get('BaselineFinish')?.split('T')[0] || null,
      durationDays: Math.round(parseFloat(get('Duration').replace('PT', '').replace('H', '') || '0') / 8) || parseInt(get('DurationFormat')) || 0,
      percentComplete: pct,
      totalFloat: Math.round(parseFloat(get('TotalSlack') || '0') / 4800),
      isCritical: get('Critical') === '1',
      status: get('ActualFinish') ? 'Complete' : get('ActualStart') ? 'In Progress' : 'Not Started',
    };
  }).filter(t => t.taskName);

  const milestoneCount = tasks.filter(t => t.taskType === 'Milestone').length;
  const starts = tasks.map(t => t.plannedStart).filter(Boolean).sort();
  const finishes = tasks.map(t => t.plannedFinish).filter(Boolean).sort();
  const statusDate = doc.querySelector('StatusDate')?.textContent?.split('T')[0];

  return {
    tasks,
    summary: {
      taskCount: tasks.length,
      milestoneCount,
      wbsLevels: Math.max(...tasks.map(t => t.wbsLevel), 1),
      projectStart: starts[0] || '',
      projectFinish: finishes[finishes.length - 1] || '',
      dataDate: statusDate || '',
      criticalPathLength: tasks.filter(t => t.isCritical).length,
      totalFloatMin: 0,
      importLog: `Parsed ${tasks.length} tasks, ${milestoneCount} milestones from MSP XML: ${fileName}`,
    },
  };
}

function parseP6XML(doc, fileName) {
  const actEls = Array.from(doc.querySelectorAll('Activity'));
  const tasks = actEls.map(el => {
    const get = (tag) => el.querySelector(tag)?.textContent || '';
    const type = get('Type');
    const isMilestone = type.includes('Mile') || type.includes('Finish');
    return {
      externalId: get('Id'),
      externalWbs: get('WBSObjectId') || get('WBSCode'),
      taskName: get('Name'),
      taskType: isMilestone ? 'Milestone' : 'Task',
      wbsLevel: 1,
      plannedStart: get('PlannedStartDate')?.split('T')[0] || get('StartDate')?.split('T')[0],
      plannedFinish: get('PlannedFinishDate')?.split('T')[0] || get('FinishDate')?.split('T')[0],
      actualStart: get('ActualStartDate')?.split('T')[0] || null,
      actualFinish: get('ActualFinishDate')?.split('T')[0] || null,
      percentComplete: parseFloat(get('PercentComplete') || '0'),
      totalFloat: parseFloat(get('TotalFloat') || '0'),
      isCritical: get('CriticalPath') === 'true' || parseFloat(get('TotalFloat') || '0') <= 0,
      status: get('Status') || 'Not Started',
    };
  });

  const milestoneCount = tasks.filter(t => t.taskType === 'Milestone').length;
  const starts = tasks.map(t => t.plannedStart).filter(Boolean).sort();
  const finishes = tasks.map(t => t.plannedFinish).filter(Boolean).sort();

  return {
    tasks,
    summary: {
      taskCount: tasks.length,
      milestoneCount,
      wbsLevels: 5,
      projectStart: starts[0] || '',
      projectFinish: finishes[finishes.length - 1] || '',
      dataDate: '',
      criticalPathLength: tasks.filter(t => t.isCritical).length,
      totalFloatMin: 0,
      importLog: `Parsed ${tasks.length} activities from P6 XML: ${fileName}`,
    },
  };
}

/**
 * Parse CSV (fallback) — assumes columns: ID, Name, Start, Finish, %Complete, etc.
 */
function parseCSV(text, fileName) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV file is empty or has no data rows');

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const find = (...candidates) => {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h.includes(c));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idIdx = find('id', 'activity id', 'task id');
  const nameIdx = find('name', 'activity name', 'task name', 'description');
  const startIdx = find('start', 'planned start', 'early start');
  const finishIdx = find('finish', 'planned finish', 'early finish');
  const pctIdx = find('percent', '% complete', 'complete', 'progress');
  const floatIdx = find('float', 'total float');

  const tasks = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (!cols[nameIdx]) return null;
    return {
      externalId: cols[idIdx] || String(Math.random()),
      taskName: cols[nameIdx],
      taskType: 'Task',
      wbsLevel: 1,
      plannedStart: cols[startIdx] || null,
      plannedFinish: cols[finishIdx] || null,
      percentComplete: parseFloat(cols[pctIdx] || '0'),
      totalFloat: parseFloat(cols[floatIdx] || '0'),
      isCritical: parseFloat(cols[floatIdx] || '0') <= 0,
      status: parseFloat(cols[pctIdx] || '0') >= 100 ? 'Complete' : parseFloat(cols[pctIdx] || '0') > 0 ? 'In Progress' : 'Not Started',
    };
  }).filter(Boolean);

  return {
    tasks,
    summary: {
      taskCount: tasks.length,
      milestoneCount: 0,
      wbsLevels: 1,
      projectStart: '',
      projectFinish: '',
      dataDate: '',
      criticalPathLength: 0,
      totalFloatMin: 0,
      importLog: `Parsed ${tasks.length} rows from CSV: ${fileName}`,
    },
  };
}

/**
 * Generate deltas between two sets of tasks
 */
export function generateDeltas(oldTasks, newTasks) {
  const deltas = [];
  const oldMap = Object.fromEntries(oldTasks.map(t => [t.externalId, t]));
  const newMap = Object.fromEntries(newTasks.map(t => [t.externalId, t]));

  // Detect new and changed tasks
  for (const newTask of newTasks) {
    const old = oldMap[newTask.externalId];
    if (!old) {
      deltas.push({ externalId: newTask.externalId, taskName: newTask.taskName, changeType: 'New Task', fieldChanged: 'all', oldValue: '—', newValue: 'New task', varianceDays: 0, impactLevel: 'Info', affectsCriticalPath: newTask.isCritical, affectsMilestone: newTask.taskType === 'Milestone' });
      continue;
    }

    // Date shift
    if (old.plannedFinish && newTask.plannedFinish && old.plannedFinish !== newTask.plannedFinish) {
      const varDays = Math.round((new Date(newTask.plannedFinish) - new Date(old.plannedFinish)) / 86400000);
      const absVar = Math.abs(varDays);
      const impactLevel = absVar > 30 || newTask.isCritical ? 'Critical' : absVar >= 15 ? 'Major' : absVar >= 5 ? 'Minor' : 'Info';
      deltas.push({ externalId: newTask.externalId, taskName: newTask.taskName, changeType: 'Date Shift', fieldChanged: 'Planned Finish', oldValue: old.plannedFinish, newValue: newTask.plannedFinish, varianceDays: varDays, impactLevel, affectsCriticalPath: newTask.isCritical, affectsMilestone: newTask.taskType === 'Milestone' });
    }

    // Progress
    if (old.percentComplete !== newTask.percentComplete) {
      deltas.push({ externalId: newTask.externalId, taskName: newTask.taskName, changeType: 'Progress Update', fieldChanged: '% Complete', oldValue: `${old.percentComplete}%`, newValue: `${newTask.percentComplete}%`, varianceDays: 0, impactLevel: 'Info', affectsCriticalPath: false, affectsMilestone: false });
    }

    // Float change (significant only)
    if (old.totalFloat !== undefined && newTask.totalFloat !== undefined) {
      const floatDelta = newTask.totalFloat - old.totalFloat;
      if (Math.abs(floatDelta) >= 5) {
        const impactLevel = newTask.totalFloat < 10 && old.totalFloat >= 10 ? 'Major' : Math.abs(floatDelta) >= 14 ? 'Minor' : 'Info';
        deltas.push({ externalId: newTask.externalId, taskName: newTask.taskName, changeType: 'Float Change', fieldChanged: 'Total Float', oldValue: `${old.totalFloat}d`, newValue: `${newTask.totalFloat}d`, varianceDays: floatDelta, impactLevel, affectsCriticalPath: newTask.isCritical, affectsMilestone: false });
      }
    }
  }

  // Deleted tasks
  for (const oldTask of oldTasks) {
    if (!newMap[oldTask.externalId]) {
      deltas.push({ externalId: oldTask.externalId, taskName: oldTask.taskName, changeType: 'Deleted Task', fieldChanged: 'all', oldValue: 'Existed', newValue: 'Removed', varianceDays: 0, impactLevel: 'Minor', affectsCriticalPath: oldTask.isCritical, affectsMilestone: oldTask.taskType === 'Milestone' });
    }
  }

  return deltas;
}