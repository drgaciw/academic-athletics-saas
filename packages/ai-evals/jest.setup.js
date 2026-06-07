jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(),
}));

jest.mock('@ai-sdk/anthropic', () => ({
  anthropic: jest.fn(),
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
  streamText: jest.fn(),
  generateObject: jest.fn(),
}));
