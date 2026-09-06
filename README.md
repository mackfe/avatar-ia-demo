# Avatar ICAIA — Holograma Interactivo

Asistente virtual con avatar de streaming en tiempo real (LiveAvatar / HeyGen) para el evento **ICAIA (Índice de Capacidades Argentinas en Inteligencia Artificial)** del Observatorio de IA de UTN Buenos Aires.

- **Cerebro**: flujo de n8n "Avatar ICAIA" (agente + RAG sobre el brochure de UTN/CIAA en PGVector)
- **Rostro y voz**: avatar femenino de medio cuerpo (LiveAvatar), fondo negro puro para holograma
- **Modo kiosko**: arranque automático, fullscreen, auto-reconexión 24/7 (sin timeout de inactividad)

## Arquitectura

```
[ Pantalla del evento (Chromium kiosko) ]
        │  WebRTC (video + audio)
        ▼
 Next.js app (este repo) ── POST /api/auth ──► LiveAvatar (token de sesión)
        │
        │  POST { sessionId, message, language }
        ▼
 n8n "Avatar ICAIA" (/webhook/icaia-avatar)
   ├─ AI Agent (OpenAI gpt-4.1-mini)
   ├─ Postgres Chat Memory (memoria por sesión)
   └─ Vector Store PGVector "icaia_vectors" (RAG del brochure)
        │
        └─ JSON { response, suggestions } → el avatar lo habla (avatar.repeat)
```

El stream WebRTC de LiveAvatar solo puede reproducirse en el navegador (la pantalla). Por eso n8n es el "cerebro" (razona + RAG) y la app + LiveAvatar son el "actor" (hablan y gesticulan). El avatar queda siempre activo: sin timeout que cierre la sesión y con reconexión automática con backoff ante cualquier corte.

## Requisitos

- Node.js 18+ (desarrollo)
- Una **LiveAvatar API Key** (NO es la key de api.heygen.com): se obtiene en https://app.liveavatar.com/developers
- Acceso al servidor n8n con los flujos "Avatar ICAIA" e "ICAIA - Ingesta de Documentos"

## Variables de entorno (`.env`)

```env
# REQUERIDO: LiveAvatar API Key (https://app.liveavatar.com/developers)
HEYGEN_API_KEY=""

# Avatar (femenino por defecto: Elenora Tech Expert)
NEXT_PUBLIC_AVATAR_ID="8175dfc2-7858-49d6-b5fa-0c135d1c4bad"

# Voces (opcional; vacío = voz por defecto del avatar)
LIVEAVATAR_VOICE_ES=""
LIVEAVATAR_VOICE_EN=""

# (Opcional) Knowledge Base de HeyGen. Dejar vacío.
NEXT_PUBLIC_HEYGEN_KB_ID=""

# Webhook de n8n del agente
N8N_WEBHOOK_URL="https://rpa11.cognitive.la/webhook/icaia-avatar"

# Arranca en modo kiosko/holograma directamente (true/false)
NEXT_PUBLIC_KIOSK_MODE="false"
```

## Modo kiosko / holograma

- URL: `http://<host>:9004/kiosk` (arranca en pantalla de espera; auto-fullscreen al primer gesto, oculta el HUD y el cursor, sin subtítulos)
- **Teclas en kiosko:** `F2` inicia el avatar · `F3` detiene la sesión (vuelve a la espera)
- O en cualquier ruta con `?kiosk=1`, o con `NEXT_PUBLIC_KIOSK_MODE=true`
- El avatar **nunca se desconecta por inactividad** y se reconecta solo si se cae (5s → 60s backoff)
- En la pantalla del evento usar Chromium en modo kiosko:
  ```bash
  chromium --kiosk --noerrdialogs --start-fullscreen http://<host>:9004/kiosk
  ```
  Con un watchdog (systemd/PM2) que relance el navegador si la pestaña muere.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:9002
npm run build      # producción
npm run start      # http://localhost:9004
```

## Docker (servidor)

```bash
cp .env.example .env   # completar HEYGEN_API_KEY y N8N_WEBHOOK_URL
docker compose up -d --build
```

El contenedor corre con `restart: always` + healthcheck, listo para operación 24/7.

## Flujos de n8n

| Flujo | Webhook | Función |
|---|---|---|
| Avatar ICAIA | `POST /webhook/icaia-avatar` | Agente con RAG que responde `{response, suggestions}` |
| ICAIA - Ingesta de Documentos | `POST /webhook/icaia-ingest` | Carga un PDF (`-F "data=@archivo.pdf"`) a la vector store |
| ICAIA - Limpiar Vector Store | `POST /webhook/icaia-clean` | Borra la tabla `icaia_vectors` para re-ingerir |

Ingesta de un documento nuevo:
```bash
curl -X POST -F "data=@nuevo_documento.pdf" https://rpa11.cognitive.la/webhook/icaia-ingest
```
