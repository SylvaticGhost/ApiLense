import { RequestRunner } from '../../src/infrastructure/requestRunner.ts';
import { ApiCallRequest } from '../../src/core/apiCallRequest.ts';

globalThis.fetch = async (
  _input: Request | URL | string,
  _init?: RequestInit,
) => {
  await new Promise((r) => setTimeout(r, 20));
  return new Response('ok', { status: 200 });
};

function makeRequest(id: number): ApiCallRequest {
  return {
    id: crypto.randomUUID(),
    url: 'https://example.test/endpoint/' + id,
    method: 'GET',
    headers: {},
    body: undefined,
    canHaveBody(): boolean {
      return false;
    },
  } as ApiCallRequest;
}

function buildConcurrentDataset(n: number): ApiCallRequest[][] {
  const iteration: ApiCallRequest[] = [];
  for (let i = 0; i < n; i++) iteration.push(makeRequest(i));
  return [iteration];
}

const runner = new RequestRunner();

const levels = [5, 10, 20, 40, 80, 160, 320, 640];

for (const n of levels) {
  Deno.bench(`RequestRunner#runConcurently concurrency=${n}`, async () => {
    const data = buildConcurrentDataset(n);
    await runner.runConcurently(data);
  });
}
