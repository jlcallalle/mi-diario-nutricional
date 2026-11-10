export const nutrients = [
 ['energy','Energía','kcal','Energía'],['protein','Proteínas','g','Macronutrientes'],['carbs','Carbohidratos','g','Macronutrientes'],['fat','Grasas totales','g','Macronutrientes'],
 ['fiber','Fibra','g','Otros componentes'],['sugars','Azúcares totales','g','Otros componentes'],['saturated','Grasas saturadas','g','Otros componentes'],['added','Azúcares añadidos','g','Otros componentes'],
 ...[['A','µg'],['C','mg'],['D','µg'],['E','mg'],['K','µg'],['B1','mg'],['B2','mg'],['B3','mg'],['B6','mg'],['B9','µg'],['B12','µg']].map(([n,u])=>[n,'Vitamina '+n,u,'Vitaminas']),
 ...[['calcium','Calcio'],['iron','Hierro'],['magnesium','Magnesio'],['potassium','Potasio'],['sodium','Sodio'],['zinc','Zinc'],['phosphorus','Fósforo'],['selenium','Selenio']].map(([k,n])=>[k,n,k==='selenium'?'µg':'mg','Minerales'])
]
export const groups = [...new Set(nutrients.map(n=>n[3]))]
export const meals = ['Desayuno','Almuerzo','Cena','Snacks']
export const activities = ['Running','Natación','Ciclismo','Descanso']
export type Values = Record<string,number | undefined>
export type Food = {id:string; name:string; category:string; state:string; base:'g'|'ml'; values:Values; units:Values; source:string; url?:string; estimated?:boolean; approximateUnits?:boolean; ingredients?:{food:Food; amount:number; unit:string}[]; servings?:number}
export type Portion = {food:Food; amount:number; unit:string}
export type Entry = Portion & {id:string; meal:string}
export type Day = {entries:Entry[]; water:number; activity:string}
export type Goal = {kind:'target'|'max'|'range'; min:number; max?:number}
export type Database = {days:Record<string,Day>; foods:Food[]; favorites:string[]; goals:Record<string,Goal>; order:string[]; reference:boolean}
export const key = 'mi-diario-nutricional-v1'
export function emptyDay():Day {return {entries:[],water:0,activity:''}}
export function load(storage:Pick<Storage,'getItem'>):Database {
 const defaults:Database={days:{},foods:[],favorites:[],goals:{},order:['energy','protein','carbs','fat'],reference:false}
 try {return {...defaults,...JSON.parse(storage.getItem(key) || '{}')}} catch {return defaults}
}
export function limaDate(now=new Date()) {
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
 return ['year','month','day'].map(k=>parts.find(p=>p.type===k)?.value).join('-')
}
export function shift(date:string,days:number) {
 const d=new Date(date+'T12:00:00Z')
 d.setUTCDate(d.getUTCDate()+days)
 return d.toISOString().slice(0,10)
}
export function portionValue(p:Portion,k:string) {
 const factor=p.unit===p.food.base?1:p.food.units[p.unit]
 const v=p.food.values[k]
 return v==null || factor==null ? undefined : v*p.amount*factor/100
}
export function total(entries:Portion[],k:string) {
 const known=entries.map(e=>portionValue(e,k)).filter(v=>v!==undefined)
 return {value:known.length?known.reduce((sum,v)=>sum+v,0):undefined,count:known.length,partial:known.length<entries.length}
}
export function recipeValues(ingredients:Portion[],yieldAmount:number):Values {
 return Object.fromEntries(nutrients.map(([k])=>{
   const t=total(ingredients,k)
   return [k,t.partial || t.value===undefined?undefined:t.value*100/yieldAmount]
 }))
}
export const fmt=(n:number)=>new Intl.NumberFormat('es-PE',{maximumFractionDigits:n>0&&n<0.01?5:2}).format(n)
export const display=(n:number|undefined,u:string)=>n===undefined?'Sin datos':fmt(n)+' '+u
export function goalStatus(v:number,g:Goal,u:string) {
 const amount=(n:number)=>display(n,u)
 if(g.kind==='max') return v>g.min?'Exceso de '+amount(v-g.min):'Margen de '+amount(g.min-v)
 if(g.kind==='range') {
   if(v<g.min) return 'Por debajo · faltan '+amount(g.min-v)
   if(v>g.max!) return 'Por encima · exceso de '+amount(v-g.max!)
   return 'Dentro del rango'
 }
 return v>=g.min?'Meta alcanzada':'Faltan '+amount(g.min-v)
}
export const referenceUrl='https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels'
const dv:Values={fat:78,carbs:275,fiber:28,saturated:20,added:50,C:90,D:20,E:15,K:120,B1:1.2,B2:1.3,B6:1.7,B12:2.4,calcium:1300,iron:18,magnesium:420,potassium:4700,sodium:2300,zinc:11,phosphorus:1250,selenium:55}
export function referenceGoal(k:string):Goal|undefined {
 const min=dv[k]
 return min===undefined?undefined:{min,kind:['saturated','added','sodium'].includes(k)?'max':'target'}
}
export function goalLabel(g:Goal,u:string) {
 return g.kind==='range'?fmt(g.min)+'–'+fmt(g.max!)+' '+u:g.kind==='max'?'Máx. '+display(g.min,u):display(g.min,u)
}
export function weekly(days:Day[],k:string) {
 const totals=days.map(d=>total(d.entries,k))
 const known=totals.filter(t=>t.value!==undefined)
 return {value:known.length?known.reduce((s,t)=>s+t.value!,0)/known.length:undefined,known:known.length,partial:totals.filter(t=>t.partial).length}
}
