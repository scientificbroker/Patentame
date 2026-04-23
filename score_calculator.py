"""
fto_score_calculator.py
Calculadora de score de riesgo FTO por patente.
Uso: python fto_score_calculator.py
"""

def calculate_fto_score(patent_data: dict) -> dict:
    """
    Calcula el score de riesgo FTO compuesto (0-100) para una patente.
    
    Args:
        patent_data: dict con los siguientes campos:
            - claim_coverage: float (0-1) fracción de elementos del claim presentes
            - claim_mode: str "literal" | "equivalent" | "partial" | "none"
            - is_active: bool
            - territories_overlap: float (0-1) fracción de territorios objetivo cubiertos
            - years_remaining: int
            - holder_type: str "npe" | "large_corp" | "mid_corp" | "university" | "individual"
            - claim_breadth: str "broad" | "moderate" | "narrow"
            - prior_art_available: str "robust" | "some" | "scarce"
            - technical_similarity: str "identical" | "high" | "moderate" | "low"
    
    Returns:
        dict con score total, desglose por dimensión, nivel de riesgo y color
    """
    
    scores = {}
    
    # ── DIMENSIÓN 1: Cobertura de claims (35 pts) ──────────────────────────
    coverage = patent_data.get("claim_coverage", 0)
    mode = patent_data.get("claim_mode", "none")
    
    if coverage >= 1.0 and mode == "literal":
        d1 = 35
    elif coverage >= 1.0 and mode == "equivalent":
        d1 = 28
    elif coverage >= 0.9 and mode in ["literal", "equivalent"]:
        d1 = 25
    elif coverage >= 0.7:
        d1 = 18
    elif coverage >= 0.5:
        d1 = 10
    elif coverage >= 0.3:
        d1 = 5
    else:
        d1 = 0
    
    scores["claim_coverage"] = {
        "score": d1,
        "max": 35,
        "input": f"Coverage: {coverage:.0%}, Mode: {mode}"
    }
    
    # ── DIMENSIÓN 2: Vigencia y territorio (20 pts) ────────────────────────
    is_active = patent_data.get("is_active", False)
    territories = patent_data.get("territories_overlap", 0)
    years = patent_data.get("years_remaining", 0)
    
    if not is_active or territories == 0:
        d2 = 0
    elif territories >= 0.9 and years > 10:
        d2 = 20
    elif territories >= 0.7 and years > 5:
        d2 = 15
    elif territories >= 0.5 and years > 2:
        d2 = 10
    elif years > 0:
        d2 = 5
    else:
        d2 = 0
    
    scores["validity_territory"] = {
        "score": d2,
        "max": 20,
        "input": f"Active: {is_active}, Territory overlap: {territories:.0%}, Years remaining: {years}"
    }
    
    # ── DIMENSIÓN 3: Calidad del titular (15 pts) ──────────────────────────
    holder_map = {
        "npe": 15,          # Non-practicing entity / patent troll
        "large_corp": 12,   # Gran corporación con historial litigante
        "mid_corp": 8,      # Empresa mediana
        "university": 5,    # Universidad con OTT
        "individual": 3,    # Inventor individual
    }
    d3 = holder_map.get(patent_data.get("holder_type", "individual"), 3)
    
    scores["holder_quality"] = {
        "score": d3,
        "max": 15,
        "input": f"Holder type: {patent_data.get('holder_type', 'unknown')}"
    }
    
    # ── DIMENSIÓN 4: Solidez de la patente (15 pts) ────────────────────────
    breadth_map = {"broad": 3, "moderate": 1, "narrow": 0}
    prior_art_map = {"scarce": 12, "some": 6, "robust": 0}
    
    breadth_score = breadth_map.get(patent_data.get("claim_breadth", "moderate"), 1)
    prior_art_score = prior_art_map.get(patent_data.get("prior_art_available", "some"), 6)
    d4 = breadth_score + prior_art_score
    
    scores["patent_strength"] = {
        "score": d4,
        "max": 15,
        "input": f"Breadth: {patent_data.get('claim_breadth')}, Prior art: {patent_data.get('prior_art_available')}"
    }
    
    # ── DIMENSIÓN 5: Proximidad técnica (15 pts) ───────────────────────────
    similarity_map = {
        "identical": 15,
        "high": 11,
        "moderate": 6,
        "low": 2,
    }
    d5 = similarity_map.get(patent_data.get("technical_similarity", "moderate"), 6)
    
    scores["technical_proximity"] = {
        "score": d5,
        "max": 15,
        "input": f"Technical similarity: {patent_data.get('technical_similarity')}"
    }
    
    # ── SCORE TOTAL ────────────────────────────────────────────────────────
    total = d1 + d2 + d3 + d4 + d5
    
    # Nivel de riesgo
    if total >= 75:
        level = "CRÍTICO"
        color = "🔴"
        action = "Detener y consultar abogado inmediatamente"
    elif total >= 50:
        level = "ALTO"
        color = "🟠"
        action = "Análisis legal formal requerido antes de continuar"
    elif total >= 25:
        level = "MODERADO"
        color = "🟡"
        action = "Monitorear; considerar design-around preventivo"
    elif total >= 10:
        level = "BAJO"
        color = "🟢"
        action = "Riesgo controlable; documentar análisis"
    else:
        level = "MÍNIMO"
        color = "✅"
        action = "Proceder con cautela normal"
    
    return {
        "total_score": total,
        "level": level,
        "color": color,
        "recommended_action": action,
        "breakdown": scores,
        "summary_table": _format_table(scores, total)
    }


