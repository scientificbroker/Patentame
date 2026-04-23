# APIs de búsqueda de patentes — Referencia técnica

## 1. EPO-OPS (European Patent Office Open Patent Services)

### Autenticación OAuth2
```http
POST https://ops.epo.org/3.2/auth/accesstoken
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={TU_CLIENT_ID}
&client_secret={TU_CLIENT_SECRET}
```
Respuesta: `{"access_token": "...", "expires_in": 1200}`
Registrar en: https://developers.epo.org

### Endpoints principales

#### Búsqueda publicada (Published Data Search)
```http
GET https://ops.epo.org/3.2/rest-services/published-data/search
Authorization: Bearer {access_token}
Accept: application/json

Query params:
  q  = CQL query (ver sintaxis abajo)
  Range = 1-25 (paginación)
  
Respuesta: JSON con lista de publicaciones + metadata básica
```

#### Sintaxis CQL para EPO-OPS
```
Campos de búsqueda:
  txt    = full text (título + abstract + claims)
  ti     = title only
  ab     = abstract only
  cl     = claims only
  ic     = IPC classification code
  pa     = applicant name
  in     = inventor name
  pd     = publication date (YYYYMMDD)
  ap     = application number
  
Operadores: AND, OR, NOT, PROX (proximity), wildcards (*)

Ejemplos:
  txt="chitosan wound healing" AND ic=A61L15 AND pd>=20200101
  pa="Universidad" AND ic=A01N AND NOT pa="Universidad de Chile"
  ti=(biodigester OR anaerobic) AND ic=C12M AND pd>=20180101
```

#### Obtener claims completos
```http
GET https://ops.epo.org/3.2/rest-services/published-data/publication/epodoc/{EP-NUMBER}/claims
Authorization: Bearer {access_token}
Accept: application/json
```

#### Obtener estado legal (vigencia, anualidades)
```http
GET https://ops.epo.org/3.2/rest-services/legal/{EP-NUMBER}/legal
Authorization: Bearer {access_token}
Accept: application/json

Campos clave en respuesta:
  LEGAL_STATUS: GRANT / APPLICATION / LAPSED / EXPIRED
  PAYMENT_STATUS: anualidades al día o no
  EXPIRY_DATE: fecha de expiración
```

#### Familia de patentes (cobertura territorial)
```http
GET https://ops.epo.org/3.2/rest-services/family/publication/epodoc/{EP-NUMBER}/biblio
Authorization: Bearer {access_token}

Devuelve: todos los números de publicación de la misma familia en diferentes países
Usar para: determinar en qué países está protegido el mismo invento
```

#### Límites de la API (rate limits)
- Plan gratuito: 4 peticiones/segundo, 10,000/semana
- Plan registrado: 20 peticiones/segundo
- Si se supera: esperar con backoff exponencial (1s, 2s, 4s, 8s...)

---

## 2. Patentscope — OMPI

### Acceso
- URL búsqueda: `https://patentscope.wipo.int/search/en/search.jsf`
- API REST (beta): `https://patentscope.wipo.int/search/en/api/`
- Sin autenticación para búsquedas básicas
- API key para volumen: registrar en https://www.wipo.int/apis/

### Endpoints de búsqueda

#### Búsqueda simple (web scraping o API beta)
```http
GET https://patentscope.wipo.int/search/en/api/query
  ?q=chitosan+wound+healing
  &office=PCT
  &dateRangeField=PD
  &dateRangeFrom=2020-01-01
  &dateRangeTo=2025-12-31
  &maxRec=20
  &offset=0
  &sortField=RELEVANCE
  &lang=ES,EN
```

#### Campos de búsqueda Patentscope
```
FP    = Full text (título + abstract)
TI    = Título
AB    = Abstract  
CL    = Claims
IC    = IPC code
PA    = Applicant
IN    = Inventor
PD    = Publication date (YYYYMMDD)
AD    = Application date
```

#### Descarga de documento completo
```http
GET https://patentscope.wipo.int/search/en/detail.jsf
  ?docId=WO2020123456
  
# Para claims en texto:
GET https://patentscope.wipo.int/search/en/clms.jsf?docId=WO2020123456
```

#### Ventajas específicas de Patentscope para FTO
- Cobertura de PCT (solicitudes internacionales)
- Identificación de "designated states" (países donde el PCT puede tener efecto)
- Base de datos de traducciones al español
- Búsqueda de similares basada en embeddings semánticos (función "Similar Docs")

#### Cálculo de vigencia para PCT
```
Regla estándar: Una PCT otorga 30 meses desde fecha de prioridad para entrar
en fase nacional. Si no entró en fase nacional en el país objetivo, no es
amenaza en ese territorio aunque la solicitud PCT esté publicada.

Verificar siempre: ¿entró en fase nacional en Perú/países CAN?
→ Buscar en INDECOPI o base nacional si hay número nacional asignado
```

