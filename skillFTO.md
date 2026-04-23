---
name: fto-analyzer
description: >
  Automated Freedom to Operate (FTO) analysis skill for startups and technology managers.
  ALWAYS use this skill when the user asks about: freedom to operate, FTO analysis, patent
  risk assessment, patent clearance, whether a product infringes patents, patent landscape
  search, claim-by-claim analysis, patent risk score, prior art search for FTO, or any
  variant of "can we launch/sell/use this without patent issues". Triggers on phrases like
  "analyze FTO", "check patents for my product", "is my technology free to use", "patent
  clearance report", "do we infringe any patents", "FTO for startup", or "patent risk".
  Connects to EPO-OPS API, Patentscope (OMPI) and Google Patents. Produces structured
  report with risk score per patent, claim-by-claim mapping, IPC classification, and
  strategic recommendations. Covers INDECOPI (Peru), EPO, USPTO and CAN (Decision 486).
---

# FTO Analyzer — Freedom to Operate automatizado

## Resumen del skill

Este skill ejecuta un análisis FTO (Freedom to Operate) estructurado en **5 fases** para
determinar si una tecnología puede desarrollarse, fabricarse o comercializarse sin infringir
patentes de terceros vigentes. Genera un reporte estructurado con score de riesgo por
patente, mapeado claim-by-claim, y recomendaciones estratégicas.

**Alcance**: EPO (Espacenet), OMPI (Patentscope), Google Patents, INDECOPI (Perú),
clasificación IPC/CPC, territorios CAN (Decisión 486).

**Output principal**: Reporte FTO con ficha por patente + score de riesgo + análisis
de claims + opciones estratégicas.

> ⚠️ **Disclaimer obligatorio en todo reporte**: Este análisis es una herramienta de
> due diligence preliminar. No constituye opinión legal. Para validez jurídica, debe
> ser revisado y firmado por un abogado especialista en propiedad intelectual.

---

## Flujo de trabajo en 5 fases

### FASE 1 — Intake: captura del objeto de análisis

Antes de ejecutar cualquier búsqueda, recopilar la siguiente información del usuario:

```
DATOS REQUERIDOS:
1. Descripción técnica detallada del producto/proceso/método
   → Componentes principales, mecanismo de acción, materiales, etapas del proceso
2. Territorios de interés (Perú, Colombia, Ecuador, Bolivia, USA, Europa, global)
3. Sector tecnológico principal
4. Competidores conocidos o empresas titulares de patentes en el sector
5. Estado del producto (concepto / prototipo / lanzamiento inminente)
6. Presupuesto aproximado para licenciamiento (orientativo para recomendaciones)
```

Si el usuario no provee todos los datos, solicitar los faltantes antes de proceder.
No iniciar búsquedas con descripción técnica incompleta.

---

### FASE 2 — Búsqueda multi-fuente de patentes

Ejecutar búsquedas en paralelo en las 3 fuentes. Ver `references/apis.md` para
parámetros técnicos completos de cada API.

#### 2A — EPO-OPS (Espacenet) — FUENTE PRIMARIA
```
Endpoint base: https://ops.epo.org/3.2/rest-services/
Autenticación: OAuth2 (client_credentials)
Endpoint clave: /published-data/search/

Query CQL ejemplo:
  txt="electrospinning chitosan wound" AND ic=A61L15 AND pd>=20200101
  
Campos a extraer por resultado:
  - publication_number, publication_date
  - applicant_name, inventor_name
  - ipc_classifications (lista completa)
  - title (EN + ES si disponible)
  - abstract
  - claims_count
  - legal_status (vigente/expirada/pendiente)
  - family_members (para identificar cobertura territorial)
```

#### 2B — Patentscope OMPI
```
Endpoint: https://patentscope.wipo.int/search/en/search.jsf
API REST: https://patentscope.wipo.int/search/en/api/
Parámetro: FP (Full text search), IC (IPC code), AD (application date)

Query ejemplo:
  FP:(chitosan electrospinning wound healing) AND IC:A61L AND AD:[20200101 TO 20251231]
  
Campos adicionales únicos de Patentscope:
  - PCT application status
  - Designated states (territorios de la solicitud PCT)
  - International filing date
```

