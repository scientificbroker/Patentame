---
name: evtt-business-case-v2
description: Guía para evaluar, valorizar y negociar transferencia de activos intangibles usando Berkus, VC Method y términos de licencia estructurados. Genera Excel de 14 hojas con trazabilidad de datos.
---

# 🎯 EVTT Business Case v2 — Skill para Transferencia Tecnológica

## Propósito

Acompañar el proceso de **evaluación, valorización y negociación** de un activo intangible (tecnología, patente, software, método) que requiere ser transferido, licenciado o cedido. Genera un Excel de 14 hojas con rigor financiero y trazabilidad de decisiones.

**No genera una valuación automática.** Estructura el análisis para que **tú** y tu comité tomen decisiones informadas sobre:
- ¿Cuánta confianza tengo en esta tecnología? (Berkus)
- ¿Cuál es el rango de precio realista? (ZOPA negociada)
- ¿Qué derechos estoy cediendo exactamente? (Términos de licencia)
- ¿Qué datos son verificados vs supuestos? (Trazabilidad)

---

## Triggers de activación

El usuario menciona cualquiera de:
- "Tengo una tecnología para licenciar / ceder / transferir"
- "Necesito un business case para una patente / invención"
- "Voy a negociar derechos de IP"
- "Debo valorar un activo intangible"
- "Quiero presentar una tecnología ante un comité / fondo / licenciatario"
- "¿Cuánto debería pedir por mi IP?"
- Cualquier variante de: transferencia tecnológica, licenciamiento, valuación de IP, derechos licenciables, cesión

---

## Flujo del skill: 7 fases estructuradas

### FASE 1: Diagnóstico y Clasificación

**Qué determinas:**
1. ¿Qué es lo que vas a transferir? (patente, software, metodología, know-how, combinación)
2. ¿Cuál es el TRL actual? (1=idea, 9=comercial)
3. ¿Quién es el titular actual de la IP?
4. ¿En qué contexto se transferirá? (licencia exclusiva, cesión total, no exclusiva, spinoff)

**Aclaraciones que hace el skill:**

> "Importante: No es lo mismo valorar:
> 
> A) **La empresa**: ¿Cuánto cuesta comprar todo Biogenia SAC?
> B) **El activo intangible**: ¿Cuánto vale la tecnología de sensores por sí sola?
> C) **Los derechos licenciables**: ¿Qué porcentaje del valor puedo ceder sin perder propiedad?
> 
> Aquí trabajamos con (B) y (C)."

---

### FASE 2: Recopilación de Datos con Clasificación

**Qué recopila y cómo clasifica:**

El skill pide cada dato y marca su **estado de confiabilidad**:

```
ESTADO DEL DATO:
  ✅ Verificado: datos duros (patente registrada, pilotos reales completados)
  📊 Supuesto: lo que asume el modelo (adopción esperada, churn)
  📈 Benchmark: referencia LATAM o internacional
  ⏳ Pendiente: falta información para completar

EJEMPLO:
  TRL actual: 6 (Verificado - dossier técnico)
  Pilotos completados: 2 (Verificado - reportes de campo)
  Ingresos año 5 esperados: $3.2M (Supuesto - proyección)
  Churn industria AgriTech: 8% (Benchmark - Latitud Fund Report)
  Regulación pendiente: En evaluación (Pendiente)
```

**Datos que recopila:**

**Técnicos:**
- Descripción del activo
- TRL, evidencia de funcionamiento
- Proprietary claims (patentes, copyrights, trade secrets)
- Territorio cubierto por IP

**Mercado:**
- TAM, SAM, SOM (con fuentes)
- Precio unitario esperado
- Margen bruto esperado
- Ciclo de adopción
- Churn / retención

**Financiero (con rangos, no valores únicos):**
- Inversión requerida para escala
- Proyecciones años 1-5 (3 escenarios: Conservador, Base, Expansivo)
- Supuestos de cada escenario

**Equipo y ecosistema:**
- Capacidad ejecutora
- Relaciones estratégicas / pilotos activos

---

### FASE 3: Evaluación Berkus (Heurística de Riesgo)

**Qué es y qué NO es:**

