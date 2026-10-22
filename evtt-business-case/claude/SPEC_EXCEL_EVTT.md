# 🔧 ESPECIFICACIÓN TÉCNICA: Excel EVTT de 14 Hojas

## Principios de Diseño

Cada hoja está diseñada para:
1. **Transparencia**: Toda fórmula es visible, no hay "cajas negras"
2. **Trazabilidad**: Cada número indica su origen (verificado, supuesto, benchmark)
3. **Auditabilidad**: Un tercero independiente puede reproducir los resultados
4. **Decisionalidad**: Facilita decisiones en comité o negociación

---

## Hoja 1: Resumen Comité

**Propósito:** Executive summary de una página. Lo que el comité ve primero.

**Estructura:**

```
EVTT BUSINESS CASE — [Nombre Activo]
Versión: 1.0 | Fecha: Oct 22, 2026 | Titular: [Inventor]

┌─────────────────────────────────────────┐
│ I. IDENTIFICACIÓN DEL ACTIVO            │
├─────────────────────────────────────────┤
│ Nombre: Sensores inteligentes            │
│ TRL: 6 | Sector: AgriTech | País: Perú  │
│ Tipo de Transferencia: Licencia Exclusiva│
│ Propietario: Universidad Agraria UNALM   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ II. VALUACIÓN SINTETIZADA               │
├─────────────────────────────────────────┤
│ Berkus Ponderado:          $2.8M  ✅    │
│                                         │
│ VC Method (3 escenarios):              │
│  • Conservador (30%):      $4.2M       │
│  • Base (50%):             $7.8M  ←    │
│  • Expansivo (20%):       $12.5M       │
│                                         │
│ ZOPA (Zona Posible Acuerdo):           │
│  • Piso:                   $2.8M       │
│  • Techo:                  $7.8M       │
│  • Rango realista:       $4.5-6.2M ← NEGOCIA AQUÍ
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ III. RECOMENDACIÓN ESTRATÉGICA          │
├─────────────────────────────────────────┤
│ Modalidad recomendada: Licencia Exclusiva│
│                                         │
│ Estructura propuesta:                  │
│  • Upfront: $3 cuotas × $50k = $150k   │
│  • Regalía anual: 5% (perpetua)        │
│  • Territorio: Perú exclusivo          │
│  • Sublicencia: No permitida           │
│  • Duración: 5 años renovables         │
│                                         │
│ Hitos de diligencia:                   │
│  • Año 1: $500k inversión              │
│  • Año 2: $1M+ en ventas               │
│  • Año 3+: Crecimiento 25% YoY         │
│                                         │
│ Si Base se cumple:                     │
│  ├─ VAN regalías inventor: $3.2M      │
│  ├─ VAN licenciatario: $4.5M          │
│  └─ Ambos ganan vs. BATNA ✓
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ IV. RIESGOS Y OPORTUNIDADES             │
├─────────────────────────────────────────┤
│ 🚨 RED FLAGS:                           │
│  • Spread Berkus-VC: 2.8x (moderado OK)│
│  • Dimensión Equipo: 60/100 (débil)    │
│  → Acción: Hiring urgente previa firma │
│                                         │
│ 🎯 OPORTUNIDADES:                      │
│  • IRR licenciatario >50% (muy bueno)  │
│  • Payback <18 meses (rápido)          │
│  → Presión sobre regalía puede bajar   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ V. PRÓXIMOS PASOS (90 DÍAS)             │
├─────────────────────────────────────────┤
│ Hito 1 (Mes 1):                         │
│  □ Presentar a licenciatario            │
│  □ Validar números con su CFO          │
│                                         │
│ Hito 2 (Mes 2):                         │
│  □ Negoción de términos principales    │
│  □ LOI (Letter of Intent) firmado      │
│                                         │
│ Hito 3 (Mes 3):                         │
│  □ Due diligence técnica                │
│  □ Términos finales, contrato          │
└─────────────────────────────────────────┘
```

