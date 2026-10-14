import { describe, expect, it, vi } from 'vitest';
import { buildApp } from './app.js';
describe('service health', () => {
  it('keeps liveness independent of database readiness and closes resources', async () => {
    const close = vi.fn(async () => {});
    const app = await buildApp({
      check: async () => {
        throw new Error('private connection details');
      },
      close,
    });
    try {
      expect((await app.inject('/health/live')).json()).toEqual({
        status: 'ok',
      });
      const response = await app.inject('/api/v1/health/ready');
      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ status: 'unavailable' });
      expect(response.body).not.toContain('private');
      expect((await app.inject('/missing')).statusCode).toBe(404);
    } finally {
      await app.close();
    }
    expect(close).toHaveBeenCalledOnce();
  });
  it('serves ready status and a generated OpenAPI health contract', async () => {
    const app = await buildApp({
      check: async () => {},
      close: async () => {},
    });
    try {
      expect((await app.inject('/health/ready')).statusCode).toBe(200);
      const spec = (await app.inject('/api/v1/openapi')).json();
      expect(
        spec.paths['/api/v1/health/ready'].get.responses['503'],
      ).toBeDefined();
    } finally {
      await app.close();
    }
  });
});
