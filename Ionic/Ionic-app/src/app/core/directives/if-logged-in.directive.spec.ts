import { TestBed } from '@angular/core/testing';

import { IfLoggedInDirective } from './if-logged-in.directive';

describe('IfLoggedInDirective', () => {
  let service: IfLoggedInDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IfLoggedInDirective);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
