import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('UsersService y CreateUserDto', () => {
  let service: UsersService;
  let usersRepositoryMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let jwtServiceMock: {
    sign: jest.Mock;
  };
  let configServiceMock: {
    get: jest.Mock;
  };
  let emailServiceMock: {
    sendVerificationEmail: jest.Mock;
    sendPasswordResetEmail: jest.Mock;
  };

  beforeEach(async () => {
    usersRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 1, ...dto })),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'FRONTEND_URL') return 'https://purodeporte.co';
        if (key === 'RESEND_API_KEY') return 're_mock_key';
        return null;
      }),
    };

    emailServiceMock = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: EmailService,
          useValue: emailServiceMock,
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

    it('debe rechazar una contraseña de 8+ caracteres que no cumple complejidad', async () => {
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

    it('debe registrar un usuario, guardar el hash del token (no el token plano) y llamar a emailService.sendVerificationEmail', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);
      usersRepositoryMock.save.mockImplementation(async (u) => ({
        id: 1,
        ...u,
      }));

      const result = await service.register(dto);

      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(usersRepositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          emailVerified: false,
          emailVerificationTokenHash: expect.any(String),
          emailVerificationTokenExpiresAt: expect.any(Date),
        }),
      );

      const createdUser = usersRepositoryMock.create.mock.results[0].value;
      expect(createdUser.emailVerificationTokenHash).toHaveLength(64);

      expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        dto.email,
        dto.name,
        expect.stringContaining('https://purodeporte.co/verificar-correo?token='),
      );

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe(dto.email);
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      usersRepositoryMock.findOne.mockResolvedValue({
        id: 1,
        email: dto.email,
      });

      await expect(service.register(dto)).rejects.toThrow(
        new ConflictException('El email ya se encuentra registrado'),
      );
    });

    it('debe convertir un QueryFailedError con ER_DUP_ENTRY en ConflictException (condición de carrera)', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);

      const dbDuplicateError = new QueryFailedError(
        'INSERT INTO user...',
        [],
        { code: 'ER_DUP_ENTRY' } as any,
      );
      usersRepositoryMock.save.mockRejectedValue(dbDuplicateError);

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyEmail', () => {
    it('con token válido marca emailVerified=true y limpia los campos de token', async () => {
      const rawToken = 'sample-verification-token-123';
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const mockUser = {
        id: 1,
        email: 'juan@example.com',
        emailVerified: false,
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: new Date(Date.now() + 3600000),
      } as User;

      usersRepositoryMock.findOne.mockResolvedValue(mockUser);
      usersRepositoryMock.save.mockImplementation(async (u) => u);

      const response = await service.verifyEmail(rawToken);

      expect(response.message).toBe('Correo electrónico verificado exitosamente');
      expect(usersRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationTokenExpiresAt: null,
        }),
      );
    });

    it('con token expirado o inexistente lanza BadRequestException', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail('token-invalido')).rejects.toThrow(
        BadRequestException,
      );

      const rawToken = 'token-expirado';
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');
      const expiredUser = {
        id: 1,
        emailVerified: false,
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: new Date(Date.now() - 3600000),
      } as User;

      usersRepositoryMock.findOne.mockResolvedValue(expiredUser);
      await expect(service.verifyEmail(rawToken)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('responde el mismo mensaje genérico tanto si el email existe como si no', async () => {
      const expectedMessage =
        'Si el correo está registrado y pendiente de verificación, se ha enviado un nuevo enlace.';

      // Caso 1: Email no existe
      usersRepositoryMock.findOne.mockResolvedValue(null);
      const res1 = await service.resendVerificationEmail('noexiste@example.com');
      expect(res1.message).toBe(expectedMessage);
      expect(emailServiceMock.sendVerificationEmail).not.toHaveBeenCalled();

      // Caso 2: Email existe y YA está verificado
      usersRepositoryMock.findOne.mockResolvedValue({
        id: 1,
        email: 'yaverificado@example.com',
        emailVerified: true,
      });
      const res2 = await service.resendVerificationEmail(
        'yaverificado@example.com',
      );
      expect(res2.message).toBe(expectedMessage);
      expect(emailServiceMock.sendVerificationEmail).not.toHaveBeenCalled();

      // Caso 3: Email existe y NO está verificado -> Genera nuevo token y envía correo
      const unverifiedUser = {
        id: 2,
        name: 'Carlos',
        email: 'pendiente@example.com',
        emailVerified: false,
      } as User;
      usersRepositoryMock.findOne.mockResolvedValue(unverifiedUser);
      usersRepositoryMock.save.mockImplementation(async (u) => u);

      const res3 = await service.resendVerificationEmail('pendiente@example.com');
      expect(res3.message).toBe(expectedMessage);
      expect(usersRepositoryMock.save).toHaveBeenCalled();
      expect(emailServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        'pendiente@example.com',
        'Carlos',
        expect.stringContaining('https://purodeporte.co/verificar-correo?token='),
      );
    });
  });

  describe('login', () => {
    it('con emailVerified=false lanza UnauthorizedException con el mensaje específico SIN comparar la contraseña', async () => {
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 1,
          email: 'unverified@example.com',
          password: '$2b$10$hashedpassword',
          emailVerified: false,
        }),
      };
      usersRepositoryMock.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      (bcrypt.compare as jest.Mock).mockClear();

      await expect(
        service.login({
          email: 'unverified@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.',
        ),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('con emailVerified=true e información válida permite el login', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 1,
          email: 'verified@example.com',
          name: 'Juan',
          role: 'user',
          password: hashedPassword,
          emailVerified: true,
        }),
      };
      usersRepositoryMock.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.login({
        email: 'verified@example.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe('verified@example.com');
    });
  });

  describe('forgotPassword', () => {
    const genericMessage =
      'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

    it('responde con el mensaje genérico y NO envía correo si el email no existe', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);

      const res = await service.forgotPassword('noexiste@example.com');

      expect(res.message).toBe(genericMessage);
      expect(emailServiceMock.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('responde con el mensaje genérico, guarda hash de token (expira en 1h) y envía correo si el email existe', async () => {
      const mockUser = {
        id: 1,
        email: 'juan@example.com',
        name: 'Juan Pérez',
      } as User;

      usersRepositoryMock.findOne.mockResolvedValue(mockUser);
      usersRepositoryMock.save.mockImplementation(async (u) => u);

      const res = await service.forgotPassword('juan@example.com');

      expect(res.message).toBe(genericMessage);
      expect(usersRepositoryMock.save).toHaveBeenCalled();

      const savedUser = usersRepositoryMock.save.mock.calls[0][0];
      expect(savedUser.passwordResetTokenHash).toBeDefined();
      expect(savedUser.passwordResetTokenHash).toHaveLength(64);
      expect(savedUser.passwordResetTokenExpiresAt).toBeInstanceOf(Date);

      // Verifica que la fecha de expiración sea aprox 1 hora en el futuro
      const now = Date.now();
      const expires = savedUser.passwordResetTokenExpiresAt.getTime();
      expect(expires - now).toBeGreaterThan(50 * 60 * 1000); // más de 50 mins
      expect(expires - now).toBeLessThanOrEqual(60 * 60 * 1000 + 5000); // máx 1 hora + buffer

      expect(emailServiceMock.sendPasswordResetEmail).toHaveBeenCalledWith(
        'juan@example.com',
        'Juan Pérez',
        expect.stringContaining('https://purodeporte.co/restablecer-contrasena?token='),
      );
    });
  });

  describe('resetPassword', () => {
    it('restablece la contraseña con token válido y no expirado', async () => {
      const rawToken = 'reset-token-12345';
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const mockUser = {
        id: 1,
        email: 'juan@example.com',
        password: 'oldHashedPassword',
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: new Date(Date.now() + 1800000), // +30 mins
      } as User;

      usersRepositoryMock.findOne.mockResolvedValue(mockUser);
      usersRepositoryMock.save.mockImplementation(async (u) => u);

      const result = await service.resetPassword(rawToken, 'NewPassword123!');

      expect(result.message).toBe('Contraseña restablecida exitosamente');
      expect(usersRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashedPassword',
          passwordResetTokenHash: null,
          passwordResetTokenExpiresAt: null,
        }),
      );
    });

    it('lanza BadRequestException si el token no existe', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('token-invalido', 'NewPassword123!'),
      ).rejects.toThrow(
        new BadRequestException(
          'El enlace para restablecer la contraseña no es válido o ha expirado',
        ),
      );
    });

    it('lanza BadRequestException si el token ha expirado', async () => {
      const rawToken = 'expired-token';
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const mockUser = {
        id: 1,
        email: 'juan@example.com',
        passwordResetTokenHash: tokenHash,
        passwordResetTokenExpiresAt: new Date(Date.now() - 1000), // Ya expiró
      } as User;

      usersRepositoryMock.findOne.mockResolvedValue(mockUser);

      await expect(
        service.resetPassword(rawToken, 'NewPassword123!'),
      ).rejects.toThrow(
        new BadRequestException(
          'El enlace para restablecer la contraseña no es válido o ha expirado',
        ),
      );
    });
  });

  describe('Validación de ForgotPasswordDto y ResetPasswordDto', () => {
    it('ForgotPasswordDto debe validar el email', async () => {
      const validDto = plainToInstance(ForgotPasswordDto, {
        email: 'test@example.com',
      });
      const validErrors = await validate(validDto);
      expect(validErrors.length).toBe(0);

      const invalidDto = plainToInstance(ForgotPasswordDto, {
        email: 'correo-invalido',
      });
      const invalidErrors = await validate(invalidDto);
      expect(invalidErrors.length).toBeGreaterThan(0);
    });

    it('ResetPasswordDto debe aplicar las 5 reglas de seguridad en password', async () => {
      const validDto = plainToInstance(ResetPasswordDto, {
        token: 'valid-token-123',
        password: 'Password123!',
      });
      const validErrors = await validate(validDto);
      expect(validErrors.length).toBe(0);

      const weakPasswordDto = plainToInstance(ResetPasswordDto, {
        token: 'valid-token-123',
        password: 'weak',
      });
      const weakErrors = await validate(weakPasswordDto);
      expect(weakErrors.length).toBeGreaterThan(0);
    });
  });

  describe('updateProfile con foto de perfil', () => {
    const existingUser: User = {
      id: 1,
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+573001234567',
      foto: 'foto-antigua.png',
    } as User;

    it('caso 1: actualizar sin archivo nuevo conserva la foto actual del usuario', async () => {
      usersRepositoryMock.findOne.mockResolvedValue(existingUser);
      usersRepositoryMock.save.mockResolvedValue({
        ...existingUser,
        name: 'Juan Carlos',
      });

      await service.updateProfile(1, { name: 'Juan Carlos' });

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(usersRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          foto: 'foto-antigua.png',
          name: 'Juan Carlos',
        }),
      );
    });

    it('caso 2: actualizar con archivo nuevo reemplaza la foto y elimina el archivo anterior del disco', async () => {
      const mockFile = { filename: 'foto-nueva.png' } as Express.Multer.File;

      usersRepositoryMock.findOne.mockResolvedValue(existingUser);
      usersRepositoryMock.save.mockResolvedValue({
        ...existingUser,
        foto: 'foto-nueva.png',
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.updateProfile(1, {}, mockFile);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(usersRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          foto: 'foto-nueva.png',
        }),
      );
    });

    it('caso 3: actualizar sin foto previa + archivo nuevo asigna la foto nueva sin intentar borrar nada', async () => {
      const userSinFoto: User = {
        ...existingUser,
        foto: null as any,
      };
      const mockFile = { filename: 'primer-perfil.png' } as Express.Multer.File;

      usersRepositoryMock.findOne.mockResolvedValue(userSinFoto);
      usersRepositoryMock.save.mockResolvedValue({
        ...userSinFoto,
        foto: 'primer-perfil.png',
      });

      await service.updateProfile(1, {}, mockFile);

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(usersRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          foto: 'primer-perfil.png',
        }),
      );
    });
  });
});
