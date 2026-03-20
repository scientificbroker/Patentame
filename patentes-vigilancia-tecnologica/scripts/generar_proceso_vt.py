#!/usr/bin/env python3
"""
Genera un documento de proceso de Vigilancia Tecnológica (VT) personalizado.

Uso:
  python generar_proceso_vt.py [--sector SECTOR] [--objetivo OBJETIVO] [--salida ARCHIVO]
  python generar_proceso_vt.py --interactivo

Salida: Documento Markdown con el proceso de VT estructurado en 5 fases.
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path


PLANTILLA_PROCESO = """# Proceso de Vigilancia Tecnológica

**Proyecto**: {titulo}
**Sector/Ámbito**: {sector}
**Objetivo principal**: {objetivo}
**Fecha de elaboración**: {fecha}

---

## 1. Definición de necesidades

### 1.1 Preguntas a responder
- ¿Qué decisiones se apoyarán con la información?
- ¿Qué tecnologías o competidores son prioritarios?
- ¿Cuál es el horizonte temporal (corto, medio, largo plazo)?

### 1.2 Alcance definido
| Criterio | Definición |
|----------|------------|
| Tecnologías clave | {tecnologias} |
| Competidores a vigilar | {competidores} |
| Regiones/Jurisdicciones | {regiones} |
| Período de revisión | {periodicidad} |

### 1.3 Entregables esperados
- [ ] Informes periódicos de vigilancia
- [ ] Alertas sobre actividad relevante
- [ ] Base de conocimiento actualizada
- [ ] Recomendaciones estratégicas

---

## 2. Selección de fuentes

### 2.1 Fuentes de patentes
| Fuente | URL | Uso |
|--------|-----|-----|
| Espacenet | https://worldwide.espacenet.com | Búsqueda mundial |
| OEPM | https://www.oepm.es | España |
| USPTO | https://patft.uspto.gov | Estados Unidos |
| Patentscope (WIPO) | https://patentscope.wipo.int | PCT/internacional |

### 2.2 Otras fuentes
- [ ] Publicaciones científicas (Scopus, Web of Science, Google Scholar)
- [ ] Normativa y estándares
- [ ] Noticias sectoriales
- [ ] Bases de datos empresariales
- [ ] Eventos y congresos

### 2.3 Alertas configuradas
- [ ] Búsqueda en bases de patentes (términos clave)
- [ ] Alertas por IPC/CPC
- [ ] Seguimiento de competidores específicos

---

## 3. Recolección

### 3.1 Estrategia de búsqueda
- **Términos clave**: Identificar y documentar sinónimos en ES/EN
- **Clasificaciones IPC/CPC**: Definir códigos relevantes
- **Operadores**: AND, OR, NEAR, truncamiento según base

### 3.2 Frecuencia de recolección
| Actividad | Frecuencia | Responsable |
|-----------|------------|-------------|
| Revisión de alertas | {frecuencia_alertas} | |
| Búsqueda manual complementaria | {frecuencia_manual} | |
| Actualización de base de datos | {frecuencia_bd} | |

### 3.3 Registro de resultados
- Formato estándar: título, fuente, fecha, URL, resumen
- Herramienta: hoja de cálculo / base de datos / gestor de referencias

---

## 4. Análisis

### 4.1 Criterios de análisis
- Relevancia tecnológica
- Potencial impacto en la organización
- Actividad de competidores
- Tendencias emergentes

### 4.2 Indicadores a calcular
- [ ] Número de documentos por período
- [ ] Distribución por titular/competidor
- [ ] Evolución temporal
- [ ] Concentración geográfica
- [ ] Clasificaciones más activas

### 4.3 Matriz de priorización
| Documento | Relevancia (1-5) | Impacto (1-5) | Acción |
|-----------|------------------|---------------|--------|
| | | | |

---

## 5. Difusión

### 5.1 Destinatarios
- [ ] Dirección / toma de decisiones
- [ ] I+D / equipos técnicos
- [ ] Comercial / negocio

### 5.2 Formato de informes
- **Informe ejecutivo**: resumen mensual/trimestral
- **Informe técnico**: detalle por tecnología
- **Alertas**: comunicaciones urgentes

### 5.3 Canal y periodicidad
- Entrega: {canal_entrega}
- Frecuencia de informes: {frecuencia_informes}

### 5.4 Retroalimentación
- [ ] Revisión de utilidad del proceso
- [ ] Ajuste de necesidades y fuentes
- [ ] Actualización de términos de búsqueda

