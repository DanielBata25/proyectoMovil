import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { ProducerSelectModel } from '../../models/producer/producer.model';
import { ApiNative } from 'src/app/core/services/http/api.native';

@Injectable({
  providedIn: 'root',
})
export class ProducerService {
  private readonly base = '/Producer';

  /** Obtener productor por código (lanza error si 404) */
  getByCodeProducer(codeProducer: string): Observable<ProducerSelectModel> {
    const safe = encodeURIComponent(codeProducer ?? '');
    return from(ApiNative.get<ProducerSelectModel>(`${this.base}/by-code/${safe}`));
  }
}
