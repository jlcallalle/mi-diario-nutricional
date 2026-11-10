<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import {Leaf, LayoutGrid, CalendarDays, Apple, Settings, Plus, ChevronLeft, ChevronRight, ChevronDown, Droplets, Sun, Sunset, Moon, Coffee, Search, Star, X, Pencil, Trash2, Copy, Download, ArrowUpRight, SlidersHorizontal, MapPin, Salad, Menu} from 'lucide-vue-next'
import {catalog,icons} from './catalog'
import {activities,display,emptyDay,fmt,goalLabel,goalStatus,groups,key,limaDate,load,meals,nutrients,portionValue,recipeValues,referenceGoal,referenceUrl,shift,total,weekly} from './nutrition'
import type {Day, Entry, Food, Goal, Portion, Values} from './nutrition'
const db=ref(load(localStorage))
const message=ref('')
watch(db, value=>{
 try {localStorage.setItem(key,JSON.stringify(value))} catch {message.value='No se pudieron guardar los cambios en este navegador.'}
},{deep:true,flush:'sync'})
const tabs=[{name:'Hoy',icon:LayoutGrid},{name:'Historial',icon:CalendarDays},{name:'Alimentos',icon:Apple},{name:'Ajustes',icon:Settings}]
const tab=ref('Hoy')
const today=ref(limaDate())
const date=ref(today.value)
const timer=window.setInterval(()=>{const current=limaDate();if(current!==today.value){if(date.value===today.value)date.value=current;today.value=current}},15000)
onUnmounted(()=>window.clearInterval(timer))
const day=computed(()=>db.value.days[date.value]??emptyDay())
function changeDay(update:(d:Day)=>void){
 const d=db.value.days[date.value]??emptyDay()
 update(d)
 db.value.days[date.value]=d
}
const foods=computed(()=>[...catalog,...db.value.foods])
const normalize=(s:string)=>s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'')
const query=ref('')
const favoritesOnly=ref(false)
const filtered=computed(()=>foods.value.filter(f=>(!favoritesOnly.value||db.value.favorites.includes(f.id))&&normalize(f.name+' '+f.category).includes(normalize(query.value))))
function favorite(id:string){db.value.favorites=db.value.favorites.includes(id)?db.value.favorites.filter(x=>x!==id):[...db.value.favorites,id]}
const ordered=computed(()=>[...db.value.order.map(k=>nutrients.find(n=>n[0]===k)!).filter(Boolean),...nutrients.filter(n=>!db.value.order.includes(n[0]))])
const summaries=computed(()=>Object.fromEntries(nutrients.map(([k])=>[k,total(day.value.entries,k)])))
const goal=(k:string)=>db.value.goals[k]??(db.value.reference?referenceGoal(k):undefined)
const more=ref(false)
const dateLabel=(d:string,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat('es-PE',{...options,timeZone:'America/Lima'}).format(new Date(d+'T12:00:00Z'))
const heading=computed(()=>dateLabel(date.value,{weekday:'long',day:'numeric',month:'long'}))
const mealIcons=[Sun,Sunset,Moon,Coffee]
const water=ref<number|null>(null)
function addWater(amount:number|null){
 if(amount&&amount>0&&Number.isFinite(amount)){changeDay(d=>d.water+=amount);water.value=null}
}
const dialog=ref<HTMLDialogElement>()
const mode=ref('')
watch(mode, m=>{if(m&&!dialog.value?.open)dialog.value?.showModal();else if(!m)dialog.value?.close()},{flush:'post'})
onMounted(()=>{if(mode.value)dialog.value?.showModal()})
function close(){mode.value=''}
const meal=ref(meals[0])
const selected=ref<Food>()
const amount=ref<number>(100)
const unit=ref('g')
const editing=ref('')
const picker=ref('')
const pickResults=computed(()=>foods.value.filter(f=>normalize(f.name).includes(normalize(picker.value))).sort((a,b)=>Number(db.value.favorites.includes(b.id))-Number(db.value.favorites.includes(a.id))))
const unitOptions=(f:Food)=>[f.base,...Object.keys(f.units).filter(u=>u!==f.base)]
function choose(f:Food){selected.value=f;unit.value=f.category==='Recetas'?'porciones':f.base;amount.value=f.category==='Recetas'?1:100}
function openPortion(m:string,food?:Food,entry?:Entry){
 meal.value=m;editing.value=entry?.id??'';selected.value=undefined;picker.value=''
 if(food)choose(food)
 if(entry){amount.value=entry.amount;unit.value=entry.unit}
 mode.value='portion'
}
const portion=computed<Portion|undefined>(()=>selected.value&&amount.value>0?{food:selected.value,amount:amount.value,unit:unit.value}:undefined)
function savePortion(){
 if(!portion.value)return
 const entry={...portion.value,id:editing.value||crypto.randomUUID(),meal:meal.value}
 changeDay(d=>d.entries=editing.value?d.entries.map(e=>e.id===editing.value?entry:e):[...d.entries,entry])
 tab.value='Hoy';close()
}
function removeEntry(id:string){changeDay(d=>d.entries=d.entries.filter(e=>e.id!==id));close()}
const past=computed(()=>Object.entries(db.value.days).filter(([d])=>d<date.value).sort(([a],[b])=>b.localeCompare(a)).flatMap(([date,d])=>d.entries.map(e=>({date,e}))))
const metric=ref(nutrients[0])
const contributions=computed(()=>day.value.entries.map(e=>({e,value:portionValue(e,metric.value[0])})).filter(x=>x.value!==undefined).sort((a,b)=>b.value!-a.value!))
function openMetric(n:string[]){metric.value=n;mode.value='metric'}
const blankFood=()=>({name:'',state:'',base:'g' as 'g'|'ml',source:'',labelAmount:100,estimated:false,values:{} as Values,units:{} as Values})
const form=ref(blankFood())
const recipe=ref({name:'',servings:1,yieldAmount:100,ingredients:[] as {id:string;amount:number;unit:string}[]})
const ingredientPortions=computed(()=>recipe.value.ingredients.flatMap(i=>{const food=foods.value.find(f=>f.id===i.id);return food?[{food,amount:i.amount,unit:i.unit}]:[]}))
function openCreate(type:string){form.value=blankFood();recipe.value={name:'',servings:1,yieldAmount:100,ingredients:[]};mode.value=type}
function setIngredient(i:{id:string;unit:string}){i.unit=foods.value.find(f=>f.id===i.id)?.base??'g'}
function saveFood(){
 const f=form.value
 if(!f.name.trim()||!(f.labelAmount>0))return
 const values=Object.fromEntries(Object.entries(f.values).filter(([,v])=>typeof v==='number'&&v>=0).map(([k,v])=>[k,v!*100/f.labelAmount]))
 const units=Object.fromEntries(Object.entries(f.units).filter(([,v])=>typeof v==='number'&&v>0))
 db.value.foods.push({id:crypto.randomUUID(),name:f.name.trim(),category:'Personalizados',state:f.state.trim()||'Según etiqueta',base:f.base,source:f.source.trim()||'Datos ingresados por el usuario',estimated:f.estimated,values,units})
 close()
}
function saveRecipe(){
 const r=recipe.value
 if(!r.name.trim()||r.servings<=0||r.yieldAmount<=0||!r.ingredients.length||ingredientPortions.value.length!==r.ingredients.length||ingredientPortions.value.some(i=>!(i.amount>0)))return
 db.value.foods.push({id:crypto.randomUUID(),name:r.name.trim(),category:'Recetas',state:'Preparación casera',base:'g',values:recipeValues(ingredientPortions.value,r.yieldAmount),units:{porciones:r.yieldAmount/r.servings},source:'Receta del usuario · cálculo a partir de los ingredientes',estimated:true,ingredients:ingredientPortions.value,servings:r.servings})
 close()
}
const goalKey=ref('energy')
const draftGoal=ref<Goal>({kind:'target',min:0})
function editGoal(k:string){goalKey.value=k;draftGoal.value={...(db.value.goals[k]??{kind:'target',min:0})}}
function saveGoal(){
 const g=draftGoal.value
 if(g.min>0&&(g.kind!=='range'||(g.max??0)>=g.min)){db.value.goals[goalKey.value]={...g};message.value='Meta guardada.'}
}
function prioritize(k:string,delta:number){
 const index=db.value.order.indexOf(k)
 if(!delta){db.value.order=index<0?[...db.value.order,k]:db.value.order.filter(x=>x!==k);return}
 const next=index+delta
 if(next<0||next>=db.value.order.length)return
 const order=[...db.value.order];[order[index],order[next]]=[order[next],order[index]];db.value.order=order
}
const month=ref(today.value.slice(0,7)+'-01')
watch(date,d=>month.value=d.slice(0,7)+'-01')
function moveMonth(step:number){
 const d=new Date(month.value+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+step);month.value=d.toISOString().slice(0,10)
}
const weekday=(d:string)=>(new Date(d+'T12:00:00Z').getUTCDay()+6)%7
const cells=computed(()=>{
 const start=shift(month.value,-weekday(month.value))
 return Array.from({length:42},(_,i)=>shift(start,i))
})
const filterActivity=ref('')
const weekStart=computed(()=>shift(date.value,-weekday(date.value)))
const weekEnd=computed(()=>shift(weekStart.value,6))
const recorded=(d?:Day)=>!!(d&&(d.entries.length||d.water>0))
const weekDays=computed(()=>Object.entries(db.value.days).filter(([k,d])=>k>=weekStart.value&&k<=weekEnd.value&&recorded(d)&&(!filterActivity.value||d.activity===filterActivity.value)).map(([,d])=>d))
const weekMetrics=computed(()=>Object.fromEntries(nutrients.map(([k])=>[k,weekly(weekDays.value,k)])))
function go(name:string){tab.value=name;message.value='';if(name==='Hoy')date.value=today.value}
function exportCsv(){
 const header=['Fecha (Lima)','Actividad','Tipo','Comida','Alimento','Cantidad','Unidad','Fuente','Estimado',...nutrients.map(([,n,u])=>n+' ('+u+')')]
 const rows:(string|number|undefined)[][]=[header]
 for(const [date,d] of Object.entries(db.value.days).sort(([a],[b])=>a.localeCompare(b))){
   for(const e of d.entries)rows.push([date,d.activity,'Alimento',e.meal,e.food.name,e.amount,e.unit,e.food.source,e.food.estimated||e.food.approximateUnits&&e.unit!==e.food.base?'Sí':'',...nutrients.map(([k])=>portionValue(e,k))])
   if(d.water)rows.push([date,d.activity,'Agua','','Agua',d.water,'ml'])
   if(d.activity&&!recorded(d))rows.push([date,d.activity,'Actividad'])
 }
 const csv=rows.map(row=>header.map((_,i)=>{
   const v=row[i];const raw=v==null?'':String(v)
   return '"'+(typeof v==='string'&&/^[=+@\-\t\r\n]/.test(raw)?"'"+raw:raw).replaceAll('"','""')+'"'
 }).join(',')).join('\r\n')
 const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}))
 const link=document.createElement('a');link.href=url;link.download='mi-diario-nutricional.csv';link.click()
 setTimeout(()=>URL.revokeObjectURL(url),1000)
}
</script>

