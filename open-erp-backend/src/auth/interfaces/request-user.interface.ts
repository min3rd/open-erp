import { JwtPayload } from '../types/jwt-payload.type';

export interface RequestUser extends JwtPayload {
  token?: string;
}
