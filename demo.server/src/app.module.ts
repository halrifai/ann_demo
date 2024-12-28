import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';

import { UsersController } from './controllers/users.controller';
import { AuthController } from './controllers/auth.controller';
import { AppController } from './controllers/app.controller';
import { ProductsController } from './controllers/products.controller';

import { AuthService } from './services/auth.service';
import { AppService } from './services/app.service';
import { ProductsService } from './services/products.service';
import { TokenCleanupService } from './services/token-cleanup.service';

import { User, UserSchema } from './models/user.model';
import { Token, TokenSchema } from './models/token.model';

import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test_db'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
    PassportModule,
    JwtModule.register({
      secret: 'changeme',
      signOptions: { expiresIn: '30s' },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    UsersController,
    AuthController,
    AppController,
    ProductsController,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    AppService,
    ProductsService,
    TokenCleanupService,
  ],
})
export class AppModule {}
