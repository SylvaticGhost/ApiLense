export interface PagedListArgs {
  page: number;
  size: number;
}

export interface PureArgs {
  json: boolean | undefined;
}

export interface InteractivePureArgs extends PureArgs {
  interactiveMode?: boolean | undefined;
}
