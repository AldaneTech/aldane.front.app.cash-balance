import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@aldanetech/cash-balance-api-client-angular';
import { AuthFrontService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(private router: Router, private  authService: AuthService, private authFrontService: AuthFrontService) {}
  selected: 'SignIn' | 'SignUp' = 'SignIn';
  username: string = '';
  password: string = '';
  email: string = '';
  select(option: 'SignIn' | 'SignUp') {
    this.selected = option;
  }
  
  onLogin() {
    let auth: any = {
      username: this.username,
      password: this.password
    }
    this.authService.login(auth).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        if (response.token) {
          this.authFrontService.login(response.token);
          this.router.navigate(['/']);
        } else {
          console.error('Login failed: Token is undefined');
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        // Handle login failure
      }
    });

    console.log('Logging in...');
    const fakeToken = '1234';
    //this.auth.login(fakeToken);
    this.router.navigate(['/']);
  }
  
  onRegister() {
    console.log('Registering...');
  }
}