#### 2C — Google Patents
```
URL base: https://patents.google.com/
API: https://patents.google.com/api/query?q=...&num=20&start=0

Ventajas específicas:
  - Cobertura de INDECOPI (Perú) vía familia de patentes
  - Prior art citations
  - Similar documents (ML-based)
  - Forward citations (quién cita esta patente)
  
Parámetros:
  q: query semántica en lenguaje natural + términos técnicos
  country: PE (Perú), CO, EC, BO, US, EP
  status: GRANT (otorgadas) | APPLICATION (pendientes)
  type: PATENT
```

#### Criterios de búsqueda IPC — usar clasificación de la imagen

Construir query de clasificación usando la estructura de 4 niveles:
```
Sección (A-H) → Clase (2 dígitos) → Subclase (letra) → Grupo (número/número)
Ejemplo: A61L15/44 = Materiales para vendas con acción específica, polisacáridos

Combinar SIEMPRE:
  1. Query semántica (palabras clave técnicas)
  2. Clasificación IPC principal
  3. Clasificaciones IPC secundarias probables
  4. Nombres de competidores como solicitantes
  5. Rango de fechas: vigentes (últimos 20 años para invención, 10 para MU)
```

#### Procesamiento de resultados
- Eliminar duplicados de familia de patentes (mismo invento, distintos países)
- Filtrar por vigencia real (verificar anualidades pagadas)
- Priorizar: patentes otorgadas > solicitudes publicadas pendientes
- Límite de análisis profundo: top 20 patentes por relevancia semántica

---

### FASE 3 — Análisis de claims (agente de reivindicaciones)

Para cada patente en el top 20, ejecutar el análisis claim-by-claim.
Ver `references/claims-agent.md` para el prompt especializado completo.

#### 3A — Extracción y parsing de reivindicaciones

Obtener el texto completo de claims vía EPO-OPS:
```
GET /published-data/publication/epodoc/{EP-NUMBER}/claims
Accept: application/json
```

Clasificar reivindicaciones por tipo:
- **Independientes**: definen el alcance máximo de protección (analizar SIEMPRE)
- **Dependientes**: agregan elementos específicos (analizar si independientes son riesgosas)
- **De producto**: cubren el objeto físico
- **De proceso**: cubren el método de fabricación/uso
- **De uso**: cubren una aplicación específica

#### 3B — Mapeo elemento a elemento

Para cada reivindicación independiente, construir tabla comparativa:

```
CLAIM ELEMENT          | PRESENTE EN TECH? | MODO        | RIESGO
---------------------- | ----------------- | ----------- | ------
[elemento 1 del claim] | Sí / No / Parcial | Literal/Eq. | Alto/Medio/Bajo
[elemento 2 del claim] | Sí / No / Parcial | Literal/Eq. | Alto/Medio/Bajo
[elemento 3 del claim] | ...               | ...         | ...
```

**Regla de infracción**: hay riesgo real solo si TODOS los elementos de una
reivindicación independiente están presentes (literal o por equivalencia).
Si falta UN elemento, no hay infracción bajo esa reivindicación.

#### 3C — Análisis de prosecution history

Si está disponible, revisar el file wrapper para identificar:
- Argumentos de distinción hechos durante el examen (estoppel)
- Amendments que restringieron el scope de los claims
- Claim terms con definición específica dada por el solicitante

---

### FASE 4 — Scoring de riesgo por patente

Calcular score de riesgo compuesto (0–100) usando la siguiente matriz:

#### Dimensiones del score

| Dimensión | Peso | Criterio de evaluación |
|-----------|------|------------------------|
| Cobertura de claims | 35% | % de elementos del claim independiente presentes en la tecnología |
| Vigencia y territorio | 20% | Patente vigente en territorios objetivo; años restantes |
| Calidad del titular | 15% | Capacidad litigante: NPE, corporación activa, universidad, individuo |
| Solidez de la patente | 15% | Prior art disponible para invalidad; alcance de claims (amplio=riesgo) |
| Proximidad técnica | 15% | Similitud semántica entre descripción técnica y claims |

