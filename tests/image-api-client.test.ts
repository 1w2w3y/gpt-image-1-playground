import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We test the exported helper functions and factory behavior
// by manipulating env vars and verifying the correct client is created.

describe('image-api-client', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
        vi.resetModules();
    });

    describe('getModelSlug', () => {
        it('should map gpt-image-1 to gptimage1', async () => {
            const { getModelSlug } = await import('../src/lib/image-api-client');
            expect(getModelSlug('gpt-image-1')).toBe('gptimage1');
        });

        it('should map gpt-image-1-mini to gptimage1mini', async () => {
            const { getModelSlug } = await import('../src/lib/image-api-client');
            expect(getModelSlug('gpt-image-1-mini')).toBe('gptimage1mini');
        });

        it('should map gpt-image-1.5 to gptimage15', async () => {
            const { getModelSlug } = await import('../src/lib/image-api-client');
            expect(getModelSlug('gpt-image-1.5')).toBe('gptimage15');
        });

        it('should return the model string itself for unknown models', async () => {
            const { getModelSlug } = await import('../src/lib/image-api-client');
            expect(getModelSlug('some-future-model')).toBe('some-future-model');
        });
    });

    describe('getImageApiMode', () => {
        it('should default to openai when IMAGE_API_MODE is not set', async () => {
            delete process.env.IMAGE_API_MODE;
            const { getImageApiMode } = await import('../src/lib/image-api-client');
            expect(getImageApiMode()).toBe('openai');
        });

        it('should return proxy when IMAGE_API_MODE=proxy', async () => {
            process.env.IMAGE_API_MODE = 'proxy';
            const { getImageApiMode } = await import('../src/lib/image-api-client');
            expect(getImageApiMode()).toBe('proxy');
        });

        it('should return openai when IMAGE_API_MODE=openai', async () => {
            process.env.IMAGE_API_MODE = 'openai';
            const { getImageApiMode } = await import('../src/lib/image-api-client');
            expect(getImageApiMode()).toBe('openai');
        });

        it('should default to openai for unrecognized values', async () => {
            process.env.IMAGE_API_MODE = 'something-else';
            const { getImageApiMode } = await import('../src/lib/image-api-client');
            expect(getImageApiMode()).toBe('openai');
        });
    });

    describe('createImageApiClient', () => {
        it('should throw if proxy mode but PROXY_BASE_URL not set', async () => {
            delete process.env.PROXY_BASE_URL;
            const { createImageApiClient } = await import('../src/lib/image-api-client');
            expect(() => createImageApiClient('proxy')).toThrow(
                'PROXY_BASE_URL must be set when IMAGE_API_MODE is "proxy".'
            );
        });

        it('should create a proxy client when mode is proxy and PROXY_BASE_URL is set', async () => {
            process.env.PROXY_BASE_URL = 'http://localhost:5219';
            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('proxy');
            expect(client).toBeDefined();
            expect(client.generate).toBeTypeOf('function');
            expect(client.edit).toBeTypeOf('function');
        });

        it('should create an openai client when mode is openai', async () => {
            process.env.OPENAI_API_KEY = 'test-key';
            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('openai');
            expect(client).toBeDefined();
            expect(client.generate).toBeTypeOf('function');
            expect(client.edit).toBeTypeOf('function');
        });
    });

    describe('proxy client - generate', () => {
        it('should call the correct proxy URL for generation', async () => {
            process.env.PROXY_BASE_URL = 'https://sample-auth-proxy.wus2.sample-dev.azgrafana-test.io';
            process.env.PROXY_API_VERSION = '2025-04-01-preview';

            const mockResponse = {
                data: [{ b64_json: 'dGVzdA==' }],
                usage: { prompt_tokens: 10, completion_tokens: 0, total_tokens: 10 },
            };

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify(mockResponse), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            );

            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('proxy');

            const result = await client.generate({
                model: 'gpt-image-1',
                prompt: 'a cat',
                n: 1,
                size: '1024x1024',
                quality: 'auto',
                output_format: 'png',
            });

            expect(fetchSpy).toHaveBeenCalledOnce();
            const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
            expect(calledUrl).toBe(
                'https://sample-auth-proxy.wus2.sample-dev.azgrafana-test.io/llm/gptimage1/images/generations?api-version=2025-04-01-preview'
            );
            expect(calledInit?.method).toBe('POST');

            // Body should NOT contain 'model'
            const body = JSON.parse(calledInit?.body as string);
            expect(body).not.toHaveProperty('model');
            expect(body.prompt).toBe('a cat');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].b64_json).toBe('dGVzdA==');
        });

        it('should use gpt-image-1.5 slug correctly', async () => {
            process.env.PROXY_BASE_URL = 'http://localhost:5219';
            process.env.PROXY_API_VERSION = '2025-04-01-preview';

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ data: [{ b64_json: 'dGVzdA==' }] }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            );

            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('proxy');

            await client.generate({ model: 'gpt-image-1.5', prompt: 'test' });

            const [calledUrl] = fetchSpy.mock.calls[0];
            expect(calledUrl).toBe(
                'http://localhost:5219/llm/gptimage15/images/generations?api-version=2025-04-01-preview'
            );
        });

        it('should use gpt-image-1-mini slug correctly', async () => {
            process.env.PROXY_BASE_URL = 'http://localhost:5219';
            process.env.PROXY_API_VERSION = '2025-04-01-preview';

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ data: [{ b64_json: 'dGVzdA==' }] }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            );

            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('proxy');

            await client.generate({ model: 'gpt-image-1-mini', prompt: 'test' });

            const [calledUrl] = fetchSpy.mock.calls[0];
            expect(calledUrl).toBe(
                'http://localhost:5219/llm/gptimage1mini/images/generations?api-version=2025-04-01-preview'
            );
        });

        it('should throw on non-OK proxy response', async () => {
            process.env.PROXY_BASE_URL = 'http://localhost:5219';

            vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response('Internal Server Error', { status: 500 })
            );

            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('proxy');

            await expect(
                client.generate({ model: 'gpt-image-1', prompt: 'test' })
            ).rejects.toThrow('Proxy request failed (500)');
        });

        it('should default PROXY_API_VERSION to 2025-04-01-preview', async () => {
            process.env.PROXY_BASE_URL = 'http://localhost:5219';
            delete process.env.PROXY_API_VERSION;

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ data: [{ b64_json: 'dGVzdA==' }] }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            );

            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('proxy');

            await client.generate({ model: 'gpt-image-1', prompt: 'test' });

            const [calledUrl] = fetchSpy.mock.calls[0];
            expect(calledUrl).toContain('api-version=2025-04-01-preview');
        });

        it('should strip trailing slashes from PROXY_BASE_URL', async () => {
            process.env.PROXY_BASE_URL = 'http://localhost:5219///';

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify({ data: [{ b64_json: 'dGVzdA==' }] }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            );

            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('proxy');

            await client.generate({ model: 'gpt-image-1', prompt: 'test' });

            const [calledUrl] = fetchSpy.mock.calls[0];
            expect(calledUrl).toMatch(/^http:\/\/localhost:5219\/llm\//);
        });
    });

    describe('proxy client - edit', () => {
        it('should call the correct proxy URL for editing', async () => {
            process.env.PROXY_BASE_URL = 'http://localhost:5219';
            process.env.PROXY_API_VERSION = '2025-04-01-preview';

            const mockResponse = {
                data: [{ b64_json: 'dGVzdA==' }],
            };

            const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
                new Response(JSON.stringify(mockResponse), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                })
            );

            const { createImageApiClient } = await import('../src/lib/image-api-client');
            const client = createImageApiClient('proxy');

            const testImage = new File([new Blob(['test'])], 'test.png', { type: 'image/png' });

            const result = await client.edit({
                model: 'gpt-image-1',
                prompt: 'edit this',
                image: testImage,
                n: 1,
            });

            expect(fetchSpy).toHaveBeenCalledOnce();
            const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
            expect(calledUrl).toBe(
                'http://localhost:5219/llm/gptimage1/images/edits?api-version=2025-04-01-preview'
            );
            expect(calledInit?.method).toBe('POST');
            // Should be FormData (no Content-Type header — browser sets boundary automatically)
            expect(calledInit?.body).toBeInstanceOf(FormData);

            expect(result.data).toHaveLength(1);
        });
    });
});
