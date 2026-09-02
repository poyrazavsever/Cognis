import { useCallback, useRef } from 'react';
import { findNodeHandle, type ScrollView, type TextInput } from 'react-native';
import { firstInvalidField } from './form-policy';

export function useKeyboardForm<Field extends string>() {
  const scrollRef = useRef<ScrollView>(null);
  const fields = useRef(new Map<Field, TextInput>());
  const register = useCallback((field: Field) => (input: TextInput | null) => {
    if (input) fields.current.set(field, input); else fields.current.delete(field);
  }, []);
  const reveal = useCallback((field: Field) => {
    const input = fields.current.get(field);
    const scrollNode = findNodeHandle(scrollRef.current);
    if (!input || !scrollNode) return;
    input.measureLayout(scrollNode, (_x, y) => scrollRef.current?.scrollTo({ animated: true, y: Math.max(0, y - 24) }), () => undefined);
  }, []);
  const focusFirstError = useCallback((errors: Partial<Record<Field, unknown>>, order: readonly Field[]) => {
    const first = firstInvalidField(errors, order);
    if (!first) return;
    requestAnimationFrame(() => { reveal(first); fields.current.get(first)?.focus(); });
  }, [reveal]);
  return { focusFirstError, onFocus: reveal, register, scrollRef };
}
