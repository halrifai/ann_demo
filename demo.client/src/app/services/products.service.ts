import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ProductsService {
  private baseUrl = "/api/products";

  constructor(private http: HttpClient) {}

  getProducts(start?: string, count?: string): Observable<any> {
    let url = this.baseUrl;
    if (start && count) {
      url += `?start=${start}&count=${count}`;
    }
    return this.http.get(url);
  }
}
