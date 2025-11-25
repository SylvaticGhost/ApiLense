export function strictGet<TProp>(obj: any, accessor: (o: any) => any) {
  const val = accessor(obj);
  if (!val) {
    throw new Error('Property not found');
  }
  return val;
}
