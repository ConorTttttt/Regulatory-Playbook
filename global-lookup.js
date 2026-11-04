/* Multi-select GHS classification × jurisdiction comparison; statuses from existing source-linked GHS_DATA. */
(function globalMultiCompare(){
  'use strict';
  const chapter=document.querySelector('#hazards');
  if(!chapter||typeof GHS_DATA==='undefined'||typeof DATA==='undefined')return;
  const original=chapter.querySelector('.section-card');
  const intro=chapter.querySelector('.feature-intro');
  if(!original||!intro||chapter.querySelector('#globalLookup'))return;
  const H=GHS_DATA.hazards, J=DATA.jurisdictions, known=new Set(['a','x','c','?']);
  const hazardCodes={
    expl:'H200 H201 H202 H203 H204 H205',desens:'H206 H207 H208',
    flgas:'H220',flgas1b:'H221',flgas2:'H221',aerosol:'H222 H223 H229',
    aerosol3:'Aerosol 3 non flammable',oxidgas:'H270',pressure:'H280 H281',
    flliq:'H224 H225 H226',flliq4:'H227',flsolid:'H228',
    selfreact:'H240 H241 H242',pyro:'H250',selfheat:'H251 H252',
    waterreact:'H260 H261',oxidliq:'H271 H272',oxidsol:'H271 H272',
    organicper:'H240 H241 H242',metcorr:'H290',
    actox:'H300 H301 H302 H310 H311 H312 H330 H331 H332',
    actox5:'H303 H313 H333',skincorr:'H314 Skin Corr 1 1A 1B 1C',
    skinirr2:'H315',skinirr3:'H316',eye1:'H318',eye2:'H319',
    eye2b:'H320',respsens:'H334',skinsens:'H317',mut:'H340 H341',
    carc:'H350 H351',repr:'H360 H361 H362',
    stotse:'H370 H371 H335 H336',stotre:'H372 H373',
    asp1:'H304',asp2:'H305',aqacute1:'H400',aqacute23:'H401 H402',
    aqchronic:'H410 H411 H412 H413',ozone:'H420',
    edhh:'EUH380 EUH381',edenv:'EUH430 EUH431',
    pbt:'EUH440 EUH441',pmt:'EUH450 EUH451'
  };
  const labels={a:'Adopted',x:'Not adopted',c:'Conditional','?':'Not verified'};
  const statusDesc={a:'Included in the stated classification scheme',x:'Not adopted in the stated scheme',c:'Scope, transition dates or conditions apply','?':'Not verified; do not assume an exclusion'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
  const normalize=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const hzById=new Map(H.map(h=>[h.id,h]));
  const jById=new Map(J.map(j=>[j.id,j]));
  const stored=(()=>{try{return JSON.parse(localStorage.getItem('rg_global_multi_v4')||'null')}catch{return null}})();
  const hazards=new Set(Array.isArray(stored?.hazards)?stored.hazards.filter(x=>hzById.has(x)):['flliq4','eye2b']);
  const jurisdictions=new Set(Array.isArray(stored?.jurisdictions)?stored.jurisdictions.filter(x=>jById.has(x)):['eu','gb','us','ca','au']);
  let differences=stored?.differences===true;
  let activeCell=null;
  const save=()=>{try{localStorage.setItem('rg_global_multi_v4',JSON.stringify({hazards:[...hazards],jurisdictions:[...jurisdictions],differences}))}catch{}};
  const root=document.createElement('div');
  root.id='globalLookup';root.className='global-lookup';
  root.innerHTML=`<div class="global-title"><div><span class="chapter-number">Global classification comparison</span>
    <h3>Compare classifications across jurisdictions</h3>
    <p>Select multiple hazard classifications and multiple jurisdictions. The results update together.</p></div><span class="global-tag">${H.length} hazard groups</span></div>
    <div class="multi-selectors">
      <section class="multi-selector" aria-label="Select hazard classifications">
        <header><div><strong>1. Hazard classifications</strong><small id="multiHazardCount"></small></div><button type="button" id="multiHazardClear">Clear</button></header>
        <label for="multiHazardSearch" class="global-search-label">Find by H-code or classification</label>
        <input id="multiHazardSearch" class="multi-search" type="search" placeholder="Search H318, eye damage, flammable…" autocomplete="off" spellcheck="false"/>
        <div class="multi-option-list" id="multiHazardOptions" aria-label="Available classifications"></div>
        <div class="multi-actions"><button type="button" id="multiHazardAddVisible">Select matching</button></div>
        <div class="multi-chips" id="multiHazardChips" aria-label="Selected classifications"></div>
      </section>
      <section class="multi-selector" aria-label="Select jurisdictions">
        <header><div><strong>2. Jurisdictions</strong><small id="multiJurisdictionCount"></small></div><button type="button" id="multiJurisdictionClear">Clear</button></header>
        <label for="multiJurisdictionSearch" class="global-search-label">Find a country or region</label>
        <input id="multiJurisdictionSearch" class="multi-search" type="search" placeholder="Search countries and regions…" autocomplete="off" spellcheck="false"/>
        <div class="multi-option-list" id="multiJurisdictionOptions" aria-label="Available jurisdictions"></div>
        <div class="multi-actions"><button type="button" id="multiJurisdictionAddVisible">Select matching</button><button type="button" id="multiJurisdictionAll">Select all jurisdictions</button></div>
        <div class="multi-chips" id="multiJurisdictionChips" aria-label="Selected jurisdictions"></div>
      </section>
    </div>
    <div class="multi-results-heading"><div><h4>Comparison matrix</h4><p id="multiComparisonSummary">Select at least one classification and one jurisdiction.</p></div>
      <label class="multi-diff-toggle"><input type="checkbox" id="multiDifferencesOnly"/><span>Differences only</span></label></div>
    <div class="multi-legend" aria-label="Status legend"><span class="multi-status a">✓ Adopted</span><span class="multi-status x">× Not adopted</span><span class="multi-status c">◐ Conditional</span><span class="multi-status q">? Not verified</span></div>
    <div id="multiCompareResults" aria-live="polite"></div>
    <div id="multiCellDetails" class="multi-cell-details" hidden></div>
    <p class="global-caveat">This tool compares whether a hazard <strong>class or category is recognised by a regulatory scheme</strong> — not whether an individual substance is classified. Grouped entries can cover multiple categories or H-statements; check the exact category in the linked legal text. <strong>Not verified</strong> must never be interpreted as <strong>not adopted</strong>. Source review: ${esc(GHS_DATA.date)}.</p>`;
  intro.insertAdjacentElement('afterend',root);
  const advanced=document.createElement('details');advanced.className='global-advanced';
  advanced.innerHTML='<summary><strong>Advanced: detailed two-jurisdiction view</strong><span>Open the original classification breakdown ⌄</span></summary>';
  original.before(advanced);advanced.append(original);
  const $=sel=>root.querySelector(sel);
  const hSearch=$('#multiHazardSearch'),jSearch=$('#multiJurisdictionSearch');
  const matchHazards=()=>{const q=normalize(hSearch.value);const parts=q.split(' ').filter(Boolean);return H.filter(h=>{const s=normalize([h.label,h.description,h.group,h.id,hazardCodes[h.id]||''].join(' '));return parts.every(p=>s.split(' ').some(t=>t.startsWith(p)))}).sort((a,b)=>a.label.localeCompare(b.label))};
  const matchJurisdictions=()=>{const q=normalize(jSearch.value);return J.filter(j=>normalize([j.name,j.region,j.id].join(' ')).includes(q))};
  const status=(j,h)=>{const s=GHS_DATA.matrix[j]?.[h];return known.has(s)?s:'?'};
  const codes=h=>[...new Set((hazardCodes[h.id]||'').match(/\b(?:EUH|H)\d{3}\b/g)||[])];
  const fullSource=(j,h)=>{
    const key=j.id+':'+h.id;
    const specific=GHS_DATA.sources?.[key],generic=GHS_DATA.editions?.[j.id]?.sources?.[0]?.[1];
    const url=specific||generic;return typeof url==='string'&&/^https?:\/\//i.test(url)?url:'';
  };
  const sourceLink=(j,h)=>{
    const url=fullSource(j,h);
    return url?`<a class="multi-source" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open regulatory source for ${esc(j.name)} and ${esc(h.label)}">Source ↗</a>`:'';
  };
  function drawOptions(){
    const matchedH=matchHazards(), matchedJ=matchJurisdictions();
    $('#multiHazardOptions').innerHTML=matchedH.length?matchedH.map(h=>{
      const alias=codes(h).slice(0,3).join(' · ');
      return `<label class="multi-option"><input type="checkbox" data-hazard="${esc(h.id)}" ${hazards.has(h.id)?'checked':''}/><span class="multi-option-text"><strong>${esc(h.label)}</strong><small>${esc(h.group)}${alias?' · '+esc(alias):''}</small></span></label>`;
    }).join(''):'<p class="multi-empty-options">No matching classifications.</p>';
    $('#multiJurisdictionOptions').innerHTML=matchedJ.length?matchedJ.map(j=>
      `<label class="multi-option"><input type="checkbox" data-jurisdiction="${esc(j.id)}" ${jurisdictions.has(j.id)?'checked':''}/><span class="multi-option-text"><strong>${esc(j.flag)} ${esc(j.name)}</strong><small>${esc(j.region)}</small></span></label>`
    ).join(''):'<p class="multi-empty-options">No matching jurisdictions.</p>';
    $('#multiHazardCount').textContent=`${hazards.size} selected / ${H.length}`;
    $('#multiJurisdictionCount').textContent=`${jurisdictions.size} selected / ${J.length}`;
    $('#multiHazardChips').innerHTML=hazards.size?[...hazards].map(id=>{
      const h=hzById.get(id);return `<button type="button" class="multi-chip" data-remove-hazard="${esc(id)}" aria-label="Remove ${esc(h.label)}">${esc(h.label)} <b aria-hidden="true">×</b></button>`;
    }).join(''):'<span class="multi-chips-empty">No classifications selected</span>';
    $('#multiJurisdictionChips').innerHTML=jurisdictions.size?[...jurisdictions].map(id=>{
      const j=jById.get(id);return `<button type="button" class="multi-chip" data-remove-jurisdiction="${esc(id)}" aria-label="Remove ${esc(j.name)}">${esc(j.flag)} ${esc(j.name)} <b aria-hidden="true">×</b></button>`;
    }).join(''):'<span class="multi-chips-empty">No jurisdictions selected</span>';
    $('#multiDifferencesOnly').checked=differences;
  }
  function detail(j,h){
    const s=status(j.id,h.id), key=j.id+':'+h.id;
    const note=GHS_DATA.notes?.[key];
    const content=$('#multiCellDetails');
    content.hidden=false;
    content.innerHTML=`<div class="multi-detail-top"><div><small>Regulatory detail</small><h5>${esc(j.flag)} ${esc(j.name)} — ${esc(h.label)}</h5></div><button type="button" data-close-detail aria-label="Close detail">×</button></div>
      <span class="multi-status ${s==='?'?'q':s}">${esc(labels[s])}</span>
      <p>${esc(note||statusDesc[s])}</p>${sourceLink(j,h)||'<small>No verified direct source link for this entry.</small>'}`;
  }
  function resultCell(j,h){
    const s=status(j.id,h.id), note=GHS_DATA.notes?.[j.id+':'+h.id];
    return `<div class="multi-cell-content"><button type="button" class="multi-status multi-status-button ${s==='?'?'q':s}" data-detail-h="${esc(h.id)}" data-detail-j="${esc(j.id)}" title="${esc(note||statusDesc[s])}" aria-label="${esc(j.name)}: ${esc(h.label)} — ${esc(labels[s])}; show details">${esc(labels[s])}</button>${sourceLink(j,h)}</div>`;
  }
  function drawResults(){
    const hs=H.filter(h=>hazards.has(h.id)), js=J.filter(j=>jurisdictions.has(j.id));
    activeCell=null;$('#multiCellDetails').hidden=true;
    const total=hs.length*js.length;
    const varying=h=>{
      const confirmed=js.map(j=>status(j.id,h.id)).filter(s=>s!=='?');
      return new Set(confirmed).size>1;
    };
    const shown=hs.filter(h=>!differences||varying(h));
    const summary=`${hs.length} classification${hs.length!==1?'s':''} × ${js.length} jurisdiction${js.length!==1?'s':''} · ${total} status checks`;
    $('#multiComparisonSummary').textContent=(hs.length&&js.length)?summary+(differences?` · ${shown.length} differing classification${shown.length!==1?'s':''}`:''):'Select at least one classification and one jurisdiction to display a comparison.';
    if(!hs.length||!js.length){
      $('#multiCompareResults').innerHTML=`<div class="multi-empty-result">${!hs.length?'Choose one or more hazard classifications.':'Choose one or more jurisdictions.'}</div>`;return;
    }
    if(!shown.length){
      $('#multiCompareResults').innerHTML='<div class="multi-empty-result">No confirmed differences among the selected jurisdictions for these classifications. Unverified entries were not treated as confirmed differences. Disable “Differences only” to see every selection.</div>';return;
    }
    const counts={a:0,x:0,c:0,'?':0};
    for(const h of shown)for(const j of js)counts[status(j.id,h.id)]++;
    const totals=`<div class="multi-totals">${['a','x','c','?'].map(s=>`<span class="multi-total"><b>${counts[s]}</b> ${labels[s]}</span>`).join('')}</div>`;
    const table=`<div class="multi-table-scroll" tabindex="0" role="region" aria-label="Classification comparison table, scroll horizontally to view further jurisdictions">
      <table class="multi-table"><thead><tr><th scope="col" class="multi-sticky">Hazard classification</th>${js.map(j=>`<th scope="col" title="${esc(j.name)}">${esc(j.flag)}<br>${esc(j.name)}</th>`).join('')}</tr></thead><tbody>${shown.map(h=>`<tr>
      <th scope="row" class="multi-sticky"><strong>${esc(h.label)}</strong><small>${esc(h.group)}${codes(h).length?' · '+esc(codes(h).join(', ')):''}</small></th>
      ${js.map(j=>`<td>${resultCell(j,h)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const mobile=`<div class="multi-mobile-list">${shown.map(h=>`<section class="multi-mobile-card"><h5>${esc(h.label)}</h5><p>${esc(h.group)}${codes(h).length?' · '+esc(codes(h).join(', ')):''}</p>
      ${js.map(j=>`<div class="multi-mobile-line"><strong>${esc(j.flag)} ${esc(j.name)}</strong>${resultCell(j,h)}</div>`).join('')}</section>`).join('')}</div>`;
    $('#multiCompareResults').innerHTML=totals+table+mobile;
  }
  function sync(){save();drawOptions();drawResults()}
  hSearch.addEventListener('input',drawOptions);
  jSearch.addEventListener('input',drawOptions);
  root.addEventListener('change',ev=>{
    const t=ev.target;
    if(t.matches('[data-hazard]')){t.checked?hazards.add(t.dataset.hazard):hazards.delete(t.dataset.hazard);sync()}
    else if(t.matches('[data-jurisdiction]')){t.checked?jurisdictions.add(t.dataset.jurisdiction):jurisdictions.delete(t.dataset.jurisdiction);sync()}
    else if(t.id==='multiDifferencesOnly'){differences=t.checked;sync()}
  });
  root.addEventListener('click',ev=>{
    const t=ev.target.closest('button');if(!t)return;
    if(t.hasAttribute('data-remove-hazard')){hazards.delete(t.dataset.removeHazard);sync()}
    else if(t.hasAttribute('data-remove-jurisdiction')){jurisdictions.delete(t.dataset.removeJurisdiction);sync()}
    else if(t.id==='multiHazardClear'){hazards.clear();sync()}
    else if(t.id==='multiJurisdictionClear'){jurisdictions.clear();sync()}
    else if(t.id==='multiHazardAddVisible'){matchHazards().forEach(h=>hazards.add(h.id));sync()}
    else if(t.id==='multiJurisdictionAddVisible'){matchJurisdictions().forEach(j=>jurisdictions.add(j.id));sync()}
    else if(t.id==='multiJurisdictionAll'){J.forEach(j=>jurisdictions.add(j.id));sync()}
    else if(t.hasAttribute('data-close-detail')){$('#multiCellDetails').hidden=true}
    else if(t.hasAttribute('data-detail-h')){
      const h=hzById.get(t.dataset.detailH),j=jById.get(t.dataset.detailJ);
      if(h&&j)detail(j,h);
    }
  });
  drawOptions();drawResults();
})();
