import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use vi.hoisted to properly declare mocks
const mockAccess = vi.hoisted(() => vi.fn());
const mockReadFile = vi.hoisted(() => vi.fn());

vi.mock('fs/promises', () => ({
    default: {
        access: mockAccess,
        readFile: mockReadFile
    },
    access: mockAccess,
    readFile: mockReadFile
}));

import { GET } from '../src/app/api/image/[filename]/route';
import { createMockNextRequest } from './api-helpers';

// Mock mime-types
vi.mock('mime-types', () => ({
    lookup: vi.fn().mockImplementation((filename: string) => {
        if (filename.endsWith('.png')) return 'image/png';
        if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
        if (filename.endsWith('.webp')) return 'image/webp';
        return 'application/octet-stream';
    })
}));

describe('/api/image/[filename]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockAccess.mockResolvedValue(undefined);
        mockReadFile.mockResolvedValue(Buffer.from('test-image-data'));
    });

    describe('GET', () => {
        it('should serve existing image file with correct headers', async () => {
            const filename = 'test-image.png';
            const imageBuffer = Buffer.from('fake-png-data');
            
            mockReadFile.mockResolvedValueOnce(imageBuffer);
            
            const request = createMockNextRequest('http://localhost:3000/api/image/test-image.png');
            const params = Promise.resolve({ filename });
            
            const response = await GET(request, { params });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toBe('image/png');
            expect(response.headers.get('content-length')).toBe(imageBuffer.length.toString());
            
            const responseBuffer = Buffer.from(await response.arrayBuffer());
            expect(responseBuffer).toEqual(imageBuffer);
        });

        it('should return 400 for missing filename', async () => {
            const request = createMockNextRequest('http://localhost:3000/api/image/');
            const params = Promise.resolve({ filename: '' });
            
            const response = await GET(request, { params });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Filename is required');
        });

        it('should return 400 for directory traversal attempts', async () => {
            const maliciousFilenames = [
                '../secret.txt',
                '..\\secret.txt',
                '/etc/passwd',
                '\\windows\\system32\\config'
            ];

            for (const filename of maliciousFilenames) {
                const request = createMockNextRequest(`http://localhost:3000/api/image/${encodeURIComponent(filename)}`);
                const params = Promise.resolve({ filename });
                
                const response = await GET(request, { params });
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.error).toBe('Invalid filename');
            }
        });

        it('should return 404 for non-existent file', async () => {
            const filename = 'non-existent.png';
            
            // Mock file not found error
            const error = new Error('ENOENT: no such file or directory') as any;
            error.code = 'ENOENT';
            mockAccess.mockRejectedValueOnce(error);
            
            const request = createMockNextRequest('http://localhost:3000/api/image/non-existent.png');
            const params = Promise.resolve({ filename });
            
            const response = await GET(request, { params });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.error).toBe('Image not found');
        });

        it('should handle different image formats correctly', async () => {
            const testCases = [
                { filename: 'test.png', contentType: 'image/png' },
                { filename: 'test.jpg', contentType: 'image/jpeg' },
                { filename: 'test.jpeg', contentType: 'image/jpeg' },
                { filename: 'test.webp', contentType: 'image/webp' },
                { filename: 'test.unknown', contentType: 'application/octet-stream' }
            ];

            for (const testCase of testCases) {
                const imageBuffer = Buffer.from(`fake-${testCase.filename}-data`);
                mockReadFile.mockResolvedValueOnce(imageBuffer);
                
                const request = createMockNextRequest(`http://localhost:3000/api/image/${testCase.filename}`);
                const params = Promise.resolve({ filename: testCase.filename });
                
                const response = await GET(request, { params });

                expect(response.status).toBe(200);
                expect(response.headers.get('content-type')).toBe(testCase.contentType);
            }
        });

        it('should return 500 for file system errors', async () => {
            const filename = 'error-file.png';
            
            // Mock fs.access to throw a non-ENOENT error
            mockAccess.mockRejectedValueOnce(new Error('Permission denied'));
            
            const request = createMockNextRequest('http://localhost:3000/api/image/error-file.png');
            const params = Promise.resolve({ filename });
            
            const response = await GET(request, { params });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Internal server error');
        });

        it('should handle valid filename characters correctly', async () => {
            const validFilenames = [
                'image.png',
                'image-123.png',
                'image_test.png',
                'IMAGE.PNG',
                '1234567890.png',
                'test-image-final.png'
            ];

            for (const filename of validFilenames) {
                const imageBuffer = Buffer.from('test-data');
                mockReadFile.mockResolvedValueOnce(imageBuffer);
                
                const request = createMockNextRequest(`http://localhost:3000/api/image/${filename}`);
                const params = Promise.resolve({ filename });
                
                const response = await GET(request, { params });

                expect(response.status).toBe(200);
                expect(response.headers.get('content-type')).toBeDefined();
            }
        });

        it('should handle large image files', async () => {
            const filename = 'large-image.png';
            const largeBuffer = Buffer.alloc(1024 * 1024, 'a'); // 1MB buffer
            
            mockReadFile.mockResolvedValueOnce(largeBuffer);
            
            const request = createMockNextRequest('http://localhost:3000/api/image/large-image.png');
            const params = Promise.resolve({ filename });
            
            const response = await GET(request, { params });

            expect(response.status).toBe(200);
            expect(response.headers.get('content-length')).toBe(largeBuffer.length.toString());
            
            const responseBuffer = Buffer.from(await response.arrayBuffer());
            expect(responseBuffer.length).toBe(largeBuffer.length);
        });
    });
});
