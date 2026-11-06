// task-habit-tracker smoke test — loads the real page script from index.html
// and exercises its core behaviour: task add/edit/delete, completion with
// habit streaks, the recommendation scoring, CSV export, and the AES-GCM
// encrypted backup round-trip.
// Run: node tests/smoke.test.js   (no dependencies; Node 18+)
'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const altHtml = fs.readFileSync(path.join(root, 'task-habit-tracker.html'), 'utf8');

let passed = 0;
function ok(name, cond) {
  assert.ok(cond, name);
  passed += 1;
  console.log('ok -', name);
}

// --- (a) Page structure: core elements and the twin build ---
for (const id of ['task-form', 'task-id', 'task-title', 'task-notes',
  'task-due', 'task-estimated', 'task-tags', 'task-ishabit', 'task-list',
  'recommendation-list', 'report-summary', 'template-list', 'habit-calendar',
  'filter-status', 'filter-type', 'export-csv', 'csv-period',
  'export-encrypted', 'import-file', 'sync-passphrase', 'theme-select',
  'current-month', 'save-current-template']) {
  ok(`page has #${id}`, html.includes(`id="${id}"`));
}
ok('twin build carries the same storage key',
  altHtml.includes('"task_habit_app_v1"') && html.includes('"task_habit_app_v1"'));
ok('twin build carries the same core logic',
  ['toggleDone', 'computeRecommendations', 'BUILTIN_TEMPLATES'].every((s) => altHtml.includes(s)));

// --- (b) Load the page's own inline script with a minimal DOM ---
class El {
  constructor(tag) {
    this.tagName = tag; this.children = []; this.style = {};
    this.value = ''; this.checked = false; this.textContent = '';
    this.className = ''; this.type = ''; this.title = '';
    this._classes = new Set();
    this.classList = {
      add: (c) => this._classes.add(c),
      remove: (c) => this._classes.delete(c),
      contains: (c) => this._classes.has(c),
    };
    this._innerHTML = '';
  }
  set innerHTML(v) { this._innerHTML = v; if (v === '') this.children = []; }
  get innerHTML() { return this._innerHTML; }
  append(...kids) { this.children.push(...kids); }
  appendChild(kid) { this.children.push(kid); return kid; }
  setAttribute() {}
  focus() {}
  click() { if (this.onclick) this.onclick(); }
}
const store = new Map();
const localStorageStub = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const byId = new Map();
function element(id) {
  if (!byId.has(id)) byId.set(id, new El('div'));
  return byId.get(id);
}
// Sensible defaults the app reads at init
element('filter-status').value = 'all';
element('filter-type').value = 'all';
element('csv-period').value = 'all';
element('theme-select').value = 'system';

const savedFiles = [];
const context = {
  console,
  TextEncoder, TextDecoder, Blob,
  crypto: webcrypto,
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  localStorage: localStorageStub,
  window: { matchMedia: () => ({ matches: false }) },
  document: {
    getElementById: (id) => element(id),
    createElement: (tag) => new El(tag),
    documentElement: new El('html'),
  },
  saveAs: (blob, name) => savedFiles.push({ blob, name }),
  prompt: () => null,
  confirm: () => true,
  alert: () => {},
};
vm.createContext(context);
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'index.html carries an inline script');
vm.runInContext(scriptMatch[1], context);
const run = (expr) => vm.runInContext(expr, context);

function submitForm(fields) {
  element('task-id').value = fields.id || '';
  element('task-title').value = fields.title || '';
  element('task-notes').value = fields.notes || '';
  element('task-due').value = fields.due || '';
  element('task-estimated').value = fields.est || '';
  element('task-tags').value = fields.tags || '';
  element('task-ishabit').checked = !!fields.habit;
  element('task-form').onsubmit({ preventDefault() {} });
}

