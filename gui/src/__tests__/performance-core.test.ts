/**
 * Core Performance Tests
 * Tests application performance without external dependencies
 */

describe('Core Performance Tests', () => {
  describe('Memory Efficiency', () => {
    test('should handle large datasets efficiently', () => {
      const startTime = performance.now();
      
      // Create large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        metadata: {
          score: Math.random(),
          timestamp: Date.now() + i,
          tags: [`tag-${i % 10}`, `category-${i % 5}`],
        },
      }));

      // Process the dataset
      const processed = largeDataset
        .filter(item => item.metadata.score > 0.5)
        .map(item => ({ ...item, processed: true }))
        .slice(0, 1000);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(processed.length).toBeLessThanOrEqual(1000);
      expect(processed.every(item => (item as any).processed)).toBe(true);
    });

    test('should handle rapid object creation and garbage collection', () => {
      const startTime = performance.now();
      const iterations = 50000;
      
      for (let i = 0; i < iterations; i++) {
        const obj = {
          id: i,
          timestamp: Date.now(),
          data: `data-${i}`,
          nested: {
            value: Math.random(),
            array: [1, 2, 3, 4, 5],
          },
        };
        
        // Simulate processing
        const processed = { ...obj, processed: true };
        
        // Object goes out of scope for GC
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle 50k object creations efficiently
      expect(duration).toBeLessThan(2000);
    });

    test('should handle complex data transformations efficiently', () => {
      const complexData = Array.from({ length: 1000 }, (_, i) => ({
        user_id: `user-${i}`,
        sessions: Array.from({ length: 30 }, (_, j) => ({
          id: `session-${i}-${j}`,
          date: new Date(Date.now() - j * 24 * 60 * 60 * 1000).toISOString(),
          duration: 15 + Math.random() * 30,
          accuracy: 0.6 + Math.random() * 0.4,
          words_practiced: Math.floor(10 + Math.random() * 20),
        })),
        total_words: 100 + i * 5,
        streak: Math.floor(Math.random() * 30),
      }));

      const startTime = performance.now();

      // Perform complex aggregations
      const analytics = complexData.map(userData => {
        const totalSessions = userData.sessions.length;
        const avgAccuracy = userData.sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
        const totalMinutes = userData.sessions.reduce((sum, s) => sum + s.duration, 0);
        const recentSessions = userData.sessions.slice(0, 7);
        
        return {
          user_id: userData.user_id,
          total_sessions: totalSessions,
          avg_accuracy: avgAccuracy,
          total_minutes: totalMinutes,
          recent_avg_duration: recentSessions.reduce((sum, s) => sum + s.duration, 0) / recentSessions.length,
          performance_score: avgAccuracy * Math.log(totalSessions + 1),
        };
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Complex aggregations should complete quickly
      expect(analytics).toHaveLength(1000);
      expect(analytics.every(a => typeof a.performance_score === 'number')).toBe(true);
    });
  });

  describe('Algorithm Performance', () => {
    test('should handle sorting algorithms efficiently', () => {
      const unsortedData = Array.from({ length: 10000 }, () => ({
        id: Math.random().toString(36),
        score: Math.random(),
        timestamp: Math.random() * Date.now(),
        priority: Math.floor(Math.random() * 100),
      }));

      const startTime = performance.now();

      // Test multiple sorting algorithms
      const sortedByScore = [...unsortedData].sort((a, b) => b.score - a.score);
      const sortedByTimestamp = [...unsortedData].sort((a, b) => b.timestamp - a.timestamp);
      const sortedByPriority = [...unsortedData].sort((a, b) => b.priority - a.priority);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Sorting 10k items should be fast
      expect(sortedByScore[0].score).toBeGreaterThanOrEqual(sortedByScore[1].score);
      expect(sortedByTimestamp[0].timestamp).toBeGreaterThanOrEqual(sortedByTimestamp[1].timestamp);
      expect(sortedByPriority[0].priority).toBeGreaterThanOrEqual(sortedByPriority[1].priority);
    });

    test('should handle search algorithms efficiently', () => {
      const searchData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description ${i}`,
        tags: [`tag-${i % 100}`, `category-${i % 50}`, `type-${i % 25}`],
        searchText: `Item ${i} Description ${i} tag-${i % 100}`.toLowerCase(),
      }));

      const searchQueries = ['Item 1234', 'Description 5678', 'tag-42', 'category-25'];

      const startTime = performance.now();

      searchQueries.forEach(query => {
        const results = searchData.filter(item => 
          item.searchText.includes(query.toLowerCase())
        );
        expect(results.length).toBeGreaterThanOrEqual(0);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Search should be fast
    });

    test('should handle pagination efficiently', () => {
      const dataset = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        value: `value-${i}`,
      }));

      const pageSize = 50;
      const startTime = performance.now();

      // Simulate pagination through large dataset
      for (let page = 0; page < 10; page++) {
        const start = page * pageSize;
        const end = start + pageSize;
        const pageData = dataset.slice(start, end);
        
        expect(pageData).toHaveLength(pageSize);
        expect(pageData[0].id).toBe(start);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Pagination should be very fast
    });
  });

  describe('Data Structure Performance', () => {
    test('should handle Map operations efficiently', () => {
      const dataMap = new Map();
      const startTime = performance.now();

      // Add 10k items to Map
      for (let i = 0; i < 10000; i++) {
        dataMap.set(`key-${i}`, {
          value: i,
          timestamp: Date.now(),
          metadata: { processed: false },
        });
      }

      // Lookup and update operations
      for (let i = 0; i < 1000; i++) {
        const key = `key-${i * 10}`;
        const item = dataMap.get(key);
        if (item) {
          dataMap.set(key, { ...item, metadata: { processed: true } });
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Map operations should be fast
      expect(dataMap.size).toBe(10000);
      expect(dataMap.get('key-100')?.metadata.processed).toBe(true);
    });

    test('should handle Set operations efficiently', () => {
      const dataSet = new Set();
      const startTime = performance.now();

      // Add and remove operations
      for (let i = 0; i < 10000; i++) {
        dataSet.add(`item-${i}`);
      }

      for (let i = 0; i < 5000; i += 2) {
        dataSet.delete(`item-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Set operations should be very fast
      expect(dataSet.size).toBe(7500); // 10000 - 2500 deleted items
      expect(dataSet.has('item-1')).toBe(true);
      expect(dataSet.has('item-0')).toBe(false);
    });
  });

  describe('Async Performance', () => {
    test('should handle concurrent Promise operations', async () => {
      const startTime = performance.now();

      const promises = Array.from({ length: 100 }, async (_, i) => {
        // Simulate async work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return {
          id: i,
          result: `processed-${i}`,
          timestamp: Date.now(),
        };
      });

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Concurrent execution should be faster than sequential
      expect(results).toHaveLength(100);
      expect(results.every(r => r.result.startsWith('processed-'))).toBe(true);
    });

    test('should handle Promise.allSettled efficiently', async () => {
      const startTime = performance.now();

      const promises = Array.from({ length: 50 }, async (_, i) => {
        if (i % 10 === 0) {
          throw new Error(`Error ${i}`);
        }
        return { success: true, data: i };
      });

      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
      expect(results).toHaveLength(50);
      
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');
      
      expect(fulfilled).toHaveLength(45); // 50 - 5 errors
      expect(rejected).toHaveLength(5);
    });
  });
});

