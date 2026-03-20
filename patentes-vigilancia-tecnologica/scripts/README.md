# Scripts de apoyo al skill de Patentes y Vigilancia Tecnológica

Scripts Python para profundizar las tareas del agente. **Requieren Python 3.9+** y solo usan la biblioteca estándar.

---

## generar_proceso_vt.py

Genera un documento Markdown con el proceso completo de Vigilancia Tecnológica en 5 fases:
1. Definición de necesidades  
2. Selección de fuentes  
3. Recolección  
4. Análisis  
5. Difusión  

### Uso

```bash
# Modo interactivo (pregunta parámetros)
python generar_proceso_vt.py --interactivo

# Con argumentos y guardar en archivo
python generar_proceso_vt.py --sector "Energía solar" --objetivo "Identificar tendencias en almacenamiento" --salida proceso_vt.md

# Solo sector, salida a consola
python generar_proceso_vt.py --sector "Biotecnología"

# Todos los parámetros
python generar_proceso_vt.py -s "IoT industrial" -o "Competencia y tendencias" -t "sensores, conectividad" -c "Empresa A, Empresa B" -r "ES, EP, US" -p "Mensual" -S proceso.md
```

### Parámetros

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `--sector`, `-s` | Sector o ámbito tecnológico | A definir |
| `--objetivo`, `-o` | Objetivo principal | Identificar tendencias... |
| `--tecnologias`, `-t` | Tecnologías clave | A definir según sector |
| `--competidores`, `-c` | Competidores a vigilar | A identificar |
| `--regiones`, `-r` | Regiones/jurisdicciones | España, Europa... |
| `--periodicidad`, `-p` | Período de revisión | Trimestral |
| `--salida`, `-S` | Archivo de salida | Consola |
| `--interactivo`, `-i` | Modo interactivo | false |

---

## generar_plan_busqueda.py

Genera un plan de búsqueda de patentes con:
- Términos clave (ES/EN)
- Clasificaciones IPC/CPC
- Estrategia de consulta
- Fuentes y operadores por base de datos
- Filtros y criterios de registro

### Uso

```bash
# Modo interactivo
python generar_plan_busqueda.py --interactivo

# Con argumentos
python generar_plan_busqueda.py --tecnologia "Baterías de litio" --objetivo "Estado del arte" --salida plan_busqueda.md

# Básico
python generar_plan_busqueda.py -t "Agricultura de precisión" -S plan.md
```

### Parámetros

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `--tecnologia`, `-t` | Tecnología o ámbito | A definir |
| `--objetivo`, `-o` | Objetivo de la búsqueda | Estado del arte... |
| `--salida`, `-S` | Archivo de salida | Consola |
| `--interactivo`, `-i` | Modo interactivo | false |

---

## Ejecución desde el directorio del skill

Desde la carpeta `patentes-vigilancia-tecnologica`:

```bash
python scripts/generar_proceso_vt.py --interactivo
python scripts/generar_plan_busqueda.py -t "Tu tecnología" -S salida.md
```
