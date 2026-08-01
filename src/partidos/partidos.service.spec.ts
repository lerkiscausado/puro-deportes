import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PartidosService } from './partidos.service';
import { Partido } from './partido.entity';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { Escenario } from '../escenarios/escenario.entity';
import { Inscripcion } from '../inscripciones/inscripcion.entity';
import { EstadoPartido } from './enums/estado-partido.enum';
import { TipoJuego } from './enums/tipo-juego.enum';

describe('PartidosService', () => {
  let service: PartidosService;
  let partidosRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    partidosRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartidosService,
        {
          provide: getRepositoryToken(Partido),
          useValue: partidosRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Torneo),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Equipo),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Escenario),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PartidosService>(PartidosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublicProgramados', () => {
    it('debe retornar solo partidos en estado PROGRAMADO sin incluir la relación user', async () => {
      const mockProgramados: Partial<Partido>[] = [
        {
          id: 1,
          fecha: '2026-08-10',
          hora: '15:00:00',
          estado: EstadoPartido.PROGRAMADO,
          tipoJuego: TipoJuego.OFICIAL,
          user: { id: 99, email: 'admin@test.com' } as User,
          torneo: { id: 1, name: 'Torneo 1', user: { id: 99 } } as Torneo,
          equipoLocal: { id: 10, nombre: 'Equipo A' } as Equipo,
          equipoVisitante: { id: 20, nombre: 'Equipo B' } as Equipo,
        },
      ];

      partidosRepositoryMock.find.mockResolvedValue(mockProgramados);

      const result = await service.findPublicProgramados();

      expect(partidosRepositoryMock.find).toHaveBeenCalledWith({
        where: { estado: EstadoPartido.PROGRAMADO },
        relations: {
          torneo: true,
          equipoLocal: true,
          equipoVisitante: true,
          escenario: true,
        },
        order: {
          fecha: 'ASC',
          hora: 'ASC',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].estado).toBe(EstadoPartido.PROGRAMADO);
      expect(result[0].user).toBeUndefined();
      expect(result[0].torneo?.user).toBeUndefined();
    });
  });

  describe('findPublicFinalizados', () => {
    it('debe retornar solo partidos en estado FINALIZADO limitando a 50 sin incluir user', async () => {
      const mockFinalizados: Partial<Partido>[] = [
        {
          id: 2,
          fecha: '2026-08-01',
          hora: '18:00:00',
          local: 2,
          visitante: 1,
          estado: EstadoPartido.FINALIZADO,
          tipoJuego: TipoJuego.OFICIAL,
          user: { id: 99, email: 'admin@test.com' } as User,
        },
      ];

      partidosRepositoryMock.find.mockResolvedValue(mockFinalizados);

      const result = await service.findPublicFinalizados();

      expect(partidosRepositoryMock.find).toHaveBeenCalledWith({
        where: { estado: EstadoPartido.FINALIZADO },
        relations: {
          torneo: true,
          equipoLocal: true,
          equipoVisitante: true,
          escenario: true,
        },
        order: {
          fecha: 'DESC',
          hora: 'DESC',
        },
        take: 50,
      });

      expect(result).toHaveLength(1);
      expect(result[0].estado).toBe(EstadoPartido.FINALIZADO);
      expect(result[0].user).toBeUndefined();
    });
  });
});
