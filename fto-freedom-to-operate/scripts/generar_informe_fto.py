#!/usr/bin/env python3
"""
generar_informe_fto.py
Skill: fto-freedom-to-operate

Genera un informe estructurado de Freedom to Operate (FTO) a partir de la
descripción del producto analizado, las jurisdicciones de interés y una lista
de patentes evaluadas.

Uso:
    python scripts/generar_informe_fto.py --interactivo
    python scripts/generar_informe_fto.py \
        --producto "Dispositivo IoT agrícola" \
        --jurisdicciones "ES,US,BR" \
        --salida informe_fto.md

Requisitos: Python 3.9+. Solo biblioteca estándar.
"""

import argparse
import sys
from datetime import date


# ---------------------------------------------------------------------------
# Plantilla principal del informe FTO
# ---------------------------------------------------------------------------

PLANTILLA_INFORME = """\
# Informe de Freedom to Operate (FTO)

**Tecnología / Producto analizado**: {producto}  
**Jurisdicción(es)**: {jurisdicciones}  
**Bases consultadas**: {bases}  
**Período de búsqueda**: {periodo}  
**Fecha del informe**: {fecha}  
**Preparado por**: {analista}  

---

## 1. Resumen Ejecutivo

{resumen_ejecutivo}

**Nivel de riesgo global**: {riesgo_global}

---

## 2. Alcance del Análisis

- **Tecnología evaluada**: {producto}
- **Jurisdicciones cubiertas**: {jurisdicciones}
- **Bases de patentes consultadas**: {bases}
- **Período de búsqueda**: {periodo}
- **Número de patentes evaluadas**: {num_patentes}

---

## 3. Patentes Identificadas y Nivel de Riesgo

| Patente | Titular | Estado | Jurisdicción | Reivindicación clave | Riesgo | Acción sugerida |
|---------|---------|--------|--------------|----------------------|--------|-----------------|
{tabla_patentes}

---

## 4. Análisis Detallado por Patente

{detalle_patentes}

---

## 5. Estrategias de Mitigación

{estrategias}

---

## 6. Conclusiones y Recomendaciones

{conclusiones}

---

## Advertencia Legal

Este informe es orientativo y **no constituye asesoramiento jurídico formal**.
Las conclusiones sobre riesgo de infracción deben ser validadas por un abogado
o agente de patentes calificado. El estado legal de las patentes puede cambiar;
se recomienda actualizar este análisis periódicamente y antes de cualquier
decisión comercial relevante.
"""

PLANTILLA_PATENTE = """\
### Patente {num}: {numero}

- **Titular**: {titular}
- **Estado legal**: {estado}
- **Jurisdicción**: {jurisdiccion}
- **Clasificación IPC/CPC**: {clasificacion}
- **Fecha de expiración estimada**: {expiracion}

**Reivindicación independiente relevante**:

> {reivindicacion}

**Análisis de correspondencia con el producto**:

{analisis_elementos}

**Conclusión de infracción**: {conclusion}  
**Nivel de riesgo**: {riesgo}  
**Justificación**: {justificacion}

**Opciones de mitigación**:
{mitigacion}

---
"""

ESTRATEGIAS_TEMPLATE = """\
### Design Around
Alternativas técnicas identificadas para evitar cubrir todas las características
de las reivindicaciones independientes de riesgo alto o medio:

{design_around}

### Licenciamiento
En caso de que las alternativas técnicas no sean viables, se recomienda evaluar
la posibilidad de negociar una licencia con los titulares de las siguientes
patentes:

{licenciamiento}

### Invalidación por Prior Art
Se ha identificado posible prior art que podría ser utilizado para impugnar
la validez de las siguientes patentes:

{prior_art}
"""


# ---------------------------------------------------------------------------
# Funciones auxiliares
# ---------------------------------------------------------------------------

def solicitar(prompt: str, default: str = "") -> str:
    """Solicita un valor al usuario con prompt."""
    if default:
        respuesta = input(f"{prompt} [{default}]: ").strip()
        return respuesta if respuesta else default
    return input(f"{prompt}: ").strip()


