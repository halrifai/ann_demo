import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getProducts(@Query('start') start?: string, @Query('count') count?: string) {
    if (start && isNaN(Number(start))) {
      throw new BadRequestException('Start parameter must be a number');
    }
    if (count && isNaN(Number(count))) {
      throw new BadRequestException('Count parameter must be a number');
    }

    return this.productsService.getProducts(start, count);
  }

  @UseGuards(JwtAuthGuard)
  @Get('total')
  getTotalProducts() {
    return {
      total: this.productsService.getTotalProducts(),
    };
  }
}