/* Global GHS building-block finder — uses the existing, source-linked GHS_DATA matrix. */
(function () {
  'use strict';
  const chapter = document.querySelector('#hazards');
  if (!chapter || typeof GHS_DATA === 'undefined' || typeof DATA === 'undefined') return;
  const original = chapter.querySelector('.section-card');
  const notes = chapter.querySelector('.feature-intro');
  if (!original || !notes) return;
  const terms = {
    expl:'H200 H201 H202 H203 H204 H205 H206 H207 H208', desens:'H206 H207 H208',
    flgas:'H220', flgas1b:'H221', flgas2:'H221', aerosol:'H222 H223', aerosol3:'H229',
    oxidgas:'H270', pressure:'H280 H281', flliq:'H224 H225 H226', flliq4:'H227', flsolid:'H228',
    selfreact:'H240 H241 H242', pyro:'H250', selfheat:'H251 H252', waterreact:'H260 H261',
    oxidliq:'H271 H272', oxidsol:'H271 H272', organicper:'H240 H241 H242', metcorr:'H290',
    actox:'H300 H301 H302 H310 H311 H312 H330 H331 H332', actox5:'H303 H313 H333',
    skincorr:'H314 Skin Corr. 1 Skin Corr. 1A Skin Corr. 1B Skin Corr. 1C',
    skinirr2:'H315 Skin Irrit. 2', skinirr3:'H316', eye1:'H318 Eye Dam. 1',
    eye2:'H319 Eye Irrit. 2 Eye Irrit. 2A', eye2b:'H320 Eye Irrit. 2B',
    respsens:'H334', skinsens:'H317', mut:'H340 H341', carc:'H350 H351',
    repr:'H360 H361 H362', stotse:'H370 H371 H335 H336', stotre:'H372 H373',
    asp1:'H304', asp2:'H305', aqacute1:'H400', aqacute23:'H401 H402',
    aqchronic:'H410 H411 H412 H413', ozone:'H420', edhh:'EUH380 EUH381',
    edenv:'EUH430 EUH431', pbt:'EUH440 EUH441', pmt:'EUH450 EUH451'
  };
  const options = GHS_DATA.hazards;
  const country = id => DATA.jurisdictions.find(j => j.id === id);
  const norm = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const searchTerms = h => [h.label,h.description,h.group,h.id,terms[h.id]||'',typeof hazardAliases !== 'undefined' ? (hazardAliases[h.id]||''):''].join(' ');
  const match = text => {
    const words = norm(text).split(/\s+/).filter(Boolean);
    return options.filter(h=>words.every(w=>norm(searchTerms(h)).split(' ').some(part=>part.startsWith(w)))).sort((a,b)=>{const score=h=>words.filter(w=>norm(h.label+' '+(terms[h.id]||'')).split(' ').some(part=>part.startsWith(w))).length;return score(b)-score(a)});
  };
  const escLocal = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const html = `<div class="global-lookup" id="globalLookup">
    <div class="global-title"><div><span class="chapter-number">Global classification search</span><h3>One classification. Every jurisdiction.</h3><p>Search an H-statement or hazard class to view its legal adoption status in all ${DATA.jurisdictions.length} regions.</p></div><span class="global-tag">${GHS_DATA.hazards.length} entries</span></div>
    <label for="globalHazardQuery" class="global-search-label">Search classification or H-code</label>
    <div class="global-search-wrap"><span class="global-search-icon" aria-hidden="true">⌕</span><input id="globalHazardQuery" type="search" placeholder="e.g. H314, H318, flammable liquid, eye irritation" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="globalSuggestions"/><button type="button" id="globalClear" aria-label="Clear classification search">Clear</button><div id="globalSuggestions" class="global-suggestions" role="listbox" hidden></div></div>
    <div class="global-examples">Try: <button data-example="H314">H314</button><button data-example="H318">H318</button><button data-example="H227">H227</button><button data-example="EUH380">EUH380</button><button data-example="aquatic chronic">Aquatic chronic</button></div>
    <div id="globalResults" aria-live="polite"></div>
  </div>`;
  notes.insertAdjacentHTML('afterend',html);
  const advanced = document.createElement('details');advanced.className='global-advanced';
  advanced.innerHTML='<summary><strong>Compare two jurisdictions in detail</strong><span>Show the original side-by-side classification matrix ⌄</span></summary>';
  original.before(advanced);advanced.append(original);
  const input = document.querySelector('#globalHazardQuery');
  const suggestion = document.querySelector('#globalSuggestions');
  const results = document.querySelector('#globalResults');
  let selected = options.find(h=>h.id==='skincorr')||options[0];
  let statusFilter = 'all';
  const order = ['a','x','c','?'];
  const labels = {a:'Adopted',x:'Not adopted',c:'Conditional', '?':'Not verified'};
  const descriptions={a:'Included in the stated regulatory scheme',x:'Not adopted in the stated scheme',c:'Depends on scope or implementation dates','?':'Category-level status not yet confirmed'};
  function choose(h) {
    selected=h;input.value=(terms[h.id]||'').split(' ').find(t=>/^\w?H\d{3}/i.test(t))||h.label;
    statusFilter='all';suggestion.hidden=true;input.setAttribute('aria-expanded','false');render();
  }
  function showSuggestions() {
    const hits = match(input.value).slice(0,12);
    if (!hits.length) {suggestion.innerHTML='<div class="global-no-match">No matching classifications in this reference. Try a broader hazard name.</div>'}
    else suggestion.innerHTML=hits.map(h=>`<button type="button" role="option" data-option="${escLocal(h.id)}" aria-selected="${!!selected&&selected.id===h.id}"><span>${escLocal(h.label)}</span><small>${escLocal((terms[h.id]||'').split(' ').filter(t=>/^(?:EU)?H\d{3}/.test(t)).slice(0,4).join(' · ')||h.group)}</small></button>`).join('');
    suggestion.hidden=false;input.setAttribute('aria-expanded','true');
    suggestion.querySelectorAll('[data-option]').forEach(b=>b.addEventListener('click',()=>{const found=options.find(h=>h.id===b.dataset.option);if(found)choose(found)}));
  }
  function render(){
    if(!selected){results.innerHTML='<div class="global-placeholder">Start typing a hazard name or H-code to compare all jurisdictions.</div>';return}
    const h=selected;
    const groups=Object.fromEntries(order.map(k=>[k,[]]));
    DATA.jurisdictions.forEach(j=>{const key=(GHS_DATA.matrix[j.id]||{})[h.id]||'?';groups[key].push(j)});
    const codes=(terms[h.id]||'').split(' ').filter(w=>/^(?:EU)?H\d{3}/i.test(w));
    const isBroad=codes.length>1 || /categories|including|may be subdivided|category 1 \/|category 2 \//i.test(h.label+' '+h.description);
    const heading=`<div class="global-selected"><div><span class="global-eyebrow">Selected classification · ${escLocal(h.group)}</span><h4>${escLocal(h.label)}</h4><p>${escLocal(h.description)}</p>${codes.length?`<span class="global-code">${escLocal(codes.slice(0,8).join(' · '))}${codes.length>8?' · …':''}</span>`:''}</div><span class="global-total">${DATA.jurisdictions.length}<small>jurisdictions</small></span></div>`;
    const stats=`<div class="global-stats" role="group" aria-label="Filter jurisdictions by adoption status">${order.map(k=>`<button type="button" class="global-stat ${k==='?'?'unknown':k} ${statusFilter===k?'selected':''}" data-stat="${k}" aria-pressed="${statusFilter===k}"><strong>${groups[k].length}</strong><span>${labels[k]}</span></button>`).join('')}</div>`;
    const bar=`<div class="global-bar" role="img" aria-label="${order.map(k=>groups[k].length+' '+labels[k]).join(', ')}">${order.map(k=>groups[k].length?`<span class="bar-${k==='?'?'q':k}" style="width:${groups[k].length/DATA.jurisdictions.length*100}%"></span>`:'').join('')}</div>`;
    const category=order.filter(k=>statusFilter==='all'||statusFilter===k).map(k=>`<section class="global-group group-${k==='?'?'q':k}"><h5><span class="global-group-dot"></span>${labels[k]} <span class="global-group-n">${groups[k].length}</span></h5><p class="global-group-desc">${descriptions[k]}</p><div class="global-country-grid">${groups[k].length?groups[k].map(j=>{
      const key=j.id+':'+h.id, note=GHS_DATA.notes[key], url=GHS_DATA.sources[key]||(GHS_DATA.editions[j.id]&&GHS_DATA.editions[j.id].sources[0][1]);
      return `<article class="global-country"><div class="global-country-top"><span class="global-country-name">${escLocal(j.flag)} ${escLocal(j.name)}</span>${url?`<a href="${escLocal(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open classification source for ${escLocal(j.name)}">Source ↗</a>`:''}</div>${note?`<p>${escLocal(note)}</p>`:k==='?'?'<p>Not yet confirmed; do not infer exclusion.</p>':''}</article>`;
    }).join(''):'<div class="global-none">No jurisdictions in this category.</div>'}</div></section>`).join('');
    results.innerHTML=heading+stats+bar+`<p class="global-caveat">${isBroad?'<strong>Category group:</strong> This entry represents several categories or H-statements; country status does not confirm every individual category. ':''}These statuses describe whether a hazard class/category is adopted in a scheme, <strong>not whether a substance is classified in that region</strong>. “Not verified” is not an exclusion. Sources reviewed ${escLocal(GHS_DATA.date)}.</p>`+`<div class="global-view-controls"><strong>${statusFilter==='all'?'All statuses':'Showing: '+labels[statusFilter]}</strong>${statusFilter!=='all'?'<button type="button" id="globalShowAll">Show all jurisdictions</button>':''}</div>`+category;
    results.querySelectorAll('[data-stat]').forEach(b=>b.addEventListener('click',()=>{statusFilter=statusFilter===b.dataset.stat?'all':b.dataset.stat;render()}));
    const showAll=results.querySelector('#globalShowAll');if(showAll)showAll.addEventListener('click',()=>{statusFilter='all';render()});
  }
  input.addEventListener('focus',showSuggestions);
  input.addEventListener('input',()=>{const hits=match(input.value);selected=hits[0]||null;statusFilter='all';render();showSuggestions()});
  input.addEventListener('keydown',ev=>{if(ev.key==='Escape'){suggestion.hidden=true;input.setAttribute('aria-expanded','false')}if(ev.key==='Enter'){ev.preventDefault();const hit=match(input.value)[0];if(hit)choose(hit)}});
  document.querySelector('#globalClear').addEventListener('click',()=>{input.value='';selected=null;statusFilter='all';suggestion.hidden=true;input.setAttribute('aria-expanded','false');render()});
  document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{const hit=match(b.dataset.example)[0];if(hit)choose(hit)}));
  document.addEventListener('click',ev=>{if(!ev.target.closest('.global-search-wrap')){suggestion.hidden=true;input.setAttribute('aria-expanded','false')}});
  choose(selected);
})();