**Columnas de trazabilidad:**
- Cada cifra tiene un superíndice que remite a la hoja fuente
- Ej: $2.8M^[Hoja 4: Berkus]

---

## Hoja 2: Definiciones Conceptuales

**Propósito:** Aclarar qué valuamos exactamente (Empresa vs Activo vs Derechos).

```
┌──────────────────────────────────────────────────────┐
│ DIFERENCIAS CLAVE                                    │
├──────────────────────────────────────────────────────┤

A) EMPRESA (Biogenia SAC)
   Incluye:  Oficinas + Equipo + Marca + Clientes + IP + Relaciones
   Valuación: $5-20M (M&A, IPO, VC rounds)
   Método: Comparables, múltiplos ingresos, DCF
   Uso: Vender/comprar todo el negocio

B) ACTIVO INTANGIBLE (Sensores)
   Incluye: Solo la tecnología (patente + software + know-how)
   Valuación: $2-8M (licenciamiento, spinoff)
   Método: Berkus, VC Method, DCF regalías
   Uso: Transferencia tecnológica, licencias

C) DERECHOS LICENCIABLES (¿Qué cedo?)
   Incluye: Porción del B que transferimos
   Valuación: % de B según términos de licencia
   Método: Negociación basada en BATNA
   Uso: Estructurar contrato de licencia

RELACIÓN:
  Empresa = Activo Intangible + Otros Activos + Equipo + Ingresos

Si cedo la licencia:
  Empresa post = Empresa pre - (Derechos Cedidos)
  
Ejemplo:
  Biogenia antes: $10M (empresa full)
  Sensores valen: $5M (activo)
  Licencio exclusiva Perú: $3M (derechos cedidos)
  
  Biogenia después de licencia:
    = $10M - (Ingresos que pierde de sensores en Perú)
    = ~$9M - $3M = ~$6M
    + Ingresos de regalías futuras: NPV $2M
    = ~$8M (neto)
```

---

## Hoja 3: Caso y Evidencia

**Propósito:** Documentar TRL, patentes, pilotos, validación de mercado.

```
┌──────────────────────────────────────────────┐
│ I. DESCRIPCIÓN TÉCNICA                       │
├──────────────────────────────────────────────┤
│ Nombre: Sensores Inteligentes Invernadero   │
│ Descripción: [1 párrafo de propuesta única] │
│ Aplicación: Monitoreo remoto de cultivos    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ II. NIVEL DE MADUREZ TECNOLÓGICA (TRL)      │
├──────────────────────────────────────────────┤
│ TRL Actual: 6 (Prototipo funcional)         │
│ Estado: ✅ VERIFICADO                       │
│ Evidencia:                                  │
│  └─ Informe técnico UNALM-2024.pdf         │
│  └─ Videos de pilotos (adjunto)            │
│  └─ Reporte de rendimiento febrero 2024    │
│                                             │
│ Próximo TRL: 7 (Escala piloto)             │
│ Timeline: 12 meses con inversión $500k     │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ III. PROPIEDAD INTELECTUAL                  │
├──────────────────────────────────────────────┤
│ Patente:  "Sistema de monitoreo wireless"   │
│  └─ Registrada: INDECOPI Perú (22-nov-2023)│
│  └─ ID: PE-000123456                       │
│  └─ Estado: Vigente (20 años)              │
│                                             │
│ Software:                                   │
│  └─ App control: Copyright © UNALM 2024    │
│  └─ Código: En repositorio privado        │
│  └─ Licencia: MIT (con restricción)       │
│                                             │
│ Know-how:                                   │
│  └─ Calibración de sensores (documentado)  │
│  └─ Mantenimiento (manual 200 págs)        │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ IV. VALIDACIÓN DE MERCADO                   │
├──────────────────────────────────────────────┤
│ Pilotos completados:                        │
│  1. Invernadero A (UNALM): Jun-Dic 2023    │
│     Resultado: 98% precisión, costo -35%   │
│  2. Invernadero B (empresa privada):       │
│     Resultado: Exitoso, usuario continúa   │
│                                             │
│ Endorsements:                               │
│  • Dr. García, experto agronomía (UNALM)   │
│  • Ing. López, CEO HortiPerú Inc.         │
│  • Carta de intención HortiPerú (adjunta)  │
│                                             │
│ Competencia:                                │
│  • Rival A: Similar, pero 2x más caro      │
│  • Rival B: Menos preciso pero cheaper     │
│  • Posicionamiento: Premium + confiable    │
└──────────────────────────────────────────────┘
```