def _format_table(scores: dict, total: int) -> str:
    """Genera tabla markdown del desglose de score."""
    
    labels = {
        "claim_coverage": "Cobertura de claims",
        "validity_territory": "Vigencia y territorio",
        "holder_quality": "Calidad del titular",
        "patent_strength": "Solidez de la patente",
        "technical_proximity": "Proximidad técnica",
    }
    
    lines = [
        "| Dimensión | Pts obtenidos | Pts máx | Input |",
        "|-----------|--------------|---------|-------|",
    ]
    
    for key, data in scores.items():
        label = labels.get(key, key)
        lines.append(
            f"| {label} | {data['score']} | {data['max']} | {data['input']} |"
        )
    
    lines.append(f"| **TOTAL** | **{total}** | **100** | |")
    return "\n".join(lines)


def calculate_global_fto_score(patent_scores: list) -> dict:
    """
    Calcula el score FTO global del análisis completo.
    Usa las 5 patentes con mayor score individual (worst case).
    
    Args:
        patent_scores: lista de dicts con total_score por patente
    
    Returns:
        dict con score global y recomendación general
    """
    if not patent_scores:
        return {"global_score": 0, "recommendation": "SIN RIESGO IDENTIFICADO"}
    
    # Ponderar: la patente más riesgosa tiene más peso
    sorted_scores = sorted(
        [p["total_score"] for p in patent_scores], 
        reverse=True
    )
    
    # Pesos: 40% patente más riesgosa, 25% segunda, 15%, 12%, 8%
    weights = [0.40, 0.25, 0.15, 0.12, 0.08]
    top5 = sorted_scores[:5]
    
    # Rellenar con 0 si hay menos de 5 patentes
    while len(top5) < 5:
        top5.append(0)
    
    global_score = sum(s * w for s, w in zip(top5, weights))
    global_score = round(global_score)
    
    if global_score >= 60:
        rec = "DETENER — Riesgo de infracción significativo. Requiere análisis legal urgente."
    elif global_score >= 40:
        rec = "PRECAUCIÓN — Riesgos identificados. Consultar abogado antes de lanzamiento."
    elif global_score >= 20:
        rec = "PROCEDER CON MONITOREO — Riesgos moderados controlables."
    else:
        rec = "PROCEDER — Sin riesgos significativos identificados."
    
    return {
        "global_score": global_score,
        "patents_analyzed": len(patent_scores),
        "recommendation": rec,
        "top5_scores": top5
    }


# ── EJEMPLO DE USO ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    
    # Ejemplo: patente de apósito con quitosán vs. tecnología Patch Healing
    example_patent = {
        "claim_coverage": 0.85,          # 85% de elementos presentes
        "claim_mode": "equivalent",      # algunos por equivalencia
        "is_active": True,
        "territories_overlap": 0.6,      # vigente en 3 de 5 territorios objetivo
        "years_remaining": 8,
        "holder_type": "large_corp",
        "claim_breadth": "moderate",
        "prior_art_available": "some",
        "technical_similarity": "high",
    }
    
    result = calculate_fto_score(example_patent)
    
    print(f"\n{'='*60}")
    print(f"SCORE FTO: {result['total_score']}/100 {result['color']} {result['level']}")
    print(f"Acción recomendada: {result['recommended_action']}")
    print(f"\nDesglose:\n{result['summary_table']}")
    print('='*60)