<template>
<div class="shell">
 <aside class="sidebar">
  <div class="brand"><span class="logo"><Leaf :size="23"/></span><div>Mi Diario<br><strong>Nutricional</strong></div></div>
  <span class="nav-caption">TU ESPACIO</span>
  <nav aria-label="Secciones"><button v-for="t in tabs" :key="t.name" :class="{active:tab===t.name}" @click="go(t.name)"><component :is="t.icon" :size="19"/><span>{{t.name}}</span></button></nav>
  <div class="local"><span class="live-dot"></span> Guardado en este navegador</div>
 </aside>
 <main>
  <header class="topbar"><div class="mobile-brand"><span class="logo"><Leaf :size="20"/></span> Mi Diario Nutricional</div><span class="crumb">Mi diario <ChevronRight :size="13"/> <b>{{tab}}</b></span><span class="location"><MapPin :size="15"/> Lima, Perú</span></header>
  <div class="page">
   <template v-if="tab==='Hoy'">
    <div class="page-head"><div><div class="eyebrow"><span></span> DIARIO DE ALIMENTACIÓN</div><h1>{{date===today?'Hoy':'Diario del día'}}</h1><p class="date-title">{{heading}}</p></div>
     <div class="head-actions"><div class="date-nav"><button aria-label="Día anterior" @click="date=shift(date,-1)"><ChevronLeft :size="18"/></button><button aria-label="Volver a hoy" @click="date=today"><CalendarDays :size="18"/></button><button aria-label="Día siguiente" :disabled="date>=today" @click="date=shift(date,1)"><ChevronRight :size="18"/></button></div><button class="primary" @click="openPortion(meals[0])"><Plus :size="18"/> Registrar alimento</button></div>
    </div>
    <section class="hero">
     <div class="hero-head"><div class="hero-icon"><LayoutGrid :size="19"/></div><div><h2>¿Cómo voy hoy?</h2><p>Nutrientes registrados y progreso de tus metas.</p></div><button class="hero-settings" @click="go('Ajustes')"><SlidersHorizontal :size="16"/> <span>Mis metas</span></button></div>
     <div class="metrics">
      <button v-for="[k,n,u] in ordered.slice(0,more?undefined:4)" :key="k" class="metric" @click="openMetric([k,n,u])">
       <span class="metric-name"><i :class="'dot '+k"></i>{{n}}<ArrowUpRight :size="13"/></span>
       <strong>{{display(summaries[k].value,u)}}</strong>
       <span class="meter"><i :style="{width:(goal(k)&&summaries[k].value!==undefined?Math.min(100,summaries[k].value!/goal(k)!.min*100):0)+'%'}"></i></span>
       <span v-if="goal(k)">Meta {{goalLabel(goal(k)!,u)}}<template v-if="summaries[k].value!==undefined"> · {{fmt(summaries[k].value!/goal(k)!.min*100)}} %{{goal(k)!.kind==='range'?' del mínimo':''}}<br>{{goalStatus(summaries[k].value!,goal(k)!,u)}}</template><template v-if="!db.goals[k]"> · Ref. general</template></span><span v-else>Sin meta</span>
       <small v-if="summaries[k].partial">Parcial · {{summaries[k].count}} de {{day.entries.length}} alimentos</small>
      </button>
     </div>
     <button class="hero-more" @click="more=!more">{{more?'Ver menos nutrientes':'Ver todos los nutrientes'}} <ChevronDown :size="15" :class="{rotated:more}"/></button>
    </section>
    <div class="today-grid">
     <section class="journal">
      <div class="section-head"><div><h2>Mis comidas</h2><p>Organiza tus registros por momento del día.</p></div><button class="quiet" @click="mode='repeat'"><Copy :size="15"/> Repetir</button></div>
      <article v-for="(m,i) in meals" :key="m" class="meal">
       <div class="meal-top"><span :class="'meal-icon meal-'+i"><component :is="mealIcons[i]" :size="20"/></span><div class="grow"><h3>{{m}}</h3><p>{{day.entries.filter(e=>e.meal===m).length ? day.entries.filter(e=>e.meal===m).length+' registro(s)' : 'Sin alimentos registrados'}}</p></div><button class="add" :aria-label="'Agregar a '+m" @click="openPortion(m)"><Plus :size="18"/></button></div>
       <div v-for="e in day.entries.filter(x=>x.meal===m)" :key="e.id" class="entry"><button class="entry-name" @click="openPortion(m,e.food,e)">{{e.food.name}}<small>{{fmt(e.amount)}} {{e.unit}} · {{display(portionValue(e,'energy'),'kcal')}}</small></button><button class="icon-button" :aria-label="'Editar '+e.food.name" @click="openPortion(m,e.food,e)"><Pencil :size="15"/></button></div>
      </article>
     </section>
     <aside class="day-side">
      <section class="card hydration"><span class="meal-icon blue"><Droplets :size="21"/></span><h2>Hidratación</h2><p>Agua registrada hoy</p><div class="water-total">{{fmt(day.water)}} <span>ml</span></div><div class="water-buttons"><button class="quiet" @click="addWater(250)">+ 250 ml</button><button class="quiet" @click="addWater(500)">+ 500 ml</button></div><form class="inline-form" @submit.prevent="addWater(water)"><input v-model.number="water" type="number" min="1" step="any" placeholder="Otro volumen (ml)" aria-label="Otro volumen de agua en mililitros" required><button class="add" aria-label="Registrar agua"><Plus :size="18"/></button></form><button v-if="day.water" class="text-button" @click="mode='water'">Corregir total</button></section>
      <section class="card activity"><div class="activity-top"><span class="meal-icon green"><Sun :size="19"/></span><h3>Actividad del día</h3></div><select aria-label="Actividad del día" :value="day.activity" @change="changeDay(d=>d.activity=($event.target as HTMLSelectElement).value)"><option value="">Sin etiqueta</option><option v-for="a in activities" :key="a">{{a}}</option></select></section>
     </aside>
    </div>
   </template>
   <template v-else-if="tab==='Historial'">
    <div class="page-head"><div><div class="eyebrow"><span></span> TU PROGRESO</div><h1>Historial</h1><p>Consulta tus días y compara tus semanas.</p></div><button class="primary" @click="exportCsv"><Download :size="17"/> Exportar CSV</button></div>
    <div class="history-grid">
     <section class="card calendar"><div class="section-head"><h2 class="date-title">{{dateLabel(month,{month:'long',year:'numeric'})}}</h2><div class="date-nav"><button aria-label="Mes anterior" @click="moveMonth(-1)"><ChevronLeft :size="18"/></button><button aria-label="Mes siguiente" @click="moveMonth(1)"><ChevronRight :size="18"/></button></div></div>
      <div class="calendar-grid"><b v-for="(label,i) in ['L','M','M','J','V','S','D']" :key="i">{{label}}</b><button v-for="d in cells" :key="d" :class="{outside:d.slice(0,7)!==month.slice(0,7),chosen:d===date,recorded:recorded(db.days[d])}" :disabled="d>today" :aria-label="d" :aria-pressed="date===d" @click="date=d">{{Number(d.slice(-2))}}</button></div>
      <div class="calendar-info"><p class="date-title">{{heading}} · {{day.entries.length}} registros · {{fmt(day.water)}} ml</p><p>{{day.activity||'Sin etiqueta de actividad'}}</p><button class="quiet" @click="tab='Hoy'">Abrir diario <ArrowUpRight :size="15"/></button></div>
     </section>
     <section class="card week"><div class="section-head"><div><h2>Vista semanal</h2><p>{{weekStart}} al {{weekEnd}}</p></div><div class="date-nav"><button aria-label="Semana anterior" @click="date=shift(date,-7)"><ChevronLeft :size="18"/></button><button aria-label="Semana siguiente" :disabled="weekEnd>=today" @click="date=shift(weekStart,7)"><ChevronRight :size="18"/></button></div></div>
      <label>Filtrar por actividad<select v-model="filterActivity"><option value="">Todas las actividades</option><option v-for="a in activities" :key="a">{{a}}</option></select></label>
      <p>{{weekDays.length}} días con registros en la selección. Los promedios usan los días con datos de cada nutriente.</p>
      <div class="table-scroll"><table><thead><tr><th>Nutriente</th><th>Promedio</th><th>Días con datos</th><th>Parciales</th></tr></thead><tbody><tr v-for="[k,n,u] in ordered" :key="k"><td>{{n}}</td><td>{{display(weekMetrics[k].value,u)}}</td><td>{{weekMetrics[k].known}} / {{weekDays.length}}</td><td>{{weekMetrics[k].partial}}</td></tr></tbody></table></div>
     </section>
    </div>
   </template>
   <template v-else-if="tab==='Alimentos'">
    <div class="page-head"><div><div class="eyebrow"><span></span> TU BIBLIOTECA</div><h1>Alimentos</h1><p>Consulta fichas y guarda tus propios alimentos y recetas.</p></div><div class="head-actions"><button class="quiet" @click="openCreate('recipe')"><Plus :size="17"/> Receta</button><button class="primary" @click="openCreate('food')"><Plus :size="17"/> Alimento</button></div></div>
    <div class="search-row"><label class="search"><Search :size="19"/><input v-model="query" placeholder="Buscar alimentos…" aria-label="Buscar alimentos"></label><button class="quiet" :class="{marked:favoritesOnly}" :aria-pressed="favoritesOnly" @click="favoritesOnly=!favoritesOnly"><Star :size="17"/> Favoritos</button></div>
    <div class="food-grid"><article v-for="f in filtered" :key="f.id" class="card food-card"><span class="food-art">{{icons[f.category]||'🥗'}}</span><button class="star" :class="{marked:db.favorites.includes(f.id)}" :aria-label="'Favorito: '+f.name" :aria-pressed="db.favorites.includes(f.id)" @click="favorite(f.id)"><Star :size="20"/></button><span class="tag">{{f.category}}</span><h2>{{f.name}}</h2><p>{{f.state}} · {{display(f.values.energy,'kcal')}} / 100 {{f.base}}</p><button class="text-button" @click="openPortion(meals[0],f)">Ver ficha <ArrowUpRight :size="16"/></button></article></div>
    <p v-if="!filtered.length" class="empty">No hay alimentos que coincidan con la búsqueda.</p>
   </template>
   <template v-else>
    <div class="page-head"><div><div class="eyebrow"><span></span> PERSONALIZACIÓN</div><h1>Ajustes</h1><p>Configura tus metas y organiza tu resumen diario.</p></div></div>
    <div class="settings-grid">
     <section class="card"><h2>Metas personales</h2><p>Elige un objetivo, un rango o un máximo para cada nutriente.</p>
      <form class="stack" @submit.prevent="saveGoal">
       <label>Nutriente<select :value="goalKey" @change="editGoal(($event.target as HTMLSelectElement).value)"><option v-for="[k,n,u] in nutrients" :key="k" :value="k">{{n}} ({{u}})</option></select></label>
       <label>Tipo de meta<select v-model="draftGoal.kind"><option value="target">Objetivo a alcanzar</option><option value="range">Rango</option><option value="max">Límite máximo</option></select></label>
       <div class="split"><label>{{draftGoal.kind==='range'?'Mínimo':draftGoal.kind==='max'?'Máximo':'Objetivo'}}<input v-model.number="draftGoal.min" type="number" min="0.000001" step="any" required></label><label v-if="draftGoal.kind==='range'">Máximo<input v-model.number="draftGoal.max" type="number" :min="draftGoal.min" step="any" required></label></div>
       <div class="head-actions"><button class="primary">Guardar meta</button><button v-if="db.goals[goalKey]" class="quiet" type="button" @click="delete db.goals[goalKey];editGoal(goalKey)">Quitar meta</button></div>
      </form>
      <h3 class="spaced">Referencias generales</h3>
      <label class="check"><input v-model="db.reference" type="checkbox"> Usar valores diarios de la FDA cuando falte una meta personal</label>
      <p>Valores diarios de etiquetado de EE. UU. para adultos y niños a partir de 4 años. La app muestra sodio, azúcares añadidos y grasas saturadas como límites. Los demás valores disponibles se muestran como objetivos de comparación.</p>
      <a :href="referenceUrl" target="_blank" rel="noopener">Fuente FDA <ArrowUpRight :size="14"/></a>
     </section>
     <section class="card"><h2>Orden del resumen</h2><p>Fija los nutrientes que quieras ver primero y ajusta su orden.</p><div v-for="[k,n] in ordered" :key="k" class="order-row"><button class="star" :class="{marked:db.order.includes(k)}" :aria-label="'Fijar '+n" :aria-pressed="db.order.includes(k)" @click="prioritize(k,0)"><Star :size="17"/></button><span>{{n}}</span><template v-if="db.order.includes(k)"><button class="quiet compact" :disabled="db.order[0]===k" :aria-label="'Subir '+n" @click="prioritize(k,-1)">↑</button><button class="quiet compact" :disabled="db.order.at(-1)===k" :aria-label="'Bajar '+n" @click="prioritize(k,1)">↓</button></template></div></section>
     <section class="card"><h2>Tus datos</h2><p>El historial, las fichas personales, los favoritos y las metas se guardan en el almacenamiento local de este navegador, para esta dirección de la app. Si borras los datos del sitio, perderás esos registros.</p><button class="quiet" @click="exportCsv"><Download :size="16"/> Exportar historial a CSV</button></section>
    </div>
   </template>
   <p v-if="message" role="status" class="notice">{{message}}</p>
   <footer><Leaf :size="15"/> Mi Diario Nutricional <span>•</span> Hora local de Lima</footer>
  </div>
 </main>
