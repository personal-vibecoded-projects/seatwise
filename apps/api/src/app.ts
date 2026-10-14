import Fastify, { LogController, type FastifyError } from 'fastify';
import swagger from '@fastify/swagger';
import {
  HealthSchema,
  ErrorSchema,
} from '../../../packages/contracts/src/index.js';
import type { DatabaseHealth } from '../../../packages/db/src/index.js';
export async function buildApp(database: DatabaseHealth, logging = false) {
  const app = Fastify({
    logger: logging
      ? { level: 'info', redact: ['req.headers', 'req.body', 'res.headers'] }
      : false,
    logController: new LogController({ disableRequestLogging: true }),
    bodyLimit: 16384,
    requestTimeout: 10000,
    trustProxy: false,
  });
  await app.register(swagger, {
    openapi: { info: { title: 'SeatWise API', version: '0.1.0' } },
  });
  const schema = { response: { 200: HealthSchema, 503: HealthSchema } };
  for (const prefix of ['', '/api/v1']) {
    app.get(`${prefix}/health/live`, { schema }, async () => ({
      status: 'ok' as const,
    }));
    app.get(`${prefix}/health/ready`, { schema }, async (_request, reply) => {
      try {
        await database.check();
        return { status: 'ok' as const };
      } catch {
        return reply.code(503).send({ status: 'unavailable' });
      }
    });
  }
  app.get('/api/v1/openapi', async () => app.swagger());
  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
        requestId: _request.id,
      },
    }),
  );
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    const invalid = error.validation !== undefined;
    const tooLarge = error.statusCode === 413;
    const status = invalid ? 400 : tooLarge ? 413 : 500;
    reply.code(status).send({
      error: {
        code: invalid || tooLarge ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
        message: invalid
          ? 'Invalid request.'
          : tooLarge
            ? 'Request is too large.'
            : 'An unexpected error occurred.',
        requestId: request.id,
      },
    });
  });
  app.addHook('onResponse', async (request, reply) => {
    app.log.info(
      {
        requestId: request.id,
        route: request.routeOptions.url,
        statusCode: reply.statusCode,
        duration: reply.elapsedTime,
      },
      'request completed',
    );
  });
  app.addHook('onClose', async () => database.close());
  // Keep error shape registered for upcoming feature routes and generated contracts.
  app.addSchema({ ...ErrorSchema, $id: 'Error' });
  return app;
}
