# Instalación en ChatGPT

Este paquete ofrece dos modalidades. Use solo una para evitar instrucciones duplicadas.

## Opción A: GPT personalizado existente o administrado

Use esta opción si su cuenta o espacio de trabajo permite crear o editar GPTs.

1. Abra el editor del GPT en ChatGPT web.
2. Use como nombre `EVTT Business Case – Grupo Biogenia`.
3. Copie todo el contenido de `custom-gpt/CHATGPT_INSTRUCTIONS.md` en **Instructions**.
4. Cargue `knowledge/methodology.md` y `knowledge/workbook-spec.md` como **Knowledge**.
5. Active análisis de datos o ejecución de código si desea generar modelos y archivos XLSX.
6. Pruebe el GPT en la vista previa antes de guardarlo o compartirlo.

## Opción B: plugin con skill para ChatGPT Work y Codex

La carpeta `plugin` contiene un plugin portable:

```text
plugin/
├── plugin.json
└── skills/
    └── evtt-business-case/
        ├── SKILL.md
        └── references/
```

Puede añadirse a un marketplace local o de repositorio compatible y luego instalarse desde el directorio de plugins. Para Codex local también puede copiarse la carpeta `plugin/skills/evtt-business-case` dentro de `%USERPROFILE%\.codex\skills\`.

No instale simultáneamente el GPT personalizado y el plugin dentro del mismo flujo si ambos aportan las mismas instrucciones.

## Prueba sugerida

```text
Usa EVTT Business Case para evaluar una tecnología pre-revenue. Separa el valor de la empresa del valor de los derechos licenciables y no declares una ZOPA sin información de ambas partes.
```

El resultado es apoyo analítico y no sustituye asesoría legal, tributaria, regulatoria ni una tasación profesional independiente.
