import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository, QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { join } from 'path';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EmailService } from '../email/email.service';
import { getUploadsPath } from '../common/utils/uploads-path.util';

/**
 * Servicio de usuarios.
 * Contiene la lógica de negocio para el registro y gestión de usuarios.
 */
@Injectable()
export class UsersService {
  constructor(
    /** Repositorio de TypeORM para ejecutar operaciones sobre la tabla 'users' */
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    /** Servicio de JWT para generar tokens de autenticación */
    private readonly jwtService: JwtService,
    /** Servicio de configuración para obtener variables de entorno */
    private readonly configService: ConfigService,
    /** Servicio de envío de correos electrónicos */
    private readonly emailService: EmailService,
  ) {}

  /**
   * Registra un nuevo usuario en la base de datos.
   *
   * Proceso:
   * 1. Verifica que el email no esté registrado previamente.
   * 2. Hashea la contraseña con bcrypt (salt rounds: 10) para almacenarla de forma segura.
   * 3. Genera un token de verificación aleatorio y su hash SHA-256 (expiración: 24h).
   * 4. Crea y guarda el registro del usuario con emailVerified = false.
   * 5. Envía el correo de verificación usando EmailService.
   * 6. Retorna los datos del usuario sin incluir la contraseña.
   *
   * @param createUserDto - Datos del usuario a registrar (email, phone, password, name)
   * @returns El usuario creado sin el campo password
   * @throws ConflictException si el email ya está registrado
   */
  async register(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    // Busca si ya existe un usuario con el mismo email
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    // Si el email ya está en uso, lanza una excepción 409 Conflict
    if (existingUser) {
      throw new ConflictException('El email ya se encuentra registrado');
    }

    // Hashea la contraseña con bcrypt usando 10 rondas de salt
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Genera un token aleatorio y su hash SHA-256 para verificación de correo (expira en 24 horas)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Crea la instancia del usuario con la contraseña hasheada y datos de verificación
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: expiresAt,
    });

    // Guarda el usuario en la base de datos manejando posibles condiciones de carrera
    try {
      const savedUser = await this.usersRepository.save(user);

      // Construye la URL de verificación y envía el correo con el token en texto plano
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3001';
      const verificationUrl = `${frontendUrl}/verificar-correo?token=${verificationToken}`;
      await this.emailService.sendVerificationEmail(
        savedUser.email,
        savedUser.name,
        verificationUrl,
      );

      // Desestructura para excluir la contraseña de la respuesta
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = savedUser;
      return result;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('El email ya se encuentra registrado');
      }
      throw error;
    }
  }

  /**
   * Verifica la dirección de correo electrónico de un usuario usando un token.
   *
   * @param token - Token enviado por correo electrónico en texto plano
   * @returns Mensaje de confirmación
   * @throws BadRequestException si el token es inválido o ha expirado
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.usersRepository.findOne({
      where: {
        emailVerificationTokenHash: tokenHash,
      },
    });

    if (
      !user ||
      !user.emailVerificationTokenExpiresAt ||
      user.emailVerificationTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'El enlace de verificación no es válido o ha expirado',
      );
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpiresAt = null;

    await this.usersRepository.save(user);

    return { message: 'Correo electrónico verificado exitosamente' };
  }

  /**
   * Reenvía un nuevo correo de verificación si el usuario existe y aún no se ha verificado.
   * Por seguridad, retorna la misma respuesta genérica en todos los casos para evitar enumeración.
   *
   * @param email - Correo del usuario a verificar
   * @returns Mensaje genérico de éxito
   */
  async resendVerificationEmail(
    email: string,
  ): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'Si el correo está registrado y pendiente de verificación, se ha enviado un nuevo enlace.',
    };

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user || user.emailVerified) {
      return genericResponse;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationTokenExpiresAt = expiresAt;

    await this.usersRepository.save(user);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3001';
    const verificationUrl = `${frontendUrl}/verificar-correo?token=${verificationToken}`;

    await this.emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationUrl,
    );

    return genericResponse;
  }

  /**
   * Solicita el restablecimiento de contraseña enviando un correo con un token temporal (expira en 1 hora).
   * Para evitar la enumeración de usuarios, retorna siempre el mismo mensaje genérico.
   *
   * @param email - Correo electrónico del usuario
   * @returns Mensaje genérico de confirmación
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const genericResponse = {
      message:
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.',
    };

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      return genericResponse;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Expira en 1 hora

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = expiresAt;

    await this.usersRepository.save(user);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3001';
    const resetUrl = `${frontendUrl}/restablecer-contrasena?token=${resetToken}`;

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetUrl,
    );

    return genericResponse;
  }

  /**
   * Restablece la contraseña de un usuario validando el token recibido por correo.
   *
   * @param token - Token recibido por correo electrónico en texto plano
   * @param newPassword - Nueva contraseña cumpliendo reglas de seguridad
   * @returns Mensaje de confirmación de restablecimiento exitoso
   * @throws BadRequestException si el token no es válido o ha expirado
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.usersRepository.findOne({
      where: {
        passwordResetTokenHash: tokenHash,
      },
    });

    if (
      !user ||
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException(
        'El enlace para restablecer la contraseña no es válido o ha expirado',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;

    await this.usersRepository.save(user);

    return { message: 'Contraseña restablecida exitosamente' };
  }

  /**
   * Inicia sesión de un usuario existente.
   *
   * Proceso:
   * 1. Busca el usuario por email en la base de datos.
   * 2. Si no existe, lanza una excepción 401 Unauthorized.
   * 3. Si el correo no está verificado, lanza una excepción 401 Unauthorized.
   * 4. Compara la contraseña enviada con el hash almacenado usando bcrypt.
   * 5. Si no coincide, lanza una excepción 401 Unauthorized.
   * 6. Genera y retorna un token JWT con el id, email y name del usuario.
   *
   * @param loginUserDto - Credenciales del usuario (email, password)
   * @returns Objeto con el access_token JWT y los datos básicos del usuario
   * @throws UnauthorizedException si el email no existe, la contraseña es incorrecta o no está verificado
   */
  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    // Busca el usuario por email incluyendo la columna password (excluida por defecto)
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: loginUserDto.email })
      .getOne();

    // Si el email no está registrado, lanza excepción 401
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Si el correo no ha sido verificado, lanza excepción 401 ANTES de comprobar la contraseña
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.',
      );
    }

    // Compara la contraseña enviada con el hash almacenado en la base de datos
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    // Si la contraseña no coincide, lanza excepción 401
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Genera el payload del token con los datos básicos del usuario (incluye el rol)
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Desestructura para excluir la contraseña de la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = user;

    return {
      access_token: this.jwtService.sign(payload),
      user: userData,
    };
  }

  /**
   * Obtiene el perfil de un usuario por su ID.
   *
   * Busca al usuario en la base de datos y retorna sus datos
   * excluyendo la contraseña por seguridad.
   *
   * @param userId - ID del usuario a buscar
   * @returns Los datos del usuario sin el campo password
   * @throws UnauthorizedException si el usuario no existe
   */
  async findById(userId: number): Promise<Omit<User, 'password'>> {
    // Busca el usuario por su ID
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    // Si no se encuentra el usuario, lanza excepción 401
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Excluye la contraseña de la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  /**
   * Actualiza el perfil de un usuario autenticado.
   *
   * Solo permite actualizar los campos: phone, name, genero,
   * fechaNacimiento, direccion y password (opcional).
   * No permite modificar email ni role por seguridad.
   *
   * Si se envía un nuevo password, se hashea con bcrypt antes de guardarlo.
   *
   * @param userId - ID del usuario a actualizar
   * @param updateProfileDto - Campos a actualizar
   * @param file - Archivo de imagen subido si se actualiza la foto de perfil (opcional)
   * @returns Los datos del usuario actualizado sin el campo password
   * @throws UnauthorizedException si el usuario no existe
   */
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
    file?: Express.Multer.File,
  ): Promise<Omit<User, 'password'>> {
    // Busca el usuario por su ID
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    // Si no se encuentra el usuario, lanza excepción 401
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (file?.filename) {
      // Si el usuario ya tenía una foto previa guardada, elimina la foto anterior del disco
      if (user.foto) {
        const oldPath = join(getUploadsPath('perfiles'), user.foto);
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch {
          // Ignorar silenciosamente si no se pudo eliminar la imagen previa
        }
      }
      user.foto = file.filename;
    }

    // Si se envió un nuevo password, lo hashea con bcrypt
    if (updateProfileDto.password) {
      updateProfileDto.password = await bcrypt.hash(
        updateProfileDto.password,
        10,
      );
    }

    // Filtra solo los campos que fueron enviados (no undefined)
    const fieldsToUpdate = Object.fromEntries(
      Object.entries(updateProfileDto).filter(
        ([, value]) => value !== undefined,
      ),
    );

    // Actualiza solo los campos enviados en el DTO
    Object.assign(user, fieldsToUpdate);

    // Guarda los cambios en la base de datos
    const updatedUser = await this.usersRepository.save(user);

    // Excluye la contraseña de la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updatedUser;
    return result;
  }
}