> "Berkus es una herramienta de **evaluación de riesgo**, no un **valorador automático**.
> 
> Responde: '¿Cuánta confianza tengo en que esto genere ingresos?'
> 
> NO responde: '¿Esto cuesta $X USD?'
> 
> Es una heurística usada por OTTs (universidades) porque es documentable y objetiva."

**Las 5 dimensiones:**

| Dimensión | Rango | Significa |
|-----------|-------|-----------|
| **1. Completitud de Idea** | 0-100 | ¿Existe documentación técnica comprobable? (patente, publicación, spec) |
| **2. Prototipo/Producto** | 0-100 | ¿Funciona en condiciones reales o solo en laboratorio? |
| **3. Equipo** | 0-100 | ¿Hay capacidad técnica Y comercial para ejecutar? |
| **4. Relaciones Estratégicas** | 0-100 | ¿Hay validación de mercado? (acuerdos firmados, pilotos reales) |
| **5. Capital Eficiente** | 0-100 | ¿Cuánto capital se necesita para pasar de TRL actual a comercial? |

**Cálculo (con aclaraciones):**

```
Puntaje Bruto = (D1 + D2 + D3 + D4 + D5) / 5
               = resultado 0-100

ESTA CIFRA NO ES UN PRECIO.

Es un índice de confianza. Interpretación:
  80-100: Alta confianza, bajo riesgo de fallo técnico
  60-79:  Confianza media, riesgos moderados
  40-59:  Confianza baja, riesgos significativos
  0-39:   Muy alto riesgo, requiere más trabajo

Ponderación sectorial (CONTEXTO, no fórmula universal):
  Berkus ponderado = Puntaje Bruto × Factor sectorial
  
  Factores ejemplares LATAM (ajusta según tu contexto):
    AgriTech con regulación: × 0.80
    HealthTech regulado: × 0.85
    EdTech/FinTech: × 0.90
    Software SaaS: × 0.95
    
  (Estos NO son universales, dependen de ciclo de mercado, 
   reglamentación actual, percepción de riesgo en tu región)
```

**Lo que el skill NO hace:**
- NO transforma Berkus en "$5M de valuación"
- NO asume que puntuación alta = precio alto
- Berkus **informa** la ZOPA, no la determina

---

### FASE 4: Análisis Financiero (3 Escenarios)

**Estructura clara de supuestos:**

```
ESCENARIO BASE (Probabilidad: 50%)
├─ Supuesto 1: Adopción normal, 2-3 años a escala
├─ Supuesto 2: 4 licenciatarios activos año 2
├─ Supuesto 3: Churn 8-10% anual
└─ Ingresos año 5: $3.2M USD

ESCENARIO CONSERVADOR (Probabilidad: 30%)
├─ Supuesto 1: Adopción lenta, retrasos regulatorios
├─ Supuesto 2: 1-2 licenciatarios, entrada tardia
├─ Supuesto 3: Churn 12%+, competencia
└─ Ingresos año 5: $1.2M USD

ESCENARIO EXPANSIVO (Probabilidad: 20%)
├─ Supuesto 1: Market timing perfecto, demanda acelerada
├─ Supuesto 2: 6-8 licenciatarios, primeros meses
├─ Supuesto 3: Churn <5%, efecto red
└─ Ingresos año 5: $5.8M USD
```

**Cada número debe trazarse:**
- ¿De dónde vino? (benchmark, dato real, estimación)
- ¿Es verificado o supuesto?
- ¿Cambió en qué versión? (changelog)

---

### FASE 5: Evaluación Berkus × VC Method (No Automática)

**Por qué cruzar ambas:**

Berkus informa el riesgo técnico. VC Method informa el retorno financiero esperado.

```
VC Method (simplificado):
  1. Estima ingresos año N
  2. Aplica múltiplo EV (según sector, mercado)
  3. Descuenta al IRR exigido
  → Obtiene Pre-money como inversión inicial

Ejemplo:
  Ingresos año 5 Base: $3.2M
  Múltiplo EV/EBITDA (SaaS LATAM): 6x
  EBITDA estimado año 5: $1.6M (50% margen)
  Enterprise Value: $9.6M
  Descuento al IRR 30%: → Pre-money ~$3.8M
  
ESTO TAMPOCO ES "LA VALUACIÓN CORRECTA".
Es la pre-money que un inversor pagaría si sus supuestos se cumplen.
```

