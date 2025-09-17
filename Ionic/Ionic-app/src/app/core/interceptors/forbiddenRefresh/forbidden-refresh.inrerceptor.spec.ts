import { TestBed } from '@angular/core/testing';

import { ForbiddenRefreshInrerceptor } from './forbidden-refresh.inrerceptor';

describe('ForbiddenRefreshInrerceptor', () => {
  let service: ForbiddenRefreshInrerceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForbiddenRefreshInrerceptor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
