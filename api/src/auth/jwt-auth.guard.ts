import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Rejects requests with a missing, invalid or expired token (401)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
