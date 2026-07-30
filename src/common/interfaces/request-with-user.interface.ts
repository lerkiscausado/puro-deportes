import { Request } from 'express';
import { Role } from '../../users/enums/role.enum';

export interface RequestWithUser extends Request {
  user: {
    sub: number;
    email: string;
    role: Role;
  };
}
