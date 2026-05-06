import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
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
   * @param createUserDto - Datos del usuario validados (email, phone, password, name)
   * @returns El usuario creado sin el campo password
   */
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.register(createUserDto);
  }

  /**
   * Endpoint para iniciar sesión.
   * Ruta: POST /users/login
   *
   * Valida el formato del email y la contraseña usando LoginUserDto,
   * verifica las credenciales contra la base de datos,
   * y retorna un token JWT si son correctas.
   *
   * @param loginUserDto - Credenciales del usuario (email, password)
   * @returns Objeto con access_token JWT y datos del usuario
   */
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
  async getProfile(@Req() req: Request) {
    // req['user'].sub contiene el ID del usuario extraído del token JWT
    return this.usersService.findById(req['user'].sub);
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
  async adminDashboard() {
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
  async management() {
    return { message: 'Bienvenido al panel de gestión' };
  }
}
