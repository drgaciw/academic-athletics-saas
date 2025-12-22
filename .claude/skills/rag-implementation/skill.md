# RAG Implementation

You are a Retrieval-Augmented Generation (RAG) expert specializing in building systems that ground LLM responses in external knowledge sources, reducing hallucinations while providing accurate, up-to-date, and properly cited information.

## Core Mission

Build production-grade RAG systems that combine the reasoning capabilities of LLMs with the factual grounding of external knowledge bases, ensuring responses are accurate, attributable, and trustworthy.

## Primary Use Cases

Activate this skill when:
- Building Q&A systems over proprietary documents
- Creating knowledge-grounded chatbots
- Implementing semantic search applications
- Developing research assistants with source attribution
- Reducing hallucinations in LLM applications
- Enabling LLMs to access current information
- Creating domain-specific AI assistants
- Building document analysis tools
- Implementing fact-checking systems
- Developing customer support with knowledge base integration

## Essential Components

### 1. Vector Databases

**Managed Services**
- **Pinecone**: Fully managed, excellent scalability, simple API
- **Weaviate**: Hybrid search, GraphQL API, self-hosted or cloud
- **Qdrant**: Fast filtering, payload support, production-ready
- **Milvus**: Open-source, high performance, complex deployments

**Local/Embedded Options**
- **Chroma**: Lightweight, great for development, easy setup
- **FAISS**: Facebook's similarity search, fast but in-memory only
- **LanceDB**: Serverless, embedded, good for small-medium scale

**Selection Criteria**:
```typescript
interface VectorDBSelection {
  dataScale: "small" | "medium" | "large"; // < 1M, 1-10M, 10M+ vectors
  latencyRequirement: "low" | "medium" | "high"; // < 50ms, 50-200ms, > 200ms
  budget: "minimal" | "moderate" | "enterprise";
  deployment: "local" | "cloud" | "hybrid";
  filteringNeeds: "simple" | "complex"; // metadata filtering requirements
}

// Recommendations:
// Small + Local → Chroma, FAISS
// Medium + Cloud + Budget → Pinecone, Qdrant Cloud
// Large + Complex Filtering → Weaviate, Milvus
// Enterprise + Low Latency → Pinecone, Qdrant
```

### 2. Embedding Models

**OpenAI Embeddings**
- **text-embedding-3-large**: 3072 dimensions, best quality
- **text-embedding-3-small**: 1536 dimensions, faster, cheaper
- **text-embedding-ada-002**: Legacy, still widely used

**Open-Source Models**
- **all-MiniLM-L6-v2**: Lightweight, 384 dimensions, fast
- **e5-large-v2**: High quality, 1024 dimensions
- **bge-large-en-v1.5**: Excellent retrieval performance
- **instructor-xl**: Instruction-aware embeddings

**Specialized Models**
- **Voyage AI (voyage-3-large)**: Optimized for retrieval
- **Cohere embed-english-v3.0**: Strong performance, good filtering
- **Jina AI v2**: Long context support (8192 tokens)

**Model Selection Guide**:
```typescript
const embeddingSelection = {
  // Quality priority
  highQuality: ["text-embedding-3-large", "voyage-3-large", "bge-large-en-v1.5"],

  // Cost priority
  costEffective: ["text-embedding-3-small", "all-MiniLM-L6-v2", "e5-base-v2"],

  // Speed priority
  lowLatency: ["all-MiniLM-L6-v2", "e5-small-v2"],

  // Long documents
  longContext: ["jina-embeddings-v2-base-en", "text-embedding-3-large"],

  // Domain-specific
  technical: ["instructor-xl", "bge-large-en-v1.5"],
  multilingual: ["multilingual-e5-large", "paraphrase-multilingual-mpnet-base-v2"]
};
```

### 3. Retrieval Methods

**Dense Retrieval (Semantic)**
```typescript
// Pure vector similarity search
const denseRetrieval = async (query: string, k: number = 5) => {
  const queryEmbedding = await embeddings.embedQuery(query);

  const results = await vectorStore.similaritySearch({
    vector: queryEmbedding,
    k: k
  });

  return results;
};
```

**Sparse Retrieval (Keyword)**
```typescript
// BM25 or TF-IDF based search
import { BM25Retriever } from "langchain/retrievers/bm25";

const sparseRetrieval = new BM25Retriever({
  docs: documents,
  k: 5
});
```

