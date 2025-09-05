import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use vi.hoisted to properly declare mocks
const mockUnlink = vi.hoisted(() => vi.fn());

vi.mock('fs/promises', () => ({
    default: {
        unlink: mockUnlink
    },
    unlink: mockUnlink
}));

import { POST } from '../src/app/api/image-delete/route';
import { createMockNextRequest, createFormData, mockEnvVar, createPasswordHash } from './api-helpers';

describe('/api/image-delete', () => {
    let cleanupEnv: (() => void) | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUnlink.mockResolvedValue(undefined);
    });

    afterEach(() => {
        if (cleanupEnv) {
            cleanupEnv();
            cleanupEnv = null;
        }
    });

    describe('POST', () => {
        it('should successfully delete existing files', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', undefined);
            
            const filenames = ['image1.png', 'image2.jpg'];
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { filenames }
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('All files deleted successfully.');
            expect(data.results).toHaveLength(2);
            expect(data.results[0]).toEqual({ filename: 'image1.png', success: true });
            expect(data.results[1]).toEqual({ filename: 'image2.jpg', success: true });
            expect(mockUnlink).toHaveBeenCalledTimes(2);
        });

        it('should handle file not found errors', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', undefined);
            
            const filenames = ['non-existent.jpg'];
            
            // Mock file not found error
            const error = new Error('ENOENT: no such file or directory') as any;
            error.code = 'ENOENT';
            mockUnlink.mockRejectedValueOnce(error);
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { filenames }
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(207); // Multi-Status
            expect(data.message).toBe('Some files could not be deleted.');
            expect(data.results[0]).toEqual({ 
                filename: 'non-existent.jpg', 
                success: false, 
                error: 'File not found.' 
            });
        });

        it('should require valid password when APP_PASSWORD is set', async () => {
            const password = 'test-password';
            cleanupEnv = mockEnvVar('APP_PASSWORD', password);
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { 
                    filenames: ['test.png'],
                    passwordHash: createPasswordHash(password)
                }
            });
            
            const response = await POST(request);

            expect(response.status).toBe(200);
        });

        it('should reject invalid password', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', 'correct-password');
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { 
                    filenames: ['test.png'],
                    passwordHash: createPasswordHash('wrong-password')
                }
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized: Invalid password.');
        });

        it('should reject missing password when required', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', 'required-password');
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { filenames: ['test.png'] }
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized: Missing password hash.');
        });

        it('should validate filenames array', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', undefined);
            
            const invalidInputs = [
                { filenames: 'not-an-array' },
                { filenames: [123, 'valid.png'] },
                { filenames: [null, 'valid.png'] },
                { filenames: [{}, 'valid.png'] }
            ];

            for (const invalidInput of invalidInputs) {
                const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                    method: 'POST',
                    body: invalidInput
                });
                
                const response = await POST(request);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toBe('Invalid filenames: Must be an array of strings.');
            }
        });

        it('should handle empty filenames array gracefully', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', undefined);
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { filenames: [] }
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('No filenames provided to delete.');
            expect(data.results).toEqual([]);
        });

        it('should reject invalid filename formats', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', undefined);
            
            const maliciousFilenames = [
                '../secret.txt',
                '../../etc/passwd',
                'folder/file.png',
                'folder\\file.png',
                ''
            ];
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { filenames: maliciousFilenames }
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(207);
            expect(data.results).toHaveLength(maliciousFilenames.length);
            
            data.results.forEach((result: any) => {
                expect(result.success).toBe(false);
                expect(result.error).toBe('Invalid filename format.');
            });
        });

        it('should handle file system errors gracefully', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', undefined);
            
            const filename = 'error-file.png';
            
            // Mock fs.unlink to throw an error
            mockUnlink.mockRejectedValueOnce(new Error('Permission denied'));
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { filenames: [filename] }
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(207);
            expect(data.results[0]).toEqual({
                filename,
                success: false,
                error: 'Failed to delete file.'
            });
        });

        it('should handle malformed JSON request body', async () => {
            const request = new Request('http://localhost:3000/api/image-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json{'
            });
            
            const response = await POST(request as any);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Invalid request body: Must be JSON.');
        });

        it('should handle bulk deletion correctly', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', undefined);
            
            const filenames = Array.from({ length: 10 }, (_, i) => `bulk-${i}.png`);
            
            const request = createMockNextRequest('http://localhost:3000/api/image-delete', {
                method: 'POST',
                body: { filenames }
            });
            
            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('All files deleted successfully.');
            expect(data.results).toHaveLength(10);
            expect(data.results.every((r: any) => r.success)).toBe(true);
            expect(mockUnlink).toHaveBeenCalledTimes(10);
        });
    });
});
