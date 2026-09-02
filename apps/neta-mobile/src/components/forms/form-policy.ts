export function firstInvalidField<Field extends string>(
  errors: Partial<Record<Field, unknown>>,
  order: readonly Field[],
): Field | undefined {
  return order.find((field) => Boolean(errors[field]));
}
