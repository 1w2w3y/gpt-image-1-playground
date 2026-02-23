import OpenAI from 'openai';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ImageApiMode = 'openai' | 'proxy';

export interface ImagesResponse {
    data: Array<{ b64_json?: string }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface ImageGenerateParams {
    model: string;
    prompt: string;
    n?: number;
    size?: string;
    quality?: string;
    output_format?: string;
    output_compression?: number;
    background?: string;
    moderation?: string;
}

export interface ImageEditParams {
    model: string;
    prompt: string;
    image: File;
    mask?: File;
    n?: number;
    size?: string;
    quality?: string;
}

export interface ImageApiClient {
    generate(params: ImageGenerateParams): Promise<ImagesResponse>;
    edit(params: ImageEditParams): Promise<ImagesResponse>;
}

// ─── Model → Proxy Slug Mapping ──────────────────────────────────────────────

const MODEL_SLUG_MAP: Record<string, string> = {
    'gpt-image-1': 'gptimage1',
    'gpt-image-1-mini': 'gptimage1mini',
    'gpt-image-1.5': 'gptimage15',
};

export function getModelSlug(model: string): string {
    return MODEL_SLUG_MAP[model] ?? model;
}

function buildProxyUrl(
    baseUrl: string,
    model: string,
    operation: 'generations' | 'edits',
    apiVersion: string
): string {
    const slug = getModelSlug(model);
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    return `${normalizedBase}/llm/${slug}/images/${operation}?api-version=${apiVersion}`;
}

// ─── OpenAI SDK Client ───────────────────────────────────────────────────────

function createOpenAIClient(): ImageApiClient {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_API_BASE_URL,
        dangerouslyAllowBrowser: true,
    });

    return {
        async generate(params: ImageGenerateParams): Promise<ImagesResponse> {
            const result = await openai.images.generate(
                params as OpenAI.Images.ImageGenerateParams
            );
            return result as ImagesResponse;
        },
        async edit(params: ImageEditParams): Promise<ImagesResponse> {
            const result = await openai.images.edit(
                params as unknown as OpenAI.Images.ImageEditParams
            );
            return result as ImagesResponse;
        },
    };
}

// ─── Proxy Fetch Client ──────────────────────────────────────────────────────

function createProxyClient(): ImageApiClient {
    const baseUrl = process.env.PROXY_BASE_URL;
    const apiVersion = process.env.PROXY_API_VERSION || '2025-04-01-preview';

    if (!baseUrl) {
        throw new Error(
            'PROXY_BASE_URL must be set when IMAGE_API_MODE is "proxy".'
        );
    }

    return {
        async generate(params: ImageGenerateParams): Promise<ImagesResponse> {
            const url = buildProxyUrl(baseUrl, params.model, 'generations', apiVersion);

            // Strip model from body — it's encoded in the URL path
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { model: _model, ...bodyParams } = params;

            console.log(`[proxy] POST ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyParams),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[proxy] Error ${response.status}: ${errorBody}`);
                const err = new Error(
                    `Proxy request failed (${response.status}): ${errorBody}`
                ) as Error & { status?: number };
                err.status = response.status;
                throw err;
            }

            const result: ImagesResponse = await response.json();
            return result;
        },

        async edit(params: ImageEditParams): Promise<ImagesResponse> {
            const url = buildProxyUrl(baseUrl, params.model, 'edits', apiVersion);

            // Build multipart form data for the proxy (image editing requires file upload)
            const form = new FormData();
            form.append('prompt', params.prompt);
            form.append('image', params.image);
            if (params.mask) form.append('mask', params.mask);
            if (params.n !== undefined) form.append('n', String(params.n));
            if (params.size !== undefined) form.append('size', params.size);
            if (params.quality !== undefined) form.append('quality', params.quality);

            console.log(`[proxy] POST ${url} (multipart)`);
            const response = await fetch(url, {
                method: 'POST',
                body: form,
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[proxy] Error ${response.status}: ${errorBody}`);
                const err = new Error(
                    `Proxy request failed (${response.status}): ${errorBody}`
                ) as Error & { status?: number };
                err.status = response.status;
                throw err;
            }

            const result: ImagesResponse = await response.json();
            return result;
        },
    };
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function getImageApiMode(): ImageApiMode {
    const mode = process.env.IMAGE_API_MODE;
    if (mode === 'proxy') return 'proxy';
    return 'openai';
}

export function createImageApiClient(mode?: ImageApiMode): ImageApiClient {
    const effectiveMode = mode ?? getImageApiMode();
    console.log(`[image-api-client] Using mode: ${effectiveMode}`);

    if (effectiveMode === 'proxy') {
        return createProxyClient();
    }
    return createOpenAIClient();
}
