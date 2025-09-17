import { TestBed } from '@angular/core/testing';

import { OrderSerivice } from './order.service';

describe('OrderSerivice', () => {
  let service: OrderSerivice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderSerivice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
