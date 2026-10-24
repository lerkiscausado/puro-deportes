import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JugadoresService } from './jugadores.service';
import { Jugador } from './jugador.entity';
import { CreateJugadorDto } from './dto/create-jugador.dto';
import { VERSION_POLITICA } from '../common/legal.constants';

describe('JugadoresService - autorización de tratamiento de datos', () => {
  let service: JugadoresService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((x: Record<string, unknown>) => x),
    save: jest.fn((x: Record<string, unknown>) =>
      Promise.resolve({ id: 1, ...x }),
    ),
  };

  const anioNacimiento = (edad: number) =>
    `${new Date().getFullYear() - edad - 1}-01-01`;

  const dto = (over: Partial<CreateJugadorDto> = {}): CreateJugadorDto =>
    ({
      nombre: 'Ana',
      apellidos: 'Pérez',
      genero: 'Mujer',
      fechaNacimiento: anioNacimiento(25),
      estatura: 1.7,
      identificacion: '123',
      autorizacionTratamiento: true,
      ...over,
    }) as CreateJugadorDto;

  beforeEach(async () => {
    jest.clearAllMocks();
    repo.findOne.mockResolvedValue(null);
    const mod = await Test.createTestingModule({
      providers: [
        JugadoresService,
        { provide: getRepositoryToken(Jugador), useValue: repo },
      ],
    }).compile();
    service = mod.get(JugadoresService);
  });

  it('mayor de edad sin representante: guarda evidencia de autorización', async () => {
    await service.create(dto(), 7);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        autorizacionTratamiento: true,
        autorizacionPorUserId: 7,
        versionPolitica: VERSION_POLITICA,
        esMenorAlRegistrar: false,
        representanteNombre: null,
        autorizacionRepresentante: false,
      }),
    );
    const creado = repo.create.mock.calls[0][0];
    expect(creado.autorizacionAt).toBeInstanceOf(Date);
  });

  it('menor sin datos del representante falla', async () => {
    await expect(
      service.create(dto({ fechaNacimiento: anioNacimiento(12) }), 7),
    ).rejects.toThrow(BadRequestException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('menor con representante pero sin confirmar autorización falla', async () => {
    await expect(
      service.create(
        dto({
          fechaNacimiento: anioNacimiento(12),
          representanteNombre: 'Luis',
          representanteDocumento: '99',
          representanteParentesco: 'Padre',
        }),
        7,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('menor con representante y autorización confirmada se guarda', async () => {
    await service.create(
      dto({
        fechaNacimiento: anioNacimiento(12),
        representanteNombre: 'Luis',
        representanteDocumento: '99',
        representanteParentesco: 'Padre',
        autorizacionRepresentante: true,
      }),
      7,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        esMenorAlRegistrar: true,
        representanteNombre: 'Luis',
        representanteDocumento: '99',
        representanteParentesco: 'Padre',
        autorizacionRepresentante: true,
      }),
    );
  });

  it('el DTO rechaza autorizacionTratamiento=false', async () => {
    const errors = await validate(
      plainToInstance(CreateJugadorDto, {
        ...dto(),
        autorizacionTratamiento: false,
      }),
    );
    expect(errors.some((e) => e.property === 'autorizacionTratamiento')).toBe(
      true,
    );
  });
});
