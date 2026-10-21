'use strict';
const $=id=>document.getElementById(id),C=JSON.parse($('tool-config').textContent),E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let valid=false;
function values(){const d={};for(const v of C.fields){const el=$(v[0]);d[v[0]]=v[5]==='text'?el.value:Number(el.value===''?NaN:el.value);}return d;}
function fill(d){for(const v of C.fields)if(Object.hasOwn(d,v[0]))$(v[0]).value=d[v[0]];}
function run(){try{const d=values(),r=ToolMath[C.kind](d);$('metrics').innerHTML=r.metrics.map(([label,v])=>`<div><strong>${E(v)}</strong><span>${E(label)}</span></div>`).join('');$('head-row').innerHTML=r.headers.map(h=>`<th scope="col">${E(h)}</th>`).join('');$('body-rows').innerHTML=r.rows.map(row=>'<tr>'+row.map((v,i)=>i===0?`<th scope="row">${E(v)}</th>`:`<td>${E(v)}</td>`).join('')+'</tr>').join('');$('note').textContent=r.note;$('result').hidden=false;$('error').hidden=true;valid=true;$('status').textContent='Resultado actualizado. '+r.metrics.map(([a,b])=>a+': '+b).join('. ');
 }catch(err){valid=false;$('error').textContent=err.message;$('error').hidden=false;$('result').hidden=true;$('status').textContent='Revisa las entradas.';}
 for(const id of ['print','copy','share'])if($(id))$(id).disabled=!valid;
}
try{if(C.kind!=='prompts'){let raw=new URL(location.href).searchParams.get('datos');if(raw&&raw.length<5000){let d=JSON.parse(raw);fill(d);}}}catch{$('feedback').textContent='No se pudo leer el enlace. Revisa las entradas.';}
$('form').addEventListener('input',run);$('form').addEventListener('change',run);$('form').addEventListener('submit',e=>{e.preventDefault();run();});
$('reset').addEventListener('click',()=>{fill(Object.fromEntries(C.fields.map(v=>[v[0],v[2]])));run();$('feedback').textContent='Ejemplo recuperado.';});
$('print').addEventListener('click',()=>{if(valid)window.print();});
async function copy(text){try{await navigator.clipboard.writeText(text);$('feedback').textContent='Copiado al portapapeles.';}catch{$('copy-field').hidden=false;$('copy-field').value=text;$('copy-field').select();$('feedback').textContent='Selecciona y copia el contenido del campo.';}}
$('copy').addEventListener('click',()=>{if(valid)copy(C.name+'\n'+$('result').innerText);});
if($('share'))$('share').addEventListener('click',()=>{if(!valid)return;const u=new URL(location.href);u.search='';u.searchParams.set('datos',JSON.stringify(values()));copy(u.href);});
run();
