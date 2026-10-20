
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface LoginResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
  };
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  role: 'student' | 'admin' = 'student';
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private apiUrl = 'http://localhost:3000/api/auth/login';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onLogin(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.isLoading = true;

    this.http.post<LoginResponse>(this.apiUrl, {
      email: this.email.trim().toLowerCase(),
      password: this.password,
      role: this.role
    }).subscribe({
      next: (response) => {
        this.isLoading = false;

        // Temporary client-side storage for the demo.
        // This is not a secure production session.
        sessionStorage.setItem(
          'campusUser',
          JSON.stringify(response.user)
        );

        if (response.user.role === 'student') {
          this.router.navigate(['/student/dashboard']);
        } else {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
