/* Regulatory Playbook v3.0: multi-page app; authoritative data remain in data.json and ghs_data.json. */
(function runSite(){
"use strict";
const mount=document.querySelector("#app");if(!mount)return;
const page=document.body.dataset.page||"home";
const CODE={
expl:"H200 H201 H202 H203 H204 H205",desens:"H206 H207 H208",flgas:"H220",flgas1b:"H221",flgas2:"H221",aerosol:"H222 H223 H229",aerosol3:"Aerosol category 3",oxidgas:"H270",pressure:"H280 H281",flliq:"H224 H225 H226",flliq4:"H227",flsolid:"H228",selfreact:"H240 H241 H242",pyro:"H250",selfheat:"H251 H252",waterreact:"H260 H261",oxidliq:"H271 H272",oxidsol:"H271 H272",organicper:"H240 H241 H242",metcorr:"H290",actox:"H300 H301 H302 H310 H311 H312 H330 H331 H332",actox5:"H303 H313 H333",skincorr:"H314",skinirr2:"H315",skinirr3:"H316",eye1:"H318",eye2:"H319",eye2b:"H320",respsens:"H334",skinsens:"H317",mut:"H340 H341",carc:"H350 H351",repr:"H360 H361 H362",stotse:"H370 H371 H335 H336",stotre:"H372 H373",asp1:"H304",asp2:"H305",aqacute1:"H400",aqacute23:"H401 H402",aqchronic:"H410 H411 H412 H413",ozone:"H420",edhh:"EUH380 EUH381",edenv:"EUH430 EUH431",pbt:"EUH440 EUH441",pmt:"EUH450 EUH451"
};
const STATUS={a:"Adopted",x:"Not adopted",c:"Conditional",v:"Regional variation","?":"Not verified"};
const CATEGORIES=["Physical","Health","Environmental","Additional"];
const safe=s=>String(s??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
const norm=s=>String(s??"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const parse=key=>{try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}};
let DATA,GHS,SCHEMES,S,J,H;
const palette=s=>s==="?"?"q":s;
const nice=(code,kind="status")=>`<span class="${kind} ${palette(code)}">${safe(STATUS[code]||code)}</span>`;
const listStatus={mandatory:"Mandatory",conditional:"Conditional",advisory:"Advisory",none:"No general list"};
const statusPill=x=>`<span class="status ${safe(x)}">${safe(listStatus[x]||"Check scope")}</span>`;
const aLink=(url,label,extra="")=>typeof url==="string"&&/^https?:\/\//i.test(url)?`<a href="${safe(url)}" target="_blank" rel="noopener noreferrer" ${extra}>${safe(label)} ↗</a>`:"";
const linkSet=links=>`<div class="links">${(links||[]).map(l=>aLink(l[1],l[0])).filter(Boolean).join("")}</div>`;
const regionTags=scheme=>`<div class="region-tags">${scheme.ids.map(id=>{const j=J.get(id);return `<span class="region-tag">${safe(j.flag)} ${safe(j.name)}</span>`}).join("")}</div>`;
const schemeLink=s=>`regulation.html?id=${encodeURIComponent(s.id)}`;
const codes=h=>[...new Set((CODE[h.id]||"").match(/\b(?:EUH|H)\d{3}\b/g)||[])];
const searchHaz=(h,q)=>{const t=norm([h.label,h.group,h.description,h.id,CODE[h.id]||""].join(" "));return norm(q).split(" ").filter(Boolean).every(w=>t.split(" ").some(x=>x.startsWith(w)))};
const localStatus=(jId,hId)=>{const c=GHS.matrix?.[jId]?.[hId];return ["a","x","c","?"].includes(c)?c:"?"};
const groupStatus=(s,hId)=>{const st=s.ids.map(id=>localStatus(id,hId));return st.every(x=>x===st[0])?st[0]:"v"};
const sourceFor=(jId,hId)=>GHS.sources?.[`${jId}:${hId}`]||GHS.editions?.[jId]?.sources?.[0]?.[1]||"";
const keyNotes=(jId,hId)=>GHS.notes?.[`${jId}:${hId}`]||"";
const labelCode=h=>`${safe(h.label)}${codes(h).length?` <span class="hazard-code">${safe(codes(h).join(" · "))}</span>`:""}`;
function themeInit(){
const saved=localStorage.getItem("rp_theme");
if(saved==="dark"||saved==="light")document.documentElement.dataset.theme=saved;
}
function header(){
const nav=[
["index.html","Home","home"],
["classification-lists.html","Classification lists","lists"],
["ghs-editions.html","GHS editions","editions"],
["compare.html","Compare","compare"],
["regulations.html","Regulation explorer","regulations"]
];
return `<header class="topbar"><div class="topbar-inner"><a class="brand" href="index.html"><span class="brand-icon">RP</span><span><b>Regulatory Playbook</b><small>Classification reference</small></span></a>
<nav class="top-nav" aria-label="Main pages">${nav.map(([href,label,p])=>`<a href="${href}" ${page===p||(page==="regulation"&&p==="regulations")?'aria-current="page"':""}>${label}</a>`).join("")}<button type="button" class="theme-toggle" id="themeToggle" aria-label="Switch colour theme">◐ Theme</button></nav></div></header>`;
}
function layout(content,crumb=""){
mount.innerHTML=header()+`<main class="wrap">${crumb?`<div class="breadcrumb"><a href="index.html">Home</a> / ${crumb}</div>`:""}${content}<footer class="footer">Regulatory Playbook · Data reviewed ${safe(DATA.reviewed)}. Reference guide only: confirm official laws, effective dates and substance-specific requirements. <a href="regulations.html">Browse regulations</a>.</footer></main>`;
document.querySelector("#themeToggle").addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;try{localStorage.setItem("rp_theme",next)}catch{}});
}
function heading(label,title,description,icon=""){
return `<div class="hero"><div><div class="eyebrow">${safe(label)}</div><h1>${safe(title)}</h1><p>${safe(description)}</p></div>${icon?`<div class="hero-icon" aria-hidden="true">${icon}</div>`:""}</div>`;
}
function warning(){
return `<div class="notice"><strong>Important regulatory distinction:</strong> “Adopted” means a hazard building block exists under a scheme, not that an individual substance has that classification. “Not adopted” is only for the scheme described. “Not verified” must never be treated as an exclusion. CLP-family regional differences are retained instead of silently combining conflicting statuses.</div>`;
}
function home(){
const cards=[
["01","Classification lists","Identify binding, conditional and advisory national substance-classification lists, with links to government publications.","classification-lists.html","📚"],
["02","GHS editions","See which GHS revisions and national standards each regulatory framework uses, including local transitions.","ghs-editions.html","🌍"],
["03","Compare classifications","Select multiple hazard classes and regulatory frameworks in one comparison matrix.","compare.html","▦"],
["04","Regulation explorer","Choose a regulation to view every adopted, not-adopted, conditional and unverified hazard class.","regulations.html","⚖️"]
];
layout(`${heading("Regulatory Guidebook · v3.0","Chemical classification, organised by regulation","A desktop and mobile reference for GHS/CLP implementations. Navigate separate pages, compare legal building blocks, and open the classification rules of one regulation at a time.","🧭")}
<div class="overview-counts"><div class="count-card"><b>${SCHEMES.length}</b><span>Distinct regulatory frameworks</span></div><div class="count-card"><b>${J.size}</b><span>Jurisdictions covered</span></div><div class="count-card"><b>${H.size}</b><span>Hazard groups / category variants</span></div></div>
${warning()}<div class="section-head"><div><h2>Explore the playbook</h2><p>Each topic now has its own page. CLP-linked regions appear together under EU CLP.</p></div></div>
<div class="card-grid">${cards.map(x=>`<article class="card nav-card"><div class="nav-icon" aria-hidden="true">${x[4]}</div><span class="eyebrow">Chapter ${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p><div class="arrow-link">Open chapter →</div><a class="stretch" href="${x[3]}" aria-label="Open ${x[1]}"></a></article>`).join("")}</div>`);
}
function makeListCard(s){
const js=s.ids.map(id=>J.get(id));
const statuses=[...new Set(js.map(j=>j.status))];
const main=js[0];
const official=main.links?.filter(x=>["direct","list","law"].includes(x[2]))||[];
return `<article class="card reg-card"><div class="reg-top"><div><div class="reg-code">${safe(s.short)}</div><h3>${safe(s.name)}</h3></div>${statuses.length===1?statusPill(statuses[0]):'<span class="status c">Mixed list statuses</span>'}</div>
${regionTags(s)}<p>${safe(s.description)}</p>
<p><strong>${safe(main.list)}</strong></p>
<div class="card-actions">${official.length?aLink(official[0][1],"Open official list / law","class='button subtle'"):""}<a class="button" href="${schemeLink(s)}">View hazard rules →</a></div>
<details class="region-detail"><summary style="cursor:pointer;font-size:11px;color:var(--blue);font-weight:750">Sources and regional notes (${js.length})</summary>
${js.map(j=>`<div class="region-detail"><h4>${safe(j.flag)} ${safe(j.name)} — ${safe(j.list)}</h4><p>${safe(j.short)}</p><p>${safe(j.caution)}</p>${linkSet(j.links)}</div>`).join("")}</details></article>`;
}
function listsPage(){
layout(`${heading("Chapter 01","Official classification lists","Understand whether a jurisdiction has a mandatory harmonised list, a conditional designated list, an advisory reference or no general national substance list.","📚")}
${warning()}<div class="toolbar"><input id="listSearch" class="input" type="search" placeholder="Find a regulation, country, classification list…" aria-label="Search classification lists"/><span class="pill" id="listCount"></span></div><div id="listCards" class="card-grid"></div>`,"Classification lists");
const draw=()=>{const q=norm(document.querySelector("#listSearch").value);const items=SCHEMES.filter(s=>norm([s.name,s.subtitle,s.short,s.description,...s.ids.flatMap(id=>[J.get(id).name,J.get(id).list])].join(" ")).includes(q));document.querySelector("#listCards").innerHTML=items.length?items.map(makeListCard).join(""):'<div class="empty">No matching classification lists.</div>';document.querySelector("#listCount").textContent=`${items.length} regulatory frameworks`};
document.querySelector("#listSearch").addEventListener("input",draw);draw();
}
function makeEditionCard(s){
return `<article class="card"><div class="reg-top"><div class="reg-code">${safe(s.short)}</div><h3>${safe(s.name)}</h3>${regionTags(s)}</div>
${s.ids.map(id=>{const j=J.get(id),e=GHS.editions[id];if(!e)return"";return `<div class="edition-region"><h4>${safe(j.flag)} ${safe(j.name)}</h4><div class="ghs-edition-tag">${safe(e.version)}</div><p><b>${safe(e.year)}</b></p><p>${safe(e.note)}</p>${linkSet(e.sources)}</div>`}).join("")}
<div class="card-actions"><a class="button subtle" href="${schemeLink(s)}">View hazard applicability →</a></div></article>`;
}
function editionsPage(){
layout(`${heading("Chapter 02","GHS editions by regulation","GHS revisions are only a starting point: countries adopt different building blocks, national standards and implementation dates.","🌍")}
${warning()}<div class="toolbar"><input id="editionSearch" class="input" type="search" placeholder="Find a regulation, jurisdiction, GHS revision…" aria-label="Search GHS editions"/><span class="pill" id="editionCount"></span></div><div id="editionCards" class="card-grid"></div>`,"GHS editions");
const draw=()=>{const q=norm(document.querySelector("#editionSearch").value);const matching=SCHEMES.filter(s=>norm([s.name,s.short,...s.ids.flatMap(id=>[J.get(id).name,GHS.editions[id]?.version,GHS.editions[id]?.year])].join(" ")).includes(q));document.querySelector("#editionCards").innerHTML=matching.length?matching.map(makeEditionCard).join(""):'<div class="empty">No matching GHS editions.</div>';document.querySelector("#editionCount").textContent=`${matching.length} frameworks`};
document.querySelector("#editionSearch").addEventListener("input",draw);draw();
}
function directoryCard(s){
const totals={a:0,x:0,c:0,v:0,"?":0};
H.forEach(h=>totals[groupStatus(s,h.id)]++);
return `<article class="card reg-card"><div class="reg-top"><div><div class="reg-code">${safe(s.short)}</div><h3>${safe(s.name)}</h3></div><span class="pill">${s.ids.length} ${s.ids.length===1?"region":"regions"}</span></div>
${regionTags(s)}<p>${safe(s.subtitle)}</p>
<p>${safe(s.description)}</p><div class="region-tags"><span class="status a">${totals.a} adopted</span><span class="status x">${totals.x} not adopted</span><span class="status c">${totals.c} conditional</span><span class="status v">${totals.v} regional</span><span class="status q">${totals["?"]} unverified</span></div>
<div class="card-actions"><a class="button primary" href="${schemeLink(s)}">View all hazard classes →</a></div></article>`;
}
function directoryPage(){
layout(`${heading("Chapter 04","Regulation explorer","Select a classification regulation to view all 49 hazard groups divided into adopted, not adopted, conditional, regional variation and unverified classifications.","⚖️")}
${warning()}<div class="toolbar"><input id="regSearch" class="input" type="search" placeholder="Search regulation or jurisdiction…" aria-label="Find regulation"/><span class="pill" id="regCount"></span></div><div class="card-grid" id="regCards"></div>`,"Regulation explorer");
const draw=()=>{const q=norm(document.querySelector("#regSearch").value);const items=SCHEMES.filter(s=>norm([s.name,s.short,s.subtitle,s.description,...s.ids.map(id=>J.get(id).name)].join(" ")).includes(q));document.querySelector("#regCards").innerHTML=items.length?items.map(directoryCard).join(""):'<div class="empty">No matching regulations.</div>';document.querySelector("#regCount").textContent=`${items.length} frameworks`};document.querySelector("#regSearch").addEventListener("input",draw);draw();
}
function hazardDetails(s,h){
const notes=s.ids.map(id=>{const j=J.get(id),st=localStatus(id,h.id),n=keyNotes(id,h.id),src=sourceFor(id,h.id);
return `<div class="region-status"><span><b>${safe(j.flag)} ${safe(j.name)}</b> ${nice(st)}</span><span class="links">${aLink(src,"Legal / guidance source")}</span></div>${n?`<p>${safe(n)}</p>`:""}`}).join("");
return `<details><summary>Why this status? Regional detail and sources ▾</summary><div><p>${safe(h.description)}</p>${notes}</div></details>`;
}
function profilePage(){
const id=new URLSearchParams(location.search).get("id");
const chosen=SCHEMES.find(s=>s.id===id);
if(!chosen){layout(`${heading("Regulation explorer","Regulation not found","Choose a valid regulation from the directory.")}<a class="button primary" href="regulations.html">Browse regulations</a>`,"Regulation explorer");return}
const statusOrder=["a","x","c","v","?"];
const count=Object.fromEntries(statusOrder.map(k=>[k,0]));
H.forEach(h=>count[groupStatus(chosen,h.id)]++);
layout(`<div class="explorer-layout"><aside class="card reg-sidebar"><strong>Regulations</strong>${SCHEMES.map(s=>`<a class="${chosen.id===s.id?"active":""}" href="${schemeLink(s)}">${safe(s.short)} ${safe(s.ids.length>1?"· regional group":"")}</a>`).join("")}</aside><div>
<div class="breadcrumb"><a href="regulations.html">All regulations</a> / ${safe(chosen.short)}</div>
<div class="detail-heading"><div class="eyebrow">Regulation explorer · ${safe(chosen.category)}</div><h1>${safe(chosen.name)}</h1><p>${safe(chosen.subtitle)}. ${safe(chosen.description)}</p>${regionTags(chosen)}</div>
<div class="notice"><strong>Scope and timing:</strong> ${safe(chosen.notice)}<br>“Regional variation” indicates that the member jurisdictions have different recorded statuses — click a classification for the exact breakdown. Not verified ≠ excluded.</div>
<section class="card"><div class="section-head"><div><h2>All hazard-class applicability</h2><p>Click a status to filter. Use the search to find H-codes or hazard names.</p></div><span class="pill">${H.size} entries</span></div>
<div class="status-summary" id="statusSummary"><button data-status="all" class="summary-chip active"><b>${H.size}</b><small>All statuses</small></button>${statusOrder.map(k=>`<button data-status="${k}" class="summary-chip"><b>${count[k]}</b><small>${STATUS[k]}</small></button>`).join("")}</div>
<input id="profileSearch" class="input" type="search" placeholder="Find a classification or H-code…" aria-label="Search hazard classes"/><p class="regions-note" id="profileCount"></p>
<div id="profileResults"></div></section>
<section class="card" style="margin-top:17px"><h3>Regulatory sources by region</h3>${chosen.ids.map(id=>{const j=J.get(id);return `<div class="region-detail"><h4>${safe(j.flag)} ${safe(j.name)}</h4><p>${safe(j.caution)}</p>${linkSet(j.links)}</div>`}).join("")}</section>
</div></div>`,"Regulation explorer");
let status="all";const filtered=()=>{
const q=document.querySelector("#profileSearch").value;
const hs=[...H.values()].filter(h=>(status==="all"||groupStatus(chosen,h.id)===status)&&searchHaz(h,q));
document.querySelector("#profileCount").textContent=`Showing ${hs.length} of ${H.size} hazard groups`;
document.querySelector("#profileResults").innerHTML=hs.length?CATEGORIES.map(cat=>{
const rows=hs.filter(h=>h.group===cat);
return rows.length?`<section class="hazard-section"><h3>${safe(cat)} · ${rows.length}</h3>${rows.map(h=>{const x=groupStatus(chosen,h.id);return `<article class="hazard-row"><div class="hazard-top"><div><strong>${safe(h.label)}</strong><span class="hazard-code">${safe(codes(h).join(" · ")||h.description)}</span></div>${nice(x)}</div>${hazardDetails(chosen,h)}</article>`}).join("")}</section>`:"";
}).join(""):'<div class="empty">No hazard classes match the current filter.</div>';
};
document.querySelector("#profileSearch").addEventListener("input",filtered);
document.querySelector("#statusSummary").addEventListener("click",e=>{const t=e.target.closest("[data-status]");if(!t)return;status=t.dataset.status;document.querySelectorAll("#statusSummary .summary-chip").forEach(b=>b.classList.toggle("active",b.dataset.status===status));filtered()});filtered();
}
function comparePage(){
const previous=parse("rp_scheme_comparison_v1");
const hIds=new Set(Array.isArray(previous?.hazards)?previous.hazards.filter(x=>H.has(x)):["flliq4","eye2b","edhh"]);
const sIds=new Set(Array.isArray(previous?.schemes)?previous.schemes.filter(x=>S.has(x)):["eu-clp","gb-clp","us-osha","canada-whmis"]);
let diff=previous?.diff===true, qH="",qS="";
const save=()=>{try{localStorage.setItem("rp_scheme_comparison_v1",JSON.stringify({hazards:[...hIds],schemes:[...sIds],diff}))}catch{}};
layout(`${heading("Chapter 03","Compare hazard classifications","Choose several hazard classes and several regulations. Each matrix column represents a regulatory framework, not a duplicated country.","▦")}
${warning()}<div class="compare-controls"><section class="picker"><h3>1. Hazard classifications</h3><p>Search or tick multiple classes. H-codes can return grouped categories.</p>
<input class="input" type="search" id="searchHazards" placeholder="H318, skin corrosion, aquatic…" aria-label="Find hazard classifications"/>
<div class="picker-list" id="hazardOptions"></div><div class="picker-actions"><button id="selectMatchingHazards">Select matching</button><button id="clearHazards">Clear selections</button></div>
<div class="chips" id="hazardChips"></div></section>
<section class="picker"><h3>2. Regulatory frameworks</h3><p>CLP regions are grouped; regional exceptions remain visible.</p>
<input class="input" type="search" id="searchSchemes" placeholder="EU CLP, OSHA, WHMIS…" aria-label="Find regulations"/>
<div class="picker-list" id="schemeOptions"></div><div class="picker-actions"><button id="selectMatchingSchemes">Select matching</button><button id="selectAllSchemes">Select all</button><button id="clearSchemes">Clear</button></div>
<div class="chips" id="schemeChips"></div></section></div>
<section class="card"><div class="matrix-toolbar"><div><h3 style="font-size:16px">Classification comparison matrix</h3><p id="comparisonSummary"></p></div><label><input type="checkbox" id="differencesOnly"/> Differences only</label></div>
<div id="comparisonResults"></div><div class="modal-info" id="comparisonDetail" hidden></div><p class="regions-note">Differences only shows rows with at least two different <strong>confirmed</strong> statuses. Unknown and mixed regional statuses cannot by themselves establish a difference. Click a status for source and regional breakdown.</p></section>`,"Compare classifications");
const $=s=>document.querySelector(s);
const matchedH=()=>[...H.values()].filter(h=>searchHaz(h,qH));
const matchedS=()=>[...SCHEMES].filter(s=>norm([s.short,s.name,s.subtitle,...s.ids.map(id=>J.get(id).name)].join(" ")).includes(norm(qS)));
function pickerRefresh(){
const hl=$("#hazardOptions"),sl=$("#schemeOptions"),sH=hl.scrollTop,sS=sl.scrollTop;
hl.innerHTML=matchedH().map(h=>`<label class="picker-option"><input type="checkbox" data-h="${safe(h.id)}" ${hIds.has(h.id)?"checked":""}/><span>${safe(h.label)}<small>${safe(h.group)} · ${safe(codes(h).join(", "))}</small></span></label>`).join("")||'<div class="empty">No matching classes.</div>';
sl.innerHTML=matchedS().map(s=>`<label class="picker-option"><input type="checkbox" data-s="${safe(s.id)}" ${sIds.has(s.id)?"checked":""}/><span>${safe(s.name)}<small>${safe(s.ids.map(id=>J.get(id).name).join(" · "))}</small></span></label>`).join("")||'<div class="empty">No matching frameworks.</div>';
hl.scrollTop=sH;sl.scrollTop=sS;
$("#hazardChips").innerHTML=[...hIds].map(id=>`<button class="chip" data-remove-h="${safe(id)}">${safe(H.get(id).label)} <b>×</b></button>`).join("")||'<span class="muted">No classifications selected</span>';
$("#schemeChips").innerHTML=[...sIds].map(id=>`<button class="chip" data-remove-s="${safe(id)}">${safe(S.get(id).short)} <b>×</b></button>`).join("")||'<span class="muted">No regulations selected</span>';
$("#differencesOnly").checked=diff;
}
const sourceLink=s=>`<a href="${schemeLink(s)}">Regulation details →</a>`;
const cell=(s,h)=>{
const st=groupStatus(s,h.id);
return `<button type="button" data-scheme="${safe(s.id)}" data-hazard="${safe(h.id)}" class="status ${palette(st)}" title="Show source and individual region statuses">${safe(STATUS[st])}</button><div class="links">${sourceLink(s)}</div>`;
};
function resultRefresh(){
$("#comparisonDetail").hidden=true;
const hs=[...H.values()].filter(h=>hIds.has(h.id)),ss=SCHEMES.filter(s=>sIds.has(s.id));
const varying=h=>new Set(ss.map(s=>groupStatus(s,h.id)).filter(x=>x!=="?"&&x!=="v")).size>1;
const shown=hs.filter(h=>!diff||varying(h));
$("#comparisonSummary").textContent=`${hs.length} classifications × ${ss.length} regulations · ${hs.length*ss.length} statuses${diff?" · "+shown.length+" confirmed differences":""}`;
if(!hs.length||!ss.length){$("#comparisonResults").innerHTML='<div class="empty">Select at least one hazard class and one regulation.</div>';return}
if(!shown.length){$("#comparisonResults").innerHTML='<div class="empty">No confirmed differences for this selection. Uncheck “Differences only” to see everything, including unverified statuses.</div>';return}
const table=`<div class="matrix-scroll" tabindex="0" role="region" aria-label="Comparison table; scroll horizontally to view other regulations"><table class="matrix"><thead><tr><th scope="col">Hazard classification</th>${ss.map(s=>`<th scope="col"><a href="${schemeLink(s)}">${safe(s.short)}</a><br><small>${safe(s.name)}</small></th>`).join("")}</tr></thead><tbody>${shown.map(h=>`<tr><th scope="row">${labelCode(h)}<small>${safe(h.group)}</small></th>${ss.map(s=>`<td>${cell(s,h)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
const mobile=`<div class="mobile-matrix">${shown.map(h=>`<article class="mobile-hazard"><h3>${safe(h.label)}</h3><p>${safe(codes(h).join(" · ")||h.group)}</p>${ss.map(s=>`<div class="mobile-line"><b>${safe(s.short)}</b><span>${cell(s,h)}</span></div>`).join("")}</article>`).join("")}</div>`;
$("#comparisonResults").innerHTML=table+mobile;
}
function refresh(){save();pickerRefresh();resultRefresh()}
function cellDetail(s,h){
const val=groupStatus(s,h.id),regions=s.ids.map(id=>{const j=J.get(id),x=localStatus(id,h.id),note=keyNotes(id,h.id);
return `<div class="region-detail"><strong>${safe(j.flag)} ${safe(j.name)} ${nice(x)}</strong><p>${safe(note||"See current local classification criteria and implementation dates.")}</p>${linkSet([[`View source for ${j.name}`,sourceFor(id,h.id)]])}</div>`}).join("");
const box=$("#comparisonDetail");box.hidden=false;box.innerHTML=`<button type="button" id="closeDetail" aria-label="Close regulatory detail">×</button><h3>${safe(s.name)} · ${safe(h.label)}</h3><p>${nice(val)} ${val==="v"?"Statuses differ within this group; inspect every region.":""}</p>${regions}<div class="links"><a href="${schemeLink(s)}">View all ${safe(s.short)} hazard rules →</a></div>`;box.scrollIntoView({behavior:"smooth",block:"nearest"});
}
$("#searchHazards").addEventListener("input",e=>{qH=e.target.value;pickerRefresh()});
$("#searchSchemes").addEventListener("input",e=>{qS=e.target.value;pickerRefresh()});
$("#hazardOptions").addEventListener("change",e=>{const t=e.target;if(!t.dataset.h)return;t.checked?hIds.add(t.dataset.h):hIds.delete(t.dataset.h);refresh()});
$("#schemeOptions").addEventListener("change",e=>{const t=e.target;if(!t.dataset.s)return;t.checked?sIds.add(t.dataset.s):sIds.delete(t.dataset.s);refresh()});
$("#differencesOnly").addEventListener("change",e=>{diff=e.target.checked;refresh()});
const onclick=(id,action)=>$(id).addEventListener("click",()=>{action();refresh()});
onclick("#selectMatchingHazards",()=>matchedH().forEach(h=>hIds.add(h.id)));
onclick("#clearHazards",()=>hIds.clear());
onclick("#selectMatchingSchemes",()=>matchedS().forEach(s=>sIds.add(s.id)));
onclick("#selectAllSchemes",()=>SCHEMES.forEach(s=>sIds.add(s.id)));
onclick("#clearSchemes",()=>sIds.clear());
$("#hazardChips").addEventListener("click",e=>{const b=e.target.closest("[data-remove-h]");if(b){hIds.delete(b.dataset.removeH);refresh()}});
$("#schemeChips").addEventListener("click",e=>{const b=e.target.closest("[data-remove-s]");if(b){sIds.delete(b.dataset.removeS);refresh()}});
$("#comparisonResults").addEventListener("click",e=>{const b=e.target.closest("[data-scheme][data-hazard]");if(b){const s=S.get(b.dataset.scheme),h=H.get(b.dataset.hazard);if(s&&h)cellDetail(s,h)}});
$("#comparisonDetail").addEventListener("click",e=>{if(e.target.id==="closeDetail")$("#comparisonDetail").hidden=true});
refresh();
}
async function init(){
themeInit();
try{
const response=await Promise.all(["data.json","ghs_data.json","regulatory-schemes.json"].map(async p=>{const r=await fetch("./"+p);if(!r.ok)throw Error(p+": "+r.status);return r.json()}));
[DATA,GHS,SCHEMES]=response;
if(!Array.isArray(SCHEMES.schemes))throw Error("Missing regulation groups");
const seen=new Set(),jIds=new Set(DATA.jurisdictions.map(j=>j.id));
for(const s of SCHEMES.schemes)for(const id of s.ids){if(seen.has(id)||!jIds.has(id))throw Error("Regulation mapping invalid: "+id);seen.add(id)}
if(seen.size!==jIds.size)throw Error("Not all jurisdictions mapped");
J=new Map(DATA.jurisdictions.map(j=>[j.id,j]));S=new Map(SCHEMES.schemes.map(s=>[s.id,s]));SCHEMES=SCHEMES.schemes;
H=new Map(GHS.hazards.map(h=>[h.id,h]));
const routes={home,lists:listsPage,editions:editionsPage,compare:comparePage,regulations:directoryPage,regulation:profilePage};
(routes[page]||home)();
}catch(e){
mount.innerHTML=`<main class="wrap"><h1>Unable to load the guidebook</h1><div class="notice">The multi-page guidebook needs to be opened through a local web server. In the repository directory, run <code>python3 -m http.server 8000</code> and open <a href="http://localhost:8000">http://localhost:8000</a>.</div><pre>${safe(e.message)}</pre></main>`;
}
}
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
init();
})();