---

## 3. Google Patents

### Acceso
- URL: `https://patents.google.com/`
- API no oficial (web scraping estructurado):
  `https://patents.google.com/api/query?q=...&num=20&start=0`
- API oficial via Google Cloud (BigQuery): datos completos en bulk

### Query URL directa (sin API key)
```
https://patents.google.com/patent/EP1234567/es
→ Acceso directo a patente específica con traducción al español

https://patents.google.com/?q=(chitosan+wound+healing)&country=PE,CO,US,EP&status=GRANT
→ Búsqueda filtrada por país y estado
```

### Parámetros de búsqueda URL
```
q       = términos de búsqueda (entre paréntesis para frase exacta)
country = PE, CO, EC, BO, US, EP, WO (múltiples separados por coma)
status  = GRANT (otorgadas) | APPLICATION (en trámite)
type    = PATENT | DESIGN | UTILITY
before  = priority:20251231 (fecha límite)
after   = priority:20000101 (fecha mínima)
inventor = apellido del inventor
assignee = nombre del solicitante/titular
language = es (español)
```

### Extracción de datos via Google Patents API (unofficial)
```javascript
// Llamada de ejemplo para FTO automation
const query = encodeURIComponent('chitosan electrospinning wound dressing');
const url = `https://patents.google.com/api/query?q=${query}&num=20&start=0&country=PE,US,EP&status=GRANT`;

// Respuesta JSON incluye:
// - patent_id, title, abstract_localized
// - assignee_harmonized (titular normalizado)
// - inventor_harmonized
// - publication_date, grant_date, expiration_date
// - ipc_code (lista)
// - claim_count, independent_claim_count
// - similar_documents (ML-based similarity)
// - art_unit, examiner
```

### Ventajas específicas de Google Patents para FTO
- **Semantic Search**: búsqueda en lenguaje natural (sin query formal)
- **Similar Documents**: encuentra patentes relacionadas que las queries formales pueden perder
- **Cobertura INDECOPI**: incluye patentes peruanas en su base de datos
- **Traducción automática**: claims en español para patentes en otros idiomas
- **Prior Art Tool**: identifica arte previo que puede invalidar una patente
- **Patent families**: visualización de cobertura territorial
- **Citas forward/backward**: quién cita esta patente, quién fue citado

### Estrategia de búsqueda combinada recomendada

```
PASO 1: Búsqueda semántica en Google Patents
  → Lenguaje natural: "tecnología de electrohilado con quitosán para apósitos"
  → Obtener top 10 por relevancia ML
  
PASO 2: Búsqueda técnica en EPO-OPS
  → Query CQL: txt="electrospinning" AND txt="chitosan" AND ic=A61L15
  → Obtener top 10 por clasificación IPC
  
PASO 3: Búsqueda PCT en Patentscope
  → FP:(electrospinning chitosan wound) AND IC:A61L
  → Obtener top 10 solicitudes internacionales
  
PASO 4: Deduplicar por familia de patentes
  → Consolidar usando el número de familia EPO como clave única
  → Resultado: lista de 15-25 invenciones únicas para análisis profundo
```

---

## 4. INDECOPI — Cobertura para Perú

INDECOPI no tiene API pública documentada. Estrategia recomendada:

### Método 1 (Recomendado): Google Patents con filtro país
```
https://patents.google.com/?q=QUERY&country=PE&status=GRANT
→ Cubre patentes otorgadas por INDECOPI
→ Incluye traducciones al español
```

### Método 2: Tablero estadístico INDECOPI
```
URL: https://www.indecopi.gob.pe/en/invenciones-y-nuevas-tecnologias
→ Búsqueda manual por número, titular, o clasificación
→ No tiene API pero permite búsqueda web interactiva
```

### Método 3: Espacenet con filtro PE
```
EPO-OPS query: ic=A61L15 AND pn=PE*
→ pn=PE* filtra por números de publicación peruanos
```

### Marco normativo relevante para Perú y CAN
- **Decisión 486 CAN** (ver `references/decision-486.md`): protección uniforme en
  Perú, Colombia, Ecuador y Bolivia. Una patente concedida en uno es válida en todos.
- **Vigencia**: 20 años para patentes de invención, 10 años para modelos de utilidad
- **Anualidades**: verificar pago en INDECOPI — muchas patentes extranjeras no mantienen
  el pago en Perú y caducan de facto

---

## 5. Manejo de errores de API

```python
# Patrón de retry para todas las APIs
import time

def api_call_with_retry(url, headers, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:  # Rate limit
                wait_time = 2 ** attempt
                time.sleep(wait_time)
            elif response.status_code == 503:  # Service unavailable
                time.sleep(5)
            else:
                raise Exception(f"API error: {response.status_code}")
        except requests.Timeout:
            if attempt == max_retries - 1:
                return None  # Reportar como fuente no disponible
    return None
```