#### Tabla de scoring por dimensión

**Cobertura de claims (35 pts máx):**
- Todos los elementos presentes, literalmente: 35 pts
- Todos presentes, algunos por equivalencia: 25–30 pts
- >70% presentes: 15–24 pts
- 50–70% presentes: 8–14 pts
- <50% presentes: 0–7 pts

**Vigencia y territorio (20 pts máx):**
- Vigente en todos los territorios objetivo, >10 años restantes: 20 pts
- Vigente en territorios principales, 5–10 años: 12–19 pts
- Vigente en algunos territorios, <5 años: 5–11 pts
- Expirada o no vigente en territorios objetivo: 0 pts

**Calidad del titular (15 pts máx):**
- Patent Troll (NPE con historial litigante): 15 pts
- Gran corporación con departamento legal activo: 12 pts
- Corporación mediana: 8 pts
- Universidad con OTT activa: 5 pts
- Inventor individual: 3 pts

**Solidez de la patente (15 pts máx):**
- Claims amplios, escaso prior art conocido: 15 pts
- Claims moderados, algo de prior art: 8–14 pts
- Claims estrechos o prior art robusto disponible: 0–7 pts

**Proximidad técnica (15 pts máx):**
- Tecnologías casi idénticas: 15 pts
- Misma clase tecnológica, variación menor: 10–14 pts
- Misma área tecnológica, diferencia significativa: 5–9 pts
- Área relacionada, diferencia sustancial: 0–4 pts

#### Clasificación final del score

| Score | Nivel de riesgo | Color | Acción recomendada |
|-------|----------------|-------|-------------------|
| 75–100 | 🔴 CRÍTICO | Rojo | Detener y consultar abogado inmediatamente |
| 50–74 | 🟠 ALTO | Naranja | Análisis legal formal requerido antes de continuar |
| 25–49 | 🟡 MODERADO | Amarillo | Monitorear; considerar design-around preventivo |
| 10–24 | 🟢 BAJO | Verde | Riesgo controlable; documentar análisis |
| 0–9 | ✅ MÍNIMO | Azul | Proceder con cautela normal |

---

### FASE 5 — Generación del reporte estructurado

Producir reporte en el siguiente formato estándar. Cada patente analizada genera
una **ficha completa** que replica la estructura del formulario de vigilancia tecnológica.

---

## Estructura del reporte FTO

