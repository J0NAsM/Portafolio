# Portafolio — contexto

Fecha de revisión estructural: 2026-09-14. Identificador: portafolio.

## Producto y alcance
Portafolio con publicación estática y servicios opcionales.

Tecnología y persistencia: JavaScript/Vite; generador estático multipágina; Express opcional y JSON

Dependencias y servidor: Hosting estático o Node según modalidad.

## Lectura obligatoria
1. [Contexto general de Vaults](<../../Vaults/jmartinez/Ecosistema/contexto.md>) y [reglas generales](<../../Vaults/jmartinez/Ecosistema/reglas.md>).
2. [Reglas particulares](reglas.md) y [ejecución y validación](ejecucion.md).
3. Documentación y decisiones del componente que vaya a cambiar.

## Límites
El build principal es estático multipágina. No imponer fallback SPA; separar las funciones que requieren servidor.

## Fuentes técnicas
- [package.json](<../package.json>)

## Documentación conservada
- [CHANGELOG.md](<../CHANGELOG.md>)
- [CONTRIBUTING.md](<../CONTRIBUTING.md>)
- [PENDIENTES-PORTAFOLIO.md](<../PENDIENTES-PORTAFOLIO.md>)
- [README.md](<../README.md>)
- [docs/deployment.md](<../docs/deployment.md>)
- [docs/prepublish-checklist.md](<../docs/prepublish-checklist.md>)

## Estado verificable
La metadata está en [proyecto.json](proyecto.json). STATUS y último despliegue permanecen NO DETERMINADO hasta contar con evidencia. Una revisión documental no valida el funcionamiento de la aplicación.
[Seguimiento de correcciones y dependencias externas](<../../Vaults/jmartinez/Ecosistema/seguimiento.md>).

No copiar versiones, estado de Git o resultados históricos como si fueran hechos permanentes. Al cambiar una fuente técnica, revisar el contexto y actualizar su hash solo después de comprobar coherencia.