</div>

<dialog ref="dialog" @close="close" @click.self="close" aria-labelledby="dialog-title">
 <div class="dialog-body"><button class="close icon-button" aria-label="Cerrar" @click="close"><X :size="23"/></button>
  <template v-if="mode==='portion'">
   <h2 id="dialog-title">{{selected?.name||(editing?'Editar registro':'Registrar alimento')}}</h2>
   <template v-if="!selected"><label class="search"><Search :size="18"/><input v-model="picker" placeholder="Buscar en tu biblioteca" aria-label="Buscar para registrar"></label><div class="picker"><button v-for="f in pickResults" :key="f.id" class="picker-row" @click="choose(f)"><span>{{icons[f.category]}}</span><div>{{f.name}}<small>{{f.state}}</small></div><Star v-if="db.favorites.includes(f.id)" :size="15"/><ChevronRight :size="16"/></button><p v-if="!pickResults.length">Sin resultados.</p></div></template>
   <form v-else class="stack" @submit.prevent="savePortion">
    <p>{{selected.state}} <span v-if="selected.estimated" class="tag">Estimado</span> <button v-if="!editing" type="button" class="text-button" @click="selected=undefined">Cambiar alimento</button></p>
    <div class="split"><label>Cantidad<input v-model.number="amount" type="number" min="0.000001" step="any" required></label><label>Unidad<select v-model="unit"><option v-for="u in unitOptions(selected)" :key="u">{{u}}</option></select></label><label>Comida<select v-model="meal"><option v-for="m in meals" :key="m">{{m}}</option></select></label></div>
    <p v-if="unit!==selected.base">1 {{unit}} ≈ {{display(selected.units[unit],selected.base)}} <span v-if="selected.approximateUnits">· equivalencia estimada</span></p>
    <p v-if="selected.ingredients">{{selected.servings}} porciones preparadas · {{selected.ingredients.map(i=>i.food.name).join(', ')}}. Si falta un dato de un ingrediente, ese nutriente queda sin datos en la receta.</p>
    <p class="source">Fuente · <a v-if="selected.url" :href="selected.url" target="_blank" rel="noopener">{{selected.source}}</a><span v-else>{{selected.source}}</span></p>
    <div class="table-scroll sheet"><table><thead><tr><th>Nutriente</th><th>Por 100 {{selected.base}}</th><th>Tu porción</th><th>% meta</th></tr></thead><tbody><template v-for="g in groups" :key="g"><tr class="group"><th colspan="4">{{g}}</th></tr><tr v-for="[k,n,u] in nutrients.filter(x=>x[3]===g)" :key="k"><td>{{n}}</td><td>{{display(selected.values[k],u)}}</td><td>{{display(portion&&portionValue(portion,k),u)}}</td><td>{{portion&&portionValue(portion,k)!==undefined&&goal(k)?fmt(portionValue(portion,k)!/goal(k)!.min*100)+' %'+(goal(k)!.kind==='range'?' mín.':''):'—'}}</td></tr></template></tbody></table></div>
    <p v-if="db.reference">Los porcentajes sin meta personal usan referencias generales disponibles de la FDA.</p>
    <div class="dialog-actions"><button v-if="editing" type="button" class="danger" @click="removeEntry(editing)"><Trash2 :size="16"/> Eliminar</button><button class="primary"><Plus v-if="!editing" :size="17"/>{{editing?'Guardar cambios':'Agregar al diario'}}</button></div>
   </form>
  </template>
  <template v-else-if="mode==='metric'"><h2 id="dialog-title">{{metric[1]}}</h2><p>{{display(summaries[metric[0]].value,metric[2])}} · {{summaries[metric[0]].count}} de {{day.entries.length}} registros con datos<span v-if="summaries[metric[0]].partial"> · Parcial</span></p><h3>Principales aportes</h3><div v-for="c in contributions" :key="c.e.id" class="contribution"><span>{{c.e.food.name}} <small>{{c.e.meal}}</small></span><b>{{display(c.value,metric[2])}}</b></div><p v-if="!contributions.length">Aún no hay aportes con datos.</p></template>
  <template v-else-if="mode==='repeat'"><h2 id="dialog-title">Repetir un alimento</h2><p>Elige un registro anterior. Podrás cambiar la porción o la comida.</p><button v-for="p in past" :key="p.e.id" class="picker-row" @click="openPortion(p.e.meal,p.e.food);amount=p.e.amount;unit=p.e.unit"><div>{{p.e.food.name}}<small>{{p.date}} · {{p.e.meal}} · {{p.e.amount}} {{p.e.unit}}</small></div><ChevronRight :size="16"/></button><p v-if="!past.length">Todavía no hay registros en días anteriores.</p></template>
  <template v-else-if="mode==='water'"><h2 id="dialog-title">Corregir agua registrada</h2><form class="stack" @submit.prevent="changeDay(d=>d.water=water??d.water);water=null;close()"><label>Total en mililitros<input v-model.number="water" type="number" min="0" step="any" required :placeholder="String(day.water)"></label><button class="primary">Guardar</button></form></template>
  <template v-else-if="mode==='food'">
   <h2 id="dialog-title">Nuevo alimento</h2><p>Introduce los valores de la etiqueta. Deja vacíos los campos sin datos.</p>
   <form class="stack" @submit.prevent="saveFood"><label>Nombre<input v-model="form.name" required></label><div class="split"><label>Estado o preparación<input v-model="form.state" placeholder="Ej. cocido"></label><label>Base<select v-model="form.base"><option>g</option><option>ml</option></select></label><label>Cantidad de la etiqueta ({{form.base}})<input v-model.number="form.labelAmount" type="number" min="0.000001" step="any" required></label></div><label>Fuente o marca<input v-model="form.source" placeholder="Ej. etiqueta nutricional"></label><label class="check"><input v-model="form.estimated" type="checkbox"> Los valores son estimados</label>
    <details><summary>Equivalencias opcionales</summary><div class="form-grid"><label v-for="u in ['g','ml','unidades','tazas','cucharadas'].filter(x=>x!==form.base)" :key="u">{{form.base}} por 1 {{u}}<input v-model.number="form.units[u]" type="number" min="0.000001" step="any"></label></div></details>
    <details v-for="g in groups" :key="g" :open="g==='Energía'||g==='Macronutrientes'"><summary>{{g}}</summary><div class="form-grid"><label v-for="[k,n,u] in nutrients.filter(x=>x[3]===g)" :key="k">{{n}} ({{u}})<input v-model.number="form.values[k]" type="number" min="0" step="any" placeholder="Sin datos"></label></div></details><div class="dialog-actions"><button class="primary">Guardar alimento</button></div></form>
  </template>
  <template v-else-if="mode==='recipe'">
   <h2 id="dialog-title">Nueva receta</h2><p>Usa el peso final de la preparación para calcular la ficha por 100 g. Cada porción recibe la misma parte del total.</p>
   <form class="stack" @submit.prevent="saveRecipe"><label>Nombre<input v-model="recipe.name" required></label><div class="split"><label>Porciones preparadas<input v-model.number="recipe.servings" type="number" min="1" required></label><label>Peso final (g)<input v-model.number="recipe.yieldAmount" type="number" min="0.000001" step="any" required></label></div><h3>Ingredientes</h3>
    <div v-for="(i,index) in recipe.ingredients" :key="index" class="ingredient"><label>Alimento<select v-model="i.id" required @change="setIngredient(i)"><option value="" disabled>Elegir</option><option v-for="f in foods" :key="f.id" :value="f.id">{{f.name}}</option></select></label><label>Cantidad<input v-model.number="i.amount" type="number" min="0.000001" step="any" required></label><label>Unidad<select v-model="i.unit"><option v-for="u in foods.find(f=>f.id===i.id)?unitOptions(foods.find(f=>f.id===i.id)!):['g']" :key="u">{{u}}</option></select></label><button type="button" class="icon-button" aria-label="Quitar ingrediente" @click="recipe.ingredients.splice(index,1)"><Trash2 :size="17"/></button></div>
    <button type="button" class="quiet" @click="recipe.ingredients.push({id:'',amount:100,unit:'g'})"><Plus :size="16"/> Añadir ingrediente</button><div class="dialog-actions"><button class="primary" :disabled="!recipe.ingredients.length">Guardar receta</button></div></form>
  </template>
 </div>
</dialog>
</template>
