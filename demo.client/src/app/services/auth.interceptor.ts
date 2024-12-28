import { inject, Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError, BehaviorSubject } from "rxjs";
import {
  catchError,
  filter,
  take,
  switchMap,
  finalize,
  tap,
} from "rxjs/operators";
import { AuthService } from "./auth.service";
import { Router } from "@angular/router";
import { NotificationService } from "./notification.service";

export class AuthInterceptor implements HttpInterceptor {
  private refreshTokenSubject: BehaviorSubject<string | null> =
    new BehaviorSubject<string | null>(null);
  private isRefreshing = false;
  notificationService = inject(NotificationService);
  constructor(private authService: AuthService, private router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    console.log("Intercepting request:", request.url);
    console.log("Current headers:", request.headers.keys());
    if (this.skipAuth(request.url)) {
      console.log("Skipping auth for URL:", request.url);
      return next.handle(request);
    }

    request = this.addAuthHeader(request);
    console.log(
      "Headers after potential auth addition:",
      request.headers.keys()
    );
    console.log("Auth header:", request.headers.get("Authorization"));

    return next.handle(request).pipe(
      tap((event) => {
        console.log("👉 Request result for:", request.url, event);
      }),
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          console.log("⚠️ Got 401 Error for URL:", request.url);
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addAuthHeader(request: HttpRequest<any>): HttpRequest<any> {
    const token = this.authService.getAccessToken();
    console.log("Current token for request:", token);

    if (token) {
      console.log("Adding token to request:", request.url);
      return request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    return request;
  }

  private skipAuth(url: string): boolean {
    const skipUrls = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/refresh",
      "/api/users/login",
    ];

    const isExternal = this.isExternalUrl(url);
    return skipUrls.some((skipUrl) => url.includes(skipUrl)) || isExternal;
  }

  private isExternalUrl(url: string): boolean {
    try {
      const requestUrl = new URL(url, window.location.origin);
      return requestUrl.origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log("starting token refresh...");
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refreshToken().pipe(
      tap((response) => {
        console.log("refresh response:", response);
      }),
      switchMap((response: any) => {
        console.log("Setting new tokens");
        const newAccessToken = response.access_token;
        const newRefreshToken = response.refresh_token;

        if (newAccessToken) {
          this.authService.setAccessToken(newAccessToken);
          if (newRefreshToken) {
            this.authService.setRefreshToken(newRefreshToken);
          }
          this.refreshTokenSubject.next(newAccessToken);

          const clonedRequest = request.clone({
            headers: request.headers.set(
              "Authorization",
              `Bearer ${newAccessToken}`
            ),
          });

          console.log("Retrying original request with new token");
          console.log(
            "New Auth header:",
            clonedRequest.headers.get("Authorization")
          );
          return next.handle(clonedRequest);
        } else {
          throw new Error("No access token in refresh response");
        }
      }),
      catchError((error) => {
        console.log("Refresh failed:", error);

        this.isRefreshing = false;
        this.authService.clearTokens();
        this.notificationService.showError(
          "Your session has expired. Please login again."
        );
        this.router.navigate(["/login"]);
        return throwError(() => error);
      }),
      finalize(() => {
        console.log("Refresh cycle complete");
        this.isRefreshing = false;
      })
    );
  }
}