---

### FASE 6: Términos de Licencia (Decisiones Estructurales)

**Aquí es donde entra la negociación real.** El skill no asume defaults.

**Los 8 elementos que DEBEN especificarse:**

```
1. PROPIEDAD
   ├─ ¿Quién es propietario del activo original?
   ├─ ¿Quién es propietario de mejoras/derivadas?
   └─ Decidir: inventor mantiene propiedad, licenciatario mejoras

2. TERRITORIO
   ├─ ¿Geográfico? (Perú, LATAM, Global)
   ├─ ¿Por mercado? (horticultura, agroindustria)
   └─ Decidir: exclusiva en Perú, no exclusiva en LATAM

3. CAMPO DE USO
   ├─ ¿Para qué aplicaciones específicas?
   ├─ ¿Qué industrias?
   └─ Decidir: solo horticultura vs horticultura + agroindustria

4. EXCLUSIVIDAD
   ├─ ¿Exclusiva para este licenciatario?
   ├─ ¿Exclusiva respecto a quién? (competencia, proveedores, otros)
   └─ Decidir: exclusiva total, exclusiva por territorio, no exclusiva

5. SUBLICENCIA
   ├─ ¿Puede el licenciatario sublicenciar a terceros?
   ├─ ¿Con qué restricciones?
   └─ Decidir: permite sublicencia con aprobación previa, no permite

6. DURACIÓN Y TERMINACIÓN
   ├─ ¿Plazo inicial? (3 años, 5 años, perpetua)
   ├─ ¿Renovable? ¿Bajo qué términos?
   ├─ ¿Causales de terminación? (incumplimiento, no diligencia)
   └─ Decidir: 5 años renovables, o 10 años fijos

7. DILIGENCIA (Hitos de Ejecución)
   ├─ ¿Qué debe hacer el licenciatario? (inversión mínima, sales, tiempo)
   ├─ ¿Consecuencias de no cumplir? (regalía aumenta, se revierte)
   └─ Decidir: $500k inversión año 1, $1M ventas año 2, o licencia revierte

8. REVERSIÓN
   ├─ ¿Qué pasa si licenciatario incumple o no invierte?
   ├─ ¿IP vuelve al inventor?
   ├─ ¿Qué pasa con stock producido?
   └─ Decidir: reversión automática si no cumple hitos, o periodo de cura

ADEMÁS:
9. REGALÍAS: ESTRUCTURA, NO DEFAULT
   ├─ Estructura A: Porcentaje fijo (5% perpetuo)
   ├─ Estructura B: Tiered (5% primeros $1M, 3% después)
   ├─ Estructura C: Declining (5% años 1-3, 3% años 4-5, cesa)
   ├─ Estructura D: Milestone + fixed (upfront + % con tope)
   └─ Decidir según: urgencia inventor, riesgo licenciatario, ciclo de negocio

10. AUDITORÍA Y REPORTE
    ├─ ¿Cómo verifica el inventor las ventas?
    ├─ ¿Acceso a libros? ¿Auditorías externas?
    └─ Decidir: reporte trimestral, auditoría anual opcional
```

**El skill NO presume:**
- Regalía "perpetua" por defecto
- Exclusividad "automática"
- Sublicencia "permitida por defecto"

**El skill SÍ proporciona:**
- Plantilla de decisión
- Implicaciones de cada opción
- Precedentes de mercado (si existen)

---

### FASE 7: Generación del Excel de 14 Hojas (con Trazabilidad)

**Cada hoja incluye:**
- **Columna ESTADO**: ✅ Verificado | 📊 Supuesto | 📈 Benchmark | ⏳ Pendiente
- **Columna FUENTE**: De dónde vino el dato
- **Columna VERSION**: En qué versión cambió
- **Changelog**: Historial de cambios

**Las 14 hojas:**

