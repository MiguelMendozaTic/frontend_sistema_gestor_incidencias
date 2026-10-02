import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusIcon } from './status-icon';

describe('StatusIcon', () => {
  let component: StatusIcon;
  let fixture: ComponentFixture<StatusIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusIcon]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusIcon);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
