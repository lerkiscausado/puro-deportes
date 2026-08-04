import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InscripcionesService } from './inscripciones.service';
import { Inscripcion } from './inscripcion.entity';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { EstadoInscripcion } from './enums/estado-inscripcion.enum';
import { DeporteEquipo } from '../equipos/enums/deporte.enum';

describe('InscripcionesService', () => {
  let service: InscripcionesService;
  let inscripcionesRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    inscripcionesRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InscripcionesService,
        {
          provide: getRepositoryToken(Inscripcion),
          useValue: inscripcionesRepositoryMock,
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
      ],
    }).compile();

    service = module.get<InscripcionesService>(InscripcionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublicByTorneo', () => {
    it('debe retornar inscripciones activas ordenadas por puntos y diferencia NUNCA incluyendo telefono ni correo del equipo', async () => {
      const mockInscripciones: Partial<Inscripcion>[] = [
        {
          id: 1,
          partidosJugados: 3,
          partidosGanados: 3,
          partidosEmpatados: 0,
          partidosPerdidos: 0,
          puntosFavor: 9,
          puntosContra: 1,
          diferencia: 8,
          puntos: 9,
          estado: EstadoInscripcion.ACTIVO,
          equipo: {
            id: 10,
            nombre: 'Equipo Alfa',
            representante: 'Carlos Perez',
            telefono: '3001234567',
            correo: 'carlos@alfa.com',
            deporte: DeporteEquipo.FUTBOL,
            foto: 'foto-alfa.jpg',
          } as Equipo,
        },
        {
          id: 2,
          partidosJugados: 3,
          partidosGanados: 2,
          partidosEmpatados: 0,
          partidosPerdidos: 1,
          puntosFavor: 6,
          puntosContra: 3,
          diferencia: 3,
          puntos: 6,
          estado: EstadoInscripcion.ACTIVO,
          equipo: {
            id: 20,
            nombre: 'Equipo Beta',
            representante: 'Maria Gomez',
            telefono: '3109876543',
            correo: 'maria@beta.com',
            deporte: DeporteEquipo.FUTBOL,
            foto: 'foto-beta.jpg',
          } as Equipo,
        },
      ];

      inscripcionesRepositoryMock.find.mockResolvedValue(mockInscripciones);

      const resultado = await service.findPublicByTorneo(1);

      expect(inscripcionesRepositoryMock.find).toHaveBeenCalledWith({
        where: {
          torneo: { id: 1 },
          estado: EstadoInscripcion.ACTIVO,
        },
        relations: {
          equipo: true,
        },
        order: {
          puntos: 'DESC',
          diferencia: 'DESC',
        },
      });

      expect(resultado).toHaveLength(2);
      expect(resultado[0].id).toBe(1);
      expect(resultado[0].puntos).toBe(9);
      expect(resultado[0].equipo?.nombre).toBe('Equipo Alfa');

      const jsonStr = JSON.stringify(resultado);
      expect(jsonStr).not.toContain('telefono');
      expect(jsonStr).not.toContain('correo');
      expect(jsonStr).not.toContain('3001234567');
      expect(jsonStr).not.toContain('carlos@alfa.com');
    });
  });
});