**Columnas:**
- Estado: ✅ Verificado | 📊 Supuesto | ⏳ Pendiente
- Fuente: Referencia a documento adjunto

---

## Hoja 4: Berkus Detallado

**Propósito:** Evaluar riesgo técnico y comercial en 5 dimensiones.

```
┌────────────────────────────────────────────────┐
│ EVALUACIÓN BERKUS: SENSORES INTELIGENTES      │
│ Fecha: Oct 22, 2026 | Evaluador: Comité OTT  │
├────────────────────────────────────────────────┤

DIMENSIÓN 1: COMPLETITUD DE LA IDEA
  Puntaje: 85/100  |  Estado: ✅ VERIFICADO
  
  Evidencia (por qué 85, no 95):
  ✅ Patente registrada (INDECOPI)
  ✅ Publicación en revista Horticultura 2024
  ✅ Spec técnica 50 páginas (completa)
  ❌ Falta: Modelado de competencia (roadmap 6 meses)
  
  Conclusión: Idea está clara y documentada.
  Riesgo: Bajo. Confianza: 95%

─────────────────────────────────────────────────

DIMENSIÓN 2: PROTOTIPO / PRODUCTO
  Puntaje: 75/100  |  Estado: ✅ VERIFICADO
  
  Evidencia (por qué 75, no 85):
  ✅ Prototipo funcional en 2 pilotos reales
  ✅ 6 meses de datos operacionales
  ✅ Videos de demostración y casos de uso
  ❌ Falta: Certificación de confiabilidad (MTBF test)
  ❌ Falta: Pruebas en clima extremo (necesario para LATAM)
  
  Conclusión: Funciona, pero falta robustez climate.
  Riesgo: Moderado. Confianza: 80%
  
  Mitigación: Tests adicionales, 2-3 meses

─────────────────────────────────────────────────

DIMENSIÓN 3: EQUIPO
  Puntaje: 60/100  |  Estado: 📊 SUPUESTO
  
  Evidencia (por qué 60, no 75):
  ✅ Líder técnico: PhD en Electrónica (track record)
  ✅ Experto agronomía: Dr. García, 20 años industria
  ❌ Falta: Especialista en comercialización/ventas
  ❌ Falta: Productor/manufacturing (necesario para escala)
  ❌ Falta: Growth/PMM (marketing)
  
  Conclusión: Equipo técnico fuerte, débil en go-to-market.
  Riesgo: Alto. Confianza: 60%
  
  Mitigación: Hiring urgente de Sales Director, $150k/año

─────────────────────────────────────────────────

DIMENSIÓN 4: RELACIONES ESTRATÉGICAS
  Puntaje: 70/100  |  Estado: ✅ VERIFICADO
  
  Evidencia (por qué 70, no 80):
  ✅ HortiPerú Inc: Carta de intención (adjunta)
  ✅ 2 pilotos activos con usuarios reales
  ✅ Endorsement público de Dr. García
  ❌ Falta: LOI (Letter of Intent) firmado
  ❌ Falta: Acuerdo de exclusiva preserie
  
  Conclusión: Mercado validado, pero sin compromisos legales.
  Riesgo: Moderado-alto. Confianza: 70%
  
  Mitigación: Acelerar LOI con HortiPerú

─────────────────────────────────────────────────

DIMENSIÓN 5: CAPITAL EFICIENTE
  Puntaje: 65/100  |  Estado: 📊 SUPUESTO
  
  Evidencia (por qué 65, no 75):
  ✅ Prototipo ya existe, falta scale
  ✅ Software mayoría completado, falta UI/UX
  ❌ Requiere $500k para TRL 7 (fabricación)
  ❌ Requiere $1.5M más para TRL 8-9 (regulaciones)
  ❌ Hardware necesita tooling (ej: inyección plástico)
  
  Conclusión: Capital-moderado, no capital-light.
  Riesgo: Moderado. Confianza: 65%
  
  Nota: Para licenciatario (no para inventor), capital
        es responsabilidad suya

─────────────────────────────────────────────────

PUNTAJE BERKUS:
  Promedio: (85 + 75 + 60 + 70 + 65) / 5 = 71/100
  
PONDERACIÓN SECTORIAL (AgriTech LATAM):
  71 × 0.85 = 60.35 ≈ 60/100 (ponderado)

INTERPRETACIÓN:
  Confianza moderada. Riesgos principales:
    1. Equipo débil en comercialización
    2. Validación de mercado incompleta
    3. Pruebas de robustez pendientes
  
  Recomendación: AVANZAR CON CONDICIONES
    • Hire Sales Director antes de firma
    • Completar LOI con HortiPerú
    • Tests de confiabilidad (2 meses)
    
  Si estas 3 se cumplen, confianza sube a 75+/100
```

