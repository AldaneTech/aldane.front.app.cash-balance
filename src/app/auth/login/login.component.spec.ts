import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import { AuthService, UserService } from '@aldanetech/cash-balance-api-client-angular';
import { AuthFrontService } from '../auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let users: jasmine.SpyObj<UserService>;
  let session: jasmine.SpyObj<AuthFrontService>;
  let router: jasmine.SpyObj<Router>;
  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['login']);
    users = jasmine.createSpyObj('UserService', ['createUser']);
    session = jasmine.createSpyObj('AuthFrontService', ['login']);
    router = jasmine.createSpyObj('Router', ['navigate', 'getCurrentNavigation']);
    await TestBed.configureTestingModule({
      declarations: [LoginComponent], imports: [FormsModule],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: AuthService, useValue: auth }, { provide: UserService, useValue: users },
        { provide: AuthFrontService, useValue: session }, { provide: Router, useValue: router }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });
  it('rejects empty login and registration with mismatched or oversized passwords', () => {
    component.onLogin();
    expect(auth.login).not.toHaveBeenCalled();
    component.username = 'test-user'; component.email = 'test@example.com';
    component.registerPassword = 'password123'; component.confirmPassword = 'different';
    component.onRegister();
    expect(users.createUser).not.toHaveBeenCalled();
    component.registerPassword = component.confirmPassword = 'é'.repeat(37);
    expect(component.registrationError).toContain('72 bytes');
  });
  it('blocks duplicate logins and form switches while waiting, then stores the token', () => {
    const response = new Subject<any>(); auth.login.and.returnValue(response);
    component.username = ' test-user '; component.password = ' password ';
    component.onLogin(); component.onLogin(); component.select('SignUp');
    fixture.detectChanges();
    expect(component.selected).toBe('SignIn');
    expect(auth.login).toHaveBeenCalledOnceWith({ username: 'test-user', password: ' password ' });
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    response.next({ token: 'test-token' });
    expect(session.login).toHaveBeenCalledWith('test-token');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.password).toBe('');
  });
  it('displays credential and network failures and allows retry', () => {
    component.username = 'test-user'; component.password = 'password';
    auth.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.onLogin(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('incorrectos');
    expect(component.submitting).toBeFalse();
    auth.login.and.returnValue(throwError(() => ({ status: 0 })));
    component.onLogin(); expect(component.error).toContain('conectar');
    expect(session.login).not.toHaveBeenCalled();
  });
  it('does not authenticate a response without a token', () => {
    component.username = 'test-user'; component.password = 'password';
    auth.login.and.returnValue(of({} as any)); component.onLogin();
    expect(component.error).toBeTruthy(); expect(session.login).not.toHaveBeenCalled();
  });
  it('registers once, returns to login and clears passwords after success', () => {
    const response = new Subject<any>(); users.createUser.and.returnValue(response);
    component.selected = 'SignUp'; component.username = ' test-user '; component.email = ' test@example.com ';
    component.registerPassword = component.confirmPassword = ' password123 ';
    component.onRegister(); component.onRegister();
    expect(users.createUser).toHaveBeenCalledOnceWith({ username: 'test-user', email: 'test@example.com', password: ' password123 ' });
    response.next({ id: 1, username: 'test-user' });
    expect(component.selected).toBe('SignIn'); expect(component.success).toContain('Cuenta creada');
    expect(component.registerPassword + component.confirmPassword + component.password).toBe('');
    expect(session.login).not.toHaveBeenCalled();
  });
  it('reports registration conflicts without claiming success', () => {
    users.createUser.and.returnValue(throwError(() => ({ status: 400 })));
    component.username = 'test-user'; component.email = 'test@example.com';
    component.registerPassword = component.confirmPassword = 'password123';
    component.onRegister();
    expect(component.error).toContain('otro usuario'); expect(component.success).toBe('');
    expect(component.submitting).toBeFalse();
  });
});
