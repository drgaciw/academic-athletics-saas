import { z } from 'zod';
import { BaseRunner } from './base-runner';
import { RAGInput, RAGOutput } from '../types';

/**
 * RAGRunner - Evaluates Retrieval-Augmented Generation quality
 *
 * Tests the AI system's ability to:
 * - Retrieve relevant documents from the knowledge base
 * - Generate accurate answers based on retrieved context
 * - Cite sources appropriately
 * - Express confidence in answers
 */
export class RAGRunner extends BaseRunner<RAGInput, RAGOutput> {
  protected preparePrompt(input: RAGInput): string {
    const maxDocs = input.maxDocuments || 5;
    const contextText = input.context
      ? `\nAdditional Context:\n${JSON.stringify(input.context, null, 2)}`
      : '';

    return `You are processing a retrieval-augmented generation query. Your task is to retrieve relevant documents and generate an accurate answer.

Query: ${input.query}${contextText}

Instructions:
1. Identify the ${maxDocs} most relevant documents from your knowledge base
2. Generate a comprehensive answer based on the retrieved documents
3. Cite the specific documents used in your answer
4. Provide a confidence score (0.0-1.0) for your answer

Important:
- Only use information from retrieved documents
- If no relevant documents are found, acknowledge this
- Be precise about the relevance of each document
- Don't hallucinate information not present in the documents

Provide your response in a structured format including the answer, sources with relevance scores, and overall confidence.`;
  }

  protected getOutputSchema(): z.ZodSchema<RAGOutput> {
    return z.object({
      answer: z.string().describe('The generated answer based on retrieved documents'),
      sources: z
        .array(
          z.object({
            documentId: z.string().describe('Unique identifier for the document'),
            content: z.string().describe('Relevant excerpt from the document'),
            relevanceScore: z
              .number()
              .min(0)
              .max(1)
              .describe('How relevant this document is to the query'),
          })
        )
        .describe('List of source documents used'),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe('Overall confidence in the answer'),
    });
  }

  protected parseOutput(output: string): RAGOutput {
    throw new Error('parseOutput should not be called when using structured output');
  }
}
