import assert from 'node:assert/strict';
import test from 'node:test';

import { NetaClientError } from './errors.ts';
import { fetchJson } from './http.ts';

test('preserves an HTML HTTP error instead of reporting a JSON parse failure', async (context) => {
  context.mock.method(globalThis, 'fetch', async () =>
    new Response('<!doctype html><title>Not found</title>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
      status: 404,
    }),
  );

  await assert.rejects(
    fetchJson('https://neta.test/api/v1/dashboard'),
    (error: unknown) =>
      error instanceof NetaClientError &&
      error.code === 'NOT_FOUND' &&
      error.status === 404 &&
      error.message === 'Sunucu 404 yanıtı döndürdü.',
  );
});

test('classifies an absent resource API route as a missing server capability', async (context) => {
  context.mock.method(globalThis, 'fetch', async () =>
    new Response('<!doctype html><title>Not found</title>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
      status: 404,
    }),
  );

  await assert.rejects(
    fetchJson('https://neta.test/api/v1/dashboard', {
      missingEndpointMessage: 'Mobil API endpoint’i bulunamadı.',
    }),
    (error: unknown) =>
      error instanceof NetaClientError &&
      error.code === 'MISSING_CAPABILITY' &&
      error.status === 404 &&
      error.message === 'Mobil API endpoint’i bulunamadı.',
  );
});

test('keeps JSON API errors and successful envelope responses intact', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch');
  fetchMock.mock.mockImplementationOnce(async () =>
    Response.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Geçersiz filtre.' } },
      { status: 422 },
    ),
  );

  await assert.rejects(
    fetchJson('https://neta.test/api/v1/projects'),
    (error: unknown) =>
      error instanceof NetaClientError &&
      error.code === 'VALIDATION_ERROR' &&
      error.status === 422 &&
      error.message === 'Geçersiz filtre.',
  );

  fetchMock.mock.mockImplementationOnce(async () =>
    Response.json({ ok: true, data: { id: 'project-a' } }),
  );

  const result = await fetchJson<{ id: string }>('https://neta.test/api/v1/projects/project-a');
  assert.deepEqual(result.data, { id: 'project-a' });
});

test('still rejects a successful non-JSON response', async (context) => {
  context.mock.method(globalThis, 'fetch', async () =>
    new Response('<!doctype html><title>Unexpected page</title>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
      status: 200,
    }),
  );

  await assert.rejects(
    fetchJson('https://neta.test/api/v1/projects'),
    (error: unknown) =>
      error instanceof NetaClientError &&
      error.code === 'SERVER_ERROR' &&
      error.status === 200 &&
      error.message === 'Sunucu JSON olmayan yanıt döndürdü.',
  );
});
