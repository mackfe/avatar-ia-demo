'use server';

import { z } from 'zod'; 

// --- CONFIGURACIÓN DE TIMEOUT ---
// Esta configuración se mueve a page.tsx para que sea válida.

const UserProfileSchema = z.object({
  companions: z.string().optional(),
  tripDuration: z.string().optional(),
  interests: z.array(z.string()).optional(),
  accommodation: z.string().optional(),
});

const GenerateAvatarResponseInputSchema = z.object({
  text: z.string(),
  userLanguage: z.string(),
  userOrigin: z.string().optional(),
  userProfile: UserProfileSchema.optional(),
  sessionId: z.string(), // ID de sesión ahora es requerido
});

const GenerateAvatarResponseOutputSchema = z.object({
  response: z.string(),
  suggestions: z.array(z.string()),
});

export type GenerateAvatarResponseInput = z.infer<typeof GenerateAvatarResponseInputSchema>;
export type GenerateAvatarResponseOutput = z.infer<typeof GenerateAvatarResponseOutputSchema>;

export async function generateAvatarResponse(input: GenerateAvatarResponseInput): Promise<GenerateAvatarResponseOutput> {
  const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.error("❌ ERROR CRÍTICO: N8N_WEBHOOK_URL no está definido en .env");
    return {
      response: "Error de configuración del sistema.",
      suggestions: []
    };
  }

  try {
    const payload = {
      sessionId: input.sessionId, // Enviamos el ID de sesión
      message: input.text,
      language: input.userLanguage,
      origin: input.userOrigin || "Desconocido",
      profile: input.userProfile || {},
      timestamp: new Date().toISOString()
    };

    console.log(`⏳ [${new Date().toLocaleTimeString()}] Enviando a n8n...`);
    console.log("📤 Payload:", JSON.stringify(payload, null, 2));

    // Aumentamos el timeout del fetch explícitamente usando AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 segundos (2 minutos)

    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal // Vinculamos el timeout
    });

    clearTimeout(timeoutId); // Limpiamos el timer si respondió a tiempo

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`🔥 Error n8n (${res.status}):`, errorText);
      throw new Error(`Error n8n: ${res.status} ${res.statusText}`);
    }

    const rawData = await res.json();
    console.log(`✅ Respuesta cruda n8n:`, JSON.stringify(rawData).substring(0, 200) + "...");

    // --- CORRECCIÓN PARA MANEJAR ARRAY ---
    // Detectamos si n8n devolvió un Array ([...]) y tomamos el primer elemento
    let data = rawData;
    if (Array.isArray(rawData)) {
        console.log("⚠️ Detectado Array de n8n, extrayendo primer elemento...");
        data = rawData[0] || {};
    }

    // Validación final
    if (!data.response) {
      console.warn("⚠️ n8n respondió OK, pero el campo 'response' está vacío en el objeto:", data);
      return {
        response: "Disculpa, hubo un problema generando la respuesta. ¿Podrías preguntar de nuevo?",
        suggestions: ["Reintentar"]
      };
    }

    return {
      response: data.response,
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : []
    };

  } catch (error: any) {
    console.error("🔥 EXCEPCIÓN AL CONECTAR CON N8N:", error);

    // Identificar si fue timeout
    if (error.name === 'AbortError') {
      return {
        response: "El sistema está tardando demasiado en pensar (Timeout). Intenta con una pregunta más simple.",
        suggestions: ["Preguntar algo más breve"]
      };
    }

    return {
      response: "Lo siento, perdí la conexión con mi cerebro. Intenta de nuevo.",
      suggestions: ["Reintentar"]
    };
  }
}
