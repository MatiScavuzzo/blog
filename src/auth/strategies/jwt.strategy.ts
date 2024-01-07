import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { LoggedUser } from '../../users/interfaces/loggedUser';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: async (_, done) => {
        const secret = this.configService.get<string>('JWT_SECRET');
        done(null, secret);
      },
    });
  }

  validate(payload: LoggedUser) {
    return { username: payload.username, role: payload.role };
  }
}