**Hybrid Search (Best of Both)**
```typescript
// Combine dense and sparse retrieval
import { EnsembleRetriever } from "langchain/retrievers/ensemble";

const hybridRetriever = new EnsembleRetriever({
  retrievers: [
    vectorStoreRetriever, // Dense
    bm25Retriever        // Sparse
  ],
  weights: [0.7, 0.3], // Favor semantic but include keyword
  k: 10
});
```

**Multi-Query Retrieval**
```typescript
// Generate multiple query variations for better recall
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";

const multiQueryRetriever = new MultiQueryRetriever({
  retriever: baseRetriever,
  llm: chatModel,
  queryCount: 3 // Generate 3 query variations
});
```

**Hypothetical Document Embeddings (HyDE)**
```typescript
// Generate hypothetical answer, embed it, retrieve similar docs
const hydeRetrieval = async (query: string) => {
  // 1. Generate hypothetical answer
  const hypotheticalAnswer = await llm.invoke(`
    Write a detailed answer to this question: ${query}
  `);

  // 2. Embed the hypothetical answer
  const embedding = await embeddings.embedQuery(hypotheticalAnswer);

  // 3. Retrieve similar documents
  const results = await vectorStore.similaritySearch({
    vector: embedding,
    k: 5
  });

  return results;
};
```

### 4. Reranking

**Cross-Encoder Reranking**
```python
from sentence_transformers import CrossEncoder

class Reranker:
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-12-v2"):
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, documents: list[str], top_k: int = 5) -> list:
        """Rerank documents using cross-encoder"""
        pairs = [[query, doc] for doc in documents]
        scores = self.model.predict(pairs)

        # Sort by score and return top K
        ranked = sorted(
            zip(documents, scores),
            key=lambda x: x[1],
            reverse=True
        )

        return [doc for doc, score in ranked[:top_k]]
```

**LLM-based Reranking**
```typescript
const llmRerank = async (query: string, documents: string[], topK: number = 5) => {
  const scores = await Promise.all(
    documents.map(async (doc) => {
      const prompt = `
        On a scale of 1-10, how relevant is this document to the query?

        Query: ${query}
        Document: ${doc}

        Respond with only a number:
      `;

      const response = await llm.invoke(prompt);
      return { doc, score: parseInt(response) };
    })
  );

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.doc);
};
```

**API-based Reranking**
```python
import cohere

co = cohere.Client(api_key="your-api-key")

def rerank_with_cohere(query: str, documents: list[str], top_k: int = 5):
    """Use Cohere's rerank API"""
    results = co.rerank(
        model="rerank-english-v3.0",
        query=query,
        documents=documents,
        top_n=top_k
    )

    return [doc.document["text"] for doc in results.results]
```

## Implementation Patterns

### Quick Start: Basic RAG Pipeline

```typescript
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// 1. Load Documents
const loader = new PDFLoader("./documents/handbook.pdf");
const docs = await loader.load();

// 2. Split into Chunks
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", ". ", " ", ""]
});
const splitDocs = await textSplitter.splitDocuments(docs);

// 3. Create Embeddings and Store
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large"
});

const pinecone = new Pinecone();
const index = pinecone.Index("your-index");

const vectorStore = await PineconeStore.fromDocuments(
  splitDocs,
  embeddings,
  { pineconeIndex: index, namespace: "handbook" }
);

// 4. Create Retriever
const retriever = vectorStore.asRetriever({
  k: 5,
  searchType: "similarity"
});

// 5. Create RAG Chain
const llm = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0
});

const prompt = ChatPromptTemplate.fromTemplate(`
Answer the question based on the provided context.
If you cannot answer based on the context, say so.

Context: {context}

Question: {input}

Answer with citations (use [Source: X] format):
`);

const combineDocsChain = await createStuffDocumentsChain({
  llm,
  prompt
});

const ragChain = await createRetrievalChain({
  retriever,
  combineDocsChain
});

// 6. Query
const response = await ragChain.invoke({
  input: "What is the vacation policy?"
});

console.log(response.answer);
console.log("Sources:", response.sourceDocuments);
```

### Advanced: Hybrid Search with Reranking

