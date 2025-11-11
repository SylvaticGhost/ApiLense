export interface RunEndpointCommandArgs {
  schema: number;
  endpoint: string;
  template: string;
  numberOfRequests: number;
  concurrency: number;
  delayMs: number;
  mode: 'single' | 'multiple' | 'progression';
}