---

## Anexo: Checklist de arranque

- [ ] Necesidades definidas y validadas
- [ ] Fuentes seleccionadas y accesibles
- [ ] Alertas configuradas en bases de patentes
- [ ] Herramienta de registro operativa
- [ ] Calendario de revisiones establecido
- [ ] Destinatarios y formato de informes acordados
"""


def generar_proceso(
    sector: str = "A definir",
    objetivo: str = "Identificar tendencias, competidores y oportunidades tecnológicas",
    tecnologias: str = "A definir según sector",
    competidores: str = "A identificar",
    regiones: str = "España, Europa, ámbito de interés",
    periodicidad: str = "Trimestral",
    frecuencia_alertas: str = "Semanal",
    frecuencia_manual: str = "Mensual",
    frecuencia_bd: str = "Mensual",
    canal_entrega: str = "Correo / plataforma interna",
    frecuencia_informes: str = "Trimestral",
    titulo: str | None = None,
) -> str:
    """Genera el documento de proceso VT."""
    titulo = titulo or f"Vigilancia Tecnológica - {sector}"
    fecha = datetime.now().strftime("%Y-%m-%d")

    return PLANTILLA_PROCESO.format(
        titulo=titulo,
        sector=sector,
        objetivo=objetivo,
        tecnologias=tecnologias,
        competidores=competidores,
        regiones=regiones,
        periodicidad=periodicidad,
        frecuencia_alertas=frecuencia_alertas,
        frecuencia_manual=frecuencia_manual,
        frecuencia_bd=frecuencia_bd,
        canal_entrega=canal_entrega,
        frecuencia_informes=frecuencia_informes,
        fecha=fecha,
    )


def modo_interactivo() -> dict:
    """Solicita parámetros por consola."""
    print("=== Generador de Proceso de Vigilancia Tecnológica ===\n")
    return {
        "sector": input("Sector/ámbito [A definir]: ").strip() or "A definir",
        "objetivo": input(
            "Objetivo principal [Identificar tendencias...]: "
        ).strip()
        or "Identificar tendencias, competidores y oportunidades tecnológicas",
        "tecnologias": input("Tecnologías clave [A definir]: ").strip()
        or "A definir según sector",
        "competidores": input("Competidores a vigilar [A identificar]: ").strip()
        or "A identificar",
        "regiones": input("Regiones [España, Europa...]: ").strip()
        or "España, Europa, ámbito de interés",
        "periodicidad": input("Período de revisión [Trimestral]: ").strip()
        or "Trimestral",
        "frecuencia_alertas": input("Frecuencia alertas [Semanal]: ").strip()
        or "Semanal",
        "frecuencia_manual": input("Búsqueda manual [Mensual]: ").strip()
        or "Mensual",
        "frecuencia_bd": input("Actualización BD [Mensual]: ").strip()
        or "Mensual",
        "canal_entrega": input("Canal de entrega [Correo/plataforma]: ").strip()
        or "Correo / plataforma interna",
        "frecuencia_informes": input("Frecuencia informes [Trimestral]: ").strip()
        or "Trimestral",
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Genera un documento de proceso de Vigilancia Tecnológica"
    )
    parser.add_argument("--sector", "-s", default="A definir")
    parser.add_argument("--objetivo", "-o", default="")
    parser.add_argument("--tecnologias", "-t", default="A definir según sector")
    parser.add_argument("--competidores", "-c", default="A identificar")
    parser.add_argument("--regiones", "-r", default="España, Europa, ámbito de interés")
    parser.add_argument("--periodicidad", "-p", default="Trimestral")
    parser.add_argument("--salida", "-S", help="Archivo de salida (Markdown)")
    parser.add_argument("--interactivo", "-i", action="store_true")
    args = parser.parse_args()

    if args.interactivo:
        params = modo_interactivo()
        documento = generar_proceso(**params)
    else:
        documento = generar_proceso(
            sector=args.sector,
            objetivo=args.objetivo or "Identificar tendencias, competidores y oportunidades tecnológicas",
            tecnologias=args.tecnologias,
            competidores=args.competidores,
            regiones=args.regiones,
            periodicidad=args.periodicidad,
        )

    if args.salida:
        Path(args.salida).write_text(documento, encoding="utf-8")
        print(f"Proceso guardado en: {args.salida}", file=sys.stderr)
    else:
        print(documento)

    return 0


if __name__ == "__main__":
    sys.exit(main())
