# EVTT — Evaluación y Vigilancia Tecnológica (Business Case)

Módulo integral de **Evaluación y Vigilancia Tecnológica (EVTT)** y formulación de casos de negocio para invenciones y tecnologías en desarrollo. Diseñado para transformar borradores de patentes, estudios de estado del arte y análisis FTO en casos de negocio financieros estructurados.

Compatible con **Claude Projects**, **OpenAI ChatGPT / Codex** y **Google Gemini Gems**.

---

## 📦 Descargas directas (Zips listos para usar)

Si deseas instalar el agente directamente en tu plataforma de preferencia sin configurar archivos manualmente, descarga los paquetes listos en [`downloads/`](./downloads/):

| Plataforma | Paquete descargable | Descripción |
| :--- | :--- | :--- |
| **Anthropic Claude** | [`EVTT_BusinessCase_Claude_Instalacion.zip`](./downloads/EVTT_BusinessCase_Claude_Instalacion.zip) | Instrucciones de sistema, metodología, especificación de libro de trabajo Excel y generador Python (`build_evtt_v2.py`). |
| **OpenAI ChatGPT** | [`EVTT_Business_Case_ChatGPT_Instalacion.zip`](./downloads/EVTT_Business_Case_ChatGPT_Instalacion.zip) | Instrucciones para Custom GPT, base de conocimiento y estructura de plugin portable con skill. |
| **Google Gemini** | [`EVTT_Business_Case_Gemini_Instalacion.zip`](./downloads/EVTT_Business_Case_Gemini_Instalacion.zip) | Instrucciones para Gems y documentos de referencia metodológica. |

---

## 📂 Estructura del módulo

```text
evtt-business-case/
├── README.md               # Esta guía
├── downloads/              # Archivos .zip comprimidos para distribución rápida
├── claude/                 # Código fuente y prompts para Claude Projects
│   ├── SKILL_EVTT_v2.md
│   ├── METODOLOGIA_EVTT.md
│   ├── SPEC_EXCEL_EVTT.md
│   └── build_evtt_v2.py
├── chatgpt/                # Código fuente y estructura para OpenAI GPT / Plugin
│   ├── INSTALL_CHATGPT.md
│   ├── custom-gpt/
│   │   └── CHATGPT_INSTRUCTIONS.md
│   ├── knowledge/
│   │   ├── methodology.md
│   │   └── workbook-spec.md
│   └── plugin/
│       ├── plugin.json
│       └── skills/evtt-business-case/
└── gemini/                 # Código fuente e instrucciones para Gemini Gems
    ├── INSTALL_GEMINI.md
    ├── GEM_INSTRUCTIONS.md
    └── knowledge/
        ├── methodology.md
        └── workbook-spec.md
```

---

## 🚀 Guías de instalación rápida

### 1. Anthropic Claude (Projects / Cowork)
1. Crea un nuevo **Project** en Claude.
2. Copia el contenido de [`claude/SKILL_EVTT_v2.md`](./claude/SKILL_EVTT_v2.md) en las **Custom Instructions** del proyecto.
3. Agrega [`claude/METODOLOGIA_EVTT.md`](./claude/METODOLOGIA_EVTT.md) y [`claude/SPEC_EXCEL_EVTT.md`](./claude/SPEC_EXCEL_EVTT.md) como archivos del proyecto.
4. Para generar el modelo financiero de 10 pestañas en Excel de forma local, ejecuta:
   ```bash
   python claude/build_evtt_v2.py
   ```

### 2. OpenAI (Custom GPT o Codex)
* **Custom GPT:**
  1. Abre el editor de GPTs en ChatGPT.
  2. Pega [`chatgpt/custom-gpt/CHATGPT_INSTRUCTIONS.md`](./chatgpt/custom-gpt/CHATGPT_INSTRUCTIONS.md) en el campo **Instructions**.
  3. Adjunta los archivos de [`chatgpt/knowledge/`](./chatgpt/knowledge/) en **Knowledge**.
  4. Habilita **Code Interpreter** para permitir la generación del Excel.
* **Codex / CLI:**
  Copia el directorio `chatgpt/plugin/skills/evtt-business-case` a tu carpeta local de skills (por ejemplo `~/.codex/skills/evtt-business-case`).

### 3. Google Gemini (Gems)
1. En Gemini, selecciona **Crear nuevo Gem**.
2. Copia [`gemini/GEM_INSTRUCTIONS.md`](./gemini/GEM_INSTRUCTIONS.md) en las instrucciones.
3. Carga los documentos de referencia ubicados en [`gemini/knowledge/`](./gemini/knowledge/).
