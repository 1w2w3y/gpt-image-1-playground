import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../src/app/api/auth-status/route';
import { mockEnvVar } from './api-helpers';

describe('/api/auth-status', () => {
    let cleanupEnv: (() => void) | null = null;

    afterEach(() => {
        if (cleanupEnv) {
            cleanupEnv();
            cleanupEnv = null;
        }
    });

    describe('GET', () => {
        it('should return passwordRequired: true when APP_PASSWORD is set', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', 'test-password');

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                passwordRequired: true
            });
        });

        it('should return passwordRequired: false when APP_PASSWORD is not set', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', undefined);

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                passwordRequired: false
            });
        });

        it('should return passwordRequired: false when APP_PASSWORD is empty string', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', '');

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toEqual({
                passwordRequired: false
            });
        });

        it('should return correct Content-Type header', async () => {
            cleanupEnv = mockEnvVar('APP_PASSWORD', 'test');

            const response = await GET();

            expect(response.headers.get('content-type')).toContain('application/json');
        });

        it('should handle various password values correctly', async () => {
            // Test with a complex password
            cleanupEnv = mockEnvVar('APP_PASSWORD', 'complex!@#$%^&*()password123');

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.passwordRequired).toBe(true);
        });
    });
});