---

## Hoja 5: Supuestos (Datos de Entrada)

**Propósito:** Listar todos los supuestos del modelo, clasificados.

```
Tabla con columnas:
┌────┬──────────────────┬────────┬──────────────────┬────────┐
│ ID │ Parámetro        │ Valor  │ Estado           │ Fuente │
├────┼──────────────────┼────────┼──────────────────┼────────┤
│ M1 │ TAM ($M)         │ 450    │ 📈 Benchmark     │ Latitud│
│ M2 │ SAM ($M)         │ 50     │ 📊 Supuesto      │ Equipo │
│ M3 │ SOM Año 1 ($M)   │ 0.8    │ 📊 Supuesto      │ Equipo │
│ F1 │ Margen bruto     │ 65%    │ ✅ Verificado    │ Piloto │
│ F2 │ Churn anual      │ 8%     │ 📈 Benchmark     │ Sector │
│ F3 │ Ciclo adopción   │ 18 mes │ 📊 Supuesto      │ Equipo │
│ ... │              │        │              │       │
└────┴──────────────────┴────────┴──────────────────┴────────┘

LEYENDA ESTADOS:
✅ = Dato verificable (piloto, contrato, prueba)
📊 = Supuesto (estimación educada)
📈 = Benchmark (comparables mercado)
⏳ = Pendiente (falta completar)
```

---

## Hoja 6-8: Análisis de Licencias (Opción A, B, C)

**Propósito:** Modelar 3 escenarios de transferencia (Cesión, Exclusiva, No-Exclusiva).

### Hoja 6: Licencia Cesión Total (Opción A)

```
ESTRUCTURA: Venta completa de derechos

Parámetro              │ Valor
──────────────────────┼──────────────
Precio único           │ $6.5M
Pago:                  │ 50% al firmar, 50% en 6 meses
IP transferida         │ 100% (patente, software, know-how)
Propiedad post         │ Licenciatario es nuevo propietario
Ingresos futuros       │ Cero para inventor
Riesgo para inventor   │ Alto (sin upside si explota)
Riesgo para comprador  │ Alto (paga por todo upfront)

FLUJOS:
Inventor recibe: $3.25M (t=0) + $3.25M (t=6 meses) = $6.5M total
Fin de relación. Inventor retira.

VENTA PROPOSICIÓN:
✅ Pro: Efectivo inmediato, sin seguimiento
❌ Contra: Si tecnología "vuela", inventor no participa
❌ Contra: Comprador espera máxima diligencia, riesgo alto
```

### Hoja 7: Licencia Exclusiva (Opción B — RECOMENDADA)