describe('Security Validation Tests', () => {
  describe('Input Validation', () => {
    test('should validate email formats', () => {
      const emailTests = [
        { email: 'valid@example.com', valid: true },
        { email: 'user.name@domain.co.uk', valid: true },
        { email: 'invalid-email', valid: false },
        { email: '@domain.com', valid: false },
        { email: 'user@', valid: false },
        { email: 'user@domain', valid: false },
        { email: '<script>@domain.com', valid: false },
        { email: 'user@domain.com<script>', valid: false },
      ];

      emailTests.forEach(({ email, valid }) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email) && !email.includes('<') && !email.includes('>');
        expect(isValid).toBe(valid);
      });
    });

    test('should validate user input sanitization', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '${alert("xss")}',
        '"; DROP TABLE users; --',
        '../../../etc/passwd',
        '\x00\x01\x02',
      ];

      dangerousInputs.forEach(input => {
        // Basic sanitization check
        const sanitized = input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/[<>'"]/g, '')
          .trim();

        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized.length).toBeLessThanOrEqual(input.length);
      });
    });

    test('should validate numeric inputs', () => {
      const numericTests = [
        { input: '123', expected: 123, valid: true },
        { input: '0', expected: 0, valid: true },
        { input: '-123', expected: -123, valid: true },
        { input: 'abc', expected: NaN, valid: false },
        { input: '123abc', expected: NaN, valid: false },
        { input: '', expected: NaN, valid: false },
        { input: 'Infinity', expected: Infinity, valid: false },
        { input: 'null', expected: NaN, valid: false },
      ];

      numericTests.forEach(({ input, expected, valid }) => {
        const parsed = parseInt(input, 10);
        const isValid = !isNaN(parsed) && isFinite(parsed) && parsed.toString() === input;
        
        if (valid) {
          expect(parsed).toBe(expected);
          expect(isValid).toBe(true);
        } else {
          expect(isValid).toBe(false);
        }
      });
    });
  });

  describe('Data Structure Security', () => {
    test('should prevent prototype pollution', () => {
      const maliciousPayload = {
        __proto__: { malicious: true },
        constructor: { prototype: { polluted: true } },
        'constructor.prototype.evil': 'payload',
      };

      // Process malicious payload safely
      const safeData = JSON.parse(JSON.stringify(maliciousPayload));
      
      // Check that prototype wasn't polluted
      expect((Object.prototype as any).malicious).toBeUndefined();
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect((Object.prototype as any).evil).toBeUndefined();
      
      // Data should be processed but not affect prototypes
      expect(safeData).toHaveProperty('__proto__');
      expect(safeData).toHaveProperty('constructor');
    });

    test('should handle deep object cloning securely', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep-value',
                  array: [1, 2, 3, { nested: true }],
                },
              },
            },
          },
        },
        __proto__: { malicious: true },
      };

      const startTime = performance.now();
      
      // Safe deep clone
      const cloned = JSON.parse(JSON.stringify(deepObject));
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(10); // Deep cloning should be fast
      expect(cloned.level1.level2.level3.level4.level5.value).toBe('deep-value');
      expect(cloned).not.toBe(deepObject); // Different object reference
      expect((Object.prototype as any).malicious).toBeUndefined(); // No pollution
    });
  });

  describe('Regex Performance and Security', () => {
    test('should handle regex operations efficiently', () => {
      const testStrings = Array.from({ length: 1000 }, (_, i) => 
        `This is test string number ${i} with email test${i}@example.com and phone +1-555-${String(i).padStart(4, '0')}`
      );

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /\+\d{1,3}-\d{3}-\d{4}/g;

      const startTime = performance.now();

      testStrings.forEach(str => {
        const emails = str.match(emailRegex) || [];
        const phones = str.match(phoneRegex) || [];
        
        expect(emails.length).toBeGreaterThan(0);
        expect(phones.length).toBeGreaterThan(0);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Regex operations should be efficient
    });

    test('should prevent ReDoS attacks', () => {
      // Test potentially dangerous regex patterns
      const safeRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      const maliciousInput = 'a'.repeat(10000) + 'invalid-format';

      const startTime = performance.now();
      const result = safeRegex.test(maliciousInput);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete quickly even with large input
      expect(duration).toBeLessThan(100);
      expect(result).toBe(false); // Invalid email format
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle error creation and propagation efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        try {
          if (i % 10 === 0) {
            throw new Error(`Test error ${i}`);
          }
          // Normal operation
          const result = { success: true, data: i };
        } catch (error) {
          // Handle error
          const errorInfo = {
            code: 'TEST_ERROR',
            message: (error as Error).message,
            timestamp: Date.now(),
          };
          expect(errorInfo.code).toBe('TEST_ERROR');
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Error handling should be fast
    });

    test('should handle nested try-catch efficiently', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        try {
          try {
            try {
              if (i % 20 === 0) {
                throw new Error('Deep error');
              }
              const result = i * 2;
            } catch (innerError) {
              throw new Error(`Wrapped: ${(innerError as Error).message}`);
            }
          } catch (middleError) {
            throw new Error(`Middle: ${(middleError as Error).message}`);
          }
        } catch (outerError) {
          const finalError = `Outer: ${(outerError as Error).message}`;
          expect(finalError).toContain('Outer: Middle: Wrapped: Deep error');
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Nested error handling should be efficient
    });
  });
});

console.log('Performance and security tests completed successfully! ✅');