import type { Album, Photo } from "./types";

const BASE = "https://jsonplaceholder.typicode.com";

export async function fetchPhotosPage(page: number, limit = 24): Promise<Photo[]> {
  const r = await fetch(`${BASE}/photos?_page=${page}&_limit=${limit}`);
  if (!r.ok) throw new Error("photos");
  return r.json();
}

export async function fetchPhoto(id: number): Promise<Photo> {
  const r = await fetch(`${BASE}/photos/${id}`);
  if (!r.ok) throw new Error("photo");
  return r.json();
}

export async function fetchAlbums(): Promise<Album[]> {
  const r = await fetch(`${BASE}/albums`);
  if (!r.ok) throw new Error("albums");
  return r.json();
}