def solicitar_patente(num: int) -> dict:
    """Solicita los datos de una patente de forma interactiva."""
    print(f"\n--- Patente {num} ---")
    numero = solicitar("  Número de patente (ej. EP1234567)")
    titular = solicitar("  Titular")
    estado = solicitar("  Estado legal (vigente/expirada/solicitud/abandonada)", "vigente")
    jurisdiccion = solicitar("  Jurisdicción (ej. ES, US, EU)", "ES")
    clasificacion = solicitar("  Clasificación IPC/CPC (opcional)", "—")
    expiracion = solicitar("  Fecha de expiración estimada (aaaa-mm-dd o 'N/A')", "N/A")
    reivindicacion = solicitar("  Reivindicación independiente principal (resumen)")

    print("  Análisis de elementos (texto libre):")
    analisis = solicitar("  Análisis de correspondencia con el producto")

    riesgo_raw = solicitar("  Nivel de riesgo (A=Alto/M=Medio/B=Bajo/N=Ninguno)", "B").upper()
    riesgo_map = {"A": "🔴 Alto", "M": "🟡 Medio", "B": "🟢 Bajo", "N": "⚪ Ninguno"}
    riesgo = riesgo_map.get(riesgo_raw, "🟢 Bajo")

    infraccion_map = {
        "🔴 Alto": "Posible infracción literal",
        "🟡 Medio": "Posible infracción por equivalentes",
        "🟢 Bajo": "Infracción improbable",
        "⚪ Ninguno": "Sin correspondencia",
    }
    conclusion = infraccion_map.get(riesgo, "Incierto")

    justificacion = solicitar("  Justificación del nivel de riesgo")
    mitigacion = solicitar("  Opción de mitigación principal (design around / licencia / invalidación / N/A)", "N/A")

    return {
        "num": num,
        "numero": numero,
        "titular": titular,
        "estado": estado,
        "jurisdiccion": jurisdiccion,
        "clasificacion": clasificacion,
        "expiracion": expiracion,
        "reivindicacion": reivindicacion,
        "analisis_elementos": analisis,
        "conclusion": conclusion,
        "riesgo": riesgo,
        "justificacion": justificacion,
        "mitigacion": f"- {mitigacion}",
    }


def solicitar_patentes() -> list[dict]:
    """Solicita la lista de patentes evaluadas."""
    print("\n--- Patentes a incluir en el informe ---")
    print("Ingresa cada patente. Escribe 'FIN' como número cuando termines.\n")
    patentes = []
    i = 1
    while True:
        check = solicitar(f"¿Agregar patente {i}? (S/N)", "S").upper()
        if check != "S":
            break
        patente = solicitar_patente(i)
        patentes.append(patente)
        i += 1
    return patentes


def generar_tabla(patentes: list[dict]) -> str:
    """Genera la tabla Markdown de resumen de patentes."""
    filas = []
    accion_map = {
        "🔴 Alto": "Mitigar urgente",
        "🟡 Medio": "Monitorear / analizar",
        "🟢 Bajo": "Documentar",
        "⚪ Ninguno": "Sin acción",
    }
    for p in patentes:
        accion = accion_map.get(p["riesgo"], "Revisar")
        reivin = p["reivindicacion"][:40] + "..." if len(p["reivindicacion"]) > 40 else p["reivindicacion"]
        fila = f"| {p['numero']} | {p['titular']} | {p['estado']} | {p['jurisdiccion']} | {reivin} | {p['riesgo']} | {accion} |"
        filas.append(fila)
    return "\n".join(filas) if filas else "| — | — | — | — | — | — | — |"


def generar_detalle(patentes: list[dict]) -> str:
    """Genera el detalle completo de cada patente."""
    secciones = []
    for p in patentes:
        seccion = PLANTILLA_PATENTE.format(**p)
        secciones.append(seccion)
    return "\n".join(secciones) if secciones else "Sin patentes analizadas."


