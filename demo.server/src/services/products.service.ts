import { Injectable } from '@nestjs/common';
import { Product } from '../models/product.model';
import * as fs from 'fs';

@Injectable()
export class ProductsService {
  private products: Product[] = [];

  constructor() {
    try {
      const filePath = 'data/products.json';

      if (!fs.existsSync(filePath)) {
        throw new Error(`Products file not found at: ${filePath}`);
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');

      const data = JSON.parse(fileContent);
      this.products = data.products;
    } catch (error) {
      console.error('Error loading products:', error);
      this.products = [];
    }
  }

  getProducts(
    start: string = '0',
    count: string = '20',
  ): {
    products: Product[];
    total: number;
    start: number;
    count: number;
    hasMore: boolean;
  } {
    const startIndex = Math.max(0, parseInt(start, 10));
    const numCount = Math.max(1, parseInt(count, 10));
    const products = this.products.slice(startIndex, startIndex + numCount);

    return {
      products,
      total: this.products.length,
      start: startIndex,
      count: products.length,
      hasMore: startIndex + numCount < this.products.length,
    };
  }

  getTotalProducts(): number {
    return this.products.length;
  }
}
