import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { DetalleModal } from './detalle-modal';

describe('DetalleModal', () => {
  let component: DetalleModal<any>;
  let fixture: ComponentFixture<DetalleModal<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleModal],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('modal', true);
    fixture.componentRef.setInput('data', { id: 1, titulo: 'Test', estado: 'ABIERTO' });
    fixture.componentRef.setInput('fields', [
      { label: 'ID', key: 'id' },
      { label: 'Titulo', key: 'titulo' },
      { label: 'Estado', key: 'estado' },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render fields from data', () => {
    const labels = fixture.debugElement.queryAll(By.css('.text-gray-500'));
    expect(labels.length).toBe(3);
    expect(labels[0].nativeElement.textContent).toContain('ID');
    expect(labels[1].nativeElement.textContent).toContain('Titulo');
  });

  it('should toggle modal on openBox', () => {
    expect(component.modal()).toBe(true);
    component.openBox();
    expect(component.modal()).toBe(false);
  });

  it('should use format function when provided', () => {
    const data = { usuario: { nombre: 'Juan' } };
    const fields = [{ label: 'Usuario', key: 'usuario' as any, format: (u: any) => u.nombre }];
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('fields', fields);
    fixture.detectChanges();
    const value = fixture.debugElement.query(By.css('.font-medium'));
    expect(value.nativeElement.textContent).toContain('Juan');
  });
});
