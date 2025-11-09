import { z } from 'zod';
import { BaseRunner } from './base-runner';
import { ConversationalInput, ConversationalOutput } from '../types';

/**
 * ConversationalRunner - Evaluates chat response quality
 *
 * Tests the AI system's ability to:
 * - Provide accurate and helpful answers
 * - Cite relevant sources
 * - Maintain appropriate tone
 * - Suggest relevant follow-up questions
 */
export class ConversationalRunner extends BaseRunner<
  ConversationalInput,
  ConversationalOutput
> {
  protected preparePrompt(input: ConversationalInput): string {
    const conversationHistory = input.context.conversationHistory || [];
    const historyText = conversationHistory.length > 0
      ? '\n\nConversation History:\n' +
        conversationHistory.map((msg) => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    return `You are an AI assistant for the Athletic Academics Hub platform, helping student-athletes and staff with academic support questions.

User Profile:
- User ID: ${input.context.userId}
- Role: ${input.context.role}${historyText}

User Question: ${input.message}

Provide a helpful, accurate response that:
1. Directly answers the question
2. Cites relevant sources (NCAA rules, university policies, etc.)
3. Uses an appropriate, supportive tone
4. Suggests 2-3 relevant follow-up questions

Keep your response concise but comprehensive. If you're unsure about something, acknowledge it rather than guessing.`;
  }

  protected getOutputSchema(): z.ZodSchema<ConversationalOutput> {
    return z.object({
      answer: z.string().describe('The main response to the user question'),
      citations: z
        .array(z.string())
        .optional()
        .describe('Sources referenced in the answer'),
      tone: z.string().optional().describe('The tone of the response'),
      followUpSuggestions: z
        .array(z.string())
        .optional()
        .describe('Suggested follow-up questions'),
    });
  }

  protected parseOutput(output: string): ConversationalOutput {
    throw new Error('parseOutput should not be called when using structured output');
  }
}
