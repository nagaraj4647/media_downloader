import { auth } from "./firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export type Platform = "youtube" | "instagram" | "facebook";

export interface PreviewResult {
  platform: Platform;
  title: string;
  thumbnail: string | null;
  durationSeconds: number | null;
  uploader: string | null;
  availableQualities: number[];
}

export async function getPreview(url: string): Promise<PreviewResult> {
  const res = await fetch(`${API_BASE}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't fetch preview.");
  return data;
}

export async function requestDownload(
  url: string,
  format: "mp4" | "mp3",
  quality?: number
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeader()),
  };
  const res = await fetch(`${API_BASE}/download`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url, format, quality }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Download failed.");
  }
  return res.blob();
}

export interface HistoryEntry {
  id: string;
  url: string;
  platform: Platform;
  format: "mp4" | "mp3";
  quality: number | null;
  createdAt: string;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/history`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't load history.");
  return data.history;
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE}/history/${id}`, { method: "DELETE", headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Couldn't delete entry.");
  }
}

export async function getQrCode(text: string): Promise<string> {
  const res = await fetch(`${API_BASE}/qr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't generate QR code.");
  return data.qr;
}
