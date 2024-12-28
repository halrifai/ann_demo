import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { MatButtonModule } from "@angular/material/button";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-my-account",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
  ],
  templateUrl: "./my-account.component.html",
  styleUrls: ["./my-account.component.scss"],
})
export class MyAccountComponent implements OnInit, OnDestroy {
  username: string | null = null;
  email: string | null = null;
  userId: string | null = null;
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    public router: Router,
    private http: HttpClient
  ) {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(["/login"]);
    }
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.username = this.authService.getUsername();
      this.email = this.authService.getEmail();
      this.userId = this.authService.getUserId();
    }
  }

  fetchProfile(): void {
    this.isLoading = true;
    this.http.get("/api/users/profile").subscribe({
      next: (response: any) => {
        console.log("Profile fetched successfully:", response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error fetching profile:", error);
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshToken(): void {
    this.authService.refreshToken().subscribe({
      next: () => {
        console.log("Token refreshed successfully");
      },
      error: (error) => {
        console.error("Error refreshing token:", error);
        this.router.navigate(["/login"]);
      },
    });
  }

  logout(): void {
    this.isLoading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(["/login"]);
      },
      error: (error) => {
        console.error("Logout failed:", error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
}
