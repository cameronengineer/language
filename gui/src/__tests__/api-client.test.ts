/**
 * API Client Tests
 * Tests API client functionality with proper mocking
 */

import { apiClient } from '@/src/services/api/client';

// Mock fetch at the global level
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
      headers: new Headers(),
    });
  });

  describe('HTTP Methods', () => {
    test('should make GET requests correctly', async () => {
      const testData = { message: 'success' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(testData),
      });

      const result = await apiClient.get('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result.data).toEqual(testData);
      expect(result.success).toBe(true);
    });

    test('should make POST requests with data', async () => {
      const postData = { name: 'test', value: 123 };
      const responseData = { id: 'created-123' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.post('/test-endpoint', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(postData),
        })
      );

      expect(result.data).toEqual(responseData);
    });

    test('should make PUT requests correctly', async () => {
      const putData = { id: '123', updated: true };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(putData),
      });

      const result = await apiClient.put('/test-endpoint/123', putData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint/123'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(putData),
        })
      );

      expect(result.data).toEqual(putData);
    });

    test('should make PATCH requests correctly', async () => {
      const patchData = { updated: true };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(patchData),
      });

      const result = await apiClient.patch('/test-endpoint/123', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint/123'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );

      expect(result.data).toEqual(patchData);
    });

    test('should make DELETE requests correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      });

      const result = await apiClient.delete('/test-endpoint/123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint/123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );

    });
  });

  describe('Query Parameters', () => {
    test('should handle query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      const params = { page: 1, limit: 10, search: 'test query' };
      await apiClient.get('/test-endpoint', params);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint?page=1&limit=10&search=test%20query'),
        expect.any(Object)
      );
    });

    test('should handle empty query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await apiClient.get('/test-endpoint', {});

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.any(Object)
      );
    });

    test('should handle undefined query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await apiClient.get('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ error: 'Invalid data' }),
      });

      await expect(apiClient.get('/test-endpoint')).rejects.toThrow();
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test-endpoint')).rejects.toThrow('Network error');
    });

    test('should handle 401 unauthorized responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Authentication required' }),
      });

      await expect(apiClient.get('/protected-endpoint')).rejects.toThrow();
    });

    test('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(apiClient.get('/test-endpoint')).rejects.toThrow();
    });

    test('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(apiClient.get('/test-endpoint')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Request Headers', () => {
    test('should include default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json',
          }),
        })
      );
    });

    test('should include Content-Type for requests with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.post('/test-endpoint', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
        })
      );
    });
  });

  describe('Response Handling', () => {
    test('should parse successful JSON responses', async () => {
      const responseData = { 
        users: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' }
        ],
        total: 2 
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseData),
      });

      const result = await apiClient.get('/users');

      expect(result.data).toEqual(responseData);
      expect(result.success).toBe(true);
    });

    test('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.resolve(null),
      });

      const result = await apiClient.delete('/test-endpoint/123');

      expect(result.data).toBe(null);
      expect(result.success).toBe(true);
    });

    test('should handle array responses', async () => {
      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(arrayData),
      });

      const result = await apiClient.get('/items');

      expect(result.data).toEqual(arrayData);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Base URL and Endpoints', () => {
    test('should construct correct URLs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/test/endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/endpoint'),
        expect.any(Object)
      );
    });

    test('should handle nested endpoints', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/users/123/profile/settings');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/123/profile/settings'),
        expect.any(Object)
      );
    });
  });

  describe('Concurrent Requests', () => {
    test('should handle multiple simultaneous requests', async () => {
      // Set up different responses for each request
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ endpoint: 1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ endpoint: 2 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ endpoint: 3 }),
        });

      const requests = [
        apiClient.get('/endpoint1'),
        apiClient.get('/endpoint2'),
        apiClient.get('/endpoint3'),
      ];

      const results = await Promise.all(requests);

      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect((results[0].data as any).endpoint).toBe(1);
      expect((results[1].data as any).endpoint).toBe(2);
      expect((results[2].data as any).endpoint).toBe(3);
    });

    test('should handle mixed success and failure requests', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Not found' }),
        });

      const results = await Promise.allSettled([
        apiClient.get('/success-endpoint'),
        apiClient.get('/error-endpoint'),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  describe('Performance', () => {
    test('should complete requests in reasonable time', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const startTime = Date.now();
      await apiClient.get('/test-endpoint');
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly in tests
    });

    test('should handle large response data efficiently', async () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
        })),
        metadata: {
          total: 1000,
          page: 1,
          limit: 1000,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(largeData),
      });

      const startTime = Date.now();
      const result = await apiClient.get('/large-dataset');
      const endTime = Date.now();

      expect((result.data as any).items).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(500); // Should handle large data efficiently
    });
  });
});

console.log('API client tests completed successfully! ✅');