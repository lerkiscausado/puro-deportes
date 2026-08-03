import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersService y CreateUserDto', () => {
  let service: UsersService;
  let usersRepositoryMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtServiceMock: {
    sign: jest.Mock;
  };

  beforeEach(async () => {
    usersRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      save: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validación de CreateUserDto', () => {
    const validBaseData = {
      email: 'juan.perez@example.com',
      phone: '+573001234567',
      password: 'Password123!',
      name: 'Juan Pérez',
    };

    it('debe aceptar datos válidos', async () => {
      const dto = plainToInstance(CreateUserDto, validBaseData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('debe rechazar una contraseña débil (solo 6 números)', async () => {
      const dto = plainToInstance(CreateUserDto, {
        ...validBaseData,
        password: '123456',
      });
      const errors = await validate(dto);
      const passwordErrors = errors.find((e) => e.property === 'password');
      expect(passwordErrors).toBeDefined();
    });

    it('debe rechazar una contraseña de 8+ caracteres que no cumple complejidad (sin mayúscula ni especial)', async () => {
      const dto = plainToInstance(CreateUserDto, {
        ...validBaseData,
        password: 'password123',
      });
      const errors = await validate(dto);
      const passwordErrors = errors.find((e) => e.property === 'password');
      expect(passwordErrors).toBeDefined();
    });

    it('debe rechazar un teléfono inválido (ej. "abc")', async () => {
      const dto = plainToInstance(CreateUserDto, {
        ...validBaseData,
        phone: 'abc',
      });
      const errors = await validate(dto);
      const phoneErrors = errors.find((e) => e.property === 'phone');
      expect(phoneErrors).toBeDefined();
      expect(phoneErrors?.constraints?.matches).toBe(
        'El teléfono no tiene un formato válido',
      );
    });
  });

  describe('register', () => {
    const dto: CreateUserDto = {
      email: 'juan.perez@example.com',
      phone: '+573001234567',
      password: 'Password123!',
      name: 'Juan Pérez',
    };

    it('debe registrar un usuario exitosamente', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);
      usersRepositoryMock.save.mockResolvedValue({
        id: 1,
        ...dto,
        password: 'hashedPassword',
      });

      const result = await service.register(dto);

      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(usersRepositoryMock.save).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(dto.email);
    });

    it('debe lanzar ConflictException si el email ya existe en el checkeo previo (findOne)', async () => {
      usersRepositoryMock.findOne.mockResolvedValue({
        id: 1,
        email: dto.email,
      });

      await expect(service.register(dto)).rejects.toThrow(
        new ConflictException('El email ya se encuentra registrado'),
      );
    });

    it('debe convertir un QueryFailedError con ER_DUP_ENTRY en ConflictException (condición de carrera)', async () => {
      // Simula que findOne no detectó duplicado (ej. petición simultánea)
      usersRepositoryMock.findOne.mockResolvedValue(null);

      // Simula error de la base de datos al hacer save() por índice UNIQUE de MySQL
      const dbDuplicateError = new QueryFailedError(
        'INSERT INTO user...',
        [],
        { code: 'ER_DUP_ENTRY' } as any,
      );
      usersRepositoryMock.save.mockRejectedValue(dbDuplicateError);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      await expect(service.register(dto)).rejects.toThrow(
        'El email ya se encuentra registrado',
      );
    });
  });
});
