// src/ai/flows/process-voice-chat-with-llm.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for processing voice chat input, transcribing it, and generating a response from an LLM.
 *
 * - processVoiceChatWithLLM - A function that takes audio data, transcribes it, generates a response using an LLM, and returns the response text.
 * - ProcessVoiceChatWithLLMInput - The input type for the processVoiceChatWithLLM function, which includes the audio data URI.
 * - ProcessVoiceChatWithLLMOutput - The return type for the processVoiceChatWithLLM function, which includes the transcribed text and the LLM-generated response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessVoiceChatWithLLMInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ProcessVoiceChatWithLLMInput = z.infer<typeof ProcessVoiceChatWithLLMInputSchema>;

const ProcessVoiceChatWithLLMOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio data.'),
  llmResponse: z.string().describe('The LLM-generated response based on the transcription.'),
});
export type ProcessVoiceChatWithLLMOutput = z.infer<typeof ProcessVoiceChatWithLLMOutputSchema>;

export async function processVoiceChatWithLLM(input: ProcessVoiceChatWithLLMInput): Promise<ProcessVoiceChatWithLLMOutput> {
  return processVoiceChatWithLLMFlow(input);
}

const transcribeAudioTool = ai.defineTool({
  name: 'transcribeAudio',
  description: 'Transcribes audio data to text.',
  inputSchema: z.object({
    audioDataUri: z
      .string()
      .describe("Audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  }),
  outputSchema: z.string(),
}, async (input) => {
  // TODO: Implement audio transcription using a service like Deepgram or Google Cloud Speech-to-Text.
  // For now, return a placeholder transcription.
  console.log('transcribeAudio input', input.audioDataUri);
  return 'Placeholder transcription from audio data.';
});

const generateResponsePrompt = ai.definePrompt({
  name: 'generateResponsePrompt',
  input: {
    schema: z.object({
      transcription: z.string().describe('The transcribed text from the user\'s audio input.'),
    }),
  },
  output: {
    schema: z.object({
      llmResponse: z.string().describe('The LLM-generated response to the user\'s input.'),
    }),
  },
  prompt: `You are a helpful and friendly avatar. Respond to the following user input: {{{transcription}}}`,
});

const processVoiceChatWithLLMFlow = ai.defineFlow(
  {
    name: 'processVoiceChatWithLLMFlow',
    inputSchema: ProcessVoiceChatWithLLMInputSchema,
    outputSchema: ProcessVoiceChatWithLLMOutputSchema,
  },
  async input => {
    const transcription = await transcribeAudioTool({
      audioDataUri: input.audioDataUri,
    });

    const {output} = await generateResponsePrompt({
      transcription: transcription,
    });

    return {
      transcription: transcription,
      llmResponse: output!.llmResponse,
    };
  }
);
