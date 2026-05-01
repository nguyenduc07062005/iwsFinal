import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserSessionRepository } from 'src/database/repositories/user-session.repository';
import { UserRepository } from 'src/database/repositories/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly userSessionRepository: UserSessionRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'sks_secret_key_2026',
    });
  }

  async validate(payload: { sub: string; role: string; sid?: string }) {
    if (!payload.sid) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    const session = await this.userSessionRepository.findActiveById(
      payload.sid,
    );

    if (!session || session.userId !== user.id) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    return {
      userId: user.id,
      role: user.role,
    };
  }
}
