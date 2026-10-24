import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

const base = {
  email: 'a@b.co',
  phone: '+573001234567',
  password: 'Password123!',
  name: 'Test',
};

describe('CreateUserDto - aceptaPolitica', () => {
  it('rechaza si no se envía aceptaPolitica', async () => {
    const errors = await validate(plainToInstance(CreateUserDto, base));
    expect(errors.some((e) => e.property === 'aceptaPolitica')).toBe(true);
  });

  it('rechaza si aceptaPolitica es false', async () => {
    const errors = await validate(
      plainToInstance(CreateUserDto, { ...base, aceptaPolitica: false }),
    );
    expect(errors.some((e) => e.property === 'aceptaPolitica')).toBe(true);
  });

  it('acepta si aceptaPolitica es true', async () => {
    const errors = await validate(
      plainToInstance(CreateUserDto, { ...base, aceptaPolitica: true }),
    );
    expect(errors).toHaveLength(0);
  });
});
