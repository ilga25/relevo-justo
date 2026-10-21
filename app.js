'use strict';
const $=id=>document.getElementById(id),C=JSON.parse($('tool-config').textContent),E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let valid=false;
function values(){const d={};for(const v of C.fields){const el=$(v[0]);d[v[0]]=v[5]==='text'?el.value:Number(el.value===''?NaN:el.value);}return d;}
function fill(d){for(const v of C.fields)if(Object.hasOwn(d,v[0]))$(v[0]).value=d[v[0]];}
function run(){try{const d=values(),r=ToolMath[C.kind](d);$('metrics').innerHTML=r.metrics.map(([label,v])=>`<div><strong>${E(v)}</strong><span>${E(label)}</span></div>`).join('');$('head-row').innerHTML=r.headers.map(h=>`<th scope="col">${E(h)}</th>`).join('');$('body-rows').innerHTML=r.rows.map(row=>'<tr>'+row.map((v,i)=>i===0?`<th scope="row">${E(v)}</th>`:`<td>${E(v)}</td>`).join('')+'</tr>').join('');$('note').textContent=r.note;renderVisualization(r,d);$('result').hidden=false;$('error').hidden=true;valid=true;$('status').textContent='Resultado actualizado. '+r.metrics.map(([a,b])=>a+': '+b).join('. ');
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



// VISUALIZACION PROPIA
function renderVisualization(r,d){
 const box=document.getElementById('feature-viz');if(!box)return;
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pretty=n=>new Intl.NumberFormat('es',{maximumFractionDigits:2}).format(n);
 const bars=(parts,total)=>'<div class="stack" aria-hidden="true">'+parts.map(([name,value,color])=>'<i style="width:'+Math.max(0,Math.min(100,value/Math.max(total,1e-9)*100))+'%;background:'+color+'"></i>').join('')+'</div><div class="viz-key">'+parts.map(([name,value,color])=>'<span><i style="background:'+color+'"></i>'+safe(name)+' <b>'+pretty(value)+'</b></span>').join('')+'</div>';
 if(C.kind==='league')box.innerHTML='<p class="viz-title">EL CALENDARIO DE UN VISTAZO</p><div class="round-path">'+r.rounds.map((q,i)=>'<span><b>R'+(i+1)+'</b>'+q.games.length+' partidos'+(q.bye.length?' · descansa P'+q.bye[0]:'')+'</span>').join('')+'</div>';
 else if(C.kind==='swim')box.innerHTML='<p class="viz-title">TU PISCINA, EN LARGOS</p><div class="pool-lanes">'+r.rows.slice(0,Math.min(16,r.rows.length)).map(row=>'<span><b>'+row[0]+'</b><em>'+safe(row[3])+'</em></span>').join('')+'</div><p class="viz-caption">Acumulados de los primeros '+Math.min(16,r.rows.length)+' largos. El listado completo está debajo.</p>';
 else if(C.kind==='rotation'){const max=Math.max(...r.counts);box.innerHTML='<p class="viz-title">MINUTOS POR PARTICIPANTE</p><div class="minute-bars">'+r.counts.map((n,i)=>'<div><span>P'+(i+1)+'</span><i style="--fill:'+n/Math.max(max,1)*100+'%"></i><b>'+pretty(n*d.minutes)+'′</b></div>').join('')+'</div>';}
 else if(C.kind==='rag')box.innerHTML='<p class="viz-title">REPARTO DE LA VENTANA · TOKENS</p>'+bars([['Base',d.fixed,'#7d6bd5'],['Recuperación',d.topk*d.chunk,'#9bc54d'],['Salida',d.output,'#e3ad62'],['Libre',Math.max(0,r.free),'#dce3ee']],d.window)+(r.free<0?'<p class="viz-caption">El conjunto supera la ventana. Revisa el margen negativo.</p>':'');
 else if(C.kind==='memory')box.innerHTML='<p class="viz-title">EL MAPA DE MEMORIA · GiB</p>'+bars([['Pesos',r.weights,'#43dfc6'],['Caché KV',r.kv,'#8b7bff'],['Reserva',d.overhead,'#e4b46c']],r.weights+r.kv+d.overhead);
 else if(C.kind==='prompts'){box.innerHTML='<div class="editor-legend"><span>− Líneas quitadas</span><span>+ Líneas añadidas</span><span>= Texto conservado</span></div>';document.querySelectorAll('#body-rows tr').forEach((tr,i)=>{tr.dataset.change=r.rows[i][0];});}
 else if(C.kind==='dice'||C.kind==='hand'){
  const rows=r.rows.map(row=>({label:row[0],p:parseFloat(String(row[1]).replace(',','.'))}));const best=[...rows].sort((a,b)=>b.p-a.p).slice(0,6);box.innerHTML='<p class="viz-title">'+(C.kind==='dice'?'LAS SUMAS MÁS PROBABLES':'DISTRIBUCIÓN DE COPIAS VISTAS')+'</p><div class="chance-bars">'+best.map(x=>'<div><b>'+safe(x.label)+'</b><i style="--fill:'+Math.max(0,Math.min(100,x.p))+'%"></i><span>'+pretty(x.p)+' %</span></div>').join('')+'</div>';
 }
 else if(C.kind==='chunks'){
  let w=r.cx2-r.cx1+1,h=r.cz2-r.cz1+1;
  if(w<=16&&h<=16){let cells='';for(let z=r.cz1;z<=r.cz2;z++)for(let x=r.cx1;x<=r.cx2;x++)cells+='<g><rect x="'+((x-r.cx1)*50)+'" y="'+((z-r.cz1)*50)+'" width="48" height="48" fill="'+((x+z)%2?'#234d3b':'#345b43')+'"/><text x="'+((x-r.cx1)*50+24)+'" y="'+((z-r.cz1)*50+28)+'" text-anchor="middle" fill="#dafaac" font-size="10">'+x+','+z+'</text></g>';box.innerHTML='<p class="viz-title">CUADRÍCULA DE CHUNKS · X,Z</p><svg role="img" aria-label="Chunks intersectados, coordenadas X y Z en cada celda" viewBox="0 0 '+(w*50)+' '+(h*50)+'">'+cells+'</svg><p class="viz-caption">X aumenta a la derecha; Z, hacia abajo. Cada celda es un chunk completo.</p>';}else box.innerHTML='<p class="viz-caption">La cuadrícula se muestra hasta 16 × 16 chunks. El recuento completo sigue disponible.</p>';
 }
 else if(C.kind==='fov'){
  let scale=230/Math.max(d.distance,r.w,1),half=r.w*scale/2,screenY=35,eyeY=35+d.distance*scale;
  box.innerHTML='<p class="viz-title">VISTA SUPERIOR · UNA PANTALLA PLANA</p><svg role="img" aria-label="Triángulo visual entre los ojos y los extremos de la pantalla" viewBox="0 0 400 310"><path d="M200 '+eyeY+'L'+(200-half)+' '+screenY+'H'+(200+half)+'Z" fill="#e6924930" stroke="#e69249" stroke-width="2"/><path d="M'+(200-half)+' '+screenY+'H'+(200+half)+'" stroke="#f6d4ab" stroke-width="8"/><circle cx="200" cy="'+eyeY+'" r="6" fill="#f6d4ab"/><text x="200" y="20" text-anchor="middle" fill="currentColor" font-size="13">Pantalla: '+pretty(r.w)+' cm de ancho</text><text x="200" y="'+(eyeY+25)+'" text-anchor="middle" fill="currentColor" font-size="14">Ojos · '+pretty(r.horizontal)+'° horizontales</text></svg>';
 }
}
