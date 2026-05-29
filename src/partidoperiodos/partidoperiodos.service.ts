import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartidoPeriodo } from './partidoperiodo.entity';
import { CreatePartidoPeriodoDto } from './dto/create-partidoperiodo.dto';
import { UpdatePartidoPeriodoDto } from './dto/update-partidoperiodo.dto';
import { User } from '../users/user.entity';
import { Partido } from '../partidos/partido.entity';
import { Role } from '../users/enums/role.enum';

@Injectable()
export class PartidoPeriodosService {
  constructor(
    @InjectRepository(PartidoPeriodo)
    private readonly partidoperiodosRepository: Repository<PartidoPeriodo>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Partido)
    private readonly partidosRepository: Repository<Partido>,
  ) {}

  private readonly selectOptions = {
    id: true,
    nombrePeriodo: true,
    tipoPeriodo: true,
    scoreLocal: true,
    scoreVisitante: true,
    createdAt: true,
    updatedAt: true,
    partido: {
      id: true,
      fecha: true,
      hora: true,
    },
    user: {
      id: true,
      name: true,
      role: true,
      email: true,
    },
  };

  async create(
    createDto: CreatePartidoPeriodoDto,
    userId: number,
  ): Promise<PartidoPeriodo> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const partido = await this.partidosRepository.findOne({
      where: { id: createDto.idPartido },
    });
    if (!partido) throw new NotFoundException('Partido no encontrado');

    const periodo = this.partidoperiodosRepository.create({
      ...createDto,
      partido,
      user,
    });

    const guardado = await this.partidoperiodosRepository.save(periodo);
    return this.findOne(guardado.id);
  }

  async findAll(): Promise<PartidoPeriodo[]> {
    return this.partidoperiodosRepository.find({
      relations: { partido: true, user: true },
      select: this.selectOptions,
    });
  }

  async findOne(id: number): Promise<PartidoPeriodo> {
    const periodo = await this.partidoperiodosRepository.findOne({
      where: { id },
      relations: { partido: true, user: true },
      select: this.selectOptions,
    });

    if (!periodo)
      throw new NotFoundException(
        `Periodo de partido con ID ${id} no encontrado`,
      );
    return periodo;
  }

  async findByPartido(partidoId: number): Promise<PartidoPeriodo[]> {
    return this.partidoperiodosRepository.find({
      where: { partido: { id: partidoId } },
      relations: { partido: true, user: true },
      select: this.selectOptions,
    });
  }

  async update(
    id: number,
    updateDto: UpdatePartidoPeriodoDto,
    userId: number,
    userRole: Role,
  ): Promise<PartidoPeriodo> {
    const periodo = await this.findOne(id);

    if (periodo.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar este periodo.',
      );
    }

    if (updateDto.idPartido) {
      const partido = await this.partidosRepository.findOne({
        where: { id: updateDto.idPartido },
      });
      if (!partido) throw new NotFoundException('Partido no encontrado');
      periodo.partido = partido;
    }

    const actualizado = this.partidoperiodosRepository.merge(
      periodo,
      updateDto,
    );
    await this.partidoperiodosRepository.save(actualizado);
    return this.findOne(id);
  }

  async remove(id: number, userId: number, userRole: Role): Promise<void> {
    const periodo = await this.findOne(id);

    if (periodo.user.id !== userId && userRole !== Role.ADMIN) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este periodo.',
      );
    }

    await this.partidoperiodosRepository.remove(periodo);
  }
}
