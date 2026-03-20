# Uso en Diferentes Motores de IA

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
- Copiar la carpeta `patentes-vigilancia-tecnologica` a `~/.cursor/skills/` (uso personal)
- O a `.cursor/skills/` del proyecto (uso en equipo)
- El agente lo aplicará cuando detecte consultas sobre patentes o vigilancia tecnológica

---

## ChatGPT (OpenAI)

### Custom Instructions
1. **Configuración** → **Personalización** → **Instrucciones personalizadas**
2. En "What would you like ChatGPT to know about you to provide better responses?", pegar las secciones relevantes de `SKILL.md`

### GPTs personalizados
1. Crear un GPT en [platform.openai.com](https://platform.openai.com)
2. En **Instructions**, incluir el contenido de `SKILL.md`
3. Añadir triggers como: "patentes", "vigilancia tecnológica", "estado del arte"

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

- **generar_proceso_vt.py**: genera un documento de proceso de vigilancia tecnológica
- **generar_plan_busqueda.py**: genera un plan de búsqueda de patentes

```bash
python scripts/generar_proceso_vt.py --interactivo
python scripts/generar_plan_busqueda.py --tecnologia "IoT" --salida plan.md
```

Ver `scripts/README.md` para más detalles.

---

## Consejos de uso

1. **Versión completa vs. resumida**: Para motores con límite de contexto, usar solo las secciones "Rol y Alcance", "Principios de Respuesta" y la plantilla de análisis.
2. **Idioma**: El skill está en español; puede traducirse al inglés si se usa en contextos anglófonos.
3. **Actualización**: Revisar periódicamente las fuentes recomendadas y los términos del glosario.
