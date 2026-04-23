# Revisión del Repositorio Patentame

**Repositorio**: [scientificbroker/Patentame](https://github.com/scientificbroker/Patentame)  
**Clonado en**: `Patentame/`  
**Fecha de revisión**: Marzo 2025

---

## 1. Descripción General

**Patentame** es un asistente multilingüe (ES/EN) para redactar solicitudes de **patentes de invención** y **modelos de utilidad** según directrices OMPI/WIPO. La app guía paso a paso, ofrece mejoras con IA (Gemini) y una lista de verificación final.

**Stack**: React 19, Vite 6, TypeScript, Tailwind CSS, @google/genai (Gemini API)

---

## 2. Estructura del Proyecto

```
Patentame/
├── App.tsx              # Componente principal, wizard completo
├── index.tsx / index.html
├── types.ts             # Tipos: PatentData, PatentSectionKey, etc.
├── components/
│   ├── SectionInput.tsx # Input por sección con IA
│   └── icons.tsx        # Iconos SVG
├── data/
│   └── i18n.ts          # Cadenas ES/EN, secciones WIPO
├── services/
│   └── geminiService.ts # Integración con Gemini (drafts, improveText)
├── vite.config.ts
├── package.json
└── .gitignore
```

---

## 3. Flujo de la Aplicación

1. **Bienvenida**: Selección de tipo (Patente de Invención / Modelo de Utilidad)
2. **Carga de documentos**: Prior Art y/o Descripción de la Invención (PDF o TXT)
3. **Secciones del wizard**:
   - Título
   - Sector técnico
   - Estado de la técnica (Prior Art)
   - Antecedente de patentes (IPC/EPO)
   - Descripción detallada (opcional)
   - Reivindicaciones
   - Resumen (Abstract)
4. **Checklist final** con recomendaciones WIPO
5. **Descarga PDF** (abre ventana de impresión del navegador)

---

## 4. Funcionalidades de IA (Gemini)

- **generateDraft**: Borrador predictivo por sección a partir de documentos subidos y contexto
- **improveText**: Mejora y amplía el texto según estándares WIPO
- **modelo**: `gemini-2.5-flash`
- **contenido multimodal**: soporta PDF como inline data para Prior Art e Invention Description

---

## 5. Configuración para Ejecutar en Local

### Requisitos
- Node.js
- API Key de Gemini (Google AI Studio)

### Pasos

1. **Instalar dependencias** (hay conflicto de peer deps, usar):
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Crear archivo `.env.local`** en la raíz con:
   ```
   GEMINI_API_KEY=tu_api_key_aquí
   ```

3. **Ejecutar**:
   ```bash
   npm run dev
   ```

   La app estará en `http://localhost:3000` (puerto configurado en `vite.config.ts`).

---

## 6. Observaciones y Posibles Mejoras

### ⚠️ Dependencias

- **react-canvas-draw** está en `package.json` e `index.html` pero **no se importa** en el código. Se puede eliminar si no se planea usar.
- **Conflicto de peer**: `react-canvas-draw@1.2.1` exige React 16/17; el proyecto usa React 19. Por eso se usa `--legacy-peer-deps`.

### ⚠️ index.html e importmap

- Hay un `importmap` con URLs de `aistudiocdn.com` (Google AI Studio). En desarrollo local con Vite, las dependencias vienen de `node_modules`. El importmap puede generar conflictos si se usa en entorno diferente a AI Studio.

### ✅ Buenas prácticas detectadas

- i18n completo ES/EN
- Referencias WIPO por sección
- Deshabilitación correcta de IA si no hay API_KEY
- Manejo de errores en `improveText`
- Estructura de tipos clara

### Sugerencias

1. Crear `.env.example` con `GEMINI_API_KEY=` para documentar la variable.
2. Valorar quitar `react-canvas-draw` si no se usa.
3. Posible adaptación del skill de patentes y vigilancia tecnológica como instrucciones de sistema para enriquecer los prompts de Gemini en `geminiService.ts`.

---

## 7. Relación con el Skill de Patentes y Vigilancia Tecnológica

El skill en `patentes-vigilancia-tecnologica/` (SKILL.md, scripts) cubre:

- Análisis de patentes
- Vigilancia tecnológica
- Planes de búsqueda
- Proceso de VT

**Patentame** se centra en la **redacción** de solicitudes (WIPO). Son complementarios: el skill puede usarse para analizar o vigilar; Patentame para redactar. Se podría integrar parte del skill como `systemInstruction` más detallado en `geminiService.ts` para alinear las sugerencias con mejores prácticas de VT.

---

## 8. Enlaces de Referencia

- [Repositorio GitHub](https://github.com/scientificbroker/Patentame)
- [Google AI Studio - App](https://ai.studio/apps/drive/1DxYjkYkgfUHX9_brDGF_SHYIyJ82pSCX)
- [OMPI/WIPO - Guías de patentes](https://www.wipo.int/patents/)
