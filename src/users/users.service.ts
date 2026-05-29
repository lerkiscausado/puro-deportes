import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
  ) {}

  /**
   * Registra un nuevo usuario en la base de datos.
   *
   * Proceso:
   * 1. Verifica que el email no esté registrado previamente.
   * 2. Hashea la contraseña con bcrypt (salt rounds: 10) para almacenarla de forma segura.
   * 3. Crea y guarda el registro del usuario en la base de datos.
   * 4. Retorna los datos del usuario sin incluir la contraseña.
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

    // Crea la instancia del usuario con la contraseña hasheada
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Guarda el usuario en la base de datos
    const savedUser = await this.usersRepository.save(user);

    // Desestructura para excluir la contraseña de la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = savedUser;
    return result;
  }

  /**
   * Inicia sesión de un usuario existente.
   *
   * Proceso:
   * 1. Busca el usuario por email en la base de datos.
   * 2. Si no existe, lanza una excepción 401 Unauthorized.
   * 3. Compara la contraseña enviada con el hash almacenado usando bcrypt.
   * 4. Si no coincide, lanza una excepción 401 Unauthorized.
   * 5. Genera y retorna un token JWT con el id, email y name del usuario.
   *
   * @param loginUserDto - Credenciales del usuario (email, password)
   * @returns Objeto con el access_token JWT y los datos básicos del usuario
   * @throws UnauthorizedException si el email no existe o la contraseña es incorrecta
   */
  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ access_token: string; user: Omit<User, 'password'> }> {
    // Busca el usuario por email
    const user = await this.usersRepository.findOne({
      where: { email: loginUserDto.email },
    });

    // Si el email no está registrado, lanza excepción 401
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
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
   * @returns Los datos del usuario actualizado sin el campo password
   * @throws UnauthorizedException si el usuario no existe
   */
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Omit<User, 'password'>> {
    // Busca el usuario por su ID
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    // Si no se encuentra el usuario, lanza excepción 401
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
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
