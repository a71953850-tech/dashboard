(function(root){
 'use strict';
 const name=r=>r.program||r.account;
 const delta=r=>r.b-r.a;
 const rate=r=>r.a===0?null:delta(r)/r.a;
 function filter(rows,sector='',account='',query=''){
  const q=query.trim().toLocaleLowerCase();
  return rows.filter(r=>(!sector||r.sector===sector)&&(!account||r.account===account)&&(!q||[r.program,r.group,r.account,r.sector].join(' ').toLocaleLowerCase().includes(q)));
 }
 function summarize(rows){
  const a=rows.reduce((s,r)=>s+r.a,0), b=rows.reduce((s,r)=>s+r.b,0);
  return {a,b,delta:b-a,rate:a===0?null:(b-a)/a,count:rows.length};
 }
 function group(rows,key){
  const groups=new Map();
  for(const r of rows){const k=r[key]||name(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
  return [...groups].map(([name,items])=>({name,...summarize(items),items}));
 }
 const api={name,delta,rate,filter,summarize,group};
 root.BudgetCore=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