```
ESTRUCTURA: Licencia con regalías perpetuas

TÉRMINOS PRINCIPALES:
  Upfront:           3 × $50k = $150k (cuotas trimestrales)
  Regalía anual:     5% de ventas netas
  Territorio:        Perú (exclusivo)
  Duración:          5 años, renovable por otros 5
  Sublicencia:       No permitida
  Diligencia:        Hitos año 1-3 (inversión, sales)
  Reversión:         Si no cumple diligencia, IP vuelve

INGRESOS ESPERADOS (Base scenario):

Año   Ingresos Licenciatario   Regalía (5%)   VAN (i=15%)
──────────────────────────────────────────────────────
1     $500k                    $25k           $21.7k
2     $1.2M                    $60k           $45.3k
3     $2.0M                    $100k          $65.8k
4     $2.8M                    $140k          $79.8k
5+    $3.2M perpetua           $160k          $600k (perpetua)

VAN Total Inventor (Upfront + Regalías): ~$813k

VALIDACIÓN PARA LICENCIATARIO:
  Ingresos año 5: $3.2M
  Menos regalía 5%: ($160k)
  Margen neto esperado: 50% = $1.6M
  Menos inversión $500k año 1: neto $1.1M/año
  
  ROI: $1.1M × 5 años = $5.5M
  Menos inversión: $500k
  = $5M profit en 5 años → IRR ~40% para licenciatario ✅ (viable)

CONCLUSIÓN: Ambos ganan (inventor $813k, licenciatario $5M)
```

### Hoja 8: Licencia No-Exclusiva (Opción C)

```
ESTRUCTURA: Múltiples licenciatarios, ingresos diversificados

SUPUESTO: 3 licenciatarios en 3 regiones

Licenciatario │ Territorio    │ Upfront  │ Regalía │ Total
────────────────────────────────────────────────────────
#1             │ Costa Perú    │ $50k     │ 2%     │ $50k
#2             │ Sierra Perú   │ $50k     │ 2%     │ $50k
#3             │ LATAM (otros) │ $50k     │ 2%     │ $50k

Upfront total: $150k (igual que Exclusiva)

INGRESOS REGALÍAS (2% múltiple):
  Cada región: ~$1M ingresos año 5
  Regalía 2% × 3 regiones = 2% × $3M total = $60k/año
  
  (COMPARAR: Exclusiva pagaba $160k/año)
  → No-Exclusiva genera menos ingresos para inventor

VENTAJA: Diversificación geográfica
DESVENTAJA: Menor precio unitario, riesgo de canibalizacion
RIESGO: Licenciatarios compiten en precio, reduce viabilidad para todos
```

---

## Hoja 9: VC Method Paso a Paso (17 Pasos)

**Propósito:** Mostrar cada paso de cálculo de pre-money, transparencia total.

```
SUPUESTOS BASE:
  Ingresos Año 5: $3.2M | Margen: 50% | Múltiplo EV: 6x
  IRR requerido: 30% | Dilución futura: 15%

PASOS 1-3: PROYECTAR INGRESOS
  Año 1: $500k  (licenciatario entra lento)
  Año 2: $1.2M  (adopción acelerada)
  Año 3: $2.0M  (mercado penetrado)
  Año 4: $2.8M  (crecimiento moderado)
  Año 5: $3.2M  (maduración)

PASOS 4-6: CALCULAR EBITDA
  EBITDA Año 5 = Ingresos × Margen = $3.2M × 50% = $1.6M

PASOS 7-9: APLICAR MÚLTIPLO
  EV = EBITDA × Múltiplo = $1.6M × 6 = $9.6M

PASOS 10-12: DESCONTAR AL IRR
  Factor descuento = (1 + 0.30)^5 = 3.71
  PV Enterprise Value = $9.6M / 3.71 = $2.59M
  (¿Cuánto vale hoy ese $9.6M de año 5?)

PASOS 13-15: AJUSTAR POR DILUCIÓN FUTURA
  Dilución esperada en futuras rondas: 15%
  Post-money = $2.59M / (1 - 0.15) = $3.05M
  (Espacio para futuras rondas)

PASOS 16-17: CALCULAR EQUITY INVERSOR
  Si inversor aporta $2M:
    Equity = $2M / $3.05M = 65% (DILUYE MUCHO)
  
  Si inversor aporta $1M:
    Equity = $1M / $3.05M = 33% (razonable)

CONCLUSIÓN:
  Pre-money viable: $1-3M
  (Si supuestos se cumplen en año 5)

NOTA: Esto es VC Method. Para licencia, adapta:
  "Ingresos licenciatario" reemplazo "Ingresos empresa"
  "Regalía %" reemplazo "Equity %"
```

