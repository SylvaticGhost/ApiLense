export type PagedList<T> = {
  items: T[];
  totalCount: number;
  page: number;
  size: number;
};
