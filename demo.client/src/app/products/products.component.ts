import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ProductsService } from "../services/products.service";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { map } from "rxjs/operators";
import { trigger, transition, style, animate } from "@angular/animations";
import { AuthService } from "../services/auth.service";
import { Router } from "@angular/router";
import { NotificationService } from "../services/notification.service";

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  stock: number;
  thumbnail: string;
  availabilityStatus: string;
}

@Component({
  selector: "app-products",
  standalone: true,
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./products.component.html",
  styleUrl: "./products.component.scss",
  animations: [
    trigger("fadeIn", [
      transition(":enter", [
        style({ opacity: 0, transform: "translateY(20px)" }),
        animate(
          "300ms ease-out",
          style({ opacity: 1, transform: "translateY(0)" })
        ),
      ]),
    ]),
  ],
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  currentPage = 0;
  cols = 3;

  notificationService = inject(NotificationService);

  constructor(
    public authService: AuthService,
    private productsService: ProductsService,
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {
    this.breakpointObserver
      .observe([Breakpoints.Small, Breakpoints.XSmall])
      .pipe(
        map((result) => {
          if (result.breakpoints[Breakpoints.XSmall]) {
            return 1;
          } else if (result.breakpoints[Breakpoints.Small]) {
            return 2;
          }
          return 3;
        })
      )
      .subscribe((cols) => (this.cols = cols));
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadProducts();
    }
  }

  loadProducts() {
    if (this.loading) return;

    this.loading = true;
    this.productsService
      .getProducts(this.currentPage.toString(), "6")
      .subscribe({
        next: (response: any) => {
          this.products = [...this.products, ...response.products];
          this.currentPage += 6;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.notificationService.showError("error loading products");
        },
      });
  }

  navigateToLogin() {
    this.router.navigate(["/login"]);
  }

  navigateToAccount() {
    this.router.navigate(["/myaccount"]);
  }
}
