export async function readStorageImageBytes(uri: string): Promise<ArrayBuffer> {
  const blob = await (await fetch(uri)).blob();
  return blob.arrayBuffer();
}