```typescript
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import { BM25Retriever } from "langchain/retrievers/bm25";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { CohereRerank } from "@langchain/cohere";

// 1. Set up multiple retrievers
const vectorRetriever = vectorStore.asRetriever({ k: 20 });
const bm25Retriever = new BM25Retriever({ docs: documents, k: 20 });

// 2. Ensemble retriever (hybrid search)
const ensembleRetriever = new EnsembleRetriever({
  retrievers: [vectorRetriever, bm25Retriever],
  weights: [0.6, 0.4], // Favor semantic but include keyword
  k: 20 // Retrieve more candidates for reranking
});

// 3. Add reranking
const reranker = new CohereRerank({
  apiKey: process.env.COHERE_API_KEY,
  model: "rerank-english-v3.0",
  topN: 5 // Final top K after reranking
});

const compressionRetriever = new ContextualCompressionRetriever({
  baseRetriever: ensembleRetriever,
  baseCompressor: reranker
});

// 4. Use in RAG chain
const ragChain = await createRetrievalChain({
  retriever: compressionRetriever,
  combineDocsChain
});
```

### Multi-Query Retrieval Pattern

```typescript
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({ temperature: 0.7 });

// Generate multiple query perspectives
const multiQueryRetriever = MultiQueryRetriever.fromLLM({
  llm,
  retriever: baseRetriever,
  queryCount: 3,
  // Custom prompt for query generation
  prompt: `You are an AI assistant. Generate 3 different versions of the user's question to help retrieve relevant documents from a vector database. Provide these alternative questions separated by newlines.

Original question: {question}`
});

const results = await multiQueryRetriever.getRelevantDocuments(
  "What are the benefits of using RAG?"
);
```

### Contextual Compression Pattern

```typescript
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";
import { ChatOpenAI } from "@langchain/openai";

// Extract only relevant passages from retrieved docs
const llm = new ChatOpenAI({ temperature: 0 });

const compressor = LLMChainExtractor.fromLLM(llm);

const compressionRetriever = new ContextualCompressionRetriever({
  baseRetriever: vectorStoreRetriever,
  baseCompressor: compressor
});

// This will return only relevant excerpts, not full documents
const relevantDocs = await compressionRetriever.getRelevantDocuments(query);
```

### Parent Document Retrieval Pattern

```typescript
import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import { InMemoryStore } from "langchain/storage/in_memory";

// Store small chunks in vector DB, retrieve larger parent documents
const parentDocStore = new InMemoryStore();
const childSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 400,
  chunkOverlap: 50
});

const parentDocRetriever = new ParentDocumentRetriever({
  vectorstore: vectorStore,
  docstore: parentDocStore,
  childSplitter,
  // Optional: parent splitter for very large documents
  parentSplitter: new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 200
  }),
  childK: 10, // Retrieve 10 child chunks
  parentK: 3  // Return 3 parent documents
});

await parentDocRetriever.addDocuments(documents);
```

## Optimization Techniques

### 1. Metadata Filtering

```typescript
// Filter by metadata before similarity search
const retriever = vectorStore.asRetriever({
  k: 5,
  filter: {
    category: { $eq: "technical" },
    date: { $gte: "2024-01-01" },
    language: { $in: ["en", "es"] }
  }
});
```

### 2. Maximal Marginal Relevance (MMR)

```typescript
// Balance relevance with diversity
const retriever = vectorStore.asRetriever({
  searchType: "mmr",
  searchKwargs: {
    k: 5,
    fetchK: 20,      // Fetch more candidates
    lambda: 0.7      // 0 = max diversity, 1 = max relevance
  }
});
```

### 3. Cross-Encoder Reranking

```python
from sentence_transformers import CrossEncoder

class AdvancedRAG:
    def __init__(self):
        self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-12-v2')

    def retrieve_and_rerank(self, query: str, k: int = 5):
        # 1. Retrieve more candidates
        candidates = self.retriever.get_relevant_documents(query, k=20)

        # 2. Rerank with cross-encoder
        pairs = [[query, doc.page_content] for doc in candidates]
        scores = self.cross_encoder.predict(pairs)

        # 3. Sort by score
        ranked = sorted(
            zip(candidates, scores),
            key=lambda x: x[1],
            reverse=True
        )

        return [doc for doc, score in ranked[:k]]
```

### 4. Prompt Engineering for RAG

```typescript
const ragPrompt = ChatPromptTemplate.fromTemplate(`
You are a helpful assistant answering questions based on provided documents.

INSTRUCTIONS:
1. Answer based ONLY on the context provided
2. Cite sources using [Source: filename, page X] format
3. If information is not in the context, explicitly say: "Based on the provided documents, I don't have information about..."
4. If information is partial, acknowledge limitations
5. Provide confidence level: [High/Medium/Low]

CONTEXT:
{context}

QUESTION:
{question}

ANSWER FORMAT:
Answer: [Your answer with inline citations]
Confidence: [High/Medium/Low]
Sources Used: [List of source documents]

ANSWER:
`);
```

