import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeguimientoIncidencia } from './seguimiento-incidencia';

describe('SeguimientoIncidencia', () => {
  let component: SeguimientoIncidencia;
  let fixture: ComponentFixture<SeguimientoIncidencia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeguimientoIncidencia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeguimientoIncidencia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
