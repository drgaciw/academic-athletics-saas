
import { buildSeededInitialState } from '../app/layout';

// Mock imports that cause issues in test environment
jest.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'inter' }),
  Lexend: () => ({ variable: 'lexend' }),
}));

jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: any }) => children,
  SignedIn: () => null,
  SignedOut: () => null,
  SignInButton: () => null,
  UserButton: () => null,
}));

// Mock CSS import
jest.mock('../app/globals.css', () => ({}));

describe('Authentication Bypass (Seeding)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should NOT bypass authentication by default', () => {
    delete process.env.NEXT_PUBLIC_CLERK_SEED_ENABLED;

    const result = buildSeededInitialState();
    expect(result).toBeUndefined();
  });

  it('should bypass authentication when NEXT_PUBLIC_CLERK_SEED_ENABLED is true', () => {
    process.env.NEXT_PUBLIC_CLERK_SEED_ENABLED = 'true';

    const result = buildSeededInitialState();
    expect(result).toBeDefined();
    expect(result?.sessionClaims).toBeDefined();
  });

  it('should NOT bypass authentication when NEXT_PUBLIC_CLERK_SEED_ENABLED is false', () => {
    process.env.NEXT_PUBLIC_CLERK_SEED_ENABLED = 'false';

    const result = buildSeededInitialState();
    expect(result).toBeUndefined();
  });
});
