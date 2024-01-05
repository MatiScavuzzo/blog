import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { LoggedUser } from '../../users/interfaces/loggedUser';

const JWT_SECRET = process.env.JWT_SECRET;
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  validate(payload: LoggedUser) {
    return { username: payload.username, role: payload.role };
  }
}