```
═══════════════════════════════════════════════════════════════
REPORTE DE FREEDOM TO OPERATE (FTO)
Tecnología analizada: [NOMBRE DEL PRODUCTO/PROCESO]
Fecha de análisis: [FECHA]
Territorios: [LISTA]
Elaborado por: Patentame FTO Analyzer v1.0 | Biogenia Lab
AVISO LEGAL: Análisis preliminar. No constituye opinión legal.
═══════════════════════════════════════════════════════════════

## RESUMEN EJECUTIVO

Tecnología analizada: [descripción breve]
Patentes analizadas: [N total]
Patentes con riesgo crítico/alto: [N]
Patentes con riesgo moderado: [N]
Recomendación general: [PROCEDER / PRECAUCIÓN / DETENER]

Score FTO global: [PROMEDIO PONDERADO DE LAS PATENTES TOP 5] / 100
Nivel de riesgo global: [CRÍTICO / ALTO / MODERADO / BAJO / MÍNIMO]

---

## PARÁMETROS DE BÚSQUEDA

### Descripción técnica del objeto de análisis
[Descripción completa del producto/proceso ingresada por el usuario]

### Palabras clave utilizadas en la búsqueda
[Listado de términos técnicos utilizados en las queries]
Fuentes consultadas: EPO-OPS (Espacenet) | Patentscope OMPI | Google Patents
Base de datos adicional: INDECOPI (via familias de patentes)

### Clasificación internacional de patente (IPC) usada para la búsqueda

| Nivel | Código | Descripción |
|-------|--------|-------------|
| Sección | [X] | [Descripción sección] |
| Clase | [XX] | [Descripción clase] |
| Subclase | [XXX] | [Descripción subclase] |
| Grupo | [XXX/XX] | [Descripción grupo] |
| Clasificaciones secundarias | [lista] | [descripciones] |

---

## FICHAS DE PATENTES ANALIZADAS

[Repetir bloque siguiente por cada patente analizada]

────────────────────────────────────────────────────────────────
### PATENTE [N] — SCORE DE RIESGO: [SCORE]/100 🔴/🟠/🟡/🟢/✅

#### Búsqueda de Información Tecnológica

**Título de la patente**: [Título completo]
**Número de publicación**: [EP/WO/US/PE-XXXXXXX]
**Solicitante/Titular**: [Nombre empresa o inventor]
**Inventores**: [Lista]
**Fecha de solicitud**: [YYYY-MM-DD]
**Fecha de concesión**: [YYYY-MM-DD o "Pendiente"]
**Estado**: [Vigente / Expirada / Pendiente / Abandonada]
**Fecha de expiración estimada**: [YYYY-MM-DD]
**Territorios de vigencia**: [Lista de países donde está activa]
**Link de acceso a la patente**: [URL directa EPO/Google Patents/WIPO]

#### Palabras clave que generaron este resultado
[Lista de los términos de búsqueda que recuperaron esta patente]

#### Clasificación IPC de la patente

| Nivel | Código | Descripción |
|-------|--------|-------------|
| Sección | [X] | [Descripción] |
| Clase | [XX] | [Descripción] |
| Subclase | [XXX] | [Descripción] |
| Grupo principal | [XXX/XX] | [Descripción] |

#### Resumen técnico
[Abstract en español — parafrasear, no copiar textualmente]

#### Análisis de reivindicaciones (claim-by-claim)

**Reivindicación independiente principal:**
> [Texto parafraseado del claim independiente más relevante]

**Tabla de mapeo elemento a elemento:**

| Elemento del claim | ¿Presente en nuestra tecnología? | Modo | Observación |
|-------------------|----------------------------------|------|-------------|
| [elemento 1] | Sí / No / Parcial | Literal / Equivalente | [nota] |
| [elemento 2] | Sí / No / Parcial | Literal / Equivalente | [nota] |
| [elemento 3] | Sí / No / Parcial | Literal / Equivalente | [nota] |

**Conclusión de infracción**: [Riesgo real / Sin riesgo / Ambiguo — justificación]

#### Identificación de similitudes y diferencias con nuestra tecnología

**Similitudes identificadas**:
- [similitud 1]
- [similitud 2]

**Diferencias y elementos ausentes**:
- [diferencia 1 — elemento del claim no presente en nuestra tech]
- [diferencia 2]

**Novedad de nuestra tecnología frente a esta patente**:
[Descripción de qué hace distinta a nuestra tecnología — base para design-around]

#### Desglose del score de riesgo

| Dimensión | Pts obtenidos | Pts máx | Justificación |
|-----------|--------------|---------|---------------|
| Cobertura de claims | [N] | 35 | [razón] |
| Vigencia y territorio | [N] | 20 | [razón] |
| Calidad del titular | [N] | 15 | [razón] |
| Solidez de la patente | [N] | 15 | [razón] |
| Proximidad técnica | [N] | 15 | [razón] |
| **TOTAL** | **[N]** | **100** | |

**Nivel de riesgo**: [CRÍTICO / ALTO / MODERADO / BAJO / MÍNIMO]

#### Opciones estratégicas para esta patente

1. **Design-around**: [Descripción específica de cómo modificar el producto para evitar los claims]
2. **Licenciamiento**: [Evaluación de viabilidad — titular, tipo de licencia probable]
3. **Invalidación**: [Prior art disponible que podría invalidar esta patente]
4. **Expiración**: [Fecha; ¿es viable esperar?]
5. **Riesgo de enforcement**: [Probabilidad real de que el titular demande]

────────────────────────────────────────────────────────────────

[FIN BLOQUE — repetir para cada patente]

---

## ANÁLISIS CONSOLIDADO

### Mapa de riesgo territorial

| Territorio | N° patentes con riesgo alto/crítico | Recomendación |
|-----------|-------------------------------------|---------------|
| Perú (INDECOPI) | [N] | [acción] |
| Colombia | [N] | [acción] |
| Estados Unidos | [N] | [acción] |
| Europa (EPO) | [N] | [acción] |
| Internacional (PCT) | [N] | [acción] |

### Patentes con mayor riesgo (top 5)

| Ranking | Número | Titular | Score | Nivel |
|---------|--------|---------|-------|-------|
| 1 | [EP/US/WO-XXX] | [titular] | [score]/100 | 🔴/🟠 |
| 2 | ... | ... | ... | ... |

### Oportunidades identificadas

[Listado de patentes expiradas en el sector que pueden ser explotadas libremente]
[Prior art relevante que refuerza la libertad de operación]
[Territorios con ausencia de cobertura patentaria del sector]

---

## RECOMENDACIONES ESTRATÉGICAS FINALES

### Acciones inmediatas (antes de continuar el desarrollo)
1. [acción concreta con responsable y plazo]
2. [acción concreta]

### Acciones de mediano plazo
1. [acción]
2. [acción]

### Monitoreo continuo recomendado
- Frecuencia de re-búsqueda: [mensual / trimestral]
- Alertas a configurar en: Espacenet, Google Patents Alerts
- Clasificaciones IPC a monitorear: [lista]
- Solicitantes a monitorear: [lista de competidores]

---

## LIMITACIONES DEL ANÁLISIS

- Cobertura: Las búsquedas cubren bases de datos públicas. Patentes en examen
  (no publicadas, menores de 18 meses) no son detectables.
- Idioma: Patentes en idiomas distintos al español e inglés pueden no aparecer
  en queries semánticas. Verificar bases nacionales de China (CNIPA), Japón (J-PlatPat).
- Validez legal: Este reporte no constituye opinión legal. Para decisiones de
  inversión o lanzamiento, obtener opinión firmada por abogado especialista en PI.
- Fecha de corte: Los datos de vigencia son correctos a la fecha del análisis.
  Las anualidades pueden pagarse o abandonarse en cualquier momento.

---

*Reporte generado por Patentame FTO Analyzer | github.com/scientificbroker/Patentame*
*Biogenia Lab — Lima, Perú*
```

