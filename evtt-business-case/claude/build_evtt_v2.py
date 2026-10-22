#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Business Case FrioRaiz v3 - La invencion universitaria como activo intangible
Nueve celdas esenciales (Cap. 3): costo de desarrollo, precio, costo variable,
unidades y sus crecimientos. Selector de modalidad de licencia (cesion total,
exclusiva, no exclusiva) y ruta alternativa de equity (VC Model + Rutas Berkus).
Adaptado del Manual Tecnico EVTT - David Chaupis Meza, CEO Grupo Biogenia.
"""
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.comments import Comment

# ---------------------------------------------------------------- paleta
INK = "FF2D2926"
MUTED = "FF746B64"
TERRA = "FFC86B4A"
TEAL = "FF49746E"
BLUE = "FF2458A0"
OCHRE = "FFD6A05B"
GREEN = "FF2F7D52"
RED = "FFB3402F"

F_PANEL = "FFFAF7F2"
F_INPUT = "FFFFF0D6"
F_ESS   = "FFFFE3B3"
F_TERRA = "FFF5E7DE"
F_TEAL  = "FFE8F0ED"
F_BLUE  = "FFE6EDF7"
F_BAND  = "FFEFEBE4"

NF_M   = '#,##0.0;(#,##0.0);"–"'
NF_M0  = '#,##0;(#,##0);"–"'
NF_USD = '"US$ "#,##0.0;("US$ "#,##0.0);"–"'
NF_P   = '0.0%;(0.0%);"–"'
NF_P2  = '0.00%;(0.00%);"–"'
NF_X   = '0.0"x"'
NF_D   = '#,##0.0'
NF_I   = '#,##0;(#,##0);"–"'

TITLE = Font(name="Aptos Display", size=18, bold=True, color=INK)
SUB   = Font(name="Aptos", size=10, color=MUTED)
H_W   = Font(name="Aptos", size=10, bold=True, color="FFFFFFFF")
BODY  = Font(name="Aptos", size=10, color=INK)
BODYB = Font(name="Aptos", size=10, bold=True, color=INK)
LINK  = Font(name="Aptos", size=10, color=TEAL)
LINKB = Font(name="Aptos", size=10, bold=True, color=TEAL)
INP   = Font(name="Aptos", size=10, bold=True, color=BLUE)
BIG   = Font(name="Aptos", size=12, bold=True, color=INK)
NOTE  = Font(name="Aptos", size=9, color=MUTED)
SECT  = Font(name="Aptos", size=10, bold=True, color=TERRA)
ESSF  = Font(name="Aptos", size=10, bold=True, color=RED)

fill = lambda c: PatternFill("solid", fgColor=c)
WRAP = Alignment(wrap_text=True, vertical="top")
CTR  = Alignment(horizontal="center")
RGT  = Alignment(horizontal="right")

wb = openpyxl.Workbook()
wb.remove(wb.active)

SH = ["Resumen comité", "Caso y fuentes", "Evidencia Berkus", "Supuestos", "Proyección",
      "Licencia", "VC Model", "Rutas Berkus", "Comparativo", "Cap Table",
      "Sensibilidad", "Negociación", "Gates 90 días", "Guía y control"]
TABS = [TERRA, MUTED, OCHRE, OCHRE, TEAL, BLUE, TEAL, TEAL, TERRA, BLUE, INK, TERRA, OCHRE, MUTED]

for nm, t in zip(SH, TABS):
    ws = wb.create_sheet(nm)
    ws.sheet_properties.tabColor = t
    ws.sheet_view.showGridLines = False

def head(ws, title, sub, widths, span=8):
    ws.column_dimensions["A"].width = 3
    for col, w in widths.items():
        ws.column_dimensions[col].width = w
    for r in (2, 3):
        for c in range(2, span + 1):
            ws.cell(r, c).fill = fill(F_PANEL)
    ws["B2"] = title; ws["B2"].font = TITLE
    ws["B3"] = sub;   ws["B3"].font = SUB
    ws.row_dimensions[2].height = 26

def band(ws, row, cols, text, bg=INK, fg="FFFFFFFF"):
    for c in cols:
        cell = ws.cell(row, c)
        cell.fill = fill(bg)
        cell.font = Font(name="Aptos", size=10, bold=True, color=fg)
    ws.cell(row, cols[0]).value = text

def lbl(ws, row, text, f=BODY, col=2):
    ws.cell(row, col).value = text
    ws.cell(row, col).font = f

def put(ws, row, col, val, nf=None, f=BODY, bg=None, al=None):
    c = ws.cell(row, col)
    c.value = val
    c.font = f
    if nf: c.number_format = nf
    if bg: c.fill = fill(bg)
    if al: c.alignment = al
    return c

def inp(ws, row, col, val, nf=None, essential=False):
    return put(ws, row, col, val, nf, INP if not essential else ESSF, F_ESS if essential else F_INPUT, CTR)

YC = ["C", "D", "E", "F", "G", "H"]
NY = 6

# ================================================================ SUPUESTOS
s = wb["Supuestos"]
head(s, "Supuestos del caso", "Ámbar: lo único que una invención sin ventas puede estimar (Cap. 3). Crema: parámetros de negociación con valores de referencia del curso.",
     {"B": 50, "C": 16, "D": 14, "E": 20, "F": 3, "G": 3}, span=5)

band(s, 5, range(2, 5), "1 · Lo que la universidad debe estimar")
ESS = {}
ess_rows = [
    ("Costo de desarrollo de la tecnología (USD miles)", 200.0, NF_M, "costo_dev"),
    ("Precio de venta por unidad (USD miles)",             30.0, NF_M, "precio"),
    ("Costo variable por unidad (USD miles)",               12.0, NF_M, "cv"),
    ("Unidades estimadas de venta en el año 1",             22,   NF_I, "unid1"),
    ("Crecimiento anual de unidades vendidas",              0.45, NF_P, "crec_unid"),
    ("Gastos operativos (OPEX) en el año 1 (USD miles)",   300.0, NF_M, "opex1"),
    ("Crecimiento anual del OPEX",                          0.12, NF_P, "crec_opex"),
    ("Capital de trabajo (% del crecimiento de ingresos)",  0.07, NF_P, "wc_pct"),
    ("Inversión o ronda buscada (USD miles)",              400.0, NF_M, "inv"),
]
r0 = 6
for i, (t, v, nf, key) in enumerate(ess_rows):
    rr = r0 + i
    lbl(s, rr, t, ESSF)
    inp(s, rr, 3, v, nf, essential=True)
    ESS[key] = f"'Supuestos'!$C${rr}"
s.cell(r0, 2).comment = Comment(
    "Estas nueve celdas son las únicas que exige el Cap. 3 para una invención sin ventas: "
    "costo de desarrollo, precio, costo variable, unidades que espera vender y sus crecimientos.\n"
    "Todo lo demás en esta hoja son parámetros de negociación con valores de referencia del curso; "
    "rara vez hace falta tocarlos.", "Modelo")

mc_row = r0 + len(ess_rows) + 1
lbl(s, mc_row, "Margen de contribución unitario (referencia: precio − costo variable)", BODYB)
put(s, mc_row, 3, f"=C{r0+1}-C{r0+2}", NF_M, LINKB, F_TEAL, CTR)
s.cell(mc_row, 2).comment = Comment(
    "Margen de contribución = precio − costo variable por unidad (Cap. 3.2).\n"
    "Con el OPEX del año define el punto de equilibrio Q* = OPEX / margen,\n"
    "visible en la hoja Proyección junto a las unidades estimadas.", "Modelo")

band(s, mc_row + 2, range(2, 5), "2 · Parámetros de negociación del comité (valores de referencia del curso)")
REF = {}
ref_rows = [
    ("Ajuste de escenario Conservador / Expansivo (±%)",         0.35, NF_P, "adj"),
    ("Múltiplo de salida EV/EBITDA",                               6.0, NF_X, "mult"),
    ("Año de salida del inversionista",                              5, NF_I, "ysal"),
    ("Tasa de retorno anual exigida",                             0.30, NF_P, "r"),
    ("Dilución esperada de ronda futura",                         0.10, NF_P, "dil"),
    ("Máximo de participación cedida por fundadores",             0.30, NF_P, "max_ced"),
    ("Reserva de contingencia sobre déficit máximo",              0.10, NF_P, "reserva"),
    ("Crecimiento perpetuo más allá del año 6 (cesión total)",    0.02, NF_P, "g_perp"),
]
r1 = mc_row + 3
for i, (t, v, nf, key) in enumerate(ref_rows):
    rr = r1 + i
    lbl(s, rr, t)
    inp(s, rr, 3, v, nf)
    REF[key] = f"'Supuestos'!$C${rr}"
s.cell(r1 + 1, 2).comment = Comment(
    "El mismo múltiplo y año de salida se usan en los tres escenarios: lo que los diferencia "
    "es el volumen de unidades (ajuste ±), no una tasa de descuento distinta (evita doble conteo del riesgo).", "Modelo")

pb_r0 = r1 + len(ref_rows) + 1
band(s, pb_r0, range(2, 6), "3 · Probabilidades de las cuatro rutas")
put(s, pb_r0, 3, "Probabilidad", None, H_W, INK, CTR)
put(s, pb_r0, 4, "Escenario base", None, H_W, INK, CTR)
RUTAS = [("Falla", 0.20, "—"), ("Bajo", 0.25, "Conservador"), ("Base", 0.40, "Base"), ("Alto", 0.15, "Expansivo")]
PB = {}
for i, (nm, p, base) in enumerate(RUTAS):
    rr = pb_r0 + 1 + i
    lbl(s, rr, nm, BODYB)
    inp(s, rr, 3, p, NF_P)
    put(s, rr, 4, base, None, BODY, None, CTR)
    PB[nm] = rr
pb_tot = pb_r0 + 5
lbl(s, pb_tot, "Suma de probabilidades", BODYB)
put(s, pb_tot, 3, f"=SUM(C{PB['Falla']}:C{PB['Alto']})", NF_P, LINKB, F_TERRA, CTR)
s.cell(PB["Falla"], 3).comment = Comment(
    "Juicio documentado del comité, revisable con nueva evidencia.\n"
    "No procede de una puntuación Berkus (Cap. 2.3 y 5.2).", "Modelo")

lic_r0 = pb_tot + 2
band(s, lic_r0, range(2, 6), "4 · Modalidad de licencia (activo intangible, Cap. 6.3)")
sel_row = lic_r0 + 1
lbl(s, sel_row, "Modalidad activa (1 Cesión total · 2 Exclusiva · 3 No exclusiva)", BODYB)
inp(s, sel_row, 3, 2, NF_I)
put(s, sel_row, 4, f'=CHOOSE($C${sel_row},"Cesión total","Exclusiva","No exclusiva")', None, LINKB)
dv_lic = DataValidation(type="whole", operator="between", formula1=1, formula2=3,
                         showErrorMessage=True, error="Use 1 (Cesión total), 2 (Exclusiva) o 3 (No exclusiva).")
s.add_data_validation(dv_lic); dv_lic.add(s.cell(sel_row, 3))

tbl_r0 = sel_row + 2
put(s, tbl_r0, 3, "Pago inicial (% costo desarrollo)", None, H_W, INK, CTR)
put(s, tbl_r0, 4, "Regalía sobre ingresos elegibles", None, H_W, INK, CTR)
put(s, tbl_r0, 5, "Licenciatarios potenciales", None, H_W, INK, CTR)
LICM = {}
modalidades = [
    ("Cesión total", 1.00, None, 1),
    ("Exclusiva",    0.20, 0.05, 1),
    ("No exclusiva", 0.05, 0.02, 3),
]
for i, (nm, pi, rg, lic_n) in enumerate(modalidades):
    rr = tbl_r0 + 1 + i
    lbl(s, rr, nm, BODYB)
    if nm == "Cesión total":
        put(s, rr, 3, "100% (ver cálculo DCF)", None, NOTE, None, CTR)
        put(s, rr, 4, "n.a.", None, NOTE, None, CTR)
        put(s, rr, 5, "n.a.", None, NOTE, None, CTR)
    else:
        inp(s, rr, 3, pi, NF_P)
        inp(s, rr, 4, rg, NF_P)
        inp(s, rr, 5, lic_n, NF_I)
    LICM[nm] = rr
s.cell(tbl_r0 + 1, 2).comment = Comment(
    "La cesión total no usa esta tabla: se valora como venta íntegra del activo, "
    "flujo de caja libre descontado más un valor terminal (ver hoja Licencia).", "Modelo")

lic_ref_rows = [
    ("Fracción de ingresos considerada elegible",                              0.75, NF_P, "eleg"),
    ("Costo institucional anual de administrar la licencia (USD miles)",        5.0, NF_M, "c_inst"),
    ("Tasa de descuento de los flujos de licencia",                           0.15, NF_P, "r_lic"),
    ("Plazo de la licencia (años)",                                              5, NF_I, "plazo"),
]
lr0 = tbl_r0 + 5
LIC = {}
for i, (t, v, nf, key) in enumerate(lic_ref_rows):
    rr = lr0 + i
    lbl(s, rr, t)
    inp(s, rr, 3, v, nf)
    LIC[key] = f"'Supuestos'!$C${rr}"

ct_r0 = lr0 + len(lic_ref_rows) + 2
band(s, ct_r0, range(2, 5), "5 · Estructura de propiedad antes de la ronda (ruta de equity)")
CT = {}
ct_rows = [("Equipo fundador e investigadores", 0.55), ("Universidad titular", 0.30), ("Reserva de opciones", 0.15)]
for i, (t, v) in enumerate(ct_rows):
    rr = ct_r0 + 1 + i
    lbl(s, rr, t); inp(s, rr, 3, v, NF_P)
    CT[t] = rr
ct_tot = ct_r0 + 4
lbl(s, ct_tot, "Suma de control", BODYB)
put(s, ct_tot, 3, f"=SUM(C{ct_r0+1}:C{ct_r0+3})", NF_P, LINKB, F_TERRA, CTR)

put(s, ct_tot + 2, 2, "Todas las cifras son supuestos docentes del caso ficticio FríoRaíz (Anexo del manual). "
                      "No representan ventas observadas ni cotizaciones reales.", None, NOTE)
s.merge_cells(start_row=ct_tot + 2, start_column=2, end_row=ct_tot + 3, end_column=5)
s.freeze_panes = "C6"

# ================================================================ PROYECCION
p = wb["Proyección"]
head(p, "Proyección operativa y de caja", "Un solo conjunto de supuestos (Cap. 3). Los escenarios Conservador y Expansivo se derivan aplicando el ajuste ± sobre las unidades del escenario Base.",
     {"B": 42, "C": 13, "D": 13, "E": 13, "F": 13, "G": 13, "H": 13}, span=8)

PROJ_ROWS = [
    ("Unidades vendidas estimadas",            NF_I,  BODYB),
    ("Precio de venta unitario",               NF_M,  BODY),
    ("Costo variable unitario",                NF_M,  BODY),
    ("Margen de contribución unitario",        NF_M,  BODY),
    ("Ingresos totales",                       NF_M,  BODYB),
    ("Costos variables totales",               NF_M,  BODY),
    ("Margen de contribución total",           NF_M,  BODYB),
    ("Gastos operativos (OPEX)",               NF_M,  BODY),
    ("Punto de equilibrio en unidades",        NF_D,  BODY),
    ("EBITDA",                                 NF_M,  BODYB),
    ("Margen EBITDA",                          NF_P,  BODY),
    ("Depreciación simplificada",              NF_M,  BODY),
    ("Utilidad gravable simplificada",         NF_M,  BODY),
    ("Impuesto pagado",                        NF_M,  BODY),
    ("Inversión en activos (CAPEX)",           NF_M,  BODY),
    ("Aumento de capital de trabajo",          NF_M,  BODY),
    ("Flujo de caja libre",                    NF_M,  BODYB),
    ("Flujo de caja acumulado",                NF_M,  BODYB),
    ("Caja proyectada incluyendo la ronda",    NF_M,  BODY),
]
IX = {name: i for i, (name, _, _) in enumerate(PROJ_ROWS)}
BLOCK_START = {}
SCALE = {"Conservador": f"(1-{REF['adj']})", "Base": "1", "Expansivo": f"(1+{REF['adj']})"}
cur = 7
for sc in ["Conservador", "Base", "Expansivo"]:
    band(p, cur, range(2, 9), f"Escenario {sc}")
    hdr = cur + 1
    put(p, hdr, 2, "Concepto", None, H_W, INK)
    for yi in range(NY):
        put(p, hdr, 3 + yi, f"Año {yi+1}", None, H_W, INK, CTR)
    st = hdr + 1
    BLOCK_START[sc] = st
    for i, (name, nf, f) in enumerate(PROJ_ROWS):
        rr = st + i
        bg = F_TEAL if name in ("EBITDA", "Flujo de caja acumulado") else None
        lbl(p, rr, name, f)
        if bg:
            for c in range(2, 9):
                p.cell(rr, c).fill = fill(bg)
        for yi in range(NY):
            Y = YC[yi]
            cl = 3 + yi
            n = lambda k: st + IX[k]
            if name == "Unidades vendidas estimadas":
                base_units = f"({ESS['unid1']}*(1+{ESS['crec_unid']})^{yi})"
                fx = f"=ROUND({base_units}*{SCALE[sc]},0)"
            elif name == "Precio de venta unitario":
                fx = f"={ESS['precio']}"
            elif name == "Costo variable unitario":
                fx = f"={ESS['cv']}"
            elif name == "Margen de contribución unitario":
                fx = f"={Y}{n('Precio de venta unitario')}-{Y}{n('Costo variable unitario')}"
            elif name == "Ingresos totales":
                fx = f"={Y}{n('Unidades vendidas estimadas')}*{Y}{n('Precio de venta unitario')}"
            elif name == "Costos variables totales":
                fx = f"={Y}{n('Unidades vendidas estimadas')}*{Y}{n('Costo variable unitario')}"
            elif name == "Margen de contribución total":
                fx = f"={Y}{n('Ingresos totales')}-{Y}{n('Costos variables totales')}"
            elif name == "Gastos operativos (OPEX)":
                fx = f"={ESS['opex1']}*(1+{ESS['crec_opex']})^{yi}"
            elif name == "Punto de equilibrio en unidades":
                fx = (f"=IF({Y}{n('Margen de contribución unitario')}<=0,\"n.a.\","
                      f"{Y}{n('Gastos operativos (OPEX)')}/{Y}{n('Margen de contribución unitario')})")
            elif name == "EBITDA":
                fx = f"={Y}{n('Margen de contribución total')}-{Y}{n('Gastos operativos (OPEX)')}"
            elif name == "Margen EBITDA":
                fx = f"=IF({Y}{n('Ingresos totales')}<=0,0,{Y}{n('EBITDA')}/{Y}{n('Ingresos totales')})"
            elif name == "Depreciación simplificada":
                fx = f"=SUM($C{n('Inversión en activos (CAPEX)')}:{Y}{n('Inversión en activos (CAPEX)')}) / 5"
            elif name == "Utilidad gravable simplificada":
                fx = f"={Y}{n('EBITDA')}-{Y}{n('Depreciación simplificada')}"
            elif name == "Impuesto pagado":
                fx = f"=0.25*MAX(0,{Y}{n('Utilidad gravable simplificada')})"
            elif name == "Inversión en activos (CAPEX)":
                fx = f"={ESS['costo_dev']}" if yi == 0 else "=0"
            elif name == "Aumento de capital de trabajo":
                if yi == 0:
                    fx = f"={ESS['wc_pct']}*{Y}{n('Ingresos totales')}"
                else:
                    pv = YC[yi - 1]
                    fx = f"={ESS['wc_pct']}*MAX(0,{Y}{n('Ingresos totales')}-{pv}{n('Ingresos totales')})"
            elif name == "Flujo de caja libre":
                fx = (f"={Y}{n('EBITDA')}-{Y}{n('Impuesto pagado')}"
                      f"-{Y}{n('Inversión en activos (CAPEX)')}-{Y}{n('Aumento de capital de trabajo')}")
            elif name == "Flujo de caja acumulado":
                fx = f"=SUM($C{n('Flujo de caja libre')}:{Y}{n('Flujo de caja libre')})"
            else:
                fx = f"={ESS['inv']}+{Y}{n('Flujo de caja acumulado')}"
            put(p, rr, cl, fx, nf, LINK if f is BODY else LINKB, bg)
    cur = st + len(PROJ_ROWS) + 2

def bs(sc, k):
    return BLOCK_START[sc] + IX[k]

cmp0 = cur
band(p, cmp0, range(2, 6), "Lectura comparativa de los tres escenarios")
put(p, cmp0, 3, "Conservador", None, H_W, INK, CTR)
put(p, cmp0, 4, "Base", None, H_W, INK, CTR)
put(p, cmp0, 5, "Expansivo", None, H_W, INK, CTR)

PCMP = {}
cmp_rows = [
    ("Ingresos del año 5",                      lambda sc: f"=G{bs(sc,'Ingresos totales')}", NF_M),
    ("EBITDA del año 5",                        lambda sc: f"=G{bs(sc,'EBITDA')}", NF_M),
    ("Margen EBITDA del año 5",                 lambda sc: f"=G{bs(sc,'Margen EBITDA')}", NF_P),
    ("Déficit máximo acumulado",                lambda sc: f"=-MIN(0,MIN(C{bs(sc,'Flujo de caja acumulado')}:H{bs(sc,'Flujo de caja acumulado')}))", NF_M),
    ("Capital requerido con reserva",           lambda sc: None, NF_M),
    ("¿La ronda de la hoja Supuestos alcanza?", lambda sc: None, None),
    ("Primer año con EBITDA positivo",          lambda sc: None, None),
    ("Primer año con caja acumulada positiva",  lambda sc: None, None),
]
for i, (t, fn, nf) in enumerate(cmp_rows):
    rr = cmp0 + 1 + i
    lbl(p, rr, t, BODYB if i in (1, 3) else BODY)
    PCMP[t] = rr
for ci, sc in enumerate(["Conservador", "Base", "Expansivo"]):
    col = 3 + ci
    L = get_column_letter(col)
    for t, fn, nf in cmp_rows[:4]:
        put(p, PCMP[t], col, fn(sc), nf, LINK, None, CTR)
    put(p, PCMP["Capital requerido con reserva"], col,
        f"={L}{PCMP['Déficit máximo acumulado']}*(1+{REF['reserva']})", NF_M, LINK, None, CTR)
    put(p, PCMP["¿La ronda de la hoja Supuestos alcanza?"], col,
        f'=IF({ESS["inv"]}>={L}{PCMP["Capital requerido con reserva"]},"Sí","No – faltan "&TEXT({L}{PCMP["Capital requerido con reserva"]}-{ESS["inv"]},"#,##0.0")&" mil")',
        None, LINK, None, CTR)
    eb = bs(sc, "EBITDA"); ac = bs(sc, "Flujo de caja acumulado")
    f_eb = "=" + "".join([f'IF({YC[k]}{eb}>0,{k+1},' for k in range(NY)]) + '"n.d."' + ")" * NY
    f_ac = "=" + "".join([f'IF({YC[k]}{ac}>0,{k+1},' for k in range(NY)]) + '"n.d."' + ")" * NY
    put(p, PCMP["Primer año con EBITDA positivo"], col, f_eb, NF_I, LINK, None, CTR)
    put(p, PCMP["Primer año con caja acumulada positiva"], col, f_ac, NF_I, LINK, None, CTR)

put(p, cmp0 + len(cmp_rows) + 2, 2,
    "Convención fiscal: impuesto = tasa × máximo(0, EBITDA − depreciación). Depreciación = costo de desarrollo ÷ vida útil, en línea recta desde el año 1. "
    "El capital de trabajo crece con el aumento de ingresos. No se reconocen pérdidas compensables de años anteriores.", None, NOTE)
p.merge_cells(start_row=cmp0 + len(cmp_rows) + 2, start_column=2, end_row=cmp0 + len(cmp_rows) + 3, end_column=6)
p.freeze_panes = "C9"

# ================================================================ LICENCIA
l = wb["Licencia"]
head(l, "Valor del activo intangible según la modalidad de licencia", "La invención se valora primero como un derecho que se transfiere, no solo como una startup (Cap. 6.3).",
     {"B": 46, "C": 13, "D": 13, "E": 13, "F": 13, "G": 13, "H": 13, "I": 3, "J": 44}, span=10)

put(l, 5, 2, "Modalidad activa", None, BODY)
put(l, 5, 3, f"='Supuestos'!$D${sel_row}", None, LINKB, None, CTR)

band(l, 7, range(2, 9), "Flujo de licencia por año (USD miles) · aplica a Exclusiva y No exclusiva")
for yi in range(NY):
    put(l, 7, 3 + yi, f"Año {yi+1}", None, H_W, INK, CTR)

LRW = [
    ("Ingresos del escenario Conservador", NF_M),
    ("Ingresos del escenario Base", NF_M),
    ("Ingresos del escenario Expansivo", NF_M),
    ("Ingreso esperado ponderado por rutas", NF_M),
    ("Ingreso elegible para regalía", NF_M),
    ("Regalía de la modalidad activa", NF_P2),
    ("Licenciatarios potenciales de la modalidad activa", NF_I),
    ("Regalía esperada", NF_M),
    ("Costo institucional de la licencia", NF_M),
    ("Flujo neto de la licencia", NF_M),
    ("Factor de descuento", '0.000'),
    ("Valor presente del flujo anual", NF_M),
]
LR = {}
for i, (t, nf) in enumerate(LRW):
    rr = 8 + i
    LR[t] = rr
    bg = F_BLUE if t in ("Flujo neto de la licencia", "Ingreso esperado ponderado por rutas") else None
    lbl(l, rr, t, BODYB if bg else BODY)
    if bg:
        for cc in range(2, 9):
            l.cell(rr, cc).fill = fill(bg)
    for yi in range(NY):
        Y = YC[yi]; cl = 3 + yi
        if t.startswith("Ingresos del escenario"):
            sc = t.split()[-1]
            fx = f"='Proyección'!{Y}{bs(sc,'Ingresos totales')}"
        elif t == "Ingreso esperado ponderado por rutas":
            fx = (f"='Supuestos'!$C${PB['Bajo']}*{Y}{LR['Ingresos del escenario Conservador']}"
                  f"+'Supuestos'!$C${PB['Base']}*{Y}{LR['Ingresos del escenario Base']}"
                  f"+'Supuestos'!$C${PB['Alto']}*{Y}{LR['Ingresos del escenario Expansivo']}")
        elif t == "Ingreso elegible para regalía":
            fx = f"={Y}{LR['Ingreso esperado ponderado por rutas']}*{LIC['eleg']}"
        elif t == "Regalía de la modalidad activa":
            fx = f"=CHOOSE('Supuestos'!$C${sel_row},0,'Supuestos'!$D${LICM['Exclusiva']},'Supuestos'!$D${LICM['No exclusiva']})"
        elif t == "Licenciatarios potenciales de la modalidad activa":
            fx = f"=CHOOSE('Supuestos'!$C${sel_row},1,'Supuestos'!$E${LICM['Exclusiva']},'Supuestos'!$E${LICM['No exclusiva']})"
        elif t == "Regalía esperada":
            fx = (f"={Y}{LR['Ingreso elegible para regalía']}*{Y}{LR['Regalía de la modalidad activa']}"
                  f"*{Y}{LR['Licenciatarios potenciales de la modalidad activa']}")
        elif t == "Costo institucional de la licencia":
            fx = f"=IF({yi+1}<={LIC['plazo']},{LIC['c_inst']},0)"
        elif t == "Flujo neto de la licencia":
            fx = (f"=IF({yi+1}>{LIC['plazo']},0,{Y}{LR['Regalía esperada']}"
                  f"-{Y}{LR['Costo institucional de la licencia']})")
        elif t == "Factor de descuento":
            fx = f"=1/(1+{LIC['r_lic']})^{yi+1}"
        else:
            fx = f"={Y}{LR['Flujo neto de la licencia']}*{Y}{LR['Factor de descuento']}"
        put(l, rr, cl, fx, nf, LINKB if bg else LINK, bg, CTR)

band(l, 21, range(2, 5), "Valor de cesión total (modalidad 1): venta íntegra del activo, escenario Base")
CES = {}
ces_rows = [
    ("Valor presente del flujo de caja libre (años 1 a 6)",
     f"=NPV({REF['r']},'Proyección'!$C${bs('Base','Flujo de caja libre')}:$H${bs('Base','Flujo de caja libre')})", NF_M, None),
    ("Valor terminal (perpetuidad creciente más allá del año 6)",
     f"=('Proyección'!$H${bs('Base','Flujo de caja libre')}*(1+{REF['g_perp']})/({REF['r']}-{REF['g_perp']}))/(1+{REF['r']})^6", NF_M, None),
    ("Valor de cesión total (pago único)", None, NF_M, F_BLUE),
]
for i, (t, fx, nf, bg) in enumerate(ces_rows):
    rr = 22 + i
    CES[t] = rr
    lbl(l, rr, t, BODYB if bg else BODY)
    if bg:
        for cc in range(2, 5):
            l.cell(rr, cc).fill = fill(bg)
    if fx:
        put(l, rr, 3, fx, nf, BIG if bg else LINK, bg, CTR)
put(l, CES["Valor de cesión total (pago único)"], 3,
    f"=C{CES['Valor presente del flujo de caja libre (años 1 a 6)']}+C{CES['Valor terminal (perpetuidad creciente más allá del año 6)']}",
    NF_M, BIG, F_BLUE, CTR)

band(l, 26, range(2, 5), "Resultado según la modalidad activa")
LRES = {}
lres_rows = [
    ("Pago inicial", None, NF_M, None),
    ("Valor presente de las regalías (si aplica)", None, NF_M, None),
    ("Valor total de la licencia bajo la modalidad activa", None, NF_M, F_BLUE),
    ("Plazo modelado (años)", f"={LIC['plazo']}", NF_I, None),
]
for i, (t, fx, nf, bg) in enumerate(lres_rows):
    rr = 27 + i
    LRES[t] = rr
    lbl(l, rr, t, BODYB if bg else BODY)
    if bg:
        for cc in range(2, 5):
            l.cell(rr, cc).fill = fill(bg)
    if fx:
        put(l, rr, 3, fx, nf, BIG if bg else LINK, bg, CTR)
put(l, LRES["Pago inicial"], 3,
    f"=CHOOSE('Supuestos'!$C${sel_row},"
    f"C{CES['Valor de cesión total (pago único)']},"
    f"'Supuestos'!$C${LICM['Exclusiva']}*{ESS['costo_dev']},"
    f"'Supuestos'!$C${LICM['No exclusiva']}*{ESS['costo_dev']})",
    NF_M, LINK, None, CTR)
put(l, LRES["Valor presente de las regalías (si aplica)"], 3,
    f"=IF('Supuestos'!$C${sel_row}=1,0,SUM(C{LR['Valor presente del flujo anual']}:H{LR['Valor presente del flujo anual']}))",
    NF_M, LINK, None, CTR)
put(l, LRES["Valor total de la licencia bajo la modalidad activa"], 3,
    f"=IF('Supuestos'!$C${sel_row}=1,C{CES['Valor de cesión total (pago único)']},"
    f"C{LRES['Pago inicial']}+C{LRES['Valor presente de las regalías (si aplica)']})",
    NF_M, BIG, F_BLUE, CTR)

put(l, 7, 10, "Las tres modalidades de transferencia", None, SECT)
for i, txt in enumerate([
    "Cesión total: la universidad vende el activo íntegro por un pago único, sin regalías futuras. Se valora como el flujo de caja libre de la tecnología, descontado, más un valor terminal por el potencial más allá del año 6.",
    "Licencia exclusiva: un solo licenciatario, con un pago inicial moderado y una regalía más alta (referencial 4% a 5%, Cap. 6.3) sobre los ingresos elegibles, durante el plazo pactado.",
    "Licencia no exclusiva: varios licenciatarios posibles, con un pago inicial bajo y una regalía menor (referencial 1% a 2%) que se multiplica por el número de licenciatarios potenciales.",
    "Esta hoja no se suma al valor del equity de la hoja VC Model: son dos formas alternativas de capturar el mismo potencial comercial, no dos activos distintos (Cap. 6.3).",
    "Las tasas de regalía de la tabla son valores de referencia del curso (1% a 5% para tecnología universitaria temprana). Requieren comparables por campo de uso, territorio y exclusividad.",
]):
    put(l, 8 + i * 3, 10, "· " + txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    l.merge_cells(start_row=8 + i * 3, start_column=10, end_row=10 + i * 3, end_column=10)
l.freeze_panes = "C8"

# ================================================================ VC MODEL
v = wb["VC Model"]
head(v, "VC Model: ruta alternativa de equity", "Valora la spin-off que recibiría el capital, no la licencia. Útil si la vía elegida es crear empresa en lugar de licenciar.",
     {"B": 46, "C": 16, "D": 16, "E": 16, "F": 3, "G": 40}, span=7)

band(v, 7, range(2, 6), "Paso del cálculo")
put(v, 7, 3, "Conservador", None, H_W, INK, CTR)
put(v, 7, 4, "Base", None, H_W, INK, CTR)
put(v, 7, 5, "Expansivo", None, H_W, INK, CTR)

VC_ROWS = [
    ("1. Inversión semilla solicitada",                        NF_M,  None),
    ("2. Año de salida del inversionista",                     NF_I,  None),
    ("3. EBITDA del año de salida",                            NF_M,  None),
    ("4. Múltiplo de salida EV/EBITDA",                        NF_X,  None),
    ("5. Valor empresa al exit (EV)",                          NF_M,  F_TEAL),
    ("6. Caja proyectada al exit",                             NF_M,  None),
    ("7. Deuda neta al exit",                                  NF_M,  None),
    ("8. Valor del equity al exit",                            NF_M,  F_TEAL),
    ("9. Tasa de retorno anual exigida",                       NF_P,  None),
    ("10. Valor presente del equity (post-money)",             NF_M,  F_TERRA),
    ("11. Pre-money implícito",                                NF_M,  F_TERRA),
    ("12. Participación requerida sin dilución futura",        NF_P,  None),
    ("13. Dilución esperada de ronda futura",                  NF_P,  None),
    ("14. Participación requerida hoy",                        NF_P,  F_TERRA),
    ("15. Participación del inversionista al exit",            NF_P,  None),
    ("16. Múltiplo sobre el capital invertido (MOIC)",         NF_X,  None),
    ("17. Verificación: TIR obtenida por el inversionista",    NF_P,  None),
]
VR = {}
for i, (t, nf, bg) in enumerate(VC_ROWS):
    rr = 8 + i
    lbl(v, rr, t, BODYB if bg else BODY)
    if bg:
        for c in range(2, 6):
            v.cell(rr, c).fill = fill(bg)
    VR[t] = rr

for ci, sc in enumerate(["Conservador", "Base", "Expansivo"]):
    col = 3 + ci
    L = get_column_letter(col)
    ys = REF['ysal']
    eb_rng = f"'Proyección'!$C${bs(sc,'EBITDA')}:$H${bs(sc,'EBITDA')}"
    cj_rng = f"'Proyección'!$C${bs(sc,'Caja proyectada incluyendo la ronda')}:$H${bs(sc,'Caja proyectada incluyendo la ronda')}"
    g = lambda t: f"{L}{VR[t]}"
    put(v, VR["1. Inversión semilla solicitada"], col, f"={ESS['inv']}", NF_M, LINK, None, CTR)
    put(v, VR["2. Año de salida del inversionista"], col, f"={ys}", NF_I, LINK, None, CTR)
    put(v, VR["3. EBITDA del año de salida"], col, f"=INDEX({eb_rng},1,{g('2. Año de salida del inversionista')})", NF_M, LINK, None, CTR)
    put(v, VR["4. Múltiplo de salida EV/EBITDA"], col, f"={REF['mult']}", NF_X, LINK, None, CTR)
    put(v, VR["5. Valor empresa al exit (EV)"], col, f"={g('3. EBITDA del año de salida')}*{g('4. Múltiplo de salida EV/EBITDA')}", NF_M, LINKB, F_TEAL, CTR)
    put(v, VR["6. Caja proyectada al exit"], col, f"=INDEX({cj_rng},1,{g('2. Año de salida del inversionista')})", NF_M, LINK, None, CTR)
    put(v, VR["7. Deuda neta al exit"], col, "=0", NF_M, LINK, None, CTR)
    put(v, VR["8. Valor del equity al exit"], col,
        f"=MAX(0,{g('5. Valor empresa al exit (EV)')}+{g('6. Caja proyectada al exit')}-{g('7. Deuda neta al exit')})", NF_M, LINKB, F_TEAL, CTR)
    put(v, VR["9. Tasa de retorno anual exigida"], col, f"={REF['r']}", NF_P, LINK, None, CTR)
    put(v, VR["10. Valor presente del equity (post-money)"], col,
        f"={g('8. Valor del equity al exit')}/(1+{g('9. Tasa de retorno anual exigida')})^{g('2. Año de salida del inversionista')}", NF_M, LINKB, F_TERRA, CTR)
    put(v, VR["11. Pre-money implícito"], col,
        f"={g('10. Valor presente del equity (post-money)')}-{g('1. Inversión semilla solicitada')}", NF_M, LINKB, F_TERRA, CTR)
    put(v, VR["12. Participación requerida sin dilución futura"], col,
        f"=IF({g('10. Valor presente del equity (post-money)')}<=0,\"n.a.\","
        f"{g('1. Inversión semilla solicitada')}/{g('10. Valor presente del equity (post-money)')})", NF_P, LINK, None, CTR)
    put(v, VR["13. Dilución esperada de ronda futura"], col, f"={REF['dil']}", NF_P, LINK, None, CTR)
    put(v, VR["14. Participación requerida hoy"], col,
        f"=IF({g('12. Participación requerida sin dilución futura')}=\"n.a.\",\"n.a.\","
        f"{g('12. Participación requerida sin dilución futura')}/(1-{g('13. Dilución esperada de ronda futura')}))", NF_P, LINKB, F_TERRA, CTR)
    put(v, VR["15. Participación del inversionista al exit"], col,
        f"=IF({g('14. Participación requerida hoy')}=\"n.a.\",\"n.a.\","
        f"{g('14. Participación requerida hoy')}*(1-{g('13. Dilución esperada de ronda futura')}))", NF_P, LINK, None, CTR)
    put(v, VR["16. Múltiplo sobre el capital invertido (MOIC)"], col,
        f"=IF({g('15. Participación del inversionista al exit')}=\"n.a.\",\"n.a.\","
        f"{g('15. Participación del inversionista al exit')}*{g('8. Valor del equity al exit')}/{g('1. Inversión semilla solicitada')})", NF_X, LINK, None, CTR)
    put(v, VR["17. Verificación: TIR obtenida por el inversionista"], col,
        f"=IF({g('16. Múltiplo sobre el capital invertido (MOIC)')}=\"n.a.\",\"n.a.\","
        f"{g('16. Múltiplo sobre el capital invertido (MOIC)')}^(1/{g('2. Año de salida del inversionista')})-1)", NF_P, LINK, None, CTR)

put(v, 8, 7, "Cómo leer esta hoja", None, SECT)
for i, txt in enumerate([
    "Cada columna aplica el VC Method clásico a un único escenario operativo, sin ponderar por probabilidad.",
    "Los tres escenarios comparten múltiplo, año de salida y tasa: lo único que cambia es el volumen de unidades vendidas (Supuestos, ajuste ±).",
    "El paso 14 incorpora la dilución futura: la participación que el inversionista necesita hoy para conservar su fracción objetivo al exit (Cap. 7.1).",
    "El paso 17 debe devolver la tasa exigida del paso 9. Si difiere, hay una inconsistencia en el encadenamiento.",
    "Esta ruta es alternativa a la hoja Licencia, no complementaria: o se cede el activo bajo una modalidad de licencia, o se crea una empresa que recibe capital (Cap. 6.3).",
]):
    c = put(v, 9 + i * 2, 7, "· " + txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    v.merge_cells(start_row=9 + i * 2, start_column=7, end_row=10 + i * 2, end_column=7)
v.freeze_panes = "C8"

# ================================================================ RUTAS BERKUS
b = wb["Rutas Berkus"]
head(b, "Rutas Berkus ponderadas", "Las cuatro rutas combinan los tres escenarios operativos más una ruta de falla, con probabilidades explícitas. Aplica a la ruta de equity.",
     {"B": 20, "C": 14, "D": 16, "E": 13, "F": 17, "G": 17, "H": 17, "I": 3, "J": 40}, span=10)

band(b, 7, range(2, 9), "Ruta")
for ci, t in enumerate(["Probabilidad", "Escenario base", "Año salida", "Equity al exit", "Valor presente", "VP ponderado"]):
    put(b, 7, 3 + ci, t, None, H_W, INK, CTR)

BR = {}
for i, (nm, _p, base) in enumerate(RUTAS):
    rr = 8 + i
    BR[nm] = rr
    lbl(b, rr, nm, BODYB)
    put(b, rr, 3, f"='Supuestos'!$C${PB[nm]}", NF_P, LINK, None, CTR)
    put(b, rr, 4, f"='Supuestos'!$D${PB[nm]}", None, LINK, None, CTR)
    if nm == "Falla":
        put(b, rr, 5, 3, NF_I, LINK, None, CTR)
        put(b, rr, 6, 0, NF_M, LINK, None, CTR)
        b.cell(rr, 6).comment = Comment("Un gate decisivo no se supera: la participación se supone sin valor.\n"
                                        "Si el caso admite valor residual, edite esta celda.", "Modelo")
    elif nm == "Bajo":
        put(b, rr, 5, f"=MIN({REF['ysal']}+1,6)", NF_I, LINK, None, CTR)
        put(b, rr, 6,
            f"=INDEX('Proyección'!$C${bs('Conservador','EBITDA')}:$H${bs('Conservador','EBITDA')},1,E{rr})*{REF['mult']}"
            f"+INDEX('Proyección'!$C${bs('Conservador','Caja proyectada incluyendo la ronda')}:$H${bs('Conservador','Caja proyectada incluyendo la ronda')},1,E{rr})",
            NF_M, LINK, None, CTR)
    else:
        sc = {"Base": "Base", "Alto": "Expansivo"}[nm]
        put(b, rr, 5, f"={REF['ysal']}", NF_I, LINK, None, CTR)
        put(b, rr, 6,
            f"=INDEX('Proyección'!$C${bs(sc,'EBITDA')}:$H${bs(sc,'EBITDA')},1,E{rr})*{REF['mult']}"
            f"+INDEX('Proyección'!$C${bs(sc,'Caja proyectada incluyendo la ronda')}:$H${bs(sc,'Caja proyectada incluyendo la ronda')},1,E{rr})",
            NF_M, LINK, None, CTR)
    put(b, rr, 7, f"=F{rr}/(1+{REF['r']})^E{rr}", NF_M, LINK, None, CTR)
    put(b, rr, 8, f"=C{rr}*G{rr}", NF_M, LINKB, None, CTR)

btot = 12
lbl(b, btot, "Total", BODYB)
for c in range(2, 9):
    b.cell(btot, c).fill = fill(F_TERRA)
put(b, btot, 3, f"=SUM(C8:C11)", NF_P, LINKB, F_TERRA, CTR)
put(b, btot, 8, f"=SUM(H8:H11)", NF_M, BIG, F_TERRA, CTR)

band(b, 14, range(2, 5), "Condiciones de la ronda bajo el modelo ajustado")
BA = {}
ba_rows = [
    ("Valor post-money ajustado",                      None, NF_M, F_TERRA),
    ("Inversión semilla solicitada",                   f"={ESS['inv']}", NF_M, None),
    ("Valor pre-money ajustado",                       None, NF_M, F_TERRA),
    ("Participación requerida sin dilución futura",    None, NF_P, None),
    ("Dilución esperada de ronda futura",              f"={REF['dil']}", NF_P, None),
    ("Participación requerida hoy",                    None, NF_P, F_TERRA),
    ("Participación del inversionista al exit",        None, NF_P, None),
]
for i, (t, fx, nf, bg) in enumerate(ba_rows):
    rr = 15 + i
    BA[t] = rr
    lbl(b, rr, t, BODYB if bg else BODY)
    if bg:
        for c in range(2, 5):
            b.cell(rr, c).fill = fill(bg)
g = lambda t: f"$C${BA[t]}"
put(b, BA["Valor post-money ajustado"], 3, f"=H{btot}", NF_M, BIG, F_TERRA, CTR)
put(b, BA["Inversión semilla solicitada"], 3, f"={ESS['inv']}", NF_M, LINK, None, CTR)
put(b, BA["Valor pre-money ajustado"], 3,
    f"={g('Valor post-money ajustado')}-{g('Inversión semilla solicitada')}", NF_M, BIG, F_TERRA, CTR)
put(b, BA["Participación requerida sin dilución futura"], 3,
    f"=IF({g('Valor post-money ajustado')}<=0,\"n.a.\",{g('Inversión semilla solicitada')}/{g('Valor post-money ajustado')})", NF_P, LINK, None, CTR)
put(b, BA["Dilución esperada de ronda futura"], 3, f"={REF['dil']}", NF_P, LINK, None, CTR)
put(b, BA["Participación requerida hoy"], 3,
    f"=IF({g('Participación requerida sin dilución futura')}=\"n.a.\",\"n.a.\","
    f"{g('Participación requerida sin dilución futura')}/(1-{g('Dilución esperada de ronda futura')}))", NF_P, BIG, F_TERRA, CTR)
put(b, BA["Participación del inversionista al exit"], 3,
    f"=IF({g('Participación requerida hoy')}=\"n.a.\",\"n.a.\","
    f"{g('Participación requerida hoy')}*(1-{g('Dilución esperada de ronda futura')}))", NF_P, LINK, None, CTR)

put(b, 7, 10, "Por qué cuatro rutas y no cinco descuentos Berkus", None, SECT)
for i, txt in enumerate([
    "Los cinco pilares Berkus son un mapa de riesgos mitigados, no sumandos de valor. Aquí ordenan la evidencia y señalan qué variable mueve cada gate.",
    "Las rutas se construyen como combinaciones plausibles de esos riesgos: la falla técnica o comercial arrastra adopción y margen a la vez, de modo que no se multiplican cinco porcentajes independientes.",
    "La ruta Bajo toma el escenario Conservador con salida un año más tardía; Base toma el escenario Base; Alto toma el Expansivo.",
    "La tasa de retorno y el múltiplo son comunes a las tres rutas con éxito: el riesgo diferencial vive en las unidades vendidas y en las probabilidades, no en una tasa distinta por ruta (evita doble conteo).",
    "Una puntuación Berkus del 80% en un pilar no es una probabilidad de éxito del 80%. Las probabilidades de esta hoja son juicio del comité, con fecha y responsable.",
]):
    put(b, 8 + i * 3, 10, "· " + txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    b.merge_cells(start_row=8 + i * 3, start_column=10, end_row=10 + i * 3, end_column=10)
b.freeze_panes = "C8"

# ================================================================ COMPARATIVO
k = wb["Comparativo"]
head(k, "Comparativo: licencia, equity y rutas ponderadas", "Tres formas de capturar el mismo potencial comercial. No se suman entre sí.",
     {"B": 44, "C": 20, "D": 4, "E": 44}, span=5)

band(k, 7, range(2, 4), "Vía de transferencia")
put(k, 7, 3, "Valor (USD miles)", None, H_W, INK, CTR)
KROWS = [
    ("Licencia · modalidad activa", f"='Licencia'!$C${LRES['Valor total de la licencia bajo la modalidad activa']}"),
    ("Equity · escenario Base (VC Model)", f"='VC Model'!D{VR['11. Pre-money implícito']}"),
    ("Equity · ajustado por las cuatro rutas Berkus", f"='Rutas Berkus'!$C${BA['Valor pre-money ajustado']}"),
]
KR = {}
for i, (t, fx) in enumerate(KROWS):
    rr = 8 + i
    KR[t] = rr
    lbl(k, rr, t, BODYB)
    put(k, rr, 3, fx, NF_M, LINKB, F_TERRA if i == 2 else F_BLUE if i == 0 else None, CTR)

put(k, 7, 5, "Cómo leer este comparativo", None, SECT)
for i, txt in enumerate([
    "Son tres lecturas del mismo potencial comercial, no tres activos: elegir una vía descarta las otras dos (Cap. 6.3).",
    "La licencia valora el derecho que se transfiere; el equity valora la empresa que recibiría el capital. Ambas parten de la misma proyección operativa.",
    "La ruta ajustada por Berkus pondera el riesgo de ejecución con probabilidades explícitas; el escenario Base la ignora y asume que el plan se cumple tal cual.",
    "El comité elige la vía según el objetivo: ingreso cierto y menor control (licencia), o mayor potencial de retorno y más riesgo (equity).",
]):
    put(k, 8 + i * 3, 5, "· " + txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    k.merge_cells(start_row=8 + i * 3, start_column=5, end_row=10 + i * 3, end_column=5)
k.freeze_panes = "B8"

# ================================================================ CAP TABLE
c = wb["Cap Table"]
head(c, "Capitalización y dilución (ruta de equity)", "Participaciones antes de la ronda, después de la inversión y después de una ronda futura hipotética.",
     {"B": 38, "C": 16, "D": 20, "E": 22, "F": 4, "G": 42}, span=7)

put(c, 5, 2, "Modelo de referencia", None, BODY)
inp(c, 5, 3, 4, NF_I)
put(c, 5, 4, '=CHOOSE($C$5,"Conservador","Base","Expansivo","Ajustado 4 rutas")', None, LINKB)
c["C5"].comment = Comment("1 Conservador · 2 Base · 3 Expansivo · 4 Ajustado por las cuatro rutas Berkus.\n"
                          "Determina la participación del inversionista usada en esta hoja.", "Modelo")
dv2 = DataValidation(type="whole", operator="between", formula1=1, formula2=4, showErrorMessage=True,
                     error="Use 1, 2, 3 o 4.")
c.add_data_validation(dv2); dv2.add(c["C5"])

put(c, 6, 2, "Participación del inversionista hoy", None, BODY)
put(c, 6, 3, f"=CHOOSE($C$5,'VC Model'!C{VR['14. Participación requerida hoy']},"
             f"'VC Model'!D{VR['14. Participación requerida hoy']},"
             f"'VC Model'!E{VR['14. Participación requerida hoy']},"
             f"'Rutas Berkus'!$C${BA['Participación requerida hoy']})", NF_P, LINKB, F_TERRA, CTR)
ALPHA = "$C$6"

band(c, 8, range(2, 6), "Titular")
put(c, 8, 3, "Antes de la ronda", None, H_W, INK, CTR)
put(c, 8, 4, "Después de la inversión", None, H_W, INK, CTR)
put(c, 8, 5, "Después de ronda futura", None, H_W, INK, CTR)

holders = list(CT.keys())
for i, hname in enumerate(holders):
    rr = 9 + i
    lbl(c, rr, hname)
    put(c, rr, 3, f"='Supuestos'!$C${CT[hname]}", NF_P, LINK, None, CTR)
    put(c, rr, 4, f"=C{rr}*(1-{ALPHA})", NF_P, LINK, None, CTR)
    put(c, rr, 5, f"=D{rr}*(1-{REF['dil']})", NF_P, LINK, None, CTR)
rr_inv = 9 + len(holders)
lbl(c, rr_inv, "Inversionista semilla", BODYB)
put(c, rr_inv, 3, 0, NF_P, LINK, None, CTR)
put(c, rr_inv, 4, f"={ALPHA}", NF_P, LINKB, F_TERRA, CTR)
put(c, rr_inv, 5, f"=D{rr_inv}*(1-{REF['dil']})", NF_P, LINK, None, CTR)
rr_fut = rr_inv + 1
lbl(c, rr_fut, "Inversionista de ronda futura")
put(c, rr_fut, 3, 0, NF_P, LINK, None, CTR)
put(c, rr_fut, 4, 0, NF_P, LINK, None, CTR)
put(c, rr_fut, 5, f"={REF['dil']}", NF_P, LINK, None, CTR)
rr_t = rr_fut + 1
lbl(c, rr_t, "Total", BODYB)
for col in range(3, 6):
    L = get_column_letter(col)
    put(c, rr_t, col, f"=SUM({L}9:{L}{rr_fut})", NF_P, LINKB, F_TERRA, CTR)
for col in range(2, 6):
    c.cell(rr_t, col).fill = fill(F_TERRA)

band(c, rr_t + 2, range(2, 6), "Valor de la participación universitaria")
vrows = [
    ("Valor pre-money de referencia",
     f"=CHOOSE($C$5,'VC Model'!C{VR['11. Pre-money implícito']},'VC Model'!D{VR['11. Pre-money implícito']},"
     f"'VC Model'!E{VR['11. Pre-money implícito']},'Rutas Berkus'!$C${BA['Valor pre-money ajustado']})", NF_M),
    ("Valor de la participación universitaria hoy", None, NF_M),
    ("Participación universitaria después de la ronda", f"=D{9+holders.index('Universidad titular')}", NF_P),
    ("Participación universitaria tras ronda futura", f"=E{9+holders.index('Universidad titular')}", NF_P),
]
vr0 = rr_t + 3
for i, (t, fx, nf) in enumerate(vrows):
    lbl(c, vr0 + i, t, BODYB if i == 1 else BODY)
    if fx:
        put(c, vr0 + i, 3, fx, nf, LINK, None, CTR)
put(c, vr0 + 1, 3, f"=C{vr0}*C{9+holders.index('Universidad titular')}", NF_M, LINKB, F_TERRA, CTR)

put(c, 8, 7, "Advertencias de esta hoja", None, SECT)
for i, txt in enumerate([
    "Esta hoja solo aplica si la vía elegida es equity, no licencia. Con selector 1 de la hoja Licencia (cesión total), la ruta de equity no corresponde.",
    "La identidad post-money = pre-money + capital nuevo supone acciones ordinarias, sin instrumentos convertibles, deuda convertida ni preferencias que alteren el reparto (Cap. 1.4 y 7.1).",
    "El valor de la participación universitaria aquí no se suma al valor de la licencia de la hoja Licencia: son vías alternativas.",
    "La reserva de opciones se trata como participación existente antes de la ronda. Si el inversionista exige ampliarla, la dilución recae sobre los fundadores.",
]):
    put(c, 9 + i * 3, 7, "· " + txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    c.merge_cells(start_row=9 + i * 3, start_column=7, end_row=11 + i * 3, end_column=7)
c.freeze_panes = "C9"

# ================================================================ SENSIBILIDAD
n = wb["Sensibilidad"]
head(n, "Sensibilidad del modelo", "Dos matrices de doble entrada. Ninguna es una banda estadística: muestran de qué parámetros dependen las condiciones de la ronda.",
     {"B": 34, "C": 14, "D": 14, "E": 14, "F": 14, "G": 14, "H": 4, "I": 42}, span=9)

# M1
band(n, 7, range(2, 8), "1. Participación requerida hoy · escenario Base")
put(n, 8, 2, "Múltiplo ↓  /  Retorno exigido →", None, BODYB)
tasas = [0.25, 0.30, 0.35, 0.40]
mults = [5.0, 5.5, 6.0, 6.5, 7.0]
for ci, t in enumerate(tasas):
    inp(n, 8, 3 + ci, t, NF_P)
for ri, m in enumerate(mults):
    rr = 9 + ri
    inp(n, rr, 2, m, NF_X)
    for ci in range(len(tasas)):
        L = get_column_letter(3 + ci)
        fx = (f"={ESS['inv']}/(('VC Model'!D{VR['3. EBITDA del año de salida']}*$B{rr}"
              f"+'VC Model'!D{VR['6. Caja proyectada al exit']})/(1+{L}$8)^{REF['ysal']})/(1-{REF['dil']})")
        put(n, rr, 3 + ci, fx, NF_P, LINK, None, CTR)
put(n, 14, 2, "Caso central de control", None, BODYB)
put(n, 14, 3, f"='VC Model'!D{VR['14. Participación requerida hoy']}", NF_P, LINKB, F_TERRA, CTR)
n.cell(14, 3).comment = Comment("Debe coincidir con la celda de la matriz donde múltiplo coincide con 'Supuestos' y retorno = 30%.", "Modelo")

# M2
band(n, 16, range(2, 8), "2. Valor de cesión total · tasa de descuento y crecimiento perpetuo")
put(n, 17, 2, "Crecimiento perpetuo ↓  /  Tasa de descuento →", None, BODYB)
tasas2 = [0.25, 0.28, 0.30, 0.33, 0.35]
for ci, t in enumerate(tasas2):
    inp(n, 17, 3 + ci, t, NF_P)
gperp_vals = [0.00, 0.01, 0.02, 0.03, 0.04]
FCFF6 = f"'Proyección'!$H${bs('Base','Flujo de caja libre')}"
FCFF_RNG = f"'Proyección'!$C${bs('Base','Flujo de caja libre')}:$H${bs('Base','Flujo de caja libre')}"
for ri, gq in enumerate(gperp_vals):
    rr = 18 + ri
    inp(n, rr, 2, gq, NF_P)
    for ci in range(len(tasas2)):
        L = get_column_letter(3 + ci)
        fx = (f"=NPV({L}$17,{FCFF_RNG})+({FCFF6}*(1+$B{rr})/({L}$17-$B{rr}))/(1+{L}$17)^6")
        put(n, rr, 3 + ci, fx, NF_M, LINK, None, CTR)
put(n, 23, 2, "Caso central de control", None, BODYB)
put(n, 23, 3, f"='Licencia'!$C${CES['Valor de cesión total (pago único)']}", NF_M, LINKB, F_TERRA, CTR)
n.cell(23, 3).comment = Comment("Debe coincidir con la celda de la matriz donde crecimiento = 'Supuestos' g_perp y tasa = 'Supuestos' r.", "Modelo")

put(n, 7, 9, "Cómo usar estas matrices", None, SECT)
for i, txt in enumerate([
    "Cada matriz mueve dos parámetros y mantiene todo lo demás constante. El rango resultante no cubre los demás riesgos del caso ni equivale a un intervalo de confianza.",
    "Matriz 1: el múltiplo y la tasa de retorno son los dos supuestos que más mueven la ronda de equity. Ninguno se deduce de Berkus ni del TRL por fórmula.",
    "Matriz 2: la tasa de descuento y el crecimiento perpetuo son los que más mueven el valor de cesión total. Un crecimiento perpetuo cercano a la tasa de descuento dispara el valor terminal: trátelo con cautela.",
    "Las celdas crema de los encabezados son editables: cambie los ejes para acercar la matriz al rango que discutirá el comité.",
]):
    put(n, 8 + i * 4, 9, "· " + txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    n.merge_cells(start_row=8 + i * 4, start_column=9, end_row=11 + i * 4, end_column=9)
n.freeze_panes = "C8"

# ================================================================ NEGOCIACION
g_ = wb["Negociación"]
head(g_, "Negociación, ZOPA y arquitectura del acuerdo", "El precio se negocia junto con la modalidad de transferencia, los riesgos, los hitos y las alternativas de cada parte.",
     {"B": 40, "C": 18, "D": 4, "E": 34, "F": 34}, span=6)

put(g_, 5, 2, "Vía de transferencia de referencia", None, BODY)
put(g_, 5, 3, "='Supuestos'!$D$" + str(sel_row), None, LINKB, None, CTR)

band(g_, 7, range(2, 4), "Rango económico de la ronda de equity (si aplica)")
NG = {}
ng_rows = [
    ("Inversión propuesta (USD miles)", f"={ESS['inv']}", NF_M, None),
    ("Participación solicitada por el inversionista", f"='Cap Table'!$C$6", NF_P, F_TERRA),
    ("Máximo de participación cedida por fundadores", f"={REF['max_ced']}", NF_P, None),
    ("Brecha de participación", None, NF_P, None),
    ("Pre-money mínimo aceptable para los fundadores", None, NF_M, None),
    ("Pre-money del modelo de referencia", None, NF_M, None),
    ("Lectura de ZOPA", None, None, F_TERRA),
]
for i, (t, fx, nf, bg) in enumerate(ng_rows):
    rr = 8 + i
    NG[t] = rr
    lbl(g_, rr, t, BODYB if bg else BODY)
    if bg:
        for cc in range(2, 4):
            g_.cell(rr, cc).fill = fill(bg)
    if fx:
        put(g_, rr, 3, fx, nf, LINKB if bg else LINK, bg, CTR)
put(g_, NG["Brecha de participación"], 3,
    f"=C{NG['Máximo de participación cedida por fundadores']}-C{NG['Participación solicitada por el inversionista']}", NF_P, LINK, None, CTR)
put(g_, NG["Pre-money mínimo aceptable para los fundadores"], 3,
    f"={ESS['inv']}/C{NG['Máximo de participación cedida por fundadores']}-{ESS['inv']}", NF_M, LINK, None, CTR)
put(g_, NG["Pre-money del modelo de referencia"], 3,
    f"='Cap Table'!$C${vr0}", NF_M, LINK, None, CTR)
put(g_, NG["Lectura de ZOPA"], 3,
    f'=IF(C{NG["Brecha de participación"]}>=0,"ZOPA posible · margen de "&TEXT(C{NG["Brecha de participación"]},"0.0%"),'
    f'"Sin ZOPA · exceso de "&TEXT(-C{NG["Brecha de participación"]},"0.0%"))', None, LINKB, F_TERRA, CTR)

band(g_, 16, range(2, 4), "Alternativas de cada parte (BATNA)")
batna = [
    ("Universidad y fundadores", "Licenciar bajo otra modalidad sin crear empresa; buscar fondo público de validación; pausar y reforzar evidencia antes de negociar."),
    ("Inversionista o licenciatario", "Esperar un piloto pagado ya demostrado; entrar en una ronda posterior con más evidencia y menos descuento por riesgo técnico."),
]
for i, (t, txt) in enumerate(batna):
    rr = 17 + i * 2
    lbl(g_, rr, t, BODYB)
    put(g_, rr, 3, txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    g_.merge_cells(start_row=rr, start_column=3, end_row=rr + 1, end_column=3)

band(g_, 22, range(2, 4), "Estructura de términos preliminares")
terms = [
    ("Pago inicial de la licencia (USD miles)", 25.0, NF_M),
    ("Pagos por hitos técnicos y comerciales (USD miles)", 60.0, NF_M),
    ("Regalía sobre ventas elegibles", 0.03, NF_P),
    ("Mínimo anual de desempeño desde el año 3 (USD miles)", 20.0, NF_M),
    ("Participación universitaria en la spin-off (si aplica)", 0.30, NF_P),
    ("Exclusividad: plazo en años", 5, NF_I),
    ("Exclusividad condicionada a gates verificables", "Sí", None),
]
for i, (t, vv, nf) in enumerate(terms):
    rr = 23 + i
    lbl(g_, rr, t)
    inp(g_, rr, 3, vv, nf)

put(g_, 7, 5, "Concesiones en orden de preferencia", None, SECT)
conc = [
    "Vincular el desembolso o el pago de hitos a gates antes de ceder participación o exclusividad: traslada riesgo sin mover el precio.",
    "Aceptar un mínimo anual de desempeño en lugar de ampliar la exclusividad territorial.",
    "Sustituir parte de la regalía por un pago inicial mayor si la universidad necesita financiar industrialización.",
    "Pasar de licencia exclusiva a no exclusiva si el comprador no acepta el pago inicial propuesto.",
    "Ceder campo de uso adicional únicamente a cambio de hitos de inversión verificables del socio.",
]
for i, txt in enumerate(conc):
    put(g_, 8 + i * 2, 5, f"{i+1}. {txt}", None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    g_.merge_cells(start_row=8 + i * 2, start_column=5, end_row=9 + i * 2, end_column=5)

put(g_, 19, 5, "Qué no hace esta hoja", None, SECT)
for i, txt in enumerate([
    "No convierte el valor calculado en un precio. Las condiciones finales expresan el reparto del riesgo entre las partes (Cap. 7.2).",
    "No suma el valor de la licencia al valor del equity: son vías alternativas de capturar el mismo potencial comercial.",
    "Una participación fuera del máximo cedido no se arregla bajando la tasa de retorno: obliga a revisar monto, hitos, modalidad o estructura.",
]):
    put(g_, 20 + i * 3, 5, "· " + txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    g_.merge_cells(start_row=20 + i * 3, start_column=5, end_row=22 + i * 3, end_column=5)
g_.freeze_panes = "B8"

# ================================================================ EVIDENCIA BERKUS
e = wb["Evidencia Berkus"]
head(e, "Evidencia, madurez y los cinco riesgos", "Mapa de riesgos mitigados. La calificación es un juicio documentado del comité, no una probabilidad ni una suma de dinero.",
     {"B": 26, "C": 38, "D": 11, "E": 10, "F": 34, "G": 26, "H": 24}, span=8)

band(e, 7, range(2, 5), "Madurez declarada del caso")
md = [
    ("Nivel de madurez tecnológica (TRL, 1 a 9)", 5, NF_I),
    ("TRL verificado documentalmente", "Pendiente", None),
    ("Madurez comercial interna (escala 1 a 5)", 2, NF_I),
    ("Evidencia de madurez comercial", "Entrevistas documentadas; interés declarado sin pedido firme", None),
]
for i, (t, vv, nf) in enumerate(md):
    rr = 8 + i
    lbl(e, rr, t)
    inp(e, rr, 3, vv, nf)
e.cell(8, 3).comment = Comment("TRL 5-6 declarado por el equipo, sujeto a verificación de informes,\n"
                               "condiciones de ensayo, reproducibilidad y entorno de prueba (Cap. 2.2).", "Modelo")
e.cell(10, 3).comment = Comment("Escala institucional interna de 1 a 5. No es una escala internacional\n"
                                "universal ni una probabilidad estadística (Cap. 2.2).", "Modelo")

band(e, 13, range(2, 9), "Pilar Berkus")
for ci, t in enumerate(["Evidencia disponible en el caso", "Calificación", "Peso", "Brecha que mueve el valor", "Gate vinculado", "Variable del modelo que actualiza"]):
    put(e, 13, 3 + ci, t, None, H_W, INK, CTR)

PIL = [
    ("Prototipo y tecnología", "Prototipo probado en entorno relevante de escala piloto; ensayo reproducible documentado", 3, 0.25,
     "Fiabilidad y costo industrial de lote", "G2 · Lote piloto con costos medidos", "Costo variable unitario y año de salida"),
    ("Idea y mercado", "Doce entrevistas a operadores; cuatro manifestaciones de interés; dos conversaciones de piloto", 2, 0.25,
     "Precio aceptado y volumen de compra", "G4 · Piloto pagado o propuesta aceptada", "Precio de venta unitario y unidades estimadas de venta"),
    ("Equipo y transferencia", "Equipo investigador con capacidades de laboratorio; sin dirección comercial ni servicio de campo", 2, 0.20,
     "Operación comercial instalada", "G3 · Roles críticos cubiertos", "Gastos operativos (OPEX)"),
    ("Relaciones estratégicas", "Canal potencial con una cooperativa, sin contrato vinculante", 2, 0.15,
     "Contrato y acceso efectivo a clientes", "G5 · Canal operativo con responsabilidades", "Unidades estimadas de venta por año"),
    ("Tracción y economía unitaria", "Cotizaciones de componentes y cálculo de margen; sin costo real medido ni unidades vendidas observadas", 1, 0.15,
     "Costo real y punto de equilibrio", "G2 y G4 · Costo medido y primera venta", "Costo variable unitario y margen de contribución"),
]
PR = {}
for i, (nmp, ev, cal, pz, br, gt, vm) in enumerate(PIL):
    rr = 14 + i
    PR[nmp] = rr
    lbl(e, rr, nmp, BODYB)
    put(e, rr, 3, ev, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    inp(e, rr, 4, cal, NF_I)
    inp(e, rr, 5, pz, NF_P)
    put(e, rr, 6, br, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    put(e, rr, 7, gt, None, Font(name="Aptos", size=9, color=TEAL), None, WRAP)
    put(e, rr, 8, vm, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    e.row_dimensions[rr].height = 34
rr = 19
lbl(e, rr, "Índice de evidencia documentado", BODYB)
for cc in range(2, 9):
    e.cell(rr, cc).fill = fill(F_TERRA)
put(e, rr, 4, "=SUMPRODUCT(D14:D18,E14:E18)/5", NF_P, LINKB, F_TERRA, CTR)
put(e, rr, 5, "=SUM(E14:E18)", NF_P, LINKB, F_TERRA, CTR)
put(e, rr, 6, "Juicio de evaluación con fecha y responsable. No es una probabilidad de éxito.", None,
    Font(name="Aptos", size=9, bold=True, color=TERRA), F_TERRA, WRAP)

band(e, 21, range(2, 9), "Matriz de trazabilidad de supuestos")
for ci, t in enumerate(["Fuente y alcance", "Qué demuestra", "Qué no demuestra", "Riesgo asociado", "Gate que lo resuelve"]):
    put(e, 21, 3 + ci, t, None, H_W, INK, CTR)
TRZ = [
    ("Precio de venta unitario", "Entrevista y propuesta no vinculante", "Interés de un responsable técnico en la solución",
     "Que exista presupuesto, decisión y disposición a pagar el precio", "Mercado", "G4 · Piloto pagado"),
    ("Costo variable unitario", "Cotización de componentes y prueba de montaje", "Un precio de proveedor a la fecha de la cotización",
     "El costo de fabricación a escala ni la merma de un lote industrial", "Tecnología y economía", "G2 · Lote piloto"),
    ("Unidades estimadas de venta", "Benchmarking comparable y entrevistas con clientes potenciales", "Un universo de organizaciones con necesidad declarada",
     "Una tasa de cierre observada para esta vertical y territorio", "Mercado y relaciones", "G4 y G5"),
    ("Gastos operativos (OPEX)", "Presupuesto preliminar del equipo investigador", "Un costo estimado de operación a la escala proyectada",
     "El costo real de operar con equipo comercial y soporte de campo contratado", "Equipo y financiero", "G3 · Roles críticos cubiertos"),
]
for i, row in enumerate(TRZ):
    rr = 22 + i
    lbl(e, rr, row[0], BODYB)
    for ci, txt in enumerate(row[1:]):
        put(e, rr, 3 + ci, txt, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    e.row_dimensions[rr].height = 30

put(e, 27, 2, "La ausencia de ventas no equivale a ausencia de información, pero una evidencia de interés no es evidencia de compra. "
              "Esta hoja registra lo que cada fuente demuestra y lo que no demuestra: de esa distinción depende la credibilidad del flujo de caja (Cap. 2.1).",
    None, NOTE, None, WRAP)
e.merge_cells(start_row=27, start_column=2, end_row=28, end_column=8)
e.freeze_panes = "C14"

# ================================================================ GATES
gt = wb["Gates 90 días"]
head(gt, "Gates verificables y desembolso por tramos", "Cada gate tiene responsable, prueba, fecha y criterio de aceptación. El tramo se libera contra el criterio, no contra el calendario.",
     {"B": 10, "C": 30, "D": 13, "E": 22, "F": 32, "G": 30, "H": 14, "I": 14}, span=9)

band(gt, 7, range(2, 10), "Gate")
for ci, t in enumerate(["Objeto del gate", "Plazo", "Responsable", "Prueba objetiva y criterio de aceptación", "Variable del modelo que actualiza", "Tramo (USD miles)", "Efecto si no se cumple"]):
    put(gt, 7, 3 + ci, t, None, H_W, INK, CTR)

GATES = [
    ("G1", "Titularidad, aportes del centro colaborador y libertad de operación preliminar", "Día 30",
     "OTL y oficina jurídica", "Expediente de titularidad firmado y opinión preliminar de FTO sobre componentes críticos",
     "Habilita toda la valoración: sin esto el caso se presenta como condicionado", 150.0,
     "Se detiene la ronda o la firma de licencia; no hay activo transferible delimitado"),
    ("G2", "Lote piloto industrial con costos medidos y desempeño repetible", "Día 60",
     "Equipo técnico e investigador principal", "Informe de costos reales de fabricación y protocolo de ensayo reproducido en entorno relevante",
     "Costo variable unitario, año de salida y probabilidad de la ruta de falla", 150.0,
     "Sube el costo variable unitario y se desplaza el inicio de ventas; aumenta el peso de la ruta Bajo"),
    ("G3", "Dirección comercial y servicio de campo cubiertos", "Día 60",
     "Dirección de la spin-off o del equipo de transferencia", "Contratos firmados de los dos roles críticos con fecha de incorporación",
     "Gastos operativos (OPEX)", 0.0,
     "Aumenta el OPEX por sobrecostos operativos y se retrasan las unidades vendidas estimadas"),
    ("G4", "Piloto pagado o propuesta comercial aceptada", "Día 90",
     "Dirección comercial", "Contrato o propuesta con precio, plazo y condiciones verificables por al menos un cliente",
     "Precio de venta unitario, unidades estimadas de venta y probabilidad de la ruta de falla", 200.0,
     "La madurez comercial no avanza de 2; el comité pausa la exclusividad"),
    ("G5", "Canal operativo con la cooperativa", "Día 90",
     "OTL y dirección comercial", "Acuerdo de canal con responsabilidades, metas de referidos y vigencia",
     "Unidades estimadas de venta por año", 0.0,
     "Se mantiene la estimación de unidades sin apalancamiento de canal"),
]
for i, (cd, obj, pl, rsp, prb, var, tr, ef) in enumerate(GATES):
    rr = 8 + i
    lbl(gt, rr, cd, BODYB)
    put(gt, rr, 3, obj, None, Font(name="Aptos", size=9, bold=True, color=INK), None, WRAP)
    put(gt, rr, 4, pl, None, Font(name="Aptos", size=9, color=TERRA), None, CTR)
    put(gt, rr, 5, rsp, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    put(gt, rr, 6, prb, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    put(gt, rr, 7, var, None, Font(name="Aptos", size=9, color=TEAL), None, WRAP)
    inp(gt, rr, 8, tr, NF_M)
    put(gt, rr, 9, ef, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    gt.row_dimensions[rr].height = 46
rr = 13
lbl(gt, rr, "Total", BODYB)
for cc in range(2, 10):
    gt.cell(rr, cc).fill = fill(F_TERRA)
put(gt, rr, 8, "=SUM(H8:H12)", NF_M, LINKB, F_TERRA, CTR)
put(gt, rr, 3, "Suma de tramos: referencia frente al pago inicial de la licencia o la inversión semilla de Supuestos", None,
    Font(name="Aptos", size=9, bold=True, color=TERRA), F_TERRA, WRAP)
put(gt, 14, 8, f'=IF(ABS(H13-{ESS["inv"]})<0.01,"Cuadra con la inversión semilla",'
               f'IF(ABS(H13-\'Licencia\'!$C${LRES["Pago inicial"]})<0.01,"Cuadra con el pago inicial de la licencia",'
               f'"Referencial: ajuste el monto según la vía elegida"))',
    None, LINKB, None, CTR)

band(gt, 16, range(2, 7), "Decisión que se somete al comité")
dec = [
    ("Recomendación", "Continuar con la modalidad de licencia activa bajo condiciones verificables, con desembolso o pago de hitos contra los gates G1, G2 y G4."),
    ("Rango de valor", "Según la vía: valor de la licencia (hoja Licencia) o pre-money ajustado por las cuatro rutas (hoja Rutas Berkus), con la sensibilidad como banda de discusión."),
    ("Qué decide el comité", "Modalidad de licencia (cesión total, exclusiva, no exclusiva), o crear empresa y buscar capital. Una sola de estas opciones."),
    ("Qué se recalcula al cerrar cada gate", "Las variables que el gate afecta y las probabilidades de las cuatro rutas, con registro en la bitácora de versiones."),
    ("Qué no se hace", "Reescribir retroactivamente la evidencia, ni ajustar números para que la participación quepa en el máximo cedido."),
]
for i, (t, txt) in enumerate(dec):
    rr = 17 + i * 2
    lbl(gt, rr, t, BODYB)
    put(gt, rr, 3, txt, None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
    gt.merge_cells(start_row=rr, start_column=3, end_row=rr + 1, end_column=6)
gt.freeze_panes = "C8"

# ================================================================ CASO Y FUENTES
cf = wb["Caso y fuentes"]
head(cf, "Caso FríoRaíz y fuentes metodológicas", "Contexto del caso ficticio y referencias que fundamentan el método. Las cifras son supuestos docentes.",
     {"B": 30, "C": 62, "D": 46}, span=4)

band(cf, 7, range(2, 4), "Contexto del caso")
ctx = [
    ("Origen", "Universidad pública peruana y centro tecnológico colaborador (instituciones ficticias)"),
    ("Invención", "Módulo de atmósfera controlada de bajo consumo para pequeños centros de acopio de fruta"),
    ("Paquete transferible", "Diseño del circuito de circulación, sensores y firmware de control, algoritmo de optimización, protocolo de calibración, resultados experimentales y documentación de capacitación"),
    ("Cliente", "Centros de acopio, cooperativas de fruta fresca y exportadores con pérdida poscosecha"),
    ("Oferta", "Venta del módulo instalado: unidad de referencia del modelo de ingresos (precio y costo variable por unidad)"),
    ("Campo de uso", "Conservación poscosecha de fruta fresca"),
    ("Territorio", "Perú, con opción de expansión a América Latina"),
    ("Propiedad intelectual", "Tres modalidades evaluadas: cesión total, licencia exclusiva condicionada y licencia no exclusiva; titularidad final y aportes del centro colaborador sujetos a verificación"),
    ("Estado de evidencia", "Prototipo probado en entorno relevante de escala piloto. TRL 5 a 6 declarado, sujeto a verificación documental. Sin ventas históricas"),
    ("Madurez comercial", "2 a 3 sobre 5: problema contrastado con entrevistas; oferta sin piloto pagado"),
    ("Objeto de la hoja Licencia", "Valor del activo intangible según se ceda, licencie en exclusiva o licencie sin exclusividad"),
    ("Objeto de la hoja VC Model", "Equity de una eventual spin-off, como vía alternativa a licenciar"),
]
for i, (t, txt) in enumerate(ctx):
    rr = 8 + i
    lbl(cf, rr, t, BODYB)
    put(cf, rr, 3, txt, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    cf.row_dimensions[rr].height = 26

band(cf, 21, range(2, 5), "Fuentes metodológicas")
src = [
    ("Sílabo del curso", "Syllabus ejecutivo Evaluación, Valoración y Estrategia de Transferencia de resultados de I+D y tecnologías. New Genesis y Biogenia, agosto de 2026", "Secuencia de los cuatro bloques y de los siete capítulos"),
    ("OMPI", "Intellectual Property Valuation Basics for Technology Transfer Professionals, 2025", "https://www.wipo.int/web-publications/intellectual-property-valuation-basics-for-technology-transfer-professionals/en/"),
    ("OMPI", "Valuing Intellectual Property Assets", "https://www.wipo.int/en/web/business/ip-valuation"),
    ("Comisión Europea", "Technology Readiness Levels", "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/support/faq/2890"),
    ("Berkus", "The Berkus Method. Valuing the Early Stage Investment, 2016", "Origen de los cinco pilares; su uso aquí como mapa de riesgos es una adaptación docente"),
    ("Damodaran", "The Dark Side of Valuation. Valuing Young, Distressed, and Complex Businesses, 3.ª edición, 2018", "Tratamiento de empresas sin historial financiero"),
]
for i, (a, t, u) in enumerate(src):
    rr = 22 + i
    lbl(cf, rr, a, BODYB)
    put(cf, rr, 3, t, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    put(cf, rr, 4, u, None, Font(name="Aptos", size=9, color=MUTED), None, WRAP)
    cf.row_dimensions[rr].height = 26

put(cf, 30, 2, "Criterio de adaptación", None, SECT)
put(cf, 31, 2, "El uso de Berkus como mapa de cinco riesgos y su conexión con probabilidades y flujos es una adaptación docente de este manual; "
               "no debe atribuirse a una fórmula universal de Berkus. Las tasas de regalía de 1% a 5% son valores de referencia del propio módulo de clase "
               "para tecnología universitaria temprana y requieren comparables por campo de uso, territorio y exclusividad. La OMPI distingue métodos de costo, "
               "mercado e ingresos y advierte que una tecnología temprana puede carecer de datos financieros históricos: de ahí la triangulación y la separación "
               "entre valor del activo, valor para una entidad y precio negociado.",
    None, Font(name="Aptos", size=9, color=INK), F_PANEL, WRAP)
cf.merge_cells(start_row=31, start_column=2, end_row=35, end_column=4)
cf.freeze_panes = "B8"

# ================================================================ RESUMEN COMITE
z = wb["Resumen comité"]
head(z, "FríoRaíz · Resumen para comité", "Valoración de una invención universitaria como activo intangible, sin historial de ventas. Caso ficticio con fines docentes.",
     {"B": 42, "C": 20, "D": 4, "E": 46, "F": 4, "G": 20, "H": 20}, span=8)

put(z, 5, 2, "Modalidad de licencia activa", None, BODY)
put(z, 5, 3, f"='Supuestos'!$D${sel_row}", None, LINKB, None, CTR)

band(z, 8, range(2, 4), "Indicador")
put(z, 8, 3, "Resultado", None, H_W, INK, CTR)

RES = [
    ("Costo de desarrollo de la tecnología", f"={ESS['costo_dev']}", NF_USD, None),
    ("Valor de la licencia bajo la modalidad activa", f"='Licencia'!$C${LRES['Valor total de la licencia bajo la modalidad activa']}", NF_USD, F_BLUE),
    ("Pago inicial", f"='Licencia'!$C${LRES['Pago inicial']}", NF_M, None),
    ("Valor presente de las regalías (si aplica)", f"='Licencia'!$C${LRES['Valor presente de las regalías (si aplica)']}", NF_M, None),
    ("Pre-money de equity · escenario Base (ruta alternativa)", f"='VC Model'!D{VR['11. Pre-money implícito']}", NF_M, None),
    ("Pre-money de equity · ajustado por las cuatro rutas", f"='Rutas Berkus'!$C${BA['Valor pre-money ajustado']}", NF_USD, F_TERRA),
    ("Participación requerida hoy (ruta de equity ajustada)", f"='Rutas Berkus'!$C${BA['Participación requerida hoy']}", NF_P, F_TERRA),
    ("Déficit máximo acumulado · escenario Base", f"='Proyección'!$D${PCMP['Déficit máximo acumulado']}", NF_M, None),
    ("¿La ronda cubre el plan del escenario Base?", f"='Proyección'!$D${PCMP['¿La ronda de la hoja Supuestos alcanza?']}", None, None),
    ("Lectura de ZOPA (ruta de equity)", f"='Negociación'!$C${NG['Lectura de ZOPA']}", None, INK),
]
ZR = {}
for i, (t, fx, nf, bg) in enumerate(RES):
    rr = 9 + i
    ZR[t] = rr
    is_key = bg in (F_TERRA, F_BLUE)
    f = BIG if is_key else BODY
    if bg == INK:
        lbl(z, rr, t, Font(name="Aptos", size=10, bold=True, color="FFFFFFFF"))
        for cc in range(2, 4):
            z.cell(rr, cc).fill = fill(INK)
        put(z, rr, 3, fx, nf, Font(name="Aptos", size=10, bold=True, color="FFFFFFFF"), INK, CTR)
    else:
        lbl(z, rr, t, BODYB if is_key else BODY)
        if bg:
            for cc in range(2, 4):
                z.cell(rr, cc).fill = fill(bg)
        put(z, rr, 3, fx, nf, f, bg, CTR)

put(z, 8, 5, "Conclusión para el comité", None, SECT)
z.cell(8, 5).fill = fill(F_TERRA)
z.cell(8, 6).fill = fill(F_TERRA)
concl = [
    "La invención se valora primero como un activo intangible que se transfiere: el pago depende de la modalidad elegida, no únicamente de crear una startup (Cap. 6.3).",
    "Cesión total entrega un pago único y cierra el riesgo de ejecución para la universidad. Licenciar, exclusiva o no, mantiene exposición a las ventas futuras a cambio de un ingreso potencialmente mayor.",
    "La ruta de equity es una alternativa, no un complemento: solo corresponde si el comité decide crear empresa en lugar de licenciar o ceder.",
    "La recomendación económica preliminar no es un precio exigible. Requiere el expediente técnico, financiero y jurídico completo.",
]
for i, txt in enumerate(concl):
    put(z, 9 + i * 3, 5, "· " + txt, None, Font(name="Aptos", size=10, color=INK), F_PANEL, WRAP)
    z.merge_cells(start_row=9 + i * 3, start_column=5, end_row=11 + i * 3, end_column=5)

put(z, 22, 5, "Condiciones previas al desembolso", None, SECT)
z.cell(22, 5).fill = fill(F_TERRA)
put(z, 23, 5, "Validar titularidad y aportes del centro colaborador (G1); medir el costo del lote piloto y reproducir el desempeño (G2); "
              "obtener al menos un piloto pagado o una propuesta aceptada con precio y condiciones verificables (G4). "
              "Cada tramo se libera contra el criterio de aceptación del gate, no contra el calendario.",
    None, Font(name="Aptos", size=10, color=INK), F_PANEL, WRAP)
z.merge_cells(start_row=23, start_column=5, end_row=26, end_column=5)

band(z, 22, range(2, 4), "Comparativo de vías · valor (USD miles)")
for i, (t, src) in enumerate([
    ("Licencia · modalidad activa", f"='Licencia'!$C${LRES['Valor total de la licencia bajo la modalidad activa']}"),
    ("Equity · escenario Base", f"='VC Model'!D{VR['11. Pre-money implícito']}"),
    ("Equity · ajustado por cuatro rutas Berkus", f"='Rutas Berkus'!$C${BA['Valor pre-money ajustado']}"),
]):
    rr = 23 + i
    lbl(z, rr, t, BODYB if i == 0 else BODY)
    put(z, rr, 3, src, NF_M, LINKB if i == 0 else LINK, F_BLUE if i == 0 else None, CTR)

put(z, 29, 2, "Todas las cifras financieras son hipótesis del ejercicio docente y no representan ventas observadas, cotizaciones reales "
              "ni compromisos de ninguna institución. Unidades en miles de dólares estadounidenses salvo indicación contraria.",
    None, NOTE, None, WRAP)
z.merge_cells(start_row=29, start_column=2, end_row=30, end_column=5)
put(z, 32, 2, "Manual Técnico de Valoración · Curso EVTT · Edición Docente 2026", None, Font(name="Aptos", size=9, bold=True, color=INK))
put(z, 33, 2, "David Chaupis Meza · CEO, Grupo Biogenia · Lima, Perú", None, Font(name="Aptos", size=9, color=MUTED))
z.freeze_panes = "B9"

# ================================================================ GUIA Y CONTROL
q = wb["Guía y control"]
head(q, "Guía de uso y controles del modelo", "Recorra el modelo en el orden de los capítulos del manual y cambie un dato por vez. Los controles son terminales: ninguna hoja depende de ellos.",
     {"B": 6, "C": 34, "D": 54, "E": 4, "F": 34, "G": 15, "H": 24}, span=8)

band(q, 7, range(2, 5), "Recorrido recomendado")
pasos = [
    ("01", "Contexto", "Lea Caso y fuentes. Delimite activo, derechos, propósito, perspectiva y fecha antes de mirar una cifra (Cap. 1)."),
    ("02", "Evidencia", "Revise Evidencia Berkus. Registre qué demuestra cada fuente y qué no demuestra; de ahí salen los gates (Cap. 2)."),
    ("03", "Supuestos", "Llene solo las nueve celdas ámbar: costo de desarrollo, precio, costo variable, unidades y crecimientos (Cap. 3). El resto son valores de referencia."),
    ("04", "Operación", "Siga en Proyección la cadena unidades vendidas → ingresos → margen de contribución → EBITDA, y compárela con el punto de equilibrio (Cap. 3)."),
    ("05", "Caja", "En el mismo bloque, verifique déficit máximo, primer EBITDA positivo y primera caja acumulada positiva (Cap. 4)."),
    ("06", "Licencia", "En Supuestos elija la modalidad (cesión total, exclusiva, no exclusiva); en Licencia lea el valor resultante (Cap. 6.3)."),
    ("07", "Equity alternativo", "Si la vía es crear empresa, compare las tres columnas de VC Model: cada una valora un futuro distinto, sin ponderar (Cap. 6.2)."),
    ("08", "Rutas Berkus", "Asigne probabilidades que sumen 100% y documente quién las aprobó y con qué evidencia (Cap. 5.2)."),
    ("09", "Comparativo", "Lea las tres vías lado a lado: licencia, equity Base y equity ajustado. No se suman entre sí."),
    ("10", "Sensibilidad", "Mueva dos parámetros por matriz. El rango no es una banda estadística ni cubre los demás riesgos (Cap. 6.4)."),
    ("11", "Negociación", "Compare la participación o el pago pedido con el máximo aceptable, revise BATNA, términos y concesiones (Cap. 7.2)."),
    ("12", "Gates", "Vincule cada tramo del desembolso o del pago a un criterio de aceptación verificable con responsable y fecha (Cap. 7.3)."),
    ("13", "Control", "Revise las reconciliaciones de esta hoja antes de llevar cualquier cifra a un comité."),
]
for i, (nn, t, txt) in enumerate(pasos):
    rr = 8 + i
    put(q, rr, 2, nn, None, Font(name="Aptos", size=9, bold=True, color=TERRA), None, CTR)
    lbl(q, rr, t, BODYB, 3)
    put(q, rr, 4, txt, None, Font(name="Aptos", size=9, color=INK), None, WRAP)
    q.row_dimensions[rr].height = 22

band(q, 23, range(2, 5), "Lectura de colores")
leg = [
    ("Ámbar con texto rojo", "Las nueve celdas esenciales del Cap. 3. Es casi lo único que debe editar."),
    ("Crema con texto azul", "Parámetro de negociación con valor de referencia. Editable, rara vez necesario."),
    ("Texto verde", "Resultado que se calcula o se trae de otra hoja."),
    ("Franja terracota", "Cifra de decisión: el resultado que llega al comité."),
    ("Franja azul", "Perspectiva de la licencia como activo intangible."),
    ("Franja teal", "Resultado intermedio relevante del escenario."),
]
for i, (t, txt) in enumerate(leg):
    rr = 24 + i
    bgm = {0: F_ESS, 1: F_INPUT, 2: None, 3: F_TERRA, 4: F_BLUE, 5: F_TEAL}[i]
    f_ = ESSF if i == 0 else (INP if i == 1 else (LINK if i == 2 else BODYB))
    put(q, rr, 3, t, None, f_, bgm)
    put(q, rr, 4, txt, None, Font(name="Aptos", size=9, color=INK), None, WRAP)

band(q, 7, range(6, 9), "Controles del modelo")
put(q, 7, 7, "Valor", None, H_W, INK, CTR)
put(q, 7, 8, "Criterio", None, H_W, INK, CTR)
CTRL = [
    ("Suma de probabilidades de las cuatro rutas", f"=SUM('Supuestos'!$C${PB['Falla']}:$C${PB['Alto']})-1", "Debe ser 0", NF_P2),
    ("Estructura de propiedad antes de la ronda", f"='Supuestos'!$C${ct_tot}-1", "Debe ser 0", NF_P2),
    ("Cap table después de la inversión", f"='Cap Table'!$D${rr_t}-1", "Debe ser 0", NF_P2),
    ("Cap table después de la ronda futura", f"='Cap Table'!$E${rr_t}-1", "Debe ser 0", NF_P2),
    ("Sensibilidad 1 frente al caso central (equity)", f"=E12-'Sensibilidad'!$C$14", "Debe ser 0", NF_P2),
    ("Sensibilidad 2 frente al caso central (cesión total)", f"='Sensibilidad'!$E$20-'Sensibilidad'!$C$23", "Debe ser 0", NF_M),
    ("Retorno verificado del inversionista · Base", f"='VC Model'!D{VR['17. Verificación: TIR obtenida por el inversionista']}-{REF['r']}", "Debe ser 0", NF_P2),
    ("Ingreso elegible no excede el ingreso esperado", f"=SUM('Licencia'!$C${LR['Ingreso elegible para regalía']}:$G${LR['Ingreso elegible para regalía']})-SUM('Licencia'!$C${LR['Ingreso esperado ponderado por rutas']}:$G${LR['Ingreso esperado ponderado por rutas']})", "Debe ser ≤ 0", NF_M),
    ("Ronda suficiente para el escenario Base", f"={ESS['inv']}-'Proyección'!$D${PCMP['Capital requerido con reserva']}", "Debe ser ≥ 0", NF_M),
    ("Participación ajustada dentro del máximo cedido", f"={REF['max_ced']}-'Rutas Berkus'!$C${BA['Participación requerida hoy']}", "Debe ser ≥ 0", NF_P2),
]
for i, (t, fx, cr, nf) in enumerate(CTRL):
    rr = 8 + i
    put(q, rr, 6, t, None, BODY, None, WRAP)
    put(q, rr, 7, fx, nf, LINKB, None, CTR)
    put(q, rr, 8, cr, None, Font(name="Aptos", size=9, color=MUTED), None, CTR)
q.cell(12, 7).value = f"='Sensibilidad'!$D$11-'Sensibilidad'!$C$14"

put(q, 19, 6, "Un control distinto de cero no invalida el modelo: señala dónde mirar. "
              "Los dos últimos son alertas de decisión, no errores de construcción.", None, NOTE, None, WRAP)
q.merge_cells(start_row=19, start_column=6, end_row=20, end_column=8)

put(q, 30, 2, "Manual Técnico de Valoración · Curso de Evaluación, Valoración y Transferencia Tecnológica · Edición Docente 2026",
    None, Font(name="Aptos", size=9, bold=True, color=INK))
put(q, 31, 2, "David Chaupis Meza · CEO, Grupo Biogenia · Lima, Perú · somosravencrm@gmail.com",
    None, Font(name="Aptos", size=9, color=MUTED))
q.freeze_panes = "B8"

# ---------------------------------------------------------------- pie de pagina
for name_ in SH:
    ws = wb[name_]
    ws.oddFooter.left.text = "Manual Técnico EVTT · Valoración sin ventas históricas"
    ws.oddFooter.left.size = 8
    ws.oddFooter.left.color = "746B64"
    ws.oddFooter.right.text = "David Chaupis Meza · CEO Grupo Biogenia · Página &P de &N"
    ws.oddFooter.right.size = 8
    ws.oddFooter.right.color = "746B64"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr = openpyxl.worksheet.properties.PageSetupProperties(fitToPage=True)

wb.active = 0
out = "/tmp/claude-0/-home-claude/f2dd2400-09fc-5216-86fc-1d5a0d3b6bab/scratchpad/BusinessCase_FrioRaiz_v3.xlsx"
wb.save(out)
print("OK ->", out)
