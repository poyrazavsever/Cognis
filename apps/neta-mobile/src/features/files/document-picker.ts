export type PickedDocument = {
  mimeType?: string | null;
  name: string;
  size?: number | null;
  uri: string;
};

export async function pickSingleDocument(type: string | readonly string[]): Promise<PickedDocument | null> {
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: typeof type === 'string' ? type : [...type],
  });

  if (result.canceled) return null;
  return result.assets?.[0] ?? null;
}