| # | Hoja | Contenido | Trazabilidad |
|---|------|-----------|--------------|
| 1 | Resumen Comité | Valuación base, ZOPA propuesta, recomendación | Estado de cada número |
| 2 | Definiciones | Empresa vs Activo vs Derechos licenciables | Claridad conceptual |
| 3 | Caso y Evidencia | TRL, patentes, pilotos, acuerdos | Verificado/Supuesto |
| 4 | Berkus Detallado | Las 5 dimensiones + puntaje + fuente de cada dimensión | ¿Por qué cada score? |
| 5 | Supuestos | Todos los inputs (mercado, financiero, comité) | Estado de cada uno |
| 6 | Proyección Financiera | Ingresos 1-5, COGS, EBITDA, márgenes (3 escenarios) | Supuestos detrás de cada número |
| 7 | VC Method Paso a Paso | Los 17 pasos del método VC | Transparencia de cálculo |
| 8 | Berkus × VC Combinado | Cómo Berkus informa la confianza en VC outputs | Coherencia entre métodos |
| 9 | Términos de Licencia (Opción A) | Cesión total: estructura, flujos, implicaciones | Si aplica |
| 10 | Términos de Licencia (Opción B) | Licencia exclusiva: upfront, regalía, hitos, reversión | Si aplica |
| 11 | Términos de Licencia (Opción C) | Licencia no exclusiva: múltiples licenciatarios | Si aplica |
| 12 | Análisis Comparativo | Side-by-side de opciones | Cuál elegir y por qué |
| 13 | ZOPA Negociada | Rangos mínimos/máximos según BATNA de ambas partes | No es fórmula, es decisión |
| 14 | Gates 90 Días | Hitos de validación post-acuerdo | Monitoreo de supuestos |

---

## Interpretación y Presentación

**Después de generar el Excel, el skill interpreta:**

### ¿Cómo leer Berkus?
```
Si Berkus = 75/100:
  → "Alta confianza técnica"
  → Pero esto NO significa "$7.5M de valuación"
  → Significa: Los riesgos técnicos son bajos. 
    Los riesgos de mercado (adopción, competencia) pueden seguir siendo altos.
```

### ¿Cómo estimar la ZOPA real?
```
NO es: Piso=Berkus, Techo=VC

SÍ es: Negocia basándote en:
  ├─ ¿Cuánto mínimo necesita el inventor para que valga la pena ejecutar?
  │   (Tiempo + riesgo + costo de oportunidad)
  │
  ├─ ¿Cuánto máximo puede pagar el licenciatario y seguir siendo negocio?
  │   (Su margen, su IRR, su riesgo)
  │
  └─ ¿Cuál es tu BATNA? (alternativas si la negociación fracasa)
      ¿Cuál es el suyo? (sus alternativas)
      → El que tiene mejores alternativas negocia desde arriba
```

### Red Flags a buscar
```
🚨 Si Berkus >80 pero VC outputs <$1M → mismatch. ¿Por qué?
🚨 Si proyecciones Base muy diferentes entre escenarios → incertidumbre alta, de-risk con hitos
🚨 Si hay datos "Pendientes" en la evaluación → falta trabajo antes de presentar
🚨 Si los términos de licencia no están especificados → la negociación será caótica
```

---

## Lo que el skill NO hace

❌ No genera una valuación "correcta" automáticamente
❌ No asume que Berkus alto = precio alto
❌ No calcula ZOPA con fórmula (es negociación)
❌ No presume términos de licencia (los especificas tú)
❌ No asume parámetros LATAM como universales
❌ No perpetúa regalías por defecto

---

## Lo que sí hace

✅ Estructura el análisis de riesgo (Berkus)
✅ Calcula escenarios de ingresos (VC Method)
✅ Propone rangos (no números únicos)
✅ Trazeabiliza datos (de dónde vino, si es verificado)
✅ Aclara qué es empresa vs activo vs derechos
✅ Guía en decisiones de términos de licencia
✅ Genera Excel profesional con auditoría interna
✅ Orienta en negociación (BATNA, alternativas)

---

## Próximos pasos después del Excel

1. **Validar con licenciatarios potenciales**: ¿Entienden la propuesta? ¿La consideran viable?
2. **Revisar Gates 90 días**: ¿Qué hace en el siguiente trimestre para validar supuestos?
3. **Ajustar ZOPA según feedback**: Los datos new informen la negociación real
4. **Documentar cambios**: Cada versión del Excel es un hito en la negociación
