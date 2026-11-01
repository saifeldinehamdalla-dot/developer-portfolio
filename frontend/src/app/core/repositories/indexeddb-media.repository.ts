import { Injectable } from '@angular/core';
import { MediaAsset } from '../models/media-asset';
import { MediaRepo } from './repository.tokens';

const DATABASE_NAME = 'portfolio-cms-media';
const STORE_NAME = 'images';
const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;

@Injectable({ providedIn: 'root' })
export class IndexedDbMediaRepository implements MediaRepo {
  private database?: Promise<IDBDatabase>;

  async list(): Promise<MediaAsset[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as MediaAsset[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      request.onerror = () => reject(request.error ?? new Error('Could not read the media library.'));
    });
  }

  async get(id: string): Promise<MediaAsset | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result as MediaAsset | undefined);
      request.onerror = () => reject(request.error ?? new Error('Could not read the image.'));
    });
  }

  async upload(file: File): Promise<string> {
    const isImage = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) throw new Error('Choose a PNG, JPG, WebP image, or PDF document.');
    if (isImage && file.size > MAX_UPLOAD_SIZE) {
      throw new Error('Images must be 2 MB or smaller before compression.');
    }
    if (isPdf && file.size > 5 * 1024 * 1024) {
      throw new Error('PDF files must be 5 MB or smaller.');
    }
    const dataUrl = isImage ? await this.compress(file) : await this.readDataUrl(file);
    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const asset: MediaAsset = {
      id,
      name: file.name.replace(/\.[^.]+$/, ''),
      dataUrl,
      mimeType: isImage ? 'image/webp' : 'application/pdf',
      size: Math.ceil((dataUrl.length * 3) / 4),
      updatedAt: new Date().toISOString(),
    };
    await this.put(asset);
    return `media:${id}`;
  }

  async rename(id: string, name: string): Promise<void> {
    const current = await this.get(id);
    if (!current) throw new Error('Image was not found.');
    await this.put({ ...current, name: name.trim(), updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete the image.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Image deletion was cancelled.'));
    });
  }

  async replaceAll(items: MediaAsset[]): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      items.forEach((item) => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not restore images.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Image restore was cancelled.'));
    });
  }

  private async put(asset: MediaAsset): Promise<void> {
    const db = await this.open();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(asset);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the image.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Image storage was cancelled.'));
    });
  }

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(new Error('This browser does not support persistent image storage.'));
        return;
      }
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open the image library.'));
      request.onblocked = () => reject(new Error('The image library is blocked by another open tab.'));
    });
    this.database = opening.catch((error: unknown) => {
      this.database = undefined;
      throw error;
    });
    return this.database;
  }

  private async compress(file: File): Promise<string> {
    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error('The selected file is not a readable image.');
    }
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      throw new Error('Image compression is not available in this browser.');
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/webp', 0.82);
  }

  private readDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not read the selected file.'));
      reader.onerror = () => reject(new Error('Could not read the selected file.'));
      reader.readAsDataURL(file);
    });
  }
}
