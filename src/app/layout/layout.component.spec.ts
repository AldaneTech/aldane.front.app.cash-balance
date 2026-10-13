import { of } from 'rxjs';
import { CashBalanceService } from '../core/cash-balance.service';
import { I18nModule } from '../i18n/i18n.module';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutComponent } from './layout.component';
import { RouterTestingModule } from '@angular/router/testing'; // ✅ IMPORTA ESTO

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{ provide: CashBalanceService, useValue: { preferences: () => of({ language: 'en' }) } }],
      declarations: [LayoutComponent],
      imports: [I18nModule, RouterTestingModule], // ✅ AÑADE ESTO
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});