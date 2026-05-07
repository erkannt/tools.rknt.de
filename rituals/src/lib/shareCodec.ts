import type { Ritual } from "./types";

export async function encodeRituals(ritualsToEncode: Ritual[]): Promise<string> {
  const json = JSON.stringify(ritualsToEncode);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const compressedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressedBytes.set(chunk, offset);
    offset += chunk.length;
  }
  return btoa(String.fromCharCode(...compressedBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function decodeRituals(encoded: string): Promise<Ritual[]> {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  const padded = padding ? base64 + "=".repeat(4 - padding) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ds = new DecompressionStream("gzip");
  const reader = ds.writable.getWriter();
  reader.write(bytes);
  reader.close();
  const decompressedReader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await decompressedReader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const decompressedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    decompressedBytes.set(chunk, offset);
    offset += chunk.length;
  }
  const decoder = new TextDecoder();
  const json = decoder.decode(decompressedBytes);
  return JSON.parse(json);
}
