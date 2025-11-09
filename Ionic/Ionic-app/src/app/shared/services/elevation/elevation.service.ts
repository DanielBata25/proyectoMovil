import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ElevationService {
  private readonly endpoint = 'https://api.opentopodata.org/v1/test-dataset';

  async getElevation(lat: number, lon: number): Promise<number | null> {
    try {
      const url = `${this.endpoint}?locations=${lat},${lon}`;
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
