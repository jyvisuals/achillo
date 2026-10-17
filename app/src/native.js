// Native bridge for the Achilles Rebuild Log. Bundled by build.js into www/native.js.
// Talks to the page through window events only:
//   page -> here : 'ach:saved' (a day record was written), 'ach:done' (an exercise finished), 'ach:state' (answer to 'ach:state?')
//   here -> page : 'ach:state?' (ask for today's state), 'ach:open' {kind} (start a session after a notification tap)
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Haptics, NotificationType, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { KeepAwake } from '@capacitor-community/keep-awake';
import SEED from './seed.json'; // one-time carry-over of the web log (Oct 2–16); merged, never overwrites

const native = Capacitor.isNativePlatform();
const log = (...a) => console.log('[native]', ...a);

// ---- hinge ladder (mirrors the page) ----
const LADDER = [['2026-10-16', 25], ['2026-10-20', 20], ['2026-10-23', 15], ['2026-10-27', 10], ['2026-10-30', 5], ['2026-11-03', 0]];
const VISIT = { day: '2026-10-30', h: 12, m: 15, body: 'Duke at 1:15 today. Tap Share log before you go in.' };
const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const at = (dayKey, h, m = 0) => { const [y, mo, d] = dayKey.split('-').map(Number); return new Date(y, mo - 1, d, h, m, 0, 0); };
const addDays = (dayKey, n) => { const t = at(dayKey, 12); t.setDate(t.getDate() + n); return keyOf(t); };

// ---- user prefs (written by the page's Settings panel) ----
const PREF_DEF = { remind: 1, morning: '7:55', cadence: 60, lastHour: 21, evening: '16:00', imageryAt: '20:25', haptics: 1 };
function prefs() { try { return Object.assign({}, PREF_DEF, JSON.parse(localStorage.getItem('ach:prefs') || '{}')); } catch (e) { return { ...PREF_DEF }; } }
const hm = (str) => { const [h, m] = String(str).split(':').map(Number); return [h || 0, m || 0]; };

// ---- state from the page ----
function askState() {
  return new Promise((res) => {
    const h = (e) => { window.removeEventListener('ach:state', h); res(e.detail); };
    window.addEventListener('ach:state', h);
    window.dispatchEvent(new Event('ach:state?'));
    setTimeout(() => { window.removeEventListener('ach:state', h); res(null); }, 1500);
  });
}

// ---- notifications ----
let idSeq = 1;
const ACTION_TYPE = { snack: 'SNACK', round: 'ROUND', imagery: 'IMAGERY' };
function note(list, when, title, body, kind) {
  if (when.getTime() <= Date.now() + 20000) return;
  list.push({ id: idSeq++, title, body, schedule: { at: when, allowWhileIdle: true }, extra: { kind }, sound: 'default', actionTypeId: ACTION_TYPE[kind] });
}
async function registerActions() {
  try {
    await LocalNotifications.registerActionTypes({ types: [
      { id: 'SNACK', actions: [{ id: 'start', title: 'Start now', foreground: true }, { id: 'snooze', title: 'Snooze 20 min' }] },
      { id: 'ROUND', actions: [{ id: 'start', title: 'Start', foreground: true }, { id: 'done', title: 'Done already' }] },
      { id: 'IMAGERY', actions: [{ id: 'start', title: 'Start', foreground: true }, { id: 'snooze', title: 'Snooze 20 min' }] },
    ] });
  } catch (e) { log('actions', e); }
}
async function snooze(kind, title, body) {
  try { await LocalNotifications.schedule({ notifications: [{ id: 9000 + Math.floor(Math.random() * 900), title, body, schedule: { at: new Date(Date.now() + 20 * 60000), allowWhileIdle: true }, extra: { kind }, sound: 'default', actionTypeId: ACTION_TYPE[kind] }] }); } catch (e) { log('snooze', e); }
}

