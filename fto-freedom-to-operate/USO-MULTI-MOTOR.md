# Uso en Diferentes Motores de IA — Skill FTO

Este skill está diseñado para ser portable. Puede usarse como instrucciones de sistema o contexto en múltiples plataformas.

---

## Claude (Anthropic)

### Claude Projects (claude.ai)
1. Crear un nuevo proyecto en [claude.ai](https://claude.ai)
2. En **Project settings** → **Custom instructions**, pegar el contenido de `SKILL.md` (desde "## Rol y Alcance" o completo)
3. O subir `SKILL.md` como documento de referencia en el proyecto

### Claude API
Incluir el contenido de `SKILL.md` en el mensaje de sistema (`system`):

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096,
  "system": "[Contenido de SKILL.md]",
  "messages": [...]
}
```

### Cursor
- Copiar la carpeta `fto-freedom-to-operate` a `~/.cursor/skills/` (uso personal)
- O a `.cursor/skills/` del proyecto (uso en equipo)
- El agente lo aplicará cuando detecte consultas sobre FTO, libertad de operación o riesgo de infracción

---

## ChatGPT (OpenAI)

### Custom Instructions
1. **Configuración** → **Personalización** → **Instrucciones personalizadas**
2. En "What would you like ChatGPT to know about you to provide better responses?", pegar las secciones relevantes de `SKILL.md`

### GPTs personalizados
1. Crear un GPT en [platform.openai.com](https://platform.openai.com)
2. En **Instructions**, incluir el contenido de `SKILL.md`
3. Añadir triggers como: "FTO", "libertad de operación", "infracción de patente", "design around"

### API
Incluir en el rol `system`:

```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "[Contenido de SKILL.md]"
    },
    ...
  ]
}
```

---

## Gemini (Google)

### Google AI Studio
1. Crear un nuevo chat o prompt
2. En **System instruction**, pegar el contenido de `SKILL.md`

### API
Usar el campo `systemInstruction` en la configuración del modelo.

---

## Otros motores (Llama, Mistral, etc.)

- Incluir el contenido de `SKILL.md` como primer mensaje de sistema
- O en el prompt de sistema si el modelo lo soporta
- Funciona con cualquier LLM que acepte instrucciones de contexto extensas

---

## Scripts de apoyo

Los scripts en `scripts/` pueden ejecutarse independientemente del motor de IA:

- **analizar_reivindicacion_fto.py**: analiza elemento a elemento una reivindicación frente al producto
- **generar_informe_fto.py**: genera un informe FTO estructurado completo

```bash
python scripts/analizar_reivindicacion_fto.py --interactivo
python scripts/generar_informe_fto.py --producto "Mi dispositivo" --jurisdicciones "ES,US" --salida informe_fto.md
```

Ver `scripts/README.md` para más detalles.

---

## Consejos de uso

1. **Versión completa vs. resumida**: Para motores con límite de contexto, usar solo las secciones "Rol y Alcance", "Principios de Respuesta" y la plantilla de informe FTO.
2. **Idioma**: El skill está en español; puede traducirse al inglés si se usa en contextos anglófonos.
3. **Actualización**: El FTO es sensible al tiempo — revisar el estado legal de patentes periódicamente.
4. **Advertencia legal**: Recordar siempre que el análisis FTO asistido por IA es orientativo y debe ser validado por un profesional legal.