---

## Hoja 10: Berkus × VC Combinado

**Propósito:** Mostrar cómo Berkus informa confianza en VC outputs.

```
SI BERKUS ES ALTO (80+):
  Confianza en VC outputs = alta
  → Usa VC Method como base de negociación

SI BERKUS ES BAJO (60-70):
  Confianza en VC outputs = moderada
  → Aplica descuento de riesgo (ej: -20% al pre-money)
  → O de-risk con hitos de ejecución

EJEMPLO:
  Berkus ponderado = 60/100
  VC Method pre-money = $2.59M
  
  Ajuste por riesgo Berkus (60%): $2.59M × 0.80 = $2.07M
  (Red flag: Equipo débil en sales → reduce valuación)
  
  ZOPA ajustada = $1.5M - $2.1M (vs original $2.6M - $7.8M)
```

---

## Hoja 11: Comparativo (Opción A vs B vs C)

**Propósito:** Side-by-side de las 3 opciones de transferencia.

```
Parámetro              │ Cesión Total │ Exclusiva │ No-Exclusiva
───────────────────────┼──────────────┼───────────┼─────────────
Upfront                │ $6.5M        │ $150k     │ $150k
Ingresos futuros       │ $0           │ ~$813k    │ ~$400k
Total inventor         │ $6.5M        │ $963k     │ $550k
Duración relación      │ 0 años       │ 5+ años   │ 5+ años
Control post           │ Pierde todo  │ Mantiene  │ Parcial
Riesgo inventor        │ Alto (dinero ya) │ Moderado │ Moderado
Riesgo licenciatario   │ Alto (paga todo) │ Bajo     │ Bajo
Facilidad negociación  │ Baja         │ Alta      │ Media
Probabilidad firma     │ Media        │ Alta      │ Media

RECOMENDACIÓN: EXCLUSIVA
Razones:
  ✅ Licenciatario acepta fácil (riesgo bajo)
  ✅ Inventor participa en upside ($963k vs $6.5M inicial, pero menos riesgo)
  ✅ Alineación de incentivos (ambos ganan si Base ocurre)
  ✅ Protección: reversión si licenciatario no invierte
```

---

## Hoja 12: ZOPA Negociada

**Propósito:** Documentar rango de negociación basado en BATNA de ambas partes.

```
PISO DEL INVENTOR:
  ¿Cuál es el mínimo viable?
  
  Inversión histórica en P&D: $200k
  Costo de oportunidad (2 años equipo): $200k
  Margen esperado (30%): $120k
  Mínimo piso: $520k
  
  Pero: Si hay otro licenciatario interesado
    → Piso sube al segundo mejor offer
    → (Aquí asumimos sin alternativa)

TECHO DEL LICENCIATARIO:
  ¿Cuál es el máximo viable?
  
  Ingresos Base año 5: $3.2M
  Menos costos: 50% = $1.6M
  Menos inversión inicial: $500k = $1.1M disponible
  VAN de eso al 20%: $2.2M
  + Upfront que puede pagar: $300k
  Máximo techo: $2.5M
  
  (Si techo es $2.5M y Berkus = $2.8M, hay problema)

ZOPA REALISTA:
  Piso:   $520k   (inventor)
  Techo:  $2.5M   (licenciatario)
  → ZOPA = $520k - $2.5M
  → Negociación realista: $1.2M - $2.0M
  
  Entra: $1.8M
  Cédete a: $1.2M si necesario
  Punto de ruptura: $800k (bajo esto, no vale)

CUÁNDO ROMPER NEGOCIACIÓN:
  • Si licenciatario baja de $800k
  • Si ofrece menos de 3% regalía
  • Si insiste en sublicencia permitida
  → Buscar otro licenciatario
```

