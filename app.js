'use strict';
const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lessons = [], catalogs = {}, completed = [], sourceCache = {}, routeVersion = 0;
try {
 const saved = JSON.parse(localStorage.getItem('int144-completed') || '[]');
 if (Array.isArray(saved)) completed = [...new Set(saved.filter(n => Number.isInteger(n) && n >= 1 && n <= 5))];
} catch {}
function notify(message) {
 $('#toast').textContent = message;
 $('#toast').classList.add('show');
 clearTimeout(notify.timer);
 notify.timer = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}
function saveProgress() {
 try { localStorage.setItem('int144-completed', JSON.stringify(completed)); }
 catch { notify(t('storageError')); }
}
function updateShell() {
 document.documentElement.lang = language;
 document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
 $('#lesson-nav').setAttribute('aria-label', t('lessons'));
 $('#menu').setAttribute('aria-label', t('menu'));
 $('#search').setAttribute('aria-label', t('searchLabel'));
 $('#search').placeholder = t('searchPlaceholder');
 $('#language-switch').setAttribute('aria-label', t('language'));
 document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
}
function navigation(active = 0) {
 $('#lesson-nav').innerHTML = `<a class="nav-link ${active === 0 ? 'active' : ''}" ${active === 0 ? 'aria-current="page"' : ''} href="#"><span class="nav-number">⌂</span><span>${t('overviewNav')}</span></a>` + lessons.map(l => `<a class="nav-link ${active === l.id ? 'active' : ''}" ${active === l.id ? 'aria-current="page"' : ''} href="#lesson/${l.id}"><span class="nav-number">${completed.includes(l.id) ? '✓' : String(l.id).padStart(2,'0')}</span><span>${esc(l.title)}</span></a>`).join('');
 $('#progress-count').textContent = `${completed.length} / 5`;
 $('#progress').value = completed.length;
 $('#progress').textContent = t('progressText', {count:completed.length});
}
function overview() {
 document.title = t('pageTitle');
 $('#crumb').textContent = t('overview');
 navigation();
 const next = lessons.find(l => !completed.includes(l.id)) || lessons[0];
 $('#main').innerHTML = `<section class="hero"><div><div class="eyebrow">YOUR AGILE LEARNING SPACE</div><h1>${t('heroTitle')}<br><span>${t('heroSubtitle')}</span></h1><p>${t('heroIntro')}</p><a class="primary" href="#lesson/${next.id}">${t(completed.length ? 'resume' : 'start')} <span aria-hidden="true">↗</span></a></div><div class="hero-visual" role="img" aria-label="${t('cycle')}"><div class="orbit"><div class="orbit-center">Scrum<small>LEARN · BUILD · GROW</small></div><span class="orbit-tag">01 · ${t('transparency')}</span><span class="orbit-tag">02 · ${t('inspection')}</span><span class="orbit-tag">03 · ${t('adaptation')}</span></div></div></section><div class="metrics"><div class="metric"><strong>05</strong><span>${t('classroomLessons')}</span></div><div class="metric"><strong>25</strong><span>${t('concepts')}</span></div><div class="metric"><strong>100</strong><span>${t('minutesTotal')}</span></div></div><div class="section-heading"><h2>${t('pathTitle')}</h2><span>${t('pathHint')}</span></div><div class="lesson-list">${lessons.map(l => `<a class="lesson-row" href="#lesson/${l.id}"><span class="lesson-index">${String(l.id).padStart(2,'0')}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.en)} · ${t('topics', {count:l.sections.length})}</p></div><div class="row-meta"><span>${completed.includes(l.id) ? t('finished') : t('duration', {count:l.minutes})}</span><b aria-hidden="true">↗</b></div></a>`).join('')}</div><div class="note"><strong>${t('overviewNoteTitle')}</strong><br>${t('overviewNote')}</div>`;
}
function completionButton(l) {
 return `<button class="primary" id="complete" aria-pressed="${completed.includes(l.id)}">${t(completed.includes(l.id) ? 'completed' : 'markComplete')}</button>`;
}
async function lesson(l, source, version) {
 document.title = t('lessonTitle', {id:l.id, title:l.title});
 navigation(l.id);
 $('#crumb').textContent = t('lessonNumber', {id:l.id});
 $('#main').innerHTML = `<div class="lesson-header"><div class="eyebrow">LESSON ${String(l.id).padStart(2,'0')} / 05</div><h1>${esc(l.title)}</h1><p class="intro">${esc(l.intro)}</p><div class="lesson-meta"><span>${esc(l.en)}</span><span>${t('readDuration', {count:l.minutes})}</span></div></div><div class="tabs" role="tablist" aria-label="${t('contentFormat')}"><button id="tab-reading" class="tab" role="tab" aria-selected="${!source}" aria-controls="panel">${t('readingTab')}</button><button id="tab-source" class="tab" role="tab" aria-selected="${source}" aria-controls="panel">${t('transcriptTab')}</button></div><div id="panel" role="tabpanel" aria-labelledby="tab-${source ? 'source' : 'reading'}"></div>`;
 $('#tab-reading').onclick = () => { location.hash = `lesson/${l.id}`; };
 $('#tab-source').onclick = () => { location.hash = `lesson/${l.id}/transcript`; };
 document.querySelectorAll('[role=tab]').forEach(tab => {
  tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
  tab.onkeydown = e => {
   if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    location.hash = source ? `lesson/${l.id}` : `lesson/${l.id}/transcript`;
   }
  };
 });
 if (source) { await transcript(l, version); return; }
 $('#panel').innerHTML = `<div class="lesson-layout"><article>${l.sections.map((s,i) => `<section class="reading-section" id="section-${i}"><h2><small>${String(i+1).padStart(2,'0')} </small>${esc(s.title)}</h2><p>${esc(s.body)}</p><aside class="example"><strong>${t('exampleLabel')}</strong><p>${esc(s.example)}</p></aside><div class="takeaway">${t('takeaway')} → ${esc(s.takeaway)}</div></section>`).join('')}<div class="lesson-end">${completionButton(l)}<a class="secondary" href="${l.id < 5 ? `#lesson/${l.id+1}` : '#'}">${t(l.id < 5 ? 'next' : 'back')}</a><button id="print" class="secondary">${t('print')}</button></div><div class="note">${esc(t('basedOn', {name:l.sourceName}))}<br>${t('exampleNote')}</div></article><nav class="toc" aria-label="${t('toc')}"><strong>${t('inLesson')}</strong>${l.sections.map((s,i) => `<a href="#lesson/${l.id}/section/${i}">${i+1}. ${esc(s.title)}</a>`).join('')}</nav></div>`;
 $('#complete').onclick = () => {
  const done = completed.includes(l.id);
  completed = done ? completed.filter(x => x !== l.id) : [...completed, l.id];
  saveProgress(); navigation(l.id);
  $('#complete').textContent = t(done ? 'markComplete' : 'completed');
  $('#complete').setAttribute('aria-pressed', String(!done));
  notify(t(done ? 'unmarked' : 'marked'));
 };
 $('#print').onclick = () => window.print();
}
function highlight(text, query) {
 if (!query) return esc(text);
 let result = '', index = 0, pos;
 const lower = text.toLocaleLowerCase(), q = query.toLocaleLowerCase();
 while ((pos = lower.indexOf(q, index)) !== -1) {
  result += esc(text.slice(index, pos)) + `<mark>${esc(text.slice(pos, pos + query.length))}</mark>`;
  index = pos + query.length;
 }
 return result + esc(text.slice(index));
}
async function transcript(l, version) {
 $('#panel').innerHTML = `<p class="loading">${t('loadingTranscript')}</p>`;
 try {
  if (!sourceCache[l.id]) {
   const response = await fetch(encodeURI(l.source));
   if (!response.ok) throw new Error('Transcript unavailable');
   sourceCache[l.id] = await response.text();
  }
  if (version !== routeVersion) return;
  $('#panel').innerHTML = `<div class="source-top"><p>${esc(t('sourceTitle', {name:l.sourceName}))}<br>${t('sourceDisclaimer')}<br>${t('sourceLanguage')}</p><a class="secondary" href="${esc(encodeURI(l.source))}" download>${t('download')}</a></div><label for="source-search">${t('sourceSearch')}</label><input class="source-search" id="source-search" type="search" placeholder="${t('sourcePlaceholder')}"><p id="source-count" aria-live="polite"></p><div class="transcript" id="transcript" lang="th" tabindex="0" aria-label="${t('transcriptContent')}"></div>`;
  const paras = sourceCache[l.id].split('\n').filter(Boolean);
  function filter() {
   const query = $('#source-search').value.trim();
   const found = paras.filter(p => p.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
   $('#source-count').textContent = query ? t('sourceMatches', {count:found.length, query}) : t('sourceParagraphs', {count:paras.length});
   $('#transcript').innerHTML = found.length ? found.map(p => `<p>${highlight(p, query)}</p>`).join('') : `<p>${t('sourceNoResults')}</p>`;
  }
  $('#source-search').oninput = filter;
  filter();
 } catch {
  if (version !== routeVersion) return;
  $('#panel').innerHTML = `<div class="note">${t('sourceError')} <button class="secondary" id="retry">${t('retry')}</button></div>`;
  $('#retry').onclick = () => transcript(l, version);
 }
}
function search(query) {
 navigation(-1); $('#crumb').textContent = t('searchResults'); document.title = t('searchTitle');
 const q = query.trim();
 if (!q) { overview(); return; }
 const results = [];
 for (const l of lessons) for (const [i,s] of l.sections.entries()) {
  const hay = [s.title, s.body, s.example, s.takeaway].join(' ');
  const at = hay.toLocaleLowerCase().indexOf(q.toLocaleLowerCase());
  if (at !== -1) results.push({l, i, s, snippet:hay.slice(Math.max(0, at-65), at+180)});
 }
 $('#main').innerHTML = `<div class="eyebrow">SEARCH LESSONS</div><h1>${esc(t('searchHeading', {query:q}))}</h1><p>${t('searchCount', {count:results.length})}</p>${results.map(({l,i,s,snippet}) => `<div class="result"><div class="eyebrow">${t('lessonNumber', {id:l.id})} · ${esc(l.en)}</div><a href="#lesson/${l.id}/section/${i}">${highlight(s.title,q)} ↗</a><p>…${highlight(snippet,q)}…</p></div>`).join('') || `<p class="empty">${t('searchEmpty')}</p>`}`;
}
async function route({preserveScroll = false} = {}) {
 const version = ++routeVersion, parts = location.hash.slice(1).split('/');
 document.body.classList.remove('menu-open'); $('#menu').setAttribute('aria-expanded','false');
 if (parts[0] === 'search') {
  let query = ''; try { query = decodeURIComponent(parts.slice(1).join('/')); } catch {}
  $('#search').value = query; search(query); return;
 }
 $('#search').value = '';
 const l = lessons.find(x => x.id === Number(parts[1]));
 if (parts[0] === 'lesson' && l) {
  await lesson(l, parts[2] === 'transcript', version);
  if (version !== routeVersion || preserveScroll) return;
  if (parts[2] === 'section') document.getElementById(`section-${Number(parts[3])}`)?.scrollIntoView();
  else window.scrollTo(0,0);
 } else { overview(); if (!preserveScroll) window.scrollTo(0,0); }
}
$('.skip').onclick = e => { e.preventDefault(); $('#main').focus(); };
$('#menu').onclick = () => { const open = document.body.classList.toggle('menu-open'); $('#menu').setAttribute('aria-expanded',String(open)); };
document.addEventListener('click', e => {
 if (document.body.classList.contains('menu-open') && !e.target.closest('#sidebar') && !e.target.closest('#menu')) {
  document.body.classList.remove('menu-open'); $('#menu').setAttribute('aria-expanded','false');
 }
});
document.addEventListener('keydown', e => {
 if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) { e.preventDefault(); $('#search').focus(); }
 if (e.key === 'Escape') { document.body.classList.remove('menu-open'); $('#menu').setAttribute('aria-expanded','false'); }
});
$('#reset').onclick = () => {
 if (!completed.length) { notify(t('noProgress')); return; }
 if (confirm(t('resetConfirm'))) { completed = []; saveProgress(); route(); notify(t('resetDone')); }
};
$('#search').oninput = () => {
 clearTimeout(search.timer);
 search.timer = setTimeout(() => {
  const query = $('#search').value.trim();
  history.replaceState(null,'',query ? `#search/${encodeURIComponent(query)}` : '#');
  ++routeVersion; search(query);
 },180);
};
document.querySelectorAll('[data-language]').forEach(button => {
 button.onclick = async () => {
  if (button.dataset.language === language || !catalogs[button.dataset.language]) return;
  clearTimeout(search.timer);
  const scroll = window.scrollY;
  const transcriptQuery = $('#source-search')?.value;
  language = button.dataset.language;
  lessons = catalogs[language];
  let saved = true;
  try { localStorage.setItem('int144-language', language); } catch { saved = false; }
  updateShell();
  await route({preserveScroll:true});
  if (transcriptQuery !== undefined && $('#source-search')) {
   $('#source-search').value = transcriptQuery;
   $('#source-search').dispatchEvent(new Event('input'));
  }
  window.scrollTo(0,scroll);
  if (!saved) notify(t('languageSavedError'));
 };
});
window.addEventListener('hashchange', () => route());
updateShell();
(async () => {
 try {
  const content = await Promise.all(['th','en'].map(async lang => {
   const response = await fetch(lang === 'th' ? 'lessons.json' : 'lessons.en.json');
   if (!response.ok) throw new Error('Lessons unavailable');
   return [lang, await response.json()];
  }));
  catalogs = Object.fromEntries(content); lessons = catalogs[language];
  await route();
 } catch {
  $('#main').innerHTML = `<h1>${t('loadError')}</h1><p>${t('loadErrorHint')}</p><button class="primary" id="reload">${t('reload')}</button>`;
  $('#reload').onclick = () => location.reload();
 }
})();
