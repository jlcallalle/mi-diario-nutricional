import test from 'node:test'
import assert from 'node:assert/strict'
import {catalog} from '../src/catalog.ts'
import {display, emptyDay, goalStatus, key, limaDate, load, portionValue, recipeValues, total, weekly} from '../src/nutrition.ts'

const food = catalog.find(f => f.id === 'A53')
const portion = {food, amount:100, unit:'g'}
test('la ficha y el total diario escalan de 100 g a 150 g', () => {
 assert.equal(portionValue(portion,'energy'),89)
 assert.equal(total([portion],'energy').value,89)
 const edited={...portion,amount:150}
 assert.equal(portionValue(edited,'energy'),133.5)
 assert.equal(total([edited],'energy').value,133.5)
})
test('un valor desconocido sigue vacío y un cero declarado se conserva', () => {
 assert.equal(display(portionValue({...portion,amount:150},'added'),'g'),'Sin datos')
 assert.deepEqual(total([portion],'added'),{value:undefined,count:0,partial:true})
 assert.deepEqual(total([portion],'B2'),{value:0,count:1,partial:false})
 assert.deepEqual(total([portion,{...portion,food:catalog[1]}],'iron'),{value:1.6,count:1,partial:true})
})
test('máximo y rango distinguen margen, exceso y estado', () => {
 assert.equal(goalStatus(300,{kind:'max',min:500},'mg'),'Margen de 200 mg')
 assert.equal(goalStatus(600,{kind:'max',min:500},'mg'),'Exceso de 100 mg')
 assert.equal(goalStatus(500,{kind:'max',min:500},'mg'),'Margen de 0 mg')
 const range={kind:'range',min:20,max:40}
 assert.match(goalStatus(15,range,'g'),/Por debajo/)
 assert.equal(goalStatus(20,range,'g'),'Dentro del rango')
 assert.match(goalStatus(45,range,'g'),/Por encima/)
})
test('una receta divide el total por porciones sin convertir valores desconocidos en cero', () => {
 const values=recipeValues([portion,{...portion,food:catalog[1]}],300)
 const recipe={food:{...food,values,units:{porciones:150}},amount:1,unit:'porciones'}
 assert.equal(portionValue(recipe,'energy'),96.5)
 assert.equal(portionValue(recipe,'iron'),undefined)
})
test('relectura de almacenamiento conserva historial y fechas de Lima', () => {
 const store=new Map()
 const storage={getItem:k=>store.get(k)}
 const db=load(storage)
 const date=limaDate(new Date('2026-11-10T04:59:59Z'))
 assert.equal(date,'2026-11-09')
 assert.equal(limaDate(new Date('2026-11-10T05:00:00Z')),'2026-11-10')
 db.days[date]={...emptyDay(),entries:[{...portion,id:'x',meal:'Almuerzo'}],water:250,activity:'Natación'}
 store.set(key,JSON.stringify(db))
 assert.deepEqual(load(storage),db)
})
test('promedios omiten los días sin datos del nutriente y cuentan los días parciales', () => {
 const a={...emptyDay(),entries:[portion]}
 const b={...emptyDay(),entries:[{...portion,food:catalog[1]}]}
 assert.deepEqual(weekly([a,b],'iron'),{value:1.6,known:1,partial:1})
})
