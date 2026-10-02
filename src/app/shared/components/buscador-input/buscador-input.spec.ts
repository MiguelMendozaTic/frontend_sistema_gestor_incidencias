import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscadorInput } from './buscador-input';

describe('BuscadorInput', () => {
  let component: BuscadorInput;
  let fixture: ComponentFixture<BuscadorInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscadorInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuscadorInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