---

## Hoja 13: Gates 90 Días

**Propósito:** Hitos de ejecución post-firma para validar supuestos.

```
HITO 1 (MES 1):
  □ Inversión inicial: Licenciatario desembolsa $50k
  □ Equipo técnico: Kick-off reunion, plan de desarrollo
  □ Validación: Confirmar acceso a know-how completamente
  
  KPI: Cumplimiento 90% de hitos iniciales

HITO 2 (MES 2):
  □ Desarrollo: Prototipo integrado en planta licenciatario
  □ Pruebas: Runs iniciales de validación
  □ Diligencia: Resultados preliminares positivos
  
  KPI: Prototipo funcional <15% desviación spec

HITO 3 (MES 3):
  □ Escalabilidad: Evaluación de costos de producción
  □ Comercial: Plan de sales, primeros contatos clientes
  □ Financiero: Proyección revisada de timing y costos
  
  KPI: Ningún bloqueador crítico identificado
  
DECISIÓN POST-GATES:
  ✅ Si todos cumplidos → Continuar con confianza
  ⚠️ Si 70% cumplidos → Renegociar hitos años 2-3
  ❌ Si <70% cumplidos → Evaluación de reversión

IMPLICACIÓN REGALÍA:
  • Si cumple gates 1-3 → Regalía 5% como acordado
  • Si cumple solo 2/3 → Regalía baja a 4%
  • Si cumple solo 1/3 → Evaluación de reversión/salida
```

---

## Hoja 14: Changelog y Auditoría

**Propósito:** Histórico de cambios y trazabilidad para auditoría.

```
VERSIÓN │ FECHA   │ CAMBIO PRINCIPAL           │ RAZÓN
────────┼─────────┼────────────────────────────┼──────────────
1.0     │Oct 22   │ Inicial                    │ Modelo base
1.1     │Oct 23   │ Ingresos Y5 $3.2M → $2.8M │ Feedback LIC
1.2     │Oct 24   │ IRR 30% → 35%              │ Análisis riesgo
        │         │ Pre-money $7.8M → $6.2M   │ Ajuste VC

AUDITORÍA INTERNA:
  Revisor: [Nombre CFO]
  Fecha: Oct 24, 2026
  
  ✅ Todos los números trazeables a fuente
  ✅ Supuestos documentados y razonables
  ✅ Fórmulas auditables sin discrepancias
  ✅ Benchmarks validados con fuentes públicas
  
  Comentarios:
    • Berkus Equipo baja (60). Requiere hiring urgente.
    • Gates 90 días son críticos para validar adopción.
    • ZOPA realista está ajustada a riesgos sector.

RECOMENDACIÓN: AVANZAR CON CONDICIONES
```

---

## Principios Generales

### Trazabilidad
Cada número debe poder trazarse a su origen. Si un revisor pregunta "¿de dónde sale $3.2M?", debería haber una ruta clara:
- Hoja 14 Changelog → Hoja 5 Supuestos → Hoja 6 Proyección → Hoja 1 Resumen

### Auditabilidad
Un tercero independiente (contador, auditor) debería poder reproducir todos los cálculos. Nada de "cajas negras".

### Decisionalidad
Cada hoja debe facilitar UNA decisión:
- Hoja 1: ¿Continuo con el proceso?
- Hoja 4: ¿Cuánto confío en esta tecnología?
- Hoja 12: ¿Este rango es realista para negociar?
- Hoja 13: ¿Se están cumpliendo los supuestos?

---

## Generación Automática

El script `build_evtt_v2.py` genera este Excel parametrizadamente:
- Usuario proporciona inputs
- Script calcula todas las hojas
- Excel resultante sigue esta estructura
- Listo para presentar al comité o licenciatario