async function reschedule(reason) {
  if (!native) return;
  const st = await askState();
  if (!st) { log('no state; skip schedule'); return; }
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') { const r = await LocalNotifications.requestPermissions(); if (r.display !== 'granted') { log('notifications not allowed'); return; } }

  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  const P = prefs();
  if (!P.remind) { log('reminders off'); return; }
  const [mH, mM] = hm(P.morning), [eH, eM] = hm(P.evening), [iH, iM] = hm(P.imageryAt);
  const cad = Math.max(30, Number(P.cadence) || 60), lastH = Number(P.lastHour) || 21;

  const L = [];
  const today = st.today;
  const now = Date.now();
  idSeq = 1;

  for (let i = 0; i < 3; i++) {
    const dk = addDays(today, i);
    const isToday = i === 0;
    const rounds = isToday ? st.rounds : 0;
    const imagery = isToday ? st.imagery : 0;

    // Morning: check-in then Barefoot PT
    if (rounds === 0 && !(isToday && st.checked))
      note(L, at(dk, mH, mM), 'Morning check', 'All good? Then Barefoot PT' + (dk <= '2026-11-12' ? ' with BFR first.' : '.'), 'round');

    // Hinge day
    const h = LADDER.find((x) => x[0] === dk);
    if (h && !(isToday && st.hingeSet === h[1]))
      note(L, new Date(at(dk, mH, mM).getTime() + 10 * 60000), `Hinge day: ${h[1]}°`, 'Down one notch if this morning is quiet. If it\'s grumpy, hold a day or two.', 'hinge');

    // Quick ones: one set, hourly, between rounds (today + tomorrow only; iOS caps pending notifications)
    if (i < 2) {
      let t;
      if (!isToday) t = at(dk, 10);
      else if (rounds >= 1) {
        const last = st.snackLast || 0;
        t = now - last >= cad * 60000 ? new Date(now + 15 * 60000) : new Date(last + cad * 60000); // overdue → nudge soon; else one cadence after the last one
      } else t = at(dk, 10).getTime() > now ? at(dk, 10) : new Date(now + cad * 60000); // morning round not done yet
      const end = at(dk, lastH, 5).getTime();
      let first = true;
      while (t.getTime() <= end) {
        note(L, new Date(t), 'Quick one', first && isToday && st.snackName ? `${st.snackName}: all sets, a few minutes. Boot on.` : 'One boot-on drill, all sets, a few minutes.', 'snack');
        t = new Date(t.getTime() + cad * 60000);
        first = false;
      }
    }

    // Evening round
    if (rounds < 2) {
      note(L, at(dk, eH, eM), 'Evening round', 'Barefoot PT (no cuff), then Boot-on PT.', 'round');
      note(L, new Date(at(dk, eH, eM).getTime() + 150 * 60000), 'Evening round', 'Still time for round two.', 'round');
    }
    // Imagery
    if (imagery < 2) note(L, at(dk, iH, iM), 'Evening imagery', 'Five minutes, eyes closed, voice-led.', 'imagery');
    // Visit
    if (dk === VISIT.day) note(L, at(dk, VISIT.h, VISIT.m), 'Duke follow-up', VISIT.body, 'open');
  }

  if (L.length) await LocalNotifications.schedule({ notifications: L });
  log(`scheduled ${L.length} (${reason})`);
}

let tmr = null;
const scheduleSoon = (why) => { clearTimeout(tmr); tmr = setTimeout(() => reschedule(why).catch((e) => log('schedule failed', e)), 1500); };

// ---- share log ----
async function shareLog() {
  const st = await askState();
  if (!st) return;
  const payload = { exported: new Date().toISOString(), app: 'Achilles Rebuild Log (iOS)', days: st.log };
  const name = `achilles-log-${st.today}.json`;
  try {
    const f = await Filesystem.writeFile({ path: name, data: JSON.stringify(payload, null, 1), directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: 'Achilles log', text: `Rehab log through ${st.today}`, url: f.uri, dialogTitle: 'Share log' });
  } catch (e) {
    // fall back to plain text if the file share is refused
    try { await Share.share({ title: 'Achilles log', text: JSON.stringify(payload) }); } catch (_) { log('share failed', e); }
  }
}

// ---- wire up ----
(async () => {
  if (!native) { log('web; bridge idle'); return; }
  document.documentElement.classList.add('native');
  // no zooming in an app: pinch blocked here; double-tap zoom is off via touch-action in the page CSS
  ['gesturestart', 'gesturechange'].forEach((t) => document.addEventListener(t, (e) => e.preventDefault(), { passive: false }));

  // carry the web log over (idempotent: mergeDay keeps the max of each counter)
  try { window.dispatchEvent(new CustomEvent('ach:seed', { detail: { days: SEED } })); } catch (e) { log('seed failed', e); }
  // version line at the bottom of the page
  try { const i = await App.getInfo(); const v = document.getElementById('ver'); if (v) v.textContent = `Achilló ${i.version} · build ${i.build}`; } catch (e) {}

  const share = document.getElementById('shareLog');
  if (share) { share.hidden = false; share.onclick = shareLog; }
  const status = document.getElementById('status');
  if (status) setTimeout(() => { if (/device only/i.test(status.textContent)) status.textContent = 'Saved on this phone. Share log sends it along.'; }, 1200);

  window.addEventListener('ach:saved', () => scheduleSoon('saved'));
  window.addEventListener('ach:done', () => { if (prefs().haptics) Haptics.notification({ type: NotificationType.Success }).catch(() => {}); });
  document.addEventListener('click', (e) => { if (prefs().haptics && e.target.closest && e.target.closest('button')) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); }, true);

  await registerActions();
  await LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
    const n = a.notification || {};
    const kind = (n.extra && n.extra.kind) || 'open';
    const act = a.actionId || 'tap';
    if (act === 'snooze') { snooze(kind, n.title || 'Achilló', n.body || ''); return; }
    if (act === 'done' && kind === 'round') { setTimeout(() => window.dispatchEvent(new Event('ach:markRound')), 400); return; }
    setTimeout(() => window.dispatchEvent(new CustomEvent('ach:open', { detail: { kind } })), 600);
  });

  // Haptics per rep + screen awake during a session (released when it ends)
  let awake = false;
  const keep = async (on) => { if (on === awake) return; awake = on; try { on ? await KeepAwake.keepAwake() : await KeepAwake.allowSleep(); } catch (e) {} };
  window.addEventListener('ach:step', (e) => {
    const d = e.detail || {}; keep(true);
    if (d.quiet || !prefs().haptics) return;
    const k = d.kind;
    if (k === 'setup') Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    else if (k === 'up' || k === 'hold') Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    else if (k === 'down') Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  });
  window.addEventListener('ach:session', (e) => { if (e.detail && e.detail.active === false) keep(false); });

  let loadedDay = keyOf(new Date());
  App.addListener('appStateChange', ({ isActive }) => {
    if (!isActive) return;
    if (keyOf(new Date()) !== loadedDay) { location.reload(); return; }
    scheduleSoon('resume');
  });

  scheduleSoon('launch');
})();
