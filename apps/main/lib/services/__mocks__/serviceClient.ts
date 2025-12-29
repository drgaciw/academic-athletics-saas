/**
 * Mock ServiceClient for testing
 * This mock is automatically used by Jest when jest.mock('../serviceClient') is called
 */

// Create shared mock functions that will be used across all instances
export const mockGet = jest.fn();
export const mockPost = jest.fn();
export const mockPut = jest.fn();
export const mockPatch = jest.fn();
export const mockDelete = jest.fn();
export const mockStream = jest.fn();
export const mockHealthCheck = jest.fn();
export const mockRequest = jest.fn();

// Mock ServiceClient class
export class ServiceClient {
  public get = mockGet;
  public post = mockPost;
  public put = mockPut;
  public patch = mockPatch;
  public delete = mockDelete;
  public stream = mockStream;
  public healthCheck = mockHealthCheck;
  public request = mockRequest;

  constructor(serviceName: string, config: any) {
    // Assign the shared mock functions to this instance
    this.get = mockGet;
    this.post = mockPost;
    this.put = mockPut;
    this.patch = mockPatch;
    this.delete = mockDelete;
    this.stream = mockStream;
    this.healthCheck = mockHealthCheck;
    this.request = mockRequest;
  }
}

export const getServiceUrl = jest.fn((serviceName: string) => {
  return `http://localhost:3000/${serviceName}`;
});

// Reset all mocks helper
export const resetAllServiceMocks = () => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockPut.mockReset();
  mockPatch.mockReset();
  mockDelete.mockReset();
  mockStream.mockReset();
  mockHealthCheck.mockReset();
  mockRequest.mockReset();
};
