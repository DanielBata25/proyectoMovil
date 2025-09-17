import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ContainerCardFlexComponent } from './container-card-flex.component';

describe('ContainerCardFlexComponent', () => {
  let component: ContainerCardFlexComponent;
  let fixture: ComponentFixture<ContainerCardFlexComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ContainerCardFlexComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ContainerCardFlexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
