#!/usr/bin/env python3
"""
Genera un plan de búsqueda de patentes estructurado para vigilancia tecnológica.

Uso:
  python generar_plan_busqueda.py [--tecnologia TECNOLOGIA] [--salida ARCHIVO]
  python generar_plan_busqueda.py --interactivo

Salida: Documento Markdown con estrategia de búsqueda, términos y fuentes.
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path


PLANTILLA_PLAN = """# Plan de Búsqueda de Patentes

**Tecnología/Ámbito**: {tecnologia}
**Objetivo**: {objetivo}
**Fecha**: {fecha}

---

## 1. Definición del ámbito

### Descripción del tema
{descripcion}

### Preguntas a responder
- ¿Qué invenciones o soluciones técnicas se buscan?
- ¿Qué aplicaciones o usos son relevantes?
- ¿Qué competidores o titulares interesan?

---

## 2. Términos de búsqueda

### 2.1 Términos principales (español)
- {terminos_es}

### 2.2 Términos principales (inglés)
- {terminos_en}

### 2.3 Sinónimos y variantes
| Concepto | Variantes |
|----------|-----------|
| {tabla_sinonimos} |

### 2.4 Términos a excluir (ruido)
- {excluir}

---

## 3. Clasificaciones IPC/CPC

### Códigos relevantes
| Código | Descripción |
|--------|-------------|
| {clasificaciones} |

### Cómo buscar clasificaciones
- Espacenet: https://worldwide.espacenet.com/classification
- USPTO: https://www.uspto.gov/web/patents/classification/

---

## 4. Estrategia de consulta

### 4.1 Consulta base (ejemplo Espacenet)
```
({termino1}) AND ({termino2}) AND ({termino3})
```

### 4.2 Variantes de consulta
- **Amplia**: menos términos, más resultados
- **Estrecha**: más términos AND, menos resultados
- **Por clasificación**: IPC/CPC + términos clave

### 4.3 Operadores por base de datos
| Base | AND | OR | Proximidad | Truncamiento |
|------|-----|-----|------------|--------------|
| Espacenet | AND | OR | NEAR | * |
| USPTO | AND | OR | - | $ |
| Patentscope | AND | OR | NEAR | * |

---

## 5. Fuentes y acceso

| Fuente | URL | Filtros sugeridos |
|--------|-----|-------------------|
| Espacenet | worldwide.espacenet.com | Fecha, país |
| OEPM | oepm.es | España |
| USPTO | patft.uspto.gov | Estados Unidos |
| Google Patents | patents.google.com | Búsqueda rápida |
| Patentscope | patentscope.wipo.int | PCT |

---

## 6. Filtros y criterios

- **Rango de fechas**: {rango_fechas}
- **Jurisdicciones**: {jurisdicciones}
- **Tipo de documento**: Solicitudes, concesiones, ambos
- **Idioma**: Priorizar títulos y resúmenes en ES/EN

---

## 7. Registro de resultados

### Campos a capturar
- Número de publicación
- Título
- Solicitante/Titular
- Inventores
- Fecha de solicitud/prioridad
- IPC/CPC
- Resumen
- URL

### Herramienta sugerida
- Hoja de cálculo con columnas fijas
- Gestor de referencias (Zotero, Mendeley)
- Base de datos interna

---

## 8. Próximos pasos

- [ ] Ejecutar búsqueda amplia inicial
- [ ] Revisar resultados y refinar términos
- [ ] Iterar consultas hasta ratio relevante aceptable
- [ ] Configurar alertas en bases seleccionadas
- [ ] Documentar consultas finales para replicación
"""


def generar_plan(
    tecnologia: str = "A definir",
    objetivo: str = "Estado del arte y vigilancia tecnológica",
    descripcion: str = "Descripción detallada del ámbito tecnológico a vigilar.",
    terminos_es: str = "término1, término2, término3",
    terminos_en: str = "term1, term2, term3",
    tabla_sinonimos: str = "Concepto principal | variante1, variante2",
    excluir: str = "Términos irrelevantes que generan ruido",
    clasificaciones: str = "IPC/CPC | Descripción (buscar en Espacenet)",
    termino1: str = "término*",
    termino2: str = "tecnología*",
    termino3: str = "método*",
    rango_fechas: str = "Últimos 5-10 años",
    jurisdicciones: str = "EP, ES, US, WO",
) -> str:
    """Genera el plan de búsqueda."""
    fecha = datetime.now().strftime("%Y-%m-%d")
    return PLANTILLA_PLAN.format(
        tecnologia=tecnologia,
        objetivo=objetivo,
        descripcion=descripcion,
        terminos_es=terminos_es,
        terminos_en=terminos_en,
        tabla_sinonimos=tabla_sinonimos,
        excluir=excluir,
        clasificaciones=clasificaciones,
        termino1=termino1,
        termino2=termino2,
        termino3=termino3,
        rango_fechas=rango_fechas,
        jurisdicciones=jurisdicciones,
        fecha=fecha,
    )


def modo_interactivo() -> dict:
    """Solicita parámetros por consola."""
    print("=== Generador de Plan de Búsqueda de Patentes ===\n")
    tecnologia = input("Tecnología/ámbito [A definir]: ").strip() or "A definir"
    return {
        "tecnologia": tecnologia,
        "objetivo": input("Objetivo [Estado del arte...]: ").strip()
        or "Estado del arte y vigilancia tecnológica",
        "descripcion": input(
            "Descripción del tema (una línea): "
        ).strip()
        or f"Ámbito tecnológico relacionado con {tecnologia}.",
        "terminos_es": input("Términos clave (ES, separados por coma): ").strip()
        or "término1, término2, término3",
        "terminos_en": input("Términos clave (EN, separados por coma): ").strip()
        or "term1, term2, term3",
        "excluir": input("Términos a excluir (opcional): ").strip()
        or "Términos irrelevantes que generan ruido",
        "rango_fechas": input("Rango de fechas [Últimos 5-10 años]: ").strip()
        or "Últimos 5-10 años",
        "jurisdicciones": input("Jurisdicciones [EP, ES, US, WO]: ").strip()
        or "EP, ES, US, WO",
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Genera un plan de búsqueda de patentes"
    )
    parser.add_argument("--tecnologia", "-t", default="A definir")
    parser.add_argument("--objetivo", "-o", default="")
    parser.add_argument("--salida", "-S", help="Archivo de salida (Markdown)")
    parser.add_argument("--interactivo", "-i", action="store_true")
    args = parser.parse_args()

    if args.interactivo:
        params = modo_interactivo()
        documento = generar_plan(**params)
    else:
        documento = generar_plan(
            tecnologia=args.tecnologia,
            objetivo=args.objetivo or "Estado del arte y vigilancia tecnológica",
        )

    if args.salida:
        Path(args.salida).write_text(documento, encoding="utf-8")
        print(f"Plan guardado en: {args.salida}", file=sys.stderr)
    else:
        print(documento)

    return 0


if __name__ == "__main__":
    sys.exit(main())
