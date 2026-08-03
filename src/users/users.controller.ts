import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { RequestWithUser } from '../common/interfaces/request-with-user.interface';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { Role } from './enums/role.enum';

/**
 * Controlador de usuarios.
 * Define los endpoints HTTP bajo la ruta /users.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Endpoint para registrar un nuevo usuario.
   * Ruta: POST /users/register
   *
   * Recibe los datos del usuario en el body del request,
   * los valida automáticamente usando CreateUserDto,
   * y delega la lógica de negocio al UsersService.
   *
   * Límite de rate limiting: 3 intentos por minuto por IP (más restrictivo
   * que el global de 100/min) para mitigar registros masivos automatizados.
   *
   * @param createUserDto - Datos del usuario validados (email, phone, password, name)
   * @returns El usuario creado sin el campo password
   */
  @Throttle({ global: { limit: 3, ttl: 60000 } })
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  /**
   * Endpoint para verificar el correo electrónico del usuario.
   * Ruta: POST /users/verify-email
   *
   * @param verifyEmailDto - DTO con el token de verificación recibido en el correo
   * @returns Mensaje de confirmación de verificación exitosa
   */
  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.usersService.verifyEmail(verifyEmailDto.token);
  }

  /**
   * Endpoint para solicitar un nuevo enlace de verificación de correo.
   * Ruta: POST /users/resend-verification
   *
   * Rate limiting: Máximo 3 intentos por 10 minutos por IP.
   *
   * @param resendVerificationDto - DTO con el email del usuario
   * @returns Mensaje genérico de confirmación (no revela la existencia del email)
   */
  @Public()
  @Throttle({ global: { limit: 3, ttl: 600000 } })
  @Post('resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.usersService.resendVerificationEmail(
      resendVerificationDto.email,
    );
  }

  /**
   * Endpoint para iniciar sesión.
   * Ruta: POST /users/login
   *
   * Valida el formato del email y la contraseña usando LoginUserDto,
   * verifica las credenciales contra la base de datos,
   * y retorna un token JWT si son correctas.
   *
   * Límite de rate limiting: 5 intentos por minuto por IP (más restrictivo
   * que el global de 100/min) para mitigar ataques de fuerza bruta.
   *
   * @param loginUserDto - Credenciales del usuario (email, password)
   * @returns Objeto con access_token JWT y datos del usuario
   */
  @Throttle({ global: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto);
  }

  /**
   * Endpoint para obtener el perfil del usuario autenticado.
   * Ruta: GET /users/profile
   *
   * Requiere autenticación mediante token JWT en el header:
   * Authorization: Bearer <token>
   *
   * Accesible por cualquier usuario autenticado (admin, manager, user).
   *
   * @param req - Objeto request con el payload del JWT adjuntado por el guard
   * @returns Los datos del usuario autenticado sin el campo password
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Get('profile')
  async getProfile(@Req() req: RequestWithUser) {
    // req.user.sub contiene el ID del usuario extraído del token JWT
    return this.usersService.findById(req.user.sub);
  }

  /**
   * Endpoint para actualizar el perfil del usuario autenticado.
   * Ruta: PATCH /users/profile
   *
   * Requiere autenticación mediante token JWT en el header:
   * Authorization: Bearer <token>
   *
   * Campos actualizables: phone, name, genero, fechaNacimiento, direccion, password.
   * No permite modificar email ni role por seguridad.
   *
   * @param req - Objeto request con el payload del JWT adjuntado por el guard
   * @param updateProfileDto - Campos a actualizar (todos opcionales)
   * @returns Los datos del usuario actualizado sin el campo password
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.USER)
  @Patch('profile')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.sub, updateProfileDto);
  }

  /**
   * Endpoint exclusivo para administradores.
   * Ruta: GET /users/admin/dashboard
   *
   * Solo accesible por usuarios con rol 'admin'.
   * Requiere autenticación JWT y verificación de rol.
   *
   * @returns Mensaje de confirmación de acceso al panel de administración
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/dashboard')
  adminDashboard() {
    return { message: 'Bienvenido al panel de administración' };
  }

  /**
   * Endpoint para administradores y managers.
   * Ruta: GET /users/management
   *
   * Accesible por usuarios con rol 'admin' o 'manager'.
   * Requiere autenticación JWT y verificación de rol.
   *
   * @returns Mensaje de confirmación de acceso al panel de gestión
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('management')
  management() {
    return { message: 'Bienvenido al panel de gestión' };
  }
}
