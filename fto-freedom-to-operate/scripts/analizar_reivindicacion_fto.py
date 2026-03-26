#!/usr/bin/env python3
"""
analizar_reivindicacion_fto.py
Skill: fto-freedom-to-operate

Analiza una reivindicación de patente elemento a elemento frente a un
producto o proceso concreto, generando un resumen de riesgo FTO.

Uso:
    python scripts/analizar_reivindicacion_fto.py --interactivo
    python scripts/analizar_reivindicacion_fto.py --patente "EP1234567" \
        --tecnologia "sistema de filtrado" --salida resultado.md

Requisitos: Python 3.9+. Solo biblioteca estándar.
"""

import argparse
import sys
from datetime import date


# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

NIVELES_RIESGO = {
    "A": "Alto",
    "M": "Medio",
    "B": "Bajo",
    "N": "Ninguno",
}

PLANTILLA_MD = """\
# Análisis FTO — Reivindicación de Patente

**Patente analizada**: {patente}  
**Titular**: {titular}  
**Tecnología / Producto evaluado**: {tecnologia}  
**Jurisdicción**: {jurisdiccion}  
**Estado legal**: {estado_legal}  
**Fecha del análisis**: {fecha}  

---

## Reivindicación Independiente Analizada

{reivindicacion}

---

## Análisis Elemento a Elemento

| # | Elemento de la reivindicación | Presente en el producto | Observaciones |
|---|-------------------------------|------------------------|---------------|
{tabla_elementos}

---

## Conclusión de Riesgo FTO

**Resultado**: {conclusion_infraccion}  
**Nivel de riesgo**: {nivel_riesgo}  

**Justificación**:  
{justificacion}

---

## Opciones de Mitigación

{mitigacion}

---

## Advertencia Legal

Este análisis es orientativo y no constituye asesoramiento jurídico formal.
Las conclusiones sobre infracción deben ser validadas por un abogado o agente
de patentes calificado. El estado legal de las patentes puede cambiar.
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


def solicitar_elementos() -> list[dict]:
    """Solicita los elementos de la reivindicación de forma interactiva."""
    elementos = []
    print("\n--- Elementos de la reivindicación ---")
    print("Introduce cada elemento de la reivindicación independiente.")
    print("Escribe 'FIN' cuando termines.\n")

    i = 1
    while True:
        elemento = solicitar(f"Elemento {i}").strip()
        if elemento.upper() == "FIN" or not elemento:
            if not elementos:
                print("Debes ingresar al menos un elemento.")
                continue
            break

        presente_raw = solicitar(
            f"  ¿Está presente en el producto? (S=Sí / N=No / I=Incierto)", "I"
        ).upper()
        presente_map = {"S": "✅ Sí", "N": "❌ No", "I": "⚠️ Incierto"}
        presente = presente_map.get(presente_raw, "⚠️ Incierto")

        obs = solicitar("  Observaciones (opcional)")

        elementos.append({
            "num": i,
            "elemento": elemento,
            "presente": presente,
            "observaciones": obs,
        })
        i += 1

    return elementos


def calcular_nivel_riesgo(elementos: list[dict]) -> tuple[str, str]:
    """
    Calcula el nivel de riesgo y la conclusión basándose en los elementos.
    Regla ALL-elements: infracción solo si TODOS están presentes.
    """
    presentes = sum(1 for e in elementos if "✅" in e["presente"])
    inciertos = sum(1 for e in elementos if "⚠️" in e["presente"])
    total = len(elementos)

    if presentes == total:
        return "Posible infracción literal", "Alto"
    elif presentes + inciertos == total and inciertos > 0:
        return "Posible infracción por equivalentes (incierto)", "Medio"
    elif presentes > 0:
        return "No se cumplen todos los elementos — infracción improbable", "Bajo"
    else:
        return "Sin correspondencia — no hay infracción", "Ninguno"


def generar_tabla_elementos(elementos: list[dict]) -> str:
    """Genera la tabla Markdown de elementos."""
    filas = []
    for e in elementos:
        obs = e["observaciones"] if e["observaciones"] else "—"
        fila = f"| {e['num']} | {e['elemento']} | {e['presente']} | {obs} |"
        filas.append(fila)
    return "\n".join(filas)


def generar_mitigacion(nivel: str) -> str:
    """Genera el bloque de opciones de mitigación según el nivel de riesgo."""
    if nivel == "Alto":
        return (
            "### 1. Design Around\n"
            "Rediseñar el producto para eliminar al menos uno de los elementos "
            "de la reivindicación independiente bloqueante.\n\n"
            "### 2. Licenciamiento\n"
            "Evaluar la posibilidad de negociar una licencia con el titular de la patente.\n\n"
            "### 3. Invalidación\n"
            "Buscar prior art que demuestre que la reivindicación no es novedosa "
            "o carece de actividad inventiva para iniciar un procedimiento de nulidad.\n\n"
            "### 4. Opinión FTO formal\n"
            "Obtener una opinión escrita de un abogado o agente de patentes "
            "para documentar la buena fe y evaluar riesgo real."
        )
    elif nivel == "Medio":
        return (
            "### 1. Monitoreo\n"
            "Seguir el estado de la patente y posibles reivindicaciones adicionales.\n\n"
            "### 2. Análisis ampliado\n"
            "Profundizar en los elementos inciertos con asesoramiento legal.\n\n"
            "### 3. Design Around preventivo\n"
            "Considerar alternativas técnicas para los elementos ambiguos."
        )
    else:
        return (
            "### Bajo riesgo identificado\n"
            "Se recomienda documentar el análisis y revisarlo periódicamente "
            "ante posibles cambios en el estado de la patente o nuevas publicaciones."
        )


def modo_interactivo() -> dict:
    """Recopila todos los parámetros de forma interactiva."""
    print("\n====================================================")
    print(" Analizador FTO — Análisis Elemento a Elemento")
    print("====================================================\n")

    patente = solicitar("Número de patente (ej. EP1234567)")
    titular = solicitar("Titular de la patente", "Desconocido")
    tecnologia = solicitar("Tecnología / Producto a evaluar")
    jurisdiccion = solicitar("Jurisdicción analizada (ej. ES, US, EU)", "ES")
    estado_legal = solicitar(
        "Estado legal de la patente (vigente / expirada / solicitud / otra)", "vigente"
    )

    print("\nReivindicación independiente a analizar:")
    print("(Escribe el texto completo — pulsa Enter dos veces para terminar)\n")
    lineas = []
    while True:
        linea = input()
        if linea == "" and lineas and lineas[-1] == "":
            break
        lineas.append(linea)
    reivindicacion = "\n".join(lineas).strip()

    elementos = solicitar_elementos()

    print("\nJustificación / notas adicionales:")
    justificacion = solicitar("Justificación")

    return {
        "patente": patente,
        "titular": titular,
        "tecnologia": tecnologia,
        "jurisdiccion": jurisdiccion,
        "estado_legal": estado_legal,
        "reivindicacion": reivindicacion,
        "elementos": elementos,
        "justificacion": justificacion,
    }


def generar_documento(datos: dict) -> str:
    """Genera el documento Markdown a partir de los datos recopilados."""
    conclusion, nivel = calcular_nivel_riesgo(datos["elementos"])
    tabla = generar_tabla_elementos(datos["elementos"])
    mitigacion = generar_mitigacion(nivel)

    return PLANTILLA_MD.format(
        patente=datos["patente"],
        titular=datos["titular"],
        tecnologia=datos["tecnologia"],
        jurisdiccion=datos["jurisdiccion"],
        estado_legal=datos["estado_legal"],
        fecha=date.today().isoformat(),
        reivindicacion=datos.get("reivindicacion", "—"),
        tabla_elementos=tabla,
        conclusion_infraccion=conclusion,
        nivel_riesgo=nivel,
        justificacion=datos.get("justificacion", "Sin justificación adicional."),
        mitigacion=mitigacion,
    )


# ---------------------------------------------------------------------------
# Punto de entrada
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analiza una reivindicación FTO elemento a elemento.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--interactivo", action="store_true",
                        help="Modo interactivo guiado paso a paso")
    parser.add_argument("--patente", type=str, help="Número de patente a analizar")
    parser.add_argument("--tecnologia", type=str, help="Descripción del producto/proceso")
    parser.add_argument("--salida", type=str, default="",
                        help="Archivo de salida Markdown (opcional)")

    args = parser.parse_args()

    if args.interactivo:
        datos = modo_interactivo()
    elif args.patente and args.tecnologia:
        # Modo mínimo: datos básicos, sin elementos detallados
        datos = {
            "patente": args.patente,
            "titular": "Por determinar",
            "tecnologia": args.tecnologia,
            "jurisdiccion": "Por determinar",
            "estado_legal": "por verificar",
            "reivindicacion": "[Ingresar reivindicación independiente manualmente]",
            "elementos": [
                {
                    "num": 1,
                    "elemento": "[Completar con elementos de la reivindicación]",
                    "presente": "⚠️ Incierto",
                    "observaciones": "Requiere análisis detallado",
                }
            ],
            "justificacion": "Análisis generado con parámetros mínimos. Completar manualmente.",
        }
    else:
        print("Error: usa --interactivo o proporciona --patente y --tecnologia.")
        print("Ejemplo: python scripts/analizar_reivindicacion_fto.py --interactivo")
        sys.exit(1)

    documento = generar_documento(datos)

    if args.salida:
        with open(args.salida, "w", encoding="utf-8") as f:
            f.write(documento)
        print(f"\n✅ Análisis FTO guardado en: {args.salida}")
    else:
        print("\n" + "=" * 60)
        print(documento)
        print("=" * 60)
        print("\n💡 Tip: usa --salida nombre_archivo.md para guardar el resultado.")


if __name__ == "__main__":
    main()
