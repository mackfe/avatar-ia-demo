# Avatar Interactivo de IA — Holograma (HeyGen + n8n + RAG)

Asistente virtual con avatar de streaming en tiempo real (HeyGen LiveAvatar) para eventos, kioskos interactivos y atención digital. Desplegado como holograma interactivo en el evento **ICAIA** del Observatorio de IA de UTN Buenos Aires.

**Proyecto de José Rodríguez (mackfe) — Demo pública**

## Funcionalidades

- ✅ Avatar de medio cuerpo en streaming en tiempo real (WebRTC, baja latencia).
- ✅ Interacción por **texto y voz** con respuestas habladas al instante.
- ✅ **Cerebro multi-agente**: flujo de n8n con agente + RAG sobre documentación (PGVector).
- ✅ Memoria persistente por sesión (PostgreSQL chat memory).
- ✅ **Modo kiosko**: arranque automático, fullscreen y auto-reconexión 24/7.
- ✅ Dos modos de inteligencia: Knowledge Base de HeyGen o LLM externo (Gemini/DeepSeek) vía Genkit.

## Arquitectura

```
[ Pantalla del evento (Chromium kiosko) ]
        │  WebRTC (video + audio)
        ▼
 Next.js app ── POST /api/auth ──► LiveAvatar (token de sesión)
        │
        │  POST { sessionId, message, language }
        ▼
 n8n "Avatar ICAIA" (/webhook/icaia-avatar)
   ├─ AI Agent (OpenAI gpt-4.1-mini)
   ├─ Postgres Chat Memory (memoria por sesión)
   └─ Vector Store PGVector (RAG del brochure)
        │
        └─ JSON { response, suggestions } → el avatar lo habla
```

## Stack
Next.js · TypeScript · HeyGen Streaming Avatar SDK · WebRTC/LiveKit · n8n · PostgreSQL (PGVector) · Google Genkit

---

*Nota: repositorio demo con una selección representativa del código del cerebro de IA. El proyecto completo es privado.*
