import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";

interface JwtPayload {
  username: string;
  sub: string;
  userId: string;
  email: string;
  exp?: number;
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  dateOfBirth: Date;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = "access_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";

  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private decodedTokenSubject = new BehaviorSubject<JwtPayload | null>(null);

  constructor(private http: HttpClient) {
    this.loadTokens();
  }

  login(loginData: LoginData): Observable<TokenResponse> {
    return this.http.post<TokenResponse>("/api/users/login", loginData).pipe(
      tap((response) => {
        this.setAccessToken(response.access_token);
        this.setRefreshToken(response.refresh_token);
      })
    );
  }

  register(registerData: RegisterData): Observable<any> {
    return this.http.post<any>("/api/users/register", registerData);
  }

  logout(): Observable<any> {
    return this.http.delete("/api/auth/logout", {}).pipe(
      tap(() => this.clearTokens()),
      catchError((error) => {
        console.error("Logout failed:", error);
        return throwError(() => error);
      })
    );
  }

  private loadTokens(): void {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (accessToken) {
      this.setAccessToken(accessToken);
    }
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    this.accessTokenSubject.next(token);
    this.decodedTokenSubject.next(this.decodeToken(token));
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    this.refreshTokenSubject.next(token);
  }

  getAccessToken(): string | null {
    return this.accessTokenSubject.value;
  }

  getRefreshToken(): string | null {
    return this.refreshTokenSubject.value;
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error("No refresh token available"));
    }

    return this.http
      .post<TokenResponse>("/api/auth/refresh", { refresh_token: refreshToken })
      .pipe(
        tap((tokens) => {
          if (tokens.access_token) {
            this.setAccessToken(tokens.access_token);
          }
          if (tokens.refresh_token) {
            this.setRefreshToken(tokens.refresh_token);
          }
        })
      );
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.accessTokenSubject.next(null);
    this.refreshTokenSubject.next(null);
    this.decodedTokenSubject.next(null);
  }

  private decodeToken(token: string): JwtPayload {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(window.atob(base64));
    } catch (error) {
      console.error("Error decoding token:", error);
      return {} as JwtPayload;
    }
  }

  getUsername(): string | null {
    return this.decodedTokenSubject.value?.username ?? null;
  }

  getUserId(): string | null {
    return this.decodedTokenSubject.value?.userId ?? null;
  }

  getEmail(): string | null {
    return this.decodedTokenSubject.value?.email ?? null;
  }

  getSub(): string | null {
    return this.decodedTokenSubject.value?.sub ?? null;
  }

  isTokenExpired(): boolean {
    const decoded = this.decodedTokenSubject.value;
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  }

  getAccessToken$(): Observable<string | null> {
    return this.accessTokenSubject.asObservable();
  }

  getDecodedToken$(): Observable<JwtPayload | null> {
    return this.decodedTokenSubject.asObservable();
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
}
