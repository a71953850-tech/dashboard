/* Offline dashboard. All chart geometry is drawn locally as responsive SVG. */
(()=>{
 'use strict';
 const C=window.BudgetCore, all=window.BUDGET_DATA.rows;
 const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const colors=['#6558ee','#20b7ad','#ffb355','#ee5e9a','#5689f4','#b08be6','#57bdd5','#ed9471','#8bc6a1','#b5a7ed'];
 const sectorColors={'전력운영':'#6558ee','방위력개선':'#20b7ad','병무행정':'#ffb355'};
 const accountColors={'일반회계':'#6558ee','특별회계·기금':'#20b7ad','내부거래·보전지출':'#ee5e9a','내부거래':'#ffb355'};
 const state={sector:'',account:'',query:'',year:'b',sort:'b',direction:-1};
 let visible=all;
 const num=v=>Number(v).toLocaleString('ko-KR',{maximumFractionDigits:0});
 const signed=v=>(v>0?'+':'')+num(v);
 const pct=v=>v===null?'—':(v>0?'+':'')+(100*v).toFixed(1)+'%';
 const compact=v=>Math.abs(v)>=10000?(v/10000).toLocaleString('ko-KR',{maximumFractionDigits:2})+'조':num(v)+'억';
 const money=v=>num(v)+'억 원';
 const short=(v,n=16)=>v.length>n?v.slice(0,n-1)+'…':v;
 const tip=r=>`${C.name(r)}\n${r.sector} · ${r.account}\n2026년  ${money(r.a)}\n2027년  ${money(r.b)}\n증감  ${signed(C.delta(r))}억 원 (${pct(C.rate(r))})`;
 const attr=t=>`data-tip="${esc(t)}"`;
 const txt=(x,y,t,more='')=>`<text x="${x}" y="${y}" ${more}>${esc(t)}</text>`;
 const rect=(x,y,w,h,color,more='')=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${color}" ${more}/>`;
 const line=(x,y,x2,y2,color='#edf0f6',more='')=>`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" ${more}/>`;
 const circle=(x,y,r,color,more='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" ${more}/>`;
 const svg=(title,content,height=320,width=680)=>`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${content}</svg>`;
 const empty=(text='선택한 조건에 해당하는 데이터가 없습니다.')=>`<div class="empty">${esc(text)}</div>`;
 function domain(values,zero=true){let lo=Math.min(...values), hi=Math.max(...values);if(zero){lo=Math.min(lo,0);hi=Math.max(hi,0);}if(lo===hi){hi=lo+1;}return [lo,hi];}
 const scale=(v,lo,hi,start,end)=>start+(v-lo)/(hi-lo)*(end-start);
 function yGrid(lo,hi,top,bottom,left,right){let out='';for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4,y=scale(v,lo,hi,bottom,top);out+=line(left,y,right,y)+txt(left-10,y+4,compact(v),'text-anchor="end"');}return out;}
 function options(){
  $('sector').innerHTML='<option value="">전체 부문</option>'+[...new Set(all.map(r=>r.sector))].map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
  accounts();
 }
 function accounts(){
  const available=[...new Set(all.filter(r=>!state.sector||r.sector===state.sector).map(r=>r.account))];
  if(!available.includes(state.account))state.account='';
  $('account').innerHTML='<option value="">전체 회계</option>'+available.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
  $('account').value=state.account;
 }
 function kpis(rows){
  const s=C.summarize(rows), up=rows.filter(r=>C.delta(r)>0).length, down=rows.filter(r=>C.delta(r)<0).length;
  const specs=[['2026년 예산',s.a,'#5689f4','#edf3ff','2026년 선택 항목 합계'],['2027년 정부안',s.b,'#6558ee','#f0edff','2027년 선택 항목 합계'],['전년 대비 증감',s.delta,'#20b7ad','#e4f8f4',`증가 ${up}개 · 감소 ${down}개`],['전년 대비 증감률',s.rate,'#ee5e9a','#ffedf5',s.a<0?'음수 기준 · 차감액 크기 변화':'증감액 ÷ 2026년 합계']];
  $('kpis').innerHTML=specs.map(([label,value,color,tint,sub],i)=>`<article class="kpi ${i>1?'color':''}" style="--accent:${color};--tint:${tint}"><div class="kpi-label"><i class="dot"></i>${label}</div><strong>${i===3?pct(value):(i===2&&value>0?'+':'')+num(value)}${i!==3?'<small>억 원</small>':''}</strong><span class="kpi-sub">${esc(sub)}</span></article>`).join('');
  const leader=[...rows].filter(r=>r.program).sort((a,b)=>C.delta(b)-C.delta(a))[0];
  $('insight').innerHTML=leader?`선택 범위에서 <b>${esc(C.name(leader))}</b>의 증감액이 가장 큽니다. <b>${signed(C.delta(leader))}억 원</b> (${pct(C.rate(leader))}) · 선택 합계 <b>${pct(s.rate)}</b>`:rows.length?'선택한 항목은 내부거래 차감 항목입니다. 음수 금액은 전체 예산에서 차감됩니다.':'조건에 맞는 항목이 없습니다. 필터 또는 검색어를 변경해 주세요.';
  $('scope').textContent=`${state.sector||'전체 부문'} / ${state.account||'전체 회계'}${state.query?' / 검색: '+state.query:''} · ${rows.length}개 항목`;
 }
 function sectorChart(rows){
  const groups=C.group(rows,'sector');if(!groups.length)return empty();
  const [lo,hi]=domain(groups.flatMap(r=>[r.a,r.b])),top=35,bottom=260,left=83,right=655;
  let out=yGrid(lo,hi,top,bottom,left,right);const zero=scale(0,lo,hi,bottom,top),step=(right-left)/groups.length;
  groups.forEach((r,i)=>{const center=left+step*(i+.5),w=Math.min(55,step*.27);
   for(const [year,dx,col] of [['a',-w-3,'#a5b4fc'],['b',3,'#6558ee']]){const y=scale(r[year],lo,hi,bottom,top);out+=rect(center+dx,Math.min(y,zero),w,Math.abs(zero-y),col,`rx="5" ${attr(`${r.name}\n${year==='a'?2026:2027}년 ${money(r[year])}`)}`)+txt(center+dx+w/2,y+(r[year]<0?18:-10),compact(r[year]),'text-anchor="middle" class="value"');}
   out+=txt(center,292,r.name,'text-anchor="middle" class="strong"');
  });return svg('부문별 2026년과 2027년 예산 비교',out,315);
 }
 function donutChart(rows){
  const year=state.year,groups=C.group(rows.filter(r=>r[year]>0),'account'),total=groups.reduce((s,r)=>s+r[year],0),negative=rows.filter(r=>r[year]<0).reduce((s,r)=>s+r[year],0);
  if(!total)return empty('양수 예산이 없어 구성 비중을 표시하지 않습니다.');
  const cx=185,cy=154,radius=100,thick=37,circum=2*Math.PI*radius;let offset=0;
  let out=circle(cx,cy,radius,'none',`stroke="#f0f2f8" stroke-width="${thick}"`);
  groups.forEach((g,i)=>{const p=g[year]/total,len=p*circum;out+=circle(cx,cy,radius,'none',`stroke="${accountColors[g.name]||colors[i]}" stroke-width="${thick}" stroke-dasharray="${Math.max(0,len-3)} ${circum-Math.max(0,len-3)}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" ${attr(`${g.name}\n${money(g[year])}\n양수 합계의 ${(100*p).toFixed(1)}%`)}`);offset+=len;});
  out+=txt(cx,142,'양수 재원 합계','text-anchor="middle"')+txt(cx,178,compact(total),'text-anchor="middle" class="strong" style="font-size:28px"');
  groups.forEach((g,i)=>{const y=100+i*64;out+=rect(350,y-12,10,10,accountColors[g.name]||colors[i],'rx="3"')+txt(372,y-2,g.name,'class="value"')+txt(372,y+22,`${compact(g[year])}  ·  ${(100*g[year]/total).toFixed(1)}%`,'class="strong" style="font-size:17px"');});
  out+=line(350,260,640,260)+txt(350,285,'차감 항목 합계')+txt(640,285,compact(negative),'text-anchor="end" class="value"');
  return svg('회계별 양수 재원 구성과 차감 항목 합계',out,310);
 }
 function treemapChart(rows){
  const items=rows.filter(r=>r[state.year]>0).sort((a,b)=>b[state.year]-a[state.year]);if(!items.length)return empty('양수 예산이 없어 예산 지도를 표시하지 않습니다.');
  const width=1260,height=370;let out='';const total=items.reduce((s,r)=>s+r[state.year],0);
  function tile(list,x,y,w,h){
   if(list.length===1){const r=list[0],v=r[state.year],col=sectorColors[r.sector],pad=3;out+=rect(x+pad,y+pad,w-pad*2,h-pad*2,col,`rx="7" opacity="${.58+.42*Math.min(1,v/100000)}" ${attr(tip(r))}`);
    const max=Math.floor((w-20)/13);if(w>65&&h>38)out+=txt(x+13,y+25,short(C.name(r),Math.max(3,max)),`style="fill:white;font-size:14px;font-weight:bold;pointer-events:none"`);
    if(w>100&&h>67)out+=txt(x+13,y+49,compact(v),`style="fill:#ffffffdd;font-size:13px;pointer-events:none"`);
    if(w>140&&h>100)out+=txt(x+13,y+h-17,`${(100*v/total).toFixed(1)}%`, 'style="fill:#ffffffbb;font-size:12px;pointer-events:none"');return;}
   const sum=list.reduce((s,r)=>s+r[state.year],0);let accum=0,index=1;for(let i=0;i<list.length-1;i++){accum+=list[i][state.year];index=i+1;if(accum>=sum/2)break;}
   const ratio=accum/sum;
   if(w>=h){tile(list.slice(0,index),x,y,w*ratio,h);tile(list.slice(index),x+w*ratio,y,w*(1-ratio),h);}else{tile(list.slice(0,index),x,y,w,h*ratio);tile(list.slice(index),x,y+h*ratio,w,h*(1-ratio));}
  }
  tile(items,0,0,width,height);return svg('프로그램별 예산 비중 지도',out,height,width);
 }
 function rankChart(rows){
  const items=rows.filter(r=>r[state.year]>0).sort((a,b)=>b[state.year]-a[state.year]).slice(0,10);if(!items.length)return empty('양수 예산 항목이 없습니다.');
  const max=items[0][state.year],height=Math.max(220,items.length*36+30);let out='';
  items.forEach((r,i)=>{const y=24+i*36;out+=txt(10,y+5,String(i+1).padStart(2,'0'),'style="fill:#b5bdd0;font-size:10px"')+txt(38,y+5,short(C.name(r),15),'class="value"')+rect(230,y-10,320,16,'#f2f4fa','rx="5"')+rect(230,y-10,320*r[state.year]/max,16,sectorColors[r.sector],`rx="5" ${attr(tip(r))}`)+txt(665,y+4,num(r[state.year]),'text-anchor="end" class="value"');});
  return svg('예산 규모 상위 프로그램',out,height);
 }
 function dumbbellChart(rows){
  const items=rows.filter(r=>r.a>0&&r.b>0).sort((a,b)=>b.b-a.b).slice(0,8);if(!items.length)return empty('비교할 양수 예산 항목이 없습니다.');
  const max=Math.max(...items.flatMap(r=>[r.a,r.b]))*1.05, height=Math.max(220,items.length*42+55),left=235,right=555;let out='';
  for(let i=0;i<=3;i++){const x=left+(right-left)*i/3;out+=line(x,0,x,height-40)+txt(x,height-15,compact(max*i/3),'text-anchor="middle"');}
  items.forEach((r,i)=>{const y=22+i*42,x1=scale(r.a,0,max,left,right),x2=scale(r.b,0,max,left,right);out+=txt(5,y+5,short(C.name(r),18),'class="value"')+`<g ${attr(tip(r))}>`+line(x1,y,x2,y,'#f7b5d2','stroke-width="5"')+circle(x1,y,5,'#b6c3d6')+circle(x2,y,6,'#ee5e9a')+txt(665,y+5,num(r.b),'text-anchor="end" class="value"')+'</g>';});return svg('주요 프로그램 예산의 2026년과 2027년 변화',out,height);
 }
 function waterfallChart(rows){
  const s=C.summarize(rows);if(!rows.length)return empty();const groups=C.group(rows,'sector');let running=s.a;
  const steps=[{name:'2026년 합계',from:0,to:s.a,total:true}];groups.forEach(g=>{steps.push({name:g.name,from:running,to:running+g.delta,value:g.delta});running+=g.delta;});steps.push({name:'2027년 합계',from:0,to:s.b,total:true});
  const [lo,hi]=domain(steps.flatMap(r=>[r.from,r.to])),top=35,bottom=235,left=95,right=1210,width=1260;let out=yGrid(lo,hi,top,bottom,left,right),step=(right-left)/steps.length;
  steps.forEach((r,i)=>{const x=left+step*(i+.2),w=step*.6,y1=scale(r.from,lo,hi,bottom,top),y2=scale(r.to,lo,hi,bottom,top);const col=r.total?(i===0?'#b1a9ef':'#6558ee'):(r.value>=0?'#20b7ad':'#ee5e9a');out+=rect(x,Math.min(y1,y2),w,Math.max(Math.abs(y2-y1),2),col,`rx="4" ${attr(`${r.name}\n${r.total?money(r.to):signed(r.value)+'억 원'}`)}`)+txt(x+w/2,Math.min(y1,y2)-12,r.total?num(r.to):signed(r.value),'text-anchor="middle" class="strong"')+txt(x+w/2,270,r.name,'text-anchor="middle" class="value"');
   if(i<steps.length-1)out+=line(x+w,y2,x+step,y2,'#bfc7d8','stroke-dasharray="4 4"');});return svg('2026년에서 2027년으로의 부문별 증감 흐름',out,295,width);
 }
 function deltaChart(rows){
  const items=[...rows].sort((a,b)=>Math.abs(C.delta(b))-Math.abs(C.delta(a))).slice(0,10);if(!items.length)return empty();
  const max=Math.max(...items.map(r=>Math.abs(C.delta(r))),1),zero=430,span=170,height=Math.max(230,items.length*36+40);let out=line(zero,0,zero,height-25,'#dce2ed');
  items.forEach((r,i)=>{const y=24+i*36,d=C.delta(r),w=span*Math.abs(d)/max;out+=txt(5,y+4,short(C.name(r),18),'class="value"')+rect(d<0?zero-w:zero,y-11,w,18,d<0?'#f077a5':'#20b7ad',`rx="4" ${attr(tip(r))}`)+txt(675,y+4,signed(d),'text-anchor="end" class="value"');});
  return svg('절대 증감액 상위 프로그램의 증가와 감소',out,height);
 }
 function scatterChart(rows){
  const items=rows.filter(r=>r.a>0&&r.b>0);if(!items.length)return empty('양수 예산이 없어 성장률 분포를 표시하지 않습니다.');
  const width=680,left=70,right=640,top=25,bottom=290,maxX=Math.max(...items.map(r=>r.b),10),maxLog=Math.log10(maxX+1)*1.06;
  const rates=items.map(C.rate),lo=Math.min(0,...rates)-.08,hi=Math.max(.1,...rates)+.1;
  const x=v=>scale(Math.log10(v+1),0,maxLog,left,right),y=v=>scale(v,lo,hi,bottom,top);let out='';
  for(let i=0;i<=4;i++){const r=lo+(hi-lo)*i/4,py=y(r);out+=line(left,py,right,py)+txt(left-10,py+4,(r*100).toFixed(0)+'%','text-anchor="end"');}
  for(const v of [0,10,100,1000,10000,100000,1000000].filter(v=>v===0||Math.log10(v+1)<=maxLog)){out+=line(x(v),top,x(v),bottom)+txt(x(v),bottom+22,num(v),'text-anchor="middle"');}
  out+=line(left,y(0),right,y(0),'#b7c2d6','stroke-dasharray="4 4"');
  const maxD=Math.max(...items.map(r=>Math.abs(C.delta(r))),1);
  [...items].sort((a,b)=>Math.abs(C.delta(b))-Math.abs(C.delta(a))).forEach(r=>{const radius=5+Math.sqrt(Math.abs(C.delta(r))/maxD)*18;out+=circle(x(r.b),y(C.rate(r)),radius,sectorColors[r.sector],`fill-opacity=".65" stroke="white" stroke-width="2" ${attr(tip(r))}`);});
  out+=txt((left+right)/2,345,'2027년 예산 · 로그 눈금 (억 원)','text-anchor="middle" style="font-size:11px"');return svg('2027년 예산 규모와 증감률 분포. 예산 가로축은 로그 눈금.',out,360,width);
 }
 function heatmap(rows){
  if(!rows.length)return empty();
  return [...rows].sort((a,b)=>(C.rate(b)??-Infinity)-(C.rate(a)??-Infinity)).map(r=>{const rate=C.rate(r),strength=Math.min(1,Math.abs(rate??0)/.5),col=rate>=0?'#20b7ad':'#ee6f9f',tint=rate>=0?`rgba(32,183,173,${.08+strength*.18})`:`rgba(238,111,159,${.08+strength*.18})`;return `<div class="heat-tile" style="background:${tint};color:${col}" ${attr(tip(r))}><span>${esc(C.name(r))}</span><strong>${pct(rate)}</strong><small>${!r.program?'차감 항목 · ':''}${esc(r.sector)}</small></div>`;}).join('');
 }
 function sorted(rows){return [...rows].sort((a,b)=>{const key=state.sort,va=key==='delta'?C.delta(a):key==='rate'?C.rate(a):a[key],vb=key==='delta'?C.delta(b):key==='rate'?C.rate(b):b[key];return state.direction*(typeof va==='number'?va-vb:String(va??'').localeCompare(String(vb??''),'ko'));});}
 function table(rows){
  $('table-count').textContent=`선택한 항목 ${rows.length}개`;
  $('table-body').innerHTML=sorted(rows).map(r=>`<tr class="${!r.program?'deduction':''}"><td class="sector"><span style="--accent:${sectorColors[r.sector]};--tint:${sectorColors[r.sector]}15">${esc(r.sector)}</span></td><td>${esc(r.account)}</td><td>${esc(r.group)||'<span class="muted">—</span>'}</td><td class="program">${esc(r.program)||'<span class="muted">차감 항목</span>'}</td><td class="num">${num(r.a)}</td><td class="num">${num(r.b)}</td><td class="num ${C.delta(r)>=0?'positive':'negative'}">${signed(C.delta(r))}</td><td class="num ${C.rate(r)>=0?'positive':'negative'}">${pct(C.rate(r))}</td></tr>`).join('')||'<tr><td colspan="8" style="text-align:center;padding:50px">조건에 맞는 데이터가 없습니다.</td></tr>';
  const s=C.summarize(rows);$('table-foot').innerHTML=`<tr><td colspan="4">선택 항목 합계 (억 원)</td><td class="num">${num(s.a)}</td><td class="num">${num(s.b)}</td><td class="num">${signed(s.delta)}</td><td class="num">${pct(s.rate)}</td></tr>`;
  document.querySelectorAll('[data-sort]').forEach(b=>{b.removeAttribute('data-direction');b.closest('th').removeAttribute('aria-sort');if(b.dataset.sort===state.sort){b.dataset.direction=state.direction===1?'asc':'desc';b.closest('th').setAttribute('aria-sort',state.direction===1?'ascending':'descending');}});
 }
 function render(){
  visible=C.filter(all,state.sector,state.account,state.query);kpis(visible);
  const charts={'sector-chart':sectorChart,'donut-chart':donutChart,'treemap-chart':treemapChart,'ranking-chart':rankChart,'dumbbell-chart':dumbbellChart,'waterfall-chart':waterfallChart,'delta-chart':deltaChart,'scatter-chart':scatterChart,'heatmap-chart':heatmap};
  Object.entries(charts).forEach(([id,fn])=>{$(id).innerHTML=fn(visible);});table(visible);
  document.querySelectorAll('.year-label').forEach(el=>el.textContent=state.year==='a'?'2026':'2027');
  document.querySelectorAll('[data-year]').forEach(b=>{const selected=b.dataset.year===state.year;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  $('download').disabled=visible.length===0;
 }
 function download(){
  const q=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  const rows=[['부문','회계구분','구분','프로그램명','2026년(억 원)','2027년(억 원)','증감(억 원)','증감률(%)'],...sorted(visible).map(r=>[r.sector,r.account,r.group,r.program,r.a,r.b,C.delta(r),C.rate(r)===null?'':(C.rate(r)*100).toFixed(4)])];
  const blob=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='국방예산_선택데이터.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 options();
 $('sector').addEventListener('change',e=>{state.sector=e.target.value;accounts();render();});
 $('account').addEventListener('change',e=>{state.account=e.target.value;render();});
 $('search').addEventListener('input',e=>{state.query=e.target.value;render();});
 $('reset').addEventListener('click',()=>{state.sector='';state.account='';state.query='';$('sector').value='';$('search').value='';accounts();render();});
 $('download').addEventListener('click',download);
 document.querySelectorAll('[data-year]').forEach(b=>b.addEventListener('click',()=>{state.year=b.dataset.year;render();}));
 document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.sort;state.direction=state.sort===key?-state.direction:(['a','b','delta','rate'].includes(key)?-1:1);state.sort=key;table(visible);}));
 const tooltip=$('tooltip');
 document.addEventListener('pointermove',e=>{const target=e.target.closest('[data-tip]');if(!target){tooltip.hidden=true;return;}tooltip.textContent=target.dataset.tip;tooltip.hidden=false;tooltip.style.left=Math.max(8,Math.min(e.clientX+16,window.innerWidth-tooltip.offsetWidth-12))+'px';tooltip.style.top=Math.max(8,Math.min(e.clientY+16,window.innerHeight-tooltip.offsetHeight-12))+'px';});
 document.addEventListener('pointerout',e=>{if(!e.relatedTarget||!e.relatedTarget.closest('[data-tip]'))tooltip.hidden=true;});
 window.addEventListener('scroll',()=>tooltip.hidden=true,{passive:true});
 document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('nav a').forEach(b=>b.classList.toggle('active',a===b));}));
 document.querySelectorAll('.sector-legend').forEach(el=>el.innerHTML=Object.entries(sectorColors).map(([n,c])=>`<span><i style="background:${c}"></i>${n}</span>`).join(''));
 render();
})();
