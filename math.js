(function(root){'use strict';
const num=(v,a,b,label)=>{if(!Number.isFinite(v)||v<a||v>b)throw Error('Revisa '+label+'.');return v;};
const int=(v,a,b,label)=>{num(v,a,b,label);if(!Number.isInteger(v))throw Error(label+': utiliza un entero.');return v;};
const f=(n,d=2)=>new Intl.NumberFormat('es',{maximumFractionDigits:d}).format(n);
const time=s=>{s=Math.round(s);return (s>=3600?Math.floor(s/3600)+':':'')+String(Math.floor(s/60)%60).padStart(s>=3600?2:1,'0')+':'+String(s%60).padStart(2,'0');};
function league(d){
 int(d.players,2,24,'Participantes');int(d.courts,1,12,'Pistas');num(d.minutes,1,240,'Minutos por partido');num(d.break,0,60,'Pausa');
 const list=Array.from({length:d.players+(d.players%2)},(_,i)=>i<d.players?i+1:0),rounds=[],rows=[];let slot=0;
 for(let r=0;r<list.length-1;r++){
  const games=[],bye=[];for(let i=0;i<list.length/2;i++){let a=list[i],b=list[list.length-1-i];if(!a||!b)bye.push(a||b);else games.push([a,b]);}
  rounds.push({games,bye});for(let i=0;i<games.length;i+=d.courts){for(let j=0;j<d.courts&&i+j<games.length;j++){const [a,b]=games[i+j];rows.push([r+1,slot+1,j+1,'P'+a+' — P'+b,time(slot*(d.minutes+d.break)*60)]);}slot++;}
  list.splice(1,0,list.pop());
 }
 return {metrics:[['Partidos',d.players*(d.players-1)/2],['Rondas',rounds.length],['Duración',time((slot*d.minutes+Math.max(0,slot-1)*d.break)*60)]],headers:['Ronda','Turno','Pista','Partido','Inicio desde 0'],rows,note:'Cada pareja se enfrenta una vez. Los partidos de una ronda se dividen en turnos si faltan pistas. No optimiza descansos entre rondas. '+rounds.map((r,i)=>r.bye.length?'Ronda '+(i+1)+': descansa P'+r.bye[0]+'.':'').filter(Boolean).join(' '),rounds,slots:slot};
}
function swim(d){
 num(d.distance,25,10000,'Distancia');num(d.pool,10,100,'Largo de piscina');num(d.seconds,10,36000,'Tiempo objetivo');num(d.change,-50,50,'Cambio de segunda mitad');
 const lengths=d.distance/d.pool;if(Math.abs(lengths-Math.round(lengths))>1e-8)throw Error('La distancia debe contener largos completos.');
 if(lengths>400)throw Error('Utiliza como máximo 400 largos.');
 const n=Math.round(lengths);if(d.change!==0&&n%2)throw Error('Para repartir dos mitades utiliza un número par de largos.');
 const first=d.seconds/2-d.change/2,second=d.seconds/2+d.change/2;if(first<=0||second<=0)throw Error('El cambio de ritmo no cabe en el tiempo objetivo.');
 let total=0;const rows=[];for(let i=1;i<=n;i++){const sec=d.change===0?d.seconds/n:(i<=n/2?first:second)/(n/2);total+=sec;rows.push([i,f(i*d.pool)+' m',time(sec),time(total)]);}
 return {metrics:[['Ritmo /100m',time(d.seconds/d.distance*100)],['Largos',n],['Tiempo objetivo',time(d.seconds)]],headers:['Largo','Distancia','Parcial','Acumulado'],rows,note:'Cambio positivo: la segunda mitad tarda más. Negativo: tarda menos. Son parciales aritméticos, sin predecir efectos de virajes ni prescribir un entrenamiento. Los tiempos visibles se redondean; el acumulado usa precisión interna.',total};
}
function rotation(d){
 int(d.players,2,30,'Jugadores');int(d.active,1,d.players,'Jugadores simultáneos');int(d.segments,1,60,'Tramos');num(d.minutes,1,60,'Minutos por tramo');
 const counts=Array(d.players).fill(0),rows=[];for(let s=0;s<d.segments;s++){let on=[];for(let j=0;j<d.active;j++){let id=(s*d.active+j)%d.players;on.push(id+1);counts[id]++;}const off=counts.map((_,i)=>i+1).filter(i=>!on.includes(i));rows.push([s+1,time(s*d.minutes*60)+' – '+time((s+1)*d.minutes*60),on.map(i=>'P'+i).join(', '),off.map(i=>'P'+i).join(', ')||'—']);}
 return {metrics:[['Duración',f(d.segments*d.minutes)+' min'],['Máxima diferencia',f((Math.max(...counts)-Math.min(...counts))*d.minutes)+' min'],['Jugadores',d.players]],headers:['Tramo','Tiempo','Juegan','Descansan'],rows,note:'Rotación cíclica por orden P1, P2… No distingue puestos ni porteros. Resumen: '+counts.map((c,i)=>'P'+(i+1)+': '+f(c*d.minutes)+' min').join(' · '),counts};
}
function rag(d){
 int(d.documents,1,1000000,'Documentos');int(d.tokens,1,10000000,'Tokens por documento');int(d.chunk,1,100000,'Tamaño de fragmento');int(d.overlap,0,d.chunk-1,'Solapamiento');int(d.window,1,10000000,'Ventana');int(d.fixed,0,d.window,'Instrucciones e historial');int(d.output,0,d.window,'Salida reservada');int(d.topk,0,10000,'Fragmentos recuperados');int(d.dim,1,65536,'Dimensión');
 const per=d.tokens<=d.chunk?1:1+Math.ceil((d.tokens-d.chunk)/(d.chunk-d.overlap));const chunks=per*d.documents;
 const embed=d.documents*(d.tokens+Math.max(0,per-1)*d.overlap),retrieval=d.topk*d.chunk,free=d.window-d.fixed-d.output-retrieval;
 return {metrics:[['Fragmentos',f(chunks,0)],['Tokens a vectorizar',f(embed,0)],['Margen de contexto',f(free,0)+' tokens']],headers:['Parte','Tokens / volumen'],rows:[['Corpus original',f(d.documents*d.tokens,0)+' tokens'],['Fragmentos por documento',f(per,0)],['Contenido recuperado (máximo)',f(retrieval,0)+' tokens'],['Instrucciones e historial',f(d.fixed,0)+' tokens'],['Reserva de salida',f(d.output,0)+' tokens'],['Vectores float32 sin índice',f(chunks*d.dim*4/2**30,3)+' GiB'],['Estado del presupuesto',free>=0?'Cabe con estas cifras':'Supera la ventana: reduce contenido o reserva']],note:'Modelo de documentos del mismo tamaño, división fija por tokens y solapamiento exacto. No tokeniza texto, no elige un tamaño óptimo y no estima RAM de un índice. El contexto recuperado usa fragmentos completos como cota; las colas pueden ser menores.',per,chunks,embed,free};
}
function memory(d){
 num(d.params,.001,1000,'Parámetros (miles de millones)');num(d.bits,1,64,'Bits por peso');int(d.layers,1,512,'Capas');int(d.heads,1,512,'Cabezas KV');int(d.headDim,1,1024,'Dimensión de cabeza');int(d.context,1,10000000,'Tokens de contexto');int(d.batch,1,1024,'Secuencias');num(d.kvBytes,.5,8,'Bytes de KV');num(d.overhead,0,1000,'Memoria adicional');
 const weights=d.params*1e9*d.bits/8/2**30,kv=2*d.layers*d.heads*d.headDim*d.context*d.batch*d.kvBytes/2**30;
 return {metrics:[['Pesos teóricos',f(weights,3)+' GiB'],['Caché KV',f(kv,3)+' GiB'],['Suma con reserva',f(weights+kv+d.overhead,3)+' GiB']],headers:['Contexto por secuencia','Caché KV','Total con reserva'],rows:[.25,.5,1,2].map(scale=>{let c=Math.max(1,Math.round(d.context*scale)),v=kv*c/d.context;return [f(c,0)+' tokens',f(v,3)+' GiB',f(weights+v+d.overhead,3)+' GiB'];}),note:'Estimación para atención estándar con caché densa sin ventana deslizante ni MLA. Usa cabezas KV, no necesariamente todas las cabezas de atención. Los pesos reales añaden escalas/metadatos de cuantización; la reserva es manual. No confirma que un modelo quepa ni funcione en tu GPU.',weights,kv};
}
function prompts(d){
 const a=String(d.before??''),b=String(d.after??'');if(a.length>20000||b.length>20000)throw Error('Máximo 20.000 caracteres por versión.');let x=a.split(/\r?\n/),y=b.split(/\r?\n/);if(x.length>250||y.length>250)throw Error('Máximo 250 líneas por versión.');
 const dp=Array.from({length:x.length+1},()=>new Uint16Array(y.length+1));for(let i=x.length-1;i>=0;i--)for(let j=y.length-1;j>=0;j--)dp[i][j]=x[i]===y[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,added=0,removed=0,rows=[];while(i<x.length||j<y.length){if(i<x.length&&j<y.length&&x[i]===y[j]){rows.push(['Igual',i+1,j+1,x[i]]);i++;j++;}else if(j<y.length&&(i===x.length||dp[i][j+1]>=dp[i+1][j])){rows.push(['Añadida','—',j+1,y[j++]]);added++;}else{rows.push(['Quitada',i+1,'—',x[i++]]);removed++;}}
 return {metrics:[['Líneas añadidas',added],['Líneas quitadas',removed],['Cambio de caracteres',b.length-a.length]],headers:['Cambio','Antes','Después','Texto literal'],rows,note:'Comparación literal por líneas; los espacios cuentan. No evalúa la calidad del prompt ni predice respuestas de un modelo. El texto se procesa localmente, sin API de IA ni almacenamiento propio.',added,removed};
}
function dice(d){
 int(d.count,1,12,'Dados');int(d.sides,2,20,'Caras');int(d.target,-1000,1000,'Objetivo');num(d.mod,-100,100,'Modificador');if(!Number.isInteger(d.mod))throw Error('El modificador debe ser entero.');
 let dist=[1n];for(let n=0;n<d.count;n++){let next=Array(dist.length+d.sides).fill(0n);dist.forEach((v,i)=>{for(let face=1;face<=d.sides;face++)next[i+face]+=v;});dist=next;}
 const total=BigInt(d.sides)**BigInt(d.count),percent=v=>f(Number(v)/Number(total)*100,4)+' %';let eq=0n,ge=0n,le=0n;
 const rows=[];dist.forEach((v,s)=>{if(v){const z=s+d.mod;if(z===d.target)eq+=v;if(z>=d.target)ge+=v;if(z<=d.target)le+=v;rows.push([z,percent(v),v.toString()]);}});
 return {metrics:[['Exactamente '+d.target,percent(eq)],['Al menos '+d.target,percent(ge)],['Como máximo '+d.target,percent(le)]],headers:['Suma con modificador','Probabilidad','Casos favorables'],rows,note:'Dados justos, independientes, numerados desde 1. Recuento entero exacto; porcentajes redondeados. Un modificador se suma una vez al total, no a cada dado. Sin ventaja, explosiones ni reglas especiales.',dist,total,eq,ge,le};
}
function choose(n,k){if(k<0||k>n)return 0n;k=Math.min(k,n-k);let v=1n;for(let i=1;i<=k;i++)v=v*BigInt(n-k+i)/BigInt(i);return v;}
function hand(d){
 int(d.deck,2,300,'Cartas del mazo');int(d.copies,0,d.deck,'Copias útiles');int(d.hand,0,d.deck,'Mano inicial');int(d.draws,0,d.deck-d.hand,'Robos extra');int(d.need,0,d.copies,'Copias mínimas');
 const n=d.hand+d.draws,total=choose(d.deck,n),rows=[];let good=0n;for(let k=0;k<=Math.min(n,d.copies);k++){let v=choose(d.copies,k)*choose(d.deck-d.copies,n-k);if(k>=d.need)good+=v;rows.push([k,f(Number(v)/Number(total)*100,4)+' %']);}
 return {metrics:[['Al menos '+d.need+' copias',f(Number(good)/Number(total)*100,4)+' %'],['Cartas vistas',n],['Copias esperadas',f(n*d.copies/d.deck,3)]],headers:['Copias útiles vistas','Probabilidad'],rows,note:'Muestreo uniforme sin reemplazo. Agrupa mano inicial y robos adicionales; no modela mulligans, cartas buscadoras ni decisiones de juego. Las copias útiles deben pertenecer a una única categoría sin doble conteo.',good,total,n};
}
function chunks(d){
 for(const k of ['x1','x2','z1','z2'])int(d[k],-30000000,30000000,'Coordenadas');
 const xlo=Math.min(d.x1,d.x2),xhi=Math.max(d.x1,d.x2),zlo=Math.min(d.z1,d.z2),zhi=Math.max(d.z1,d.z2),cx1=Math.floor(xlo/16),cx2=Math.floor(xhi/16),cz1=Math.floor(zlo/16),cz2=Math.floor(zhi/16),count=(cx2-cx1+1)*(cz2-cz1+1),rows=[];
 if(count<=400){for(let z=cz1;z<=cz2;z++)for(let x=cx1;x<=cx2;x++)rows.push([x,z,x*16+' a '+(x*16+15),z*16+' a '+(z*16+15)]);}else rows.push(['—','—','El detalle se limita a 400 chunks','Reduce el rectángulo para verlo']);
 return {metrics:[['Chunks intersectados',f(count,0)],['Bloques en rectángulo',f((xhi-xlo+1)*(zhi-zlo+1),0)],['Primer chunk X/Z',cx1+' / '+cz1]],headers:['Chunk X','Chunk Z','Bloques X','Bloques Z'],rows,note:'Extremos inclusivos. X y Z son horizontales. Cada chunk mide 16×16 bloques; las coordenadas negativas se redondean hacia menos infinito. No calcula chunks cargados, aparición de criaturas ni biomas.',cx1,cx2,cz1,cz2,count};
}
function fov(d){
 num(d.diagonal,5,150,'Diagonal');num(d.ratioW,1,100,'Proporción horizontal');num(d.ratioH,1,100,'Proporción vertical');num(d.distance,5,500,'Distancia');num(d.target,5,150,'FOV deseado');
 const diag=d.diagonal*2.54,w=diag*d.ratioW/Math.hypot(d.ratioW,d.ratioH),h=diag*d.ratioH/Math.hypot(d.ratioW,d.ratioH),deg=v=>v*180/Math.PI;
 const horizontal=deg(2*Math.atan(w/(2*d.distance))),vertical=deg(2*Math.atan(h/(2*d.distance))),targetDistance=w/(2*Math.tan(d.target*Math.PI/360));
 return {metrics:[['FOV horizontal',f(horizontal)+'°'],['FOV vertical',f(vertical)+'°'],['Para FOV '+d.target+'°',f(targetDistance)+' cm']],headers:['Distancia de ojos','Horizontal','Vertical'],rows:[.75,1,1.25,1.5].map(scale=>{let dis=d.distance*scale;return [f(dis)+' cm',f(deg(2*Math.atan(w/(2*dis))))+'°',f(deg(2*Math.atan(h/(2*dis))))+'°'];}),note:'Geometría de una sola pantalla plana centrada frente a los ojos. Diagonal visible y proporción real. No modela pantallas curvas, triples, biseles ni ajustes específicos de cada juego. El juego puede pedir FOV horizontal, vertical o una escala distinta.',w,h,horizontal,vertical,targetDistance};
}
const api={league,swim,rotation,rag,memory,prompts,dice,hand,chunks,fov,choose};if(typeof module!=='undefined')module.exports=api;else root.ToolMath=api;
})(typeof window!=='undefined'?window:globalThis);
