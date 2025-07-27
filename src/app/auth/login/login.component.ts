import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(private auth: AuthService, private router: Router) {}
  selected: 'SignIn' | 'SignUp' = 'SignIn';

  select(option: 'SignIn' | 'SignUp') {
    this.selected = option;
  }
  
  login() {
    const fakeToken = '1234';
    this.auth.login(fakeToken);
    this.router.navigate(['/']);
  }
  
}