def calcular_riesgo_global(patentes: list[dict]) -> str:
    """Calcula el riesgo global a partir de los niveles individuales."""
    niveles = [p["riesgo"] for p in patentes]
    if "🔴 Alto" in niveles:
        return "🔴 **ALTO** — Se identificaron patentes con infracción literal probable"
    elif "🟡 Medio" in niveles:
        return "🟡 **MEDIO** — Se identificaron patentes con posible infracción por equivalentes"
    elif "🟢 Bajo" in niveles:
        return "🟢 **BAJO** — Riesgo reducido, monitoreo recomendado"
    else:
        return "⚪ **NINGUNO** — No se identificaron patentes bloqueantes"


def generar_resumen_ejecutivo(producto: str, patentes: list[dict], jurisdicciones: str) -> str:
    """Genera el resumen ejecutivo automáticamente."""
    alto = sum(1 for p in patentes if "Alto" in p["riesgo"])
    medio = sum(1 for p in patentes if "Medio" in p["riesgo"])
    bajo = sum(1 for p in patentes if "Bajo" in p["riesgo"])
    ninguno = sum(1 for p in patentes if "Ninguno" in p["riesgo"])
    total = len(patentes)

    resumen = (
        f"Se analizaron **{total} patente(s)** en relación con el producto: *{producto}*, "
        f"para las jurisdicciones: **{jurisdicciones}**.\n\n"
        f"- Patentes de riesgo **alto**: {alto}  \n"
        f"- Patentes de riesgo **medio**: {medio}  \n"
        f"- Patentes de riesgo **bajo**: {bajo}  \n"
        f"- Patentes **sin riesgo**: {ninguno}  \n\n"
    )

    if alto > 0:
        resumen += (
            "Se identificaron patentes con posible infracción literal que requieren "
            "atención inmediata. Se recomienda evaluar opciones de design around, "
            "licenciamiento o invalidación antes de la comercialización del producto."
        )
    elif medio > 0:
        resumen += (
            "Se identificaron patentes con riesgo medio que requieren análisis adicional "
            "y monitoreo. Se recomienda consultar con un abogado de PI antes de proceder."
        )
    else:
        resumen += (
            "No se identificaron patentes con alto riesgo de infracción para el producto "
            "analizado. Se recomienda documentar este análisis y actualizarlo periódicamente."
        )

    return resumen


def generar_estrategias(patentes: list[dict]) -> str:
    """Genera las estrategias de mitigación consolidadas."""
    da_list = [f"- **{p['numero']}** ({p['titular']}): [describir alternativa técnica]"
               for p in patentes if "Alto" in p["riesgo"] or "Medio" in p["riesgo"]]
    lic_list = [f"- **{p['numero']}** ({p['titular']})"
                for p in patentes if "Alto" in p["riesgo"]]
    pa_list = [f"- **{p['numero']}**: [identificar prior art específico]"
               for p in patentes if "Alto" in p["riesgo"] or "Medio" in p["riesgo"]]

    return ESTRATEGIAS_TEMPLATE.format(
        design_around="\n".join(da_list) if da_list else "- No se requieren acciones inmediatas.",
        licenciamiento="\n".join(lic_list) if lic_list else "- No aplica.",
        prior_art="\n".join(pa_list) if pa_list else "- No aplica.",
    )


def generar_conclusiones(patentes: list[dict], producto: str) -> str:
    """Genera las conclusiones finales."""
    alto = sum(1 for p in patentes if "Alto" in p["riesgo"])
    if alto > 0:
        return (
            f"1. **Prioridad alta**: Revisar con un abogado de PI las patentes de riesgo alto "
            f"antes de comercializar *{producto}*.\n"
            "2. Evaluar diseños alternativos que eliminen los elementos bloqueantes.\n"
            "3. Mantener registro documentado de este análisis (buena fe).\n"
            "4. Actualizar el análisis FTO antes del lanzamiento y anualmente."
        )
    else:
        return (
            f"1. El análisis no identifica riesgos inmediatos para *{producto}*.\n"
            "2. Establecer alertas de vigilancia para nuevas publicaciones de patentes relevantes.\n"
            "3. Actualizar este informe FTO periódicamente (recomendado: cada 6-12 meses).\n"
            "4. Documentar el análisis realizado para demostrar diligencia debida."
        )


