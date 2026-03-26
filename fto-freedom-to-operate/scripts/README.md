# Scripts de Apoyo — Skill FTO (Freedom to Operate)

Scripts Python para automatizar el proceso de análisis FTO. Requieren **Python 3.9+** y solo usan la biblioteca estándar (sin dependencias externas).

---

## score_calculator.py ⭐ MÓDULO CENTRAL

**Calculadora de score de riesgo FTO** (0–100) por patente con 5 dimensiones. Importable como módulo desde otros scripts.

```bash
# Ejecutar ejemplo embebido
python scripts/score_calculator.py
```

```python
# Uso como módulo
from scripts.score_calculator import calculate_fto_score, calculate_global_fto_score

result = calculate_fto_score({
    "claim_coverage": 0.85,      # 0.0–1.0
    "claim_mode": "equivalent",  # "literal" | "equivalent" | "partial" | "none"
    "is_active": True,
    "territories_overlap": 0.6,  # 0.0–1.0
    "years_remaining": 8,
    "holder_type": "large_corp", # "npe"|"large_corp"|"mid_corp"|"university"|"individual"
    "claim_breadth": "moderate", # "broad" | "moderate" | "narrow"
    "prior_art_available": "some", # "robust" | "some" | "scarce"
    "technical_similarity": "high", # "identical"|"high"|"moderate"|"low"
})
print(result["total_score"], result["level"])  # Ej: 61 ALTO
```

### Niveles de riesgo

| Score | Nivel | Color | Acción |
|-------|-------|-------|--------|
| 75–100 | CRÍTICO | 🔴 | Detener y consultar abogado |
| 50–74 | ALTO | 🟠 | Análisis legal formal requerido |
| 25–49 | MODERADO | 🟡 | Monitorear; design-around preventivo |
| 10–24 | BAJO | 🟢 | Documentar análisis |
| 0–9 | MÍNIMO | ✅ | Proceder con cautela normal |

---

## analizar_reivindicacion_fto.py

Análisis **elemento a elemento** de una reivindicación frente al producto analizado.

```bash
python scripts/analizar_reivindicacion_fto.py --interactivo
python scripts/analizar_reivindicacion_fto.py --patente "EP1234567" \
    --tecnologia "sistema de filtrado" --salida fto_ep1234567.md
```

---

## generar_informe_fto.py

Genera un **informe FTO estructurado completo** con tabla de patentes, análisis detallado, estrategias de mitigación y conclusiones.

```bash
python scripts/generar_informe_fto.py --interactivo
python scripts/generar_informe_fto.py \
    --producto "Dispositivo IoT agrícola" \
    --jurisdicciones "PE,US,EU" \
    --salida informe_fto.md
```

---

## Notas

- Compatible con Windows, Linux y macOS
- En Windows CMD, si hay problemas con caracteres: `chcp 65001`
- En modo interactivo salir con `Ctrl+C`
- `score_calculator.py` puede importarse desde `generar_informe_fto.py` para scoring automático
