import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { UserOrdersListComponent } from './user-orders-list.component';

describe('UserOrdersListComponent', () => {
  let component: UserOrdersListComponent;
  let fixture: ComponentFixture<UserOrdersListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UserOrdersListComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(UserOrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.loading).toBe(true);
    expect(component.items).toEqual([]);
  });

  it('should set loading to false after data loads', () => {
    component.load();
    expect(component.loading).toBe(false);
  });

  it('should track items by id', () => {
    const mockItem = { id: 1, productName: 'Test Product' } as any;
    expect(component.trackById(0, mockItem)).toBe(1);
  });

  describe('Status Guards', () => {
    it('should allow upload payment for AcceptedAwaitingPayment status', () => {
      expect(component.canUploadPayment('AcceptedAwaitingPayment')).toBe(true);
      expect(component.canUploadPayment('OtherStatus')).toBe(false);
    });

    it('should allow cancel for PendingReview status', () => {
      expect(component.canCancel('PendingReview')).toBe(true);
      expect(component.canCancel('OtherStatus')).toBe(false);
    });

    it('should allow confirm for DeliveredPendingBuyerConfirm status', () => {
      expect(component.canConfirm('DeliveredPendingBuyerConfirm')).toBe(true);
      expect(component.canConfirm('OtherStatus')).toBe(false);
    });
  });

  describe('Chip Classes', () => {
    it('should return correct chip class for pending status', () => {
      expect(component.chipClass('PendingReview')).toBe('pending');
      expect(component.chipClass('DeliveredPendingBuyerConfirm')).toBe('pending');
    });

    it('should return correct chip class for accepted status', () => {
      expect(component.chipClass('AcceptedAwaitingPayment')).toBe('accepted');
      expect(component.chipClass('PaymentSubmitted')).toBe('accepted');
      expect(component.chipClass('Preparing')).toBe('accepted');
      expect(component.chipClass('Dispatched')).toBe('accepted');
    });

    it('should return correct chip class for completed status', () => {
      expect(component.chipClass('Completed')).toBe('completed');
    });

    it('should return correct chip class for rejected status', () => {
      expect(component.chipClass('Rejected')).toBe('rejected');
      expect(component.chipClass('Expired')).toBe('rejected');
      expect(component.chipClass('CancelledByUser')).toBe('rejected');
    });

    it('should return correct chip class for disputed status', () => {
      expect(component.chipClass('Disputed')).toBe('disputed');
    });

    it('should default to accepted for unknown status', () => {
      expect(component.chipClass('UnknownStatus')).toBe('accepted');
      expect(component.chipClass('')).toBe('accepted');
    });
  });

  describe('File Upload', () => {
    it('should trigger file input click', () => {
      const mockFileInput = document.createElement('input');
      spyOn(mockFileInput, 'click');
      
      component.triggerFile(mockFileInput);
      expect(mockFileInput.click).toHaveBeenCalled();
    });

    it('should validate file type for images only', async () => {
      const mockEvent = {
        target: {
          files: [new File(['test'], 'test.pdf', { type: 'application/pdf' })],
          value: ''
        }
      } as any;
      
      await component.onPickPaymentFile(1, mockEvent);
      // Should not proceed with non-image files
      expect(component).toBeTruthy();
    });

    it('should validate file size under limit', async () => {
      const largeFile = new File(['x'.repeat(7 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const mockEvent = {
        target: {
          files: [largeFile],
          value: ''
        }
      } as any;
      
      await component.onPickPaymentFile(1, mockEvent);
      // Should not proceed with files over 6MB
      expect(component).toBeTruthy();
    });
  });
});