---

## Comportamiento del agente en casos especiales

### Si no hay resultados relevantes
Reportar explícitamente la ausencia de patentes bloqueantes como hallazgo
positivo. Incluir la query usada y las bases consultadas para documentar
la diligencia debida. Un FTO negativo (sin riesgos) también es valioso.

### Si hay >50 resultados de alta relevancia
Priorizar los 20 con mayor proximidad técnica. Informar al usuario que
el análisis completo requeriría revisión profesional extendida.

### Si el usuario proporciona una patente específica para analizar
Ir directamente a la Fase 3 con esa patente. Igual consultar bases para
identificar familia de patentes relacionadas.

### Si se solicita análisis solo para Perú (INDECOPI)
Priorizar Google Patents con filtro `country:PE` y familias de patentes.
Incluir referencia explícita a la Decisión 486 de la CAN para cobertura
andina regional.

---

## Referencias del skill

- `references/apis.md` — Parámetros técnicos completos de EPO-OPS, Patentscope y Google Patents
- `references/claims-agent.md` — Prompt especializado para análisis de reivindicaciones
- `references/ipc-guide.md` — Guía de clasificación IPC para los sectores más comunes en Perú
- `references/decision-486.md` — Marco normativo andino para FTO en CAN
- `scripts/epo_search.py` — Script de búsqueda EPO-OPS con autenticación OAuth2
- `scripts/score_calculator.py` — Calculadora de score de riesgo

Leer el archivo de referencia pertinente antes de ejecutar cada fase.
