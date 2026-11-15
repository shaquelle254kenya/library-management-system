import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    // Hash the password BEFORE saving. The plain password is never stored.
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // The role is not taken from the request, so new accounts are always PATRON
    const user = await this.prisma.user.create({
      data: { email, name: dto.name, password: passwordHash },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });

    // Use the same message for "no such user" and "wrong password",
    // so attackers cannot tell which emails have accounts
    const passwordMatches = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  // Create the JWT and return the user without the password
  private async buildAuthResponse(user: {
    id: number;
    email: string;
    name: string;
    role: string;
  }) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