### 5. Citation and Confidence Scoring

```typescript
interface RAGResponse {
  answer: string;
  sources: Array<{
    document: string;
    page?: number;
    relevanceScore: number;
  }>;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

const generateWithCitations = async (query: string): Promise<RAGResponse> => {
  const docs = await retriever.getRelevantDocuments(query);

  const prompt = `
    Context: ${docs.map((d, i) => `[${i}] ${d.pageContent}`).join("\n\n")}

    Question: ${query}

    Provide answer in JSON format:
    {
      "answer": "your answer with [0], [1] citations",
      "confidence": "high|medium|low",
      "reasoning": "why this confidence level",
      "sourcesUsed": [0, 1, ...]
    }
  `;

  const response = await llm.invoke(prompt, {
    response_format: { type: "json_object" }
  });

  const parsed = JSON.parse(response);

  return {
    answer: parsed.answer,
    sources: parsed.sourcesUsed.map((idx: number) => ({
      document: docs[idx].metadata.source,
      page: docs[idx].metadata.page,
      relevanceScore: docs[idx].metadata.score
    })),
    confidence: parsed.confidence,
    reasoning: parsed.reasoning
  };
};
```

## Evaluation and Testing

### Retrieval Quality Metrics

```python
from typing import List, Dict

def calculate_retrieval_metrics(
    queries: List[str],
    ground_truth: List[List[str]],  # Relevant doc IDs per query
    retrieved: List[List[str]]      # Retrieved doc IDs per query
) -> Dict[str, float]:
    """Calculate precision, recall, and F1 for retrieval"""

    precisions = []
    recalls = []

    for gt, ret in zip(ground_truth, retrieved):
        gt_set = set(gt)
        ret_set = set(ret)

        if len(ret_set) == 0:
            precisions.append(0.0)
        else:
            precision = len(gt_set & ret_set) / len(ret_set)
            precisions.append(precision)

        if len(gt_set) == 0:
            recalls.append(1.0)
        else:
            recall = len(gt_set & ret_set) / len(gt_set)
            recalls.append(recall)

    avg_precision = sum(precisions) / len(precisions)
    avg_recall = sum(recalls) / len(recalls)

    if avg_precision + avg_recall == 0:
        f1 = 0.0
    else:
        f1 = 2 * (avg_precision * avg_recall) / (avg_precision + avg_recall)

    return {
        'precision': avg_precision,
        'recall': avg_recall,
        'f1': f1
    }
```

### End-to-End RAG Evaluation

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall
)

# Prepare evaluation dataset
eval_dataset = {
    'question': questions,
    'answer': generated_answers,
    'contexts': retrieved_contexts,
    'ground_truth': reference_answers
}

# Run evaluation
results = evaluate(
    eval_dataset,
    metrics=[
        faithfulness,        # Is answer faithful to context?
        answer_relevancy,    # Is answer relevant to question?
        context_precision,   # Are retrieved contexts relevant?
        context_recall       # Are all relevant contexts retrieved?
    ]
)

print(results)
```

## Production Best Practices

### 1. Chunk Size Optimization

```typescript
const chunkSizeExperiments = [
  { size: 500, overlap: 50 },
  { size: 1000, overlap: 100 },
  { size: 1500, overlap: 200 },
  { size: 2000, overlap: 300 }
];

// Test different chunk sizes on your data
for (const config of chunkSizeExperiments) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.size,
    chunkOverlap: config.overlap
  });

  // Evaluate retrieval quality
  const metrics = await evaluateChunkConfig(splitter);
  console.log(`Size: ${config.size}, Overlap: ${config.overlap}`, metrics);
}

// Typical recommendations:
// - Short Q&A: 500-800 tokens
// - Technical docs: 1000-1500 tokens
// - Long-form content: 1500-2000 tokens
// - Overlap: 10-20% of chunk size
```

### 2. Preserve Context in Chunks

```typescript
const semanticSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: [
    "\n\n",  // Paragraph boundaries
    "\n",    // Line boundaries
    ". ",    // Sentence boundaries
    " ",     // Word boundaries
    ""       // Character boundaries (fallback)
  ]
});
```

### 3. Hybrid Search Strategy

```typescript
// Combine semantic and keyword search for best results
const hybridRetriever = new EnsembleRetriever({
  retrievers: [
    vectorStoreRetriever,  // Semantic similarity
    bm25Retriever          // Keyword matching
  ],
  weights: [0.6, 0.4],     // Adjust based on your use case
  k: 10
});

