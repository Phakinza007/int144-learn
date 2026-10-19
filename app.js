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
 catch { notify(t('storageError')); return false; }
 return true;
}
function updateShell() {
 document.documentElement.lang = language;
 document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
 $('#lesson-nav').setAttribute('aria-label', t('lessons'));
 $('#menu').setAttribute('aria-label', t('menu'));
 $('#search').setAttribute('aria-label', t('searchLabel'));
 $('#search').placeholder = t('searchPlaceholder');
 $('#language-switch').setAttribute('aria-label', t('language'));
 document.querySelectorAll('[data-language]').forEach(button => {
  button.setAttribute('aria-pressed', String(button.dataset.language === language));
  button.disabled = !catalogs[button.dataset.language];
 });
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
 const topicCount = lessons.reduce((sum, lesson) => sum + lesson.sections.length, 0);
 const readingMinutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
 $('#main').innerHTML = `<section class="hero"><div><div class="eyebrow">YOUR AGILE LEARNING SPACE</div><h1>${t('heroTitle')}<br><span>${t('heroSubtitle')}</span></h1><p>${t('heroIntro')}</p><a class="primary" href="#lesson/${next.id}">${t(completed.length ? 'resume' : 'start')} <span aria-hidden="true">↗</span></a></div><div class="hero-visual" role="img" aria-label="${t('cycle')}"><div class="orbit"><div class="orbit-center">Scrum<small>LEARN · BUILD · GROW</small></div><span class="orbit-tag">01 · ${t('transparency')}</span><span class="orbit-tag">02 · ${t('inspection')}</span><span class="orbit-tag">03 · ${t('adaptation')}</span></div></div></section><div class="metrics"><div class="metric"><strong>05</strong><span>${t('classroomLessons')}</span></div><div class="metric"><strong>${topicCount}</strong><span>${t('concepts')}</span></div><div class="metric"><strong>${readingMinutes}</strong><span>${t('minutesTotal')}</span></div></div><div class="section-heading"><h2>${t('pathTitle')}</h2><span>${t('pathHint')}</span></div><div class="lesson-list">${lessons.map(l => `<a class="lesson-row" href="#lesson/${l.id}"><span class="lesson-index">${String(l.id).padStart(2,'0')}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.en)} · ${t('topics', {count:l.sections.length})}</p></div><div class="row-meta"><span>${completed.includes(l.id) ? t('finished') : t('duration', {count:l.minutes})}</span><b aria-hidden="true">↗</b></div></a>`).join('')}</div><div class="note"><strong>${t('overviewNoteTitle')}</strong><br>${t('overviewNote')}</div>`;
}
function completionButton(l) {
 return `<button class="primary" id="complete" aria-pressed="${completed.includes(l.id)}">${t(completed.includes(l.id) ? 'completed' : 'markComplete')}</button>`;
}
function renderVisual(key) {
 const visual = lessonVisuals[key];
 if (!visual) return '';
 const lang = language === 'en' ? 1 : 0;
 const text = pair => Array.isArray(pair) ? pair[lang] : pair;
 const localized = (items, className = 'visual-node') => items.map((item, i) => `<div class="${className}">${esc(text(item))}</div>${i < items.length - 1 ? '<span class="diagram-arrow" aria-hidden="true">→</span>' : ''}`).join('');
 let content = '';
 if (visual.type === 'compare') {
  content = `<div class="visual-comparison"><div class="visual-head">${esc(lang ? 'Value first' : 'สิ่งที่ให้ความสำคัญ')}</div><div></div><div class="visual-head">${esc(lang ? 'Also valuable' : 'ยังมีประโยชน์')}</div>${visual.left.map((left,i) => `<div class="visual-choice is-focus">${esc(text(left))}</div><span class="visual-middle">${esc(text(visual.middle))}</span><div class="visual-choice">${esc(text(visual.right[i]))}</div>`).join('')}</div>`;
 } else if (visual.type === 'flow' || visual.type === 'story') {
  content = `<div class="diagram-flow ${visual.loop ? 'is-loop' : ''}">${localized(visual.items)}${visual.loop ? '<span class="diagram-loop" aria-hidden="true">↻</span>' : ''}</div>`;
 } else if (visual.type === 'tiles') {
  content = `<div class="visual-tiles">${visual.items.map(item => { const value = Array.isArray(item[0]) ? item[lang] : item[lang]; const title = Array.isArray(value) ? value[0] : value; const detail = Array.isArray(value) ? (value.length > 2 ? value.slice(1).join(' · ') : value[1]) : ''; return `<div class="visual-tile"><strong>${esc(title)}</strong>${detail ? `<span>${esc(detail)}</span>` : ''}</div>`; }).join('')}</div>`;
 } else if (visual.type === 'timeline') {
  content = `<div class="visual-timeline">${visual.items.map((item,i) => `<div class="timeline-item"><span class="timeline-step">0${i+1}</span><strong>${esc(text(item))}</strong><span>${esc(text(visual.labels[i]))}</span></div>`).join('')}</div>`;
 } else if (visual.type === 'layers') {
  content = `<div class="visual-layers">${visual.items.map((item,i) => `<div class="visual-layer" style="--layer:${i}"><b>${esc(text(item))}</b></div>`).join('')}</div>`;
 } else if (visual.type === 'equation') {
  content = `<div class="visual-equation"><div class="equation-top">${visual.top.map((part,i) => `${i ? '<span>+</span>' : ''}<b>${esc(text(part))}</b>`).join('')}</div><div class="equation-rule"></div><b class="equation-bottom">${esc(text(visual.bottom))}</b><span class="equation-equals">=</span><b class="equation-result">${esc(text(visual.result))}</b></div>`;
 } else if (visual.type === 'capacity') {
  content = `<div class="visual-capacity">${visual.items.map((item,i) => `<div class="capacity-item capacity-${i}"><strong>${esc(text(item[0]))}</strong><span>${esc(text(item[1]))}</span></div>${i < visual.items.length - 1 ? '<span class="capacity-op" aria-hidden="true">−</span>' : ''}`).join('')}</div>`;
 } else if (visual.type === 'tshape') {
  content = `<div class="visual-tshape"><div class="t-bar">${esc(text(visual.horizontal))}</div><div class="t-stem">${esc(text(visual.vertical))}</div></div>`;
 }
 return `<figure class="lesson-visual" role="img" aria-label="${esc(text(visual.title))}"><figcaption>${esc(text(visual.title))}</figcaption>${content}${visual.note ? `<p class="visual-note">${esc(text(visual.note))}</p>` : ''}</figure>`;
}
async function lesson(l, source, version, {focusTab = false} = {}) {
 document.title = t('lessonTitle', {id:l.id, title:l.title});
 navigation(l.id);
 $('#crumb').textContent = t('lessonNumber', {id:l.id});
 $('#main').innerHTML = `<div class="lesson-header"><div class="eyebrow">LESSON ${String(l.id).padStart(2,'0')} / 05</div><h1>${esc(l.title)}</h1><p class="intro">${esc(l.intro)}</p><div class="lesson-meta"><span>${esc(l.en)}</span><span>${t('readDuration', {count:l.minutes})}</span></div></div><div class="tabs" role="tablist" aria-label="${t('contentFormat')}"><button id="tab-reading" class="tab" role="tab" aria-selected="${!source}" aria-controls="panel">${t('readingTab')}</button><button id="tab-source" class="tab" role="tab" aria-selected="${source}" aria-controls="panel">${t('transcriptTab')}</button></div><div id="panel" role="tabpanel" tabindex="0" aria-labelledby="tab-${source ? 'source' : 'reading'}"></div>`;
 $('#tab-reading').onclick = () => { location.hash = `lesson/${l.id}`; };
 $('#tab-source').onclick = () => { location.hash = `lesson/${l.id}/transcript`; };
 document.querySelectorAll('[role=tab]').forEach(tab => {
  tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
  tab.onkeydown = e => {
   if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
    const showSource = e.key === 'End' || (e.key !== 'Home' && !source);
    if (showSource !== source) location.hash = `lesson/${l.id}${showSource ? '/transcript' : ''}`;
   }
  };
 });
 if (focusTab) document.querySelector('[role=tab][aria-selected=true]').focus({preventScroll:true});
 if (source) { await transcript(l, version); return; }
 $('#panel').innerHTML = `<div class="lesson-layout"><article>${l.sections.map((s,i) => `<section class="reading-section" id="section-${i}"><h2><small>${String(i+1).padStart(2,'0')} </small>${esc(s.title)}</h2><p>${esc(s.body)}</p>${renderVisual(`${l.id}-${i}`)}<aside class="example"><strong>${t('exampleLabel')}</strong><p>${esc(s.example)}</p></aside><div class="takeaway">${t('takeaway')} → ${esc(s.takeaway)}</div>${s.source ? `<p class="section-source">${t('sectionSource')}: ${esc(s.source)}</p>` : ''}</section>`).join('')}<div class="lesson-end">${completionButton(l)}<a class="secondary" href="${l.id < 5 ? `#lesson/${l.id+1}` : '#'}">${t(l.id < 5 ? 'next' : 'back')}</a><button id="print" class="secondary">${t('print')}</button></div><div class="note">${esc(t('basedOn', {name:l.sourceName}))}<br>${t('exampleNote')}${l.references?.length ? `<p class="reference-heading">${t('reviewedReferences')}</p><ul class="reference-list">${l.references.map(ref => `<li><a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.label)} ↗</a></li>`).join('')}</ul>` : ''}</div></article><nav class="toc" aria-label="${t('toc')}"><strong>${t('inLesson')}</strong>${l.sections.map((s,i) => `<a href="#lesson/${l.id}/section/${i}">${i+1}. ${esc(s.title)}</a>`).join('')}</nav></div>`;
 $('#complete').onclick = () => {
  const done = completed.includes(l.id);
  completed = done ? completed.filter(x => x !== l.id) : [...completed, l.id];
  const saved = saveProgress(); navigation(l.id);
  $('#complete').textContent = t(done ? 'markComplete' : 'completed');
  $('#complete').setAttribute('aria-pressed', String(!done));
  if (saved) notify(t(done ? 'unmarked' : 'marked'));
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
 clearTimeout(search.timer); search.timer = null;
 if (!lessons.length) return;
 const focusTab = document.activeElement?.getAttribute('role') === 'tab';
 const focusMain = $('#sidebar').contains(document.activeElement);
 const version = ++routeVersion, parts = location.hash.slice(1).split('/');
 setMenu(false);
 if (parts[0] === 'search') {
  let query = ''; try { query = decodeURIComponent(parts.slice(1).join('/')); } catch {}
  $('#search').value = query; search(query); return;
 }
 $('#search').value = '';
 const l = lessons.find(x => x.id === Number(parts[1]));
 if (parts[0] === 'lesson' && l) {
  await lesson(l, parts[2] === 'transcript', version, {focusTab});
  if (version !== routeVersion) return;
  if (focusMain) $('#main').focus({preventScroll:true});
  if (preserveScroll) return;
  if (parts[2] === 'section') document.getElementById(`section-${Number(parts[3])}`)?.scrollIntoView();
  else window.scrollTo(0,0);
 } else { overview(); if (focusMain) $('#main').focus({preventScroll:true}); if (!preserveScroll) window.scrollTo(0,0); }
}
const mobileLayout = window.matchMedia('(max-width:760px)');
function setMenu(open, {restoreFocus = false} = {}) {
 open = mobileLayout.matches && open;
 document.body.classList.toggle('menu-open', open);
 $('#menu').setAttribute('aria-expanded', String(open));
 $('#sidebar').inert = mobileLayout.matches && !open;
 if (open) requestAnimationFrame(() => {
  if (document.body.classList.contains('menu-open')) ($('#lesson-nav [aria-current=page]') || $('#menu-close')).focus({preventScroll:true});
 });
 else if (restoreFocus && mobileLayout.matches) $('#menu').focus({preventScroll:true});
}
mobileLayout.addEventListener('change', () => setMenu(false));
setMenu(false);
$('.skip').onclick = e => { e.preventDefault(); $('#main').focus(); };
$('#menu').onclick = () => setMenu(!document.body.classList.contains('menu-open'));
$('#menu-close').onclick = () => setMenu(false, {restoreFocus:true});
document.addEventListener('click', e => {
 const href = e.target.closest('a[href^="#"]')?.getAttribute('href');
 if (href && href !== '#main' && href === (location.hash || '#')) { e.preventDefault(); route(); }
 if (document.body.classList.contains('menu-open') && !e.target.closest('#sidebar') && !e.target.closest('#menu')) setMenu(false);
});
document.addEventListener('keydown', e => {
 if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); setMenu(false); $('#search').focus(); }
 if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false, {restoreFocus:true});
});
$('#reset').onclick = () => {
 if (!completed.length) { notify(t('noProgress')); return; }
 if (confirm(t('resetConfirm'))) { completed = []; const saved = saveProgress(); route(); if (saved) notify(t('resetDone')); }
};
$('#search').oninput = () => {
 clearTimeout(search.timer);
 search.timer = setTimeout(() => {
  search.timer = null;
  const query = $('#search').value.trim();
  history.replaceState(null,'',query ? `#search/${encodeURIComponent(query)}` : '#');
  ++routeVersion; search(query);
 },180);
};
function captureReadingPosition() {
 const sections = [...document.querySelectorAll('.reading-section')];
 const readingLine = document.querySelector('header').getBoundingClientRect().bottom + 24;
 const nextHeading = sections.find(el => { const top = el.getBoundingClientRect().top; return top > readingLine && top <= readingLine + 160; });
 const section = nextHeading || sections.find(el => { const box = el.getBoundingClientRect(); return box.top <= readingLine + 1 && box.bottom > readingLine; });
 if (!section) return {scroll:window.scrollY};
 const box = section.getBoundingClientRect();
 if (nextHeading) return {id:section.id, offset:box.top - readingLine};
 return {id:section.id, fraction:Math.max(0, Math.min(1, (readingLine - box.top) / box.height))};
}
function restoreReadingPosition(position) {
 const section = position.id && document.getElementById(position.id);
 if (section) {
  const box = section.getBoundingClientRect();
  const readingLine = document.querySelector('header').getBoundingClientRect().bottom + 24;
  const withinSection = position.offset !== undefined ? -position.offset : position.fraction * box.height;
  window.scrollTo(0, window.scrollY + box.top + withinSection - readingLine);
 } else window.scrollTo(0, position.scroll || 0);
}
document.querySelectorAll('[data-language]').forEach(button => {
 button.onclick = async () => {
  if (button.dataset.language === language || !catalogs[button.dataset.language]) return;
  if (search.timer) {
   clearTimeout(search.timer); search.timer = null;
   const query = $('#search').value.trim();
   history.replaceState(null, '', query ? `#search/${encodeURIComponent(query)}` : '#');
  }
  const position = captureReadingPosition();
  const transcriptQuery = $('#source-search')?.value;
  const source = $('#transcript');
  const sourceFraction = source ? source.scrollTop / Math.max(1, source.scrollHeight - source.clientHeight) : 0;
  language = button.dataset.language;
  lessons = catalogs[language];
  let saved = true;
  try { localStorage.setItem('int144-language', language); } catch { saved = false; }
  updateShell();
  const version = routeVersion + 1;
  await route({preserveScroll:true});
  if (version !== routeVersion) return;
  if (transcriptQuery !== undefined && $('#source-search')) {
   $('#source-search').value = transcriptQuery;
   $('#source-search').dispatchEvent(new Event('input'));
   const transcript = $('#transcript');
   transcript.scrollTop = sourceFraction * (transcript.scrollHeight - transcript.clientHeight);
  }
  restoreReadingPosition(position);
  if (!saved) notify(t('languageSavedError'));
 };
});
window.addEventListener('hashchange', () => route());
updateShell();
(async () => {
 try {
  const content = await Promise.allSettled(['th','en'].map(async lang => {
   const response = await fetch((lang === 'th' ? 'lessons.json' : 'lessons.en.json') + '?v=8');
   if (!response.ok) throw new Error('Lessons unavailable');
   return [lang, await response.json()];
  }));
  catalogs = Object.fromEntries(content.filter(result => result.status === 'fulfilled').map(result => result.value));
  if (!catalogs.th && !catalogs.en) throw new Error('No lesson catalog available');
  if (!catalogs[language]) language = catalogs.th ? 'th' : 'en';
  lessons = catalogs[language];
  updateShell();
  await route();
  if (Object.keys(catalogs).length < 2) notify(t('languageUnavailable'));
 } catch {
  $('#main').innerHTML = `<h1>${t('loadError')}</h1><p>${t('loadErrorHint')}</p><button class="primary" id="reload">${t('reload')}</button>`;
  $('#reload').onclick = () => location.reload();
 }
})();
