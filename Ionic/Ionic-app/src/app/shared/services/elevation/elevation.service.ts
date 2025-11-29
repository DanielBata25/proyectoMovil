import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ElevationService {
  /** API con soporte CORS */
  private readonly endpoint = 'https://api.open-elevation.com/api/v1/lookup';

  async getElevation(lat: number, lon: number): Promise<number | null> {
    try {
      const coords = encodeURIComponent(`${lat},${lon}`);
      const url = `${this.endpoint}?locations=${coords}`;
      const resp = await fetch(url);
      if (!resp.ok) return null;

      const data = await resp.json();
      const elevation = data?.results?.[0]?.elevation;
      return typeof elevation === 'number' ? elevation : null;
    } catch {
      return null;
    }
  }
}
