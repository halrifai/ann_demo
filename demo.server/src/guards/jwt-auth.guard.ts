import { Injectable, UnauthorizedException } from '@nestjs/common';
   import { AuthGuard } from '@nestjs/passport';

   @Injectable()
   export class JwtAuthGuard extends AuthGuard('jwt') {
     handleRequest(err, user, info) {
       if (err || !user) {
         console.log('Authentication error:', err);
         console.log('User:', user);
         console.log('Info:', info);
         throw err || new UnauthorizedException();
       }
       return user;
     }
   }