(async () => {
  // --- (c) Adding tasks through the form handler ---
  submitForm({ title: 'Daily review', est: '15', tags: 'review, planning', habit: true });
  let tasks = run('state.tasks');
  ok('one task after first submit', tasks.length === 1);
  ok('task shape matches docs/api.md',
    tasks[0].title === 'Daily review' && tasks[0].status === 'pending' &&
    tasks[0].estimatedMinutes === 15 && tasks[0].isHabit === true &&
    tasks[0].streak === 0 && tasks[0].dueDate === null);
  ok('tags were split and trimmed',
    JSON.stringify(tasks[0].tags) === JSON.stringify(['review', 'planning']));
  ok('state persisted to localStorage',
    JSON.parse(store.get('task_habit_app_v1')).tasks.length === 1);
  ok('task list rendered one item', element('task-list').children.length === 1);

  submitForm({ title: '' });
  ok('an empty title adds nothing', run('state.tasks').length === 1);

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  submitForm({ title: 'Overdue report', est: '90', due: yesterday });
  submitForm({ title: 'Quick email', est: '10' });
  tasks = run('state.tasks');
  ok('three tasks after more submits', tasks.length === 3);
  const habitId = tasks[0].id;
  const overdueId = tasks[1].id;

  // --- (d) Editing preserves status/streak and updates fields ---
  run(`editTask(${JSON.stringify(habitId)})`);
  ok('edit loads the task into the form', element('task-title').value === 'Daily review');
  element('task-title').value = 'Daily review & plan';
  element('task-form').onsubmit({ preventDefault() {} });
  tasks = run('state.tasks');
  ok('edit updates in place (still 3 tasks)', tasks.length === 3);
  ok('edited title saved, habit flag preserved',
    tasks[0].title === 'Daily review & plan' && tasks[0].isHabit === true);

  // --- (e) Completion and habit streaks ---
  run(`toggleDone(${JSON.stringify(habitId)})`);
  let habit = run('state.tasks')[0];
  ok('toggle marks the habit done', habit.status === 'done');
  ok('first completion starts the streak at 1', habit.streak === 1);
  ok('actual minutes default to the estimate', habit.actualMinutes === 15);
  ok('lastDoneAt is set', typeof habit.lastDoneAt === 'string');
  run(`toggleDone(${JSON.stringify(habitId)})`);
  ok('toggling again reopens the task', run('state.tasks')[0].status === 'pending');
  run(`toggleDone(${JSON.stringify(habitId)})`);
  habit = run('state.tasks')[0];
  ok('same-day recompletion does not double-count the streak', habit.streak === 1);

  // Yesterday completion + streak 3 -> completing today makes 4
  const yDayFull = new Date(Date.now() - 86400000).toISOString();
  run(`(state.tasks[0].status = 'pending', state.tasks[0].streak = 3, state.tasks[0].lastDoneAt = ${JSON.stringify(yDayFull)}, state.tasks[0])`);
  run(`toggleDone(${JSON.stringify(habitId)})`);
  habit = run('state.tasks')[0];
  ok('consecutive-day completion extends the streak (3 -> 4)', habit.streak === 4);
  // A gap of two days resets the streak
  const twoDays = new Date(Date.now() - 2 * 86400000).toISOString();
  run(`(state.tasks[0].status = 'pending', state.tasks[0].lastDoneAt = ${JSON.stringify(twoDays)}, state.tasks[0])`);
  run(`toggleDone(${JSON.stringify(habitId)})`);
  ok('a missed day resets the streak to 1', run('state.tasks')[0].streak === 1);
  run(`toggleDone(${JSON.stringify(habitId)})`); // back to pending for the rec tests

  // --- (f) Recommendation scoring (docs/usage.md weights) ---
  const recs = run('computeRecommendations()');
  ok('recommendations are produced for pending tasks', recs.length >= 2);
  ok('recommendations are sorted by score, highest first',
    recs.every((r, i) => i === 0 || recs[i - 1].score >= r.score));
  const habitRec = recs.find((r) => r.task.id === habitId);
  ok('habit scores 40 + 15 missed + streak bonus',
    habitRec.score === 55 + Math.min(1 * 2, 10) && habitRec.reasons.includes('habit'));
  const overdueRec = recs.find((r) => r.task.id === overdueId);
  ok('overdue task scores 30 with the overdue reason',
    overdueRec.score === 30 && overdueRec.reasons.includes('overdue'));
  const quickRec = recs.find((r) => r.task.title === 'Quick email');
  ok('quick win (<=15m) scores 15', quickRec.score === 15 && quickRec.reasons.includes('quick'));
  run(`toggleDone(${JSON.stringify(overdueId)})`);
  ok('done tasks drop out of recommendations',
    !run('computeRecommendations()').some((r) => r.task.id === overdueId));

  // --- (g) Habit history + report ---
  const history = run('getHabitHistory()');
  ok('habit history counts completions by day', Object.values(history).some((n) => n >= 1));
  ok('report renders the 7-day summary',
    element('report-summary').innerHTML.includes('tasks done (7d)'));

  // --- (h) Templates: the documented builtin set is what loads ---
  const names = run('templates.map(t => t.name)');
  ok('builtin templates load (Daily Review, Code Sprint, Gym Weights, Portfolio)',
    JSON.stringify(names) === JSON.stringify(['Daily Review', 'Code Sprint', 'Gym Weights', 'Portfolio']));
  ok('template list rendered one button per template',
    element('template-list').children.length === 4);

  // --- (i) CSV export carries the documented header and done rows ---
  // Observed behaviour, pinned deliberately: toggleDone records lastDoneAt
  // only for habits, and the CSV filter requires lastDoneAt — so a completed
  // HABIT appears in the export, while the completed non-habit task above
  // does not. The filing pack flags this for the maintainer.
  run(`toggleDone(${JSON.stringify(habitId)})`);
  savedFiles.length = 0;
  element('export-csv').onclick();
  ok('CSV export saves one file', savedFiles.length === 1);
  const csvText = await savedFiles[0].blob.text();
  ok('CSV filename is performance-<date>-alld.csv',
    /^performance-\d{4}-\d{2}-\d{2}-alld\.csv$/.test(savedFiles[0].name));
  ok('CSV header matches docs/api.md',
    csvText.split('\n')[0] === 'Date,Task,Status,Est,Actual,Tags,Habit,Streak,Notes');
  ok('CSV includes the completed habit row',
    csvText.includes('"Daily review & plan",done,15,15,review;planning,YES,1'));
  ok('CSV omits the completed non-habit task (no completion timestamp recorded)',
    !csvText.includes('Overdue report'));

  // --- (j) Encrypted backup: real AES-GCM round-trip of the app format ---
  element('sync-passphrase').value = 'correct horse battery staple';
  savedFiles.length = 0;
  await element('export-encrypted').onclick();
  ok('encrypted export saves one file', savedFiles.length === 1);
  ok('encrypted filename is tasks-<date>.json.enc',
    /^tasks-\d{4}-\d{2}-\d{2}\.json\.enc$/.test(savedFiles[0].name));
  const b64 = await savedFiles[0].blob.text();
  const combined = Uint8Array.from(Buffer.from(b64, 'base64'));
  ok('backup layout is salt(16) + iv(12) + ciphertext',
    combined.length > 28 && !b64.includes('Overdue report'));
  async function derive(pass, salt) {
    return webcrypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      await webcrypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  }
  const plain = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: combined.slice(16, 28) },
    await derive('correct horse battery staple', combined.slice(0, 16)),
    combined.slice(28));
  const restored = JSON.parse(new TextDecoder().decode(plain));
  ok('decrypting with the passphrase restores the exact state',
    JSON.stringify(restored) === JSON.stringify(run('state')));
  let wrongFailed = false;
  try {
    await webcrypto.subtle.decrypt(
      { name: 'AES-GCM', iv: combined.slice(16, 28) },
      await derive('wrong passphrase', combined.slice(0, 16)),
      combined.slice(28));
  } catch { wrongFailed = true; }
  ok('decrypting with a wrong passphrase fails (AES-GCM auth)', wrongFailed);

  // --- (k) Delete removes the task and persists ---
  const before = run('state.tasks').length;
  run(`deleteTask(${JSON.stringify(overdueId)})`);
  ok('delete removes the task', run('state.tasks').length === before - 1);
  ok('delete persisted', JSON.parse(store.get('task_habit_app_v1')).tasks.length === before - 1);

  console.log(`\nPASS — ${passed} assertions`);
})().catch((err) => {
  console.error('FAIL:', err && err.message ? err.message : err);
  process.exit(1);
});
