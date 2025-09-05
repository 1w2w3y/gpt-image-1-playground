import { createMocks } from 'node-mocks-http';
import type { NextRequest } from 'next/server';
import { vi } from 'vitest';

// Helper to create a mocked NextRequest for testing
export function createMockNextRequest(url: string, options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    formData?: FormData;
} = {}): NextRequest {
    const { method = 'GET', body, headers = {}, formData } = options;
    
    // Prepare headers - don't set Content-Type for FormData as it will be set automatically
    const requestHeaders: Record<string, string> = {};
    
    if (!formData) {
        requestHeaders['Content-Type'] = 'application/json';
    }
    
    // Add any additional headers
    Object.assign(requestHeaders, headers);
    
    // Create the base request
    const request = new Request(url, {
        method,
        headers: requestHeaders,
        body: formData ? formData : (body ? JSON.stringify(body) : undefined)
    });
    
    return request as NextRequest;
}

// Helper to create FormData for multipart requests
export function createFormData(data: Record<string, any>): FormData {
    const formData = new FormData();
    
    for (const [key, value] of Object.entries(data)) {
        if (value instanceof File) {
            formData.append(key, value);
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                if (item instanceof File) {
                    formData.append(`${key}_${index}`, item);
                } else {
                    formData.append(`${key}[${index}]`, String(item));
                }
            });
        } else {
            formData.append(key, String(value));
        }
    }
    
    return formData;
}

// Helper to create a mock File for testing
export function createMockFile(name: string, content: string, type: string = 'text/plain'): File {
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
}

// Helper to create a mock image File
export function createMockImageFile(name: string = 'test.png', size: number = 1024): File {
    // Create a simple base64 PNG header for testing
    const pngHeader = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(pngHeader, 'base64');
    const blob = new Blob([buffer], { type: 'image/png' });
    return new File([blob], name, { type: 'image/png' });
}

// Helper to mock environment variables
export function mockEnvVar(name: string, value: string | undefined): () => void {
    const originalValue = process.env[name];
    
    if (value === undefined) {
        delete process.env[name];
    } else {
        process.env[name] = value;
    }
    
    // Return cleanup function
    return () => {
        if (originalValue === undefined) {
            delete process.env[name];
        } else {
            process.env[name] = originalValue;
        }
    };
}

// Helper to create SHA256 hash for password testing
export function createPasswordHash(password: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Mock OpenAI response for testing
export const mockOpenAIResponse = {
    data: [
        {
            b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        }
    ],
    usage: {
        prompt_tokens: 10,
        completion_tokens: 0,
        total_tokens: 10
    }
};

// Helper to mock fs operations
export const createMockFS = () => {
    const mockFiles = new Map<string, Buffer>();
    
    return {
        files: mockFiles,
        access: vi.fn().mockImplementation(async (path: string) => {
            if (!mockFiles.has(path)) {
                const error = new Error('ENOENT: no such file or directory') as any;
                error.code = 'ENOENT';
                throw error;
            }
        }),
        writeFile: vi.fn().mockImplementation(async (path: string, data: Buffer) => {
            mockFiles.set(path, data);
        }),
        readFile: vi.fn().mockImplementation(async (path: string) => {
            if (!mockFiles.has(path)) {
                const error = new Error('ENOENT: no such file or directory') as any;
                error.code = 'ENOENT';
                throw error;
            }
            return mockFiles.get(path);
        }),
        unlink: vi.fn().mockImplementation(async (path: string) => {
            if (!mockFiles.has(path)) {
                const error = new Error('ENOENT: no such file or directory') as any;
                error.code = 'ENOENT';
                throw error;
            }
            mockFiles.delete(path);
        }),
        mkdir: vi.fn().mockResolvedValue(undefined)
    };
};