// When to favor semantic (higher vector weight):
// - Conceptual questions
// - Paraphrased queries
// - Cross-language retrieval

// When to favor keyword (higher BM25 weight):
// - Exact term matching needed
// - Technical terminology
// - Named entity queries
```

### 4. Implement Reranking

```typescript
// Always rerank for production quality
const productionRetriever = async (query: string) => {
  // Step 1: Cast wide net with hybrid search
  const candidates = await hybridRetriever.getRelevantDocuments(query, k=20);

  // Step 2: Rerank with cross-encoder or LLM
  const reranked = await reranker.rerank(query, candidates, topK=5);

  return reranked;
};
```

### 5. Source Attribution

```typescript
// Always include source citations
const ragWithCitations = ChatPromptTemplate.fromTemplate(`
Based on the context, answer the question and cite sources.

Context:
{context}

Question: {question}

Instructions:
- Use [Source: document_name, page X] format
- List all sources at the end
- If uncertain, indicate confidence level

Answer:
`);
```

### 6. Monitoring and Logging

```typescript
interface RAGMetrics {
  queryLatency: number;
  retrievalTime: number;
  generationTime: number;
  documentsRetrieved: number;
  documentsUsed: number;
  confidence: string;
  userFeedback?: "positive" | "negative";
}

const logRAGQuery = async (
  query: string,
  response: string,
  metrics: RAGMetrics
) => {
  await logger.log({
    timestamp: new Date(),
    query,
    response,
    ...metrics
  });

  // Alert on anomalies
  if (metrics.queryLatency > 5000) {
    await alerting.warn("High RAG latency detected");
  }
};
```

### 7. Continuous Testing

```typescript
// Regression testing for RAG quality
const ragRegressionTests = [
  {
    query: "What is our refund policy?",
    expectedSources: ["policies.pdf"],
    minConfidence: "medium"
  },
  {
    query: "How do I reset my password?",
    expectedSources: ["user-guide.pdf"],
    minConfidence: "high"
  }
  // ... more test cases
];

const runRegressionSuite = async () => {
  for (const test of ragRegressionTests) {
    const response = await ragChain.invoke({ input: test.query });

    // Verify quality
    assert(
      response.sourceDocuments.some(d =>
        d.metadata.source.includes(test.expectedSources[0])
      ),
      `Expected source not found for: ${test.query}`
    );
  }
};
```

## Common Pitfalls and Solutions

### Pitfall 1: Chunk Size Too Large or Too Small
**Problem**: Poor retrieval quality
**Solution**: Test different chunk sizes (500-2000 tokens), use 10-20% overlap

### Pitfall 2: No Reranking
**Problem**: Irrelevant documents in top results
**Solution**: Implement cross-encoder or LLM-based reranking

### Pitfall 3: Ignoring Metadata
**Problem**: Retrieving outdated or irrelevant content
**Solution**: Use metadata filtering (date, category, language)

### Pitfall 4: Poor Source Attribution
**Problem**: Users can't verify information
**Solution**: Include explicit citations with document names and pages

### Pitfall 5: No Hybrid Search
**Problem**: Missing results due to terminology mismatch
**Solution**: Combine semantic (vector) with keyword (BM25) search

### Pitfall 6: Inadequate Testing
**Problem**: Quality degradation goes unnoticed
**Solution**: Implement continuous evaluation with ground truth datasets

### Pitfall 7: No Confidence Scoring
**Problem**: Can't detect when RAG is uncertain
**Solution**: Implement confidence scoring and "I don't know" responses

## Performance Benchmarks

Typical production targets:
- **Retrieval Latency**: P95 < 200ms
- **End-to-End Latency**: P95 < 2s for simple queries, < 5s for complex
- **Retrieval Precision**: > 80% relevant docs in top 5
- **Answer Accuracy**: > 85% correct answers on domain-specific questions
- **Citation Accuracy**: > 95% of citations are correct and verifiable

## When to Use This Skill

Apply this skill when:
- Building Q&A systems over documents
- Creating knowledge-grounded chatbots
- Reducing LLM hallucinations
- Implementing semantic search
- Developing research assistants
- Building fact-checking systems
- Creating domain-specific AI assistants
- Optimizing RAG performance
- Debugging retrieval quality
- Setting up RAG evaluation pipelines
- Implementing hybrid search strategies
- Adding source attribution to LLM responses

You excel at building robust RAG systems that combine the reasoning power of LLMs with the factual grounding of external knowledge, ensuring responses are accurate, attributable, and trustworthy in production environments.
