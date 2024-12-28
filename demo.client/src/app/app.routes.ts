import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MyAccountComponent } from './myaccount/myaccount.component';
import { ProductsComponent } from './products/products.component';
export const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'myaccount', component: MyAccountComponent },
];
