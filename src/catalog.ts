import type {Food, Values} from './nutrition.ts'
const insUrl='https://cdn.www.gob.pe/uploads/document/file/4565836/Tablas-peruanas.pdf'
function ins(id:string,name:string,category:string,state:string,values:Values):Food {
 return {id,name,category,state,base:'g',units:{},values,source:'INS/CENAN · Tablas Peruanas 2017 · '+id,url:insUrl}
}
function usda(id:string,name:string,category:string,state:string,values:Values,units:Values):Food {
 return {id,name,category,state,base:'g',values,units,source:'USDA FoodData Central · SR Legacy · '+id,url:'https://fdc.nal.usda.gov/food-details/'+id+'/nutrients',approximateUnits:true}
}
export const catalog:Food[]=[
 ins('A53','Quinua cocida','Cereales','Cocida',{energy:89,protein:2.8,fat:1.3,carbs:16.3,calcium:27,phosphorus:61,iron:1.6,sodium:24,potassium:472,B1:.01,B2:0,B3:.26,C:0}),
 ins('C131','Palta fuerte','Frutas','Cruda',{energy:104,protein:1.9,fat:8.9,carbs:17.1,fiber:10.6}),
 ins('U3','Camote amarillo','Tubérculos','Crudo, sin cáscara',{energy:95,protein:2,fat:0,carbs:23.4,fiber:2.9}),
 usda('172421','Lentejas cocidas','Legumbres','Hervidas, sin sal',{energy:116,protein:9.02,fat:.38,carbs:20.13,fiber:7.9,sugars:1.8,saturated:.053,calcium:19,iron:3.33,magnesium:36,phosphorus:180,potassium:369,sodium:2,zinc:1.27,selenium:2.8,C:1.5,B1:.169,B2:.073,B3:1.06,B6:.178,B9:181,B12:0},{tazas:198,cucharadas:12.375}),
 ins('E18','Anchoveta','Pescados','Cruda',{energy:156,protein:19.1,fat:8.2,carbs:0}),
 ins('A54','Quinua cruda','Cereales','Seca, cruda',{energy:351,protein:13.6,fat:5.8,carbs:66.6,fiber:5.9,calcium:56,phosphorus:242,zinc:3.3,iron:7.5,sodium:30,potassium:776,A:0,B1:.48,B2:.03,B3:1.4,C:.5}),
 ins('A3','Arroz blanco','Cereales','Crudo',{energy:358,protein:7.8,fat:.7,carbs:77.6,calcium:6,phosphorus:134,zinc:1.51,iron:1.04,sodium:19,potassium:148,A:0,B1:.11,B2:.04,B3:2.19,C:.9}),
 ins('C128','Naranja tangelo','Frutas','Cruda',{energy:24,protein:1,fat:.2,carbs:7.4,fiber:2.2}),
 ins('C135','Plátano bellaco','Frutas','Crudo',{energy:102,protein:1.3,fat:.1,carbs:29.5,fiber:2.6}),
]
export const icons:Record<string,string>={Cereales:'🌾',Frutas:'🥑',Tubérculos:'🍠',Legumbres:'🫘',Pescados:'🐟',Recetas:'🥣',Personalizados:'🏷️'}
