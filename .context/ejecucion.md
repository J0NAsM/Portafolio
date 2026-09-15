# Ejecución y validación

## Requisitos y límites
Hosting estático o Node según modalidad.

El build principal es estático multipágina. No imponer fallback SPA; separar las funciones que requieren servidor.

## Comandos declarados
Ejecutar desde el directorio indicado, después de revisar sus efectos. Esta tabla acredita que existe el script, no que haya pasado recientemente.
Los comandos de prueba pueden escribir archivos o datos. Builds móviles requieren SDK/firma y Maven puede ejecutar pruebas de integración.

| Fuente | Directorio relativo a la raíz | Script o propósito | Comando |
|---|---|---|---|
| [package.json](<../package.json>) | . | dev | npm run dev |
| [package.json](<../package.json>) | . | build | npm run build |
| [package.json](<../package.json>) | . | start | npm run start |
| [package.json](<../package.json>) | . | test | npm test |
| [package.json](<../package.json>) | . | test:accessibility | npm run test:accessibility |
| [package.json](<../package.json>) | . | test:integration | npm run test:integration |
| [package.json](<../package.json>) | . | test:production | npm run test:production |

## Configuración y despliegue encontrados
- [.github/workflows/ci.yml](<../.github/workflows/ci.yml>)
- [.github/workflows/deploy.yml](<../.github/workflows/deploy.yml>)

Despliegue efectivo: NO DETERMINADO. No ejecutar Compose, migraciones o arranque contra datos compartidos por inferencia.

## Puertos
Consultar [registro global](<../../Vaults/jmartinez/Infraestructura/Puertos/registro.json>) antes de iniciar varias aplicaciones. Se conservan los puertos actuales; si un proceso ajeno ocupa uno, informar y no detenerlo.

## Cierre de un cambio
Registrar comando, entorno, revisión, fecha y resultado real en proyecto.json o en el informe de validación del cambio. Actualizar documentación afectada y revisar el diff. No confundir la existencia de CI con un resultado aprobado.
