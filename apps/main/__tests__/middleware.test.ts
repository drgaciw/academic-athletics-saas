
import { authMiddleware } from '@clerk/nextjs';
import middleware, { config } from '../middleware';

// Mock @clerk/nextjs
jest.mock('@clerk/nextjs', () => ({
  authMiddleware: jest.fn().mockImplementation((options) => {
    return (req: any, evt: any) => {
      // Mock middleware execution
      return 'middleware executed';
    };
  }),
}));

describe('Middleware', () => {
  it('should configure authMiddleware correctly', () => {
    // Check if authMiddleware was called
    expect(authMiddleware).toHaveBeenCalled();

    // Get the options passed to authMiddleware
    const options = (authMiddleware as jest.Mock).mock.calls[0][0];

    // Assert that publicRoutes are defined correctly
    expect(options.publicRoutes).toEqual([
      '/',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/api/webhooks(.*)',
    ]);

    // Assert that publishableKey and secretKey are read from env
    // Note: process.env mocks should be handled in jest.setup.js or beforeEach
  });

  it('should define matcher config', () => {
    expect(config).toBeDefined();
    expect(config.matcher).toBeInstanceOf(Array);
    expect(config.matcher).toContain('/(api|trpc)(.*)');
  });
});
