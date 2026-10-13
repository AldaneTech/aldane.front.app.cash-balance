import { of, Subject } from 'rxjs';
import { CashBalanceService } from '../core/cash-balance.service';
import { I18nModule } from '../i18n/i18n.module';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutComponent } from './layout.component';
import { RouterTestingModule } from '@angular/router/testing'; // ✅ IMPORTA ESTO

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  let updates: Subject<{ id: number; username: string; email: string }>;

  beforeEach(async () => {
    updates = new Subject();
    await TestBed.configureTestingModule({
      providers: [{ provide: CashBalanceService, useValue: { preferences: () => of({ language: 'en' }), profile: () => of({ id: 7, username: 'Alice Example', email: 'alice@example.com' }), profileUpdates$: updates } }],
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
  it('shows the authenticated account instead of a placeholder photo and unused buttons', () => {
    expect(component.initials).toBe('AE');
    const trigger = fixture.nativeElement.querySelector('button[aria-controls="profile-options"]');
    expect(trigger.textContent).toContain('Alice Example');
    expect(trigger.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('nav button').length).toBe(1);
    trigger.click(); fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector('#profile-options');
    expect(menu.textContent).toContain('alice@example.com');
    expect(menu.textContent).toContain('Edit profile');
    expect(menu.textContent).toContain('Sign out');
  });
  it('updates the header and account initials after a profile edit', () => {
    updates.next({ id: 7, username: 'Updated Name', email: 'updated@example.com' });
    fixture.detectChanges();
    expect(component.initials).toBe('UN');
    expect(fixture.nativeElement.querySelector('button[aria-controls="profile-options"]').textContent).toContain('Updated Name');
  });

});