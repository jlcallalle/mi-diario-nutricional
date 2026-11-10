# Mi Diario Nutricional

App móvil de diario de alimentación con Vue 3, TypeScript y Vite. El día se calcula con la zona horaria de Lima.

## Abrir en tu computadora

Con Node.js 22.18 o posterior, abre una terminal en esta carpeta y ejecuta:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abre la dirección que imprime Vite. Usa siempre la misma dirección y el mismo navegador para acceder a tus registros.

`npm.cmd run build` comprueba los tipos y genera el sitio estático en `dist`. `npm.cmd test` ejecuta las pruebas de porciones, datos faltantes, metas, recetas, promedios y almacenamiento.

## Datos

Los registros se conservan en el almacenamiento local del navegador y están asociados a la dirección del sitio. Puedes exportarlos desde Historial. El CSV deja las celdas desconocidas vacías y conserva los ceros declarados.

El catálogo inicial usa las Tablas Peruanas de Composición de Alimentos del INS/CENAN y USDA FoodData Central. Cada ficha identifica su fuente. Los valores diarios de la FDA son opcionales y aparecen como referencias generales. En los rangos, el porcentaje se calcula respecto del mínimo.

Cada promedio semanal usa los días con algún valor para ese nutriente. La columna Parciales cuenta los días con al menos un alimento sin datos para ese nutriente. Las recetas usan el peso final y el número de porciones para calcular los valores.