def modo_interactivo() -> dict:
    """Recopila todos los parámetros de forma interactiva."""
    print("\n====================================================")
    print(" Generador de Informe FTO — Freedom to Operate")
    print("====================================================\n")

    producto = solicitar("Descripción del producto / tecnología analizada")
    jurisdicciones = solicitar("Jurisdicciones (ej. ES, US, BR)", "ES")
    bases = solicitar("Bases de patentes consultadas", "Espacenet, Google Patents, Patentscope")
    periodo = solicitar("Período de búsqueda (ej. 2000-2025)", "últimos 20 años")
    analista = solicitar("Nombre del analista", "Equipo de PI")

    patentes = solicitar_patentes()

    return {
        "producto": producto,
        "jurisdicciones": jurisdicciones,
        "bases": bases,
        "periodo": periodo,
        "analista": analista,
        "patentes": patentes,
    }


def generar_informe(datos: dict) -> str:
    """Genera el informe FTO completo a partir de los datos."""
    patentes = datos.get("patentes", [])
    resumen = generar_resumen_ejecutivo(datos["producto"], patentes, datos["jurisdicciones"])
    riesgo_global = calcular_riesgo_global(patentes)
    tabla = generar_tabla(patentes)
    detalle = generar_detalle(patentes)
    estrategias = generar_estrategias(patentes)
    conclusiones = generar_conclusiones(patentes, datos["producto"])

    return PLANTILLA_INFORME.format(
        producto=datos["producto"],
        jurisdicciones=datos["jurisdicciones"],
        bases=datos.get("bases", "Espacenet, Google Patents, Patentscope"),
        periodo=datos.get("periodo", "últimos 20 años"),
        fecha=date.today().isoformat(),
        analista=datos.get("analista", "Equipo de PI"),
        resumen_ejecutivo=resumen,
        riesgo_global=riesgo_global,
        num_patentes=len(patentes),
        tabla_patentes=tabla,
        detalle_patentes=detalle,
        estrategias=estrategias,
        conclusiones=conclusiones,
    )


# ---------------------------------------------------------------------------
# Punto de entrada
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Genera un informe FTO estructurado.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--interactivo", action="store_true",
                        help="Modo interactivo guiado paso a paso")
    parser.add_argument("--producto", type=str, help="Descripción del producto a analizar")
    parser.add_argument("--jurisdicciones", type=str, default="ES",
                        help="Jurisdicciones separadas por coma (ej. ES,US,BR)")
    parser.add_argument("--salida", type=str, default="",
                        help="Archivo de salida Markdown (opcional)")

    args = parser.parse_args()

    if args.interactivo:
        datos = modo_interactivo()
    elif args.producto:
        # Modo mínimo: genera informe con estructura vacía lista para completar
        datos = {
            "producto": args.producto,
            "jurisdicciones": args.jurisdicciones,
            "bases": "Espacenet, Google Patents, Patentscope",
            "periodo": "últimos 20 años",
            "analista": "Por completar",
            "patentes": [
                {
                    "num": 1,
                    "numero": "[Número de patente]",
                    "titular": "[Titular]",
                    "estado": "[Estado]",
                    "jurisdiccion": args.jurisdicciones.split(",")[0],
                    "clasificacion": "—",
                    "expiracion": "N/A",
                    "reivindicacion": "[Completar con reivindicación independiente]",
                    "analisis_elementos": "[Completar análisis elemento a elemento]",
                    "conclusion": "Incierto",
                    "riesgo": "🟡 Medio",
                    "justificacion": "Requiere análisis detallado",
                    "mitigacion": "- Por determinar",
                }
            ],
        }
    else:
        print("Error: usa --interactivo o proporciona al menos --producto.")
        print("Ejemplo: python scripts/generar_informe_fto.py --interactivo")
        sys.exit(1)

    informe = generar_informe(datos)

    if args.salida:
        with open(args.salida, "w", encoding="utf-8") as f:
            f.write(informe)
        print(f"\n✅ Informe FTO guardado en: {args.salida}")
    else:
        print("\n" + "=" * 60)
        print(informe)
        print("=" * 60)
        print("\n💡 Tip: usa --salida nombre_archivo.md para guardar el resultado.")


if __name__ == "__main__":
    main()
