import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatCardModule } from "@angular/material/card";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
  ],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoading = false;
  isLoginMode = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ["", [Validators.required, Validators.minLength(3)]],
      password: ["", [Validators.required, Validators.minLength(3)]],
    });

    this.registerForm = this.fb.group({
      username: ["", [Validators.required, Validators.minLength(3)]],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(3)]],
      dateOfBirth: ["", Validators.required],
    });

    if (this.authService.isLoggedIn()) {
      this.router.navigate(["/myaccount"]);
    }
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit() {
    const currentForm = this.isLoginMode ? this.loginForm : this.registerForm;

    if (currentForm.valid) {
      this.isLoading = true;

      if (this.isLoginMode) {
        const loginData = {
          username: this.loginForm.get("username")?.value,
          password: this.loginForm.get("password")?.value,
        };

        this.authService.login(loginData).subscribe({
          next: () => {
            this.router.navigate(["/myaccount"]);
          },
          error: (error) => {
            console.error("Login failed:", error);
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          },
        });
      } else {
        const registerData = {
          username: this.registerForm.get("username")?.value,
          password: this.registerForm.get("password")?.value,
          email: this.registerForm.get("email")?.value,
          dateOfBirth: this.registerForm.get("dateOfBirth")?.value,
        };

        this.authService.register(registerData).subscribe({
          next: () => {
            this.isLoginMode = true;
          },
          error: (error) => {
            console.error("Registration failed:", error);
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          },
        });
      }
    } else {
      Object.keys(currentForm.controls).forEach((key) => {
        const control = currentForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }
}
