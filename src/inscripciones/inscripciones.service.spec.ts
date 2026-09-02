import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { validate } from 'class-validator';
import { InscripcionesService } from './inscripciones.service';
import { Inscripcion } from './inscripcion.entity';
import { User } from '../users/user.entity';
import { Torneo } from '../torneos/torneo.entity';
import { Equipo } from '../equipos/equipo.entity';
import { EstadoInscripcion } from './enums/estado-inscripcion.enum';
import { DeporteEquipo } from '../equipos/enums/deporte.enum';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';
import { Role } from '../users/enums/role.enum';

describe('InscripcionesService', () => {
  let service: InscripcionesService;
  let inscripcionesRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
  };

  beforeEach(async () => {
    inscripcionesRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
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
          grupo: 'A',
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
          grupo: 'B',
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

    it('debe incluir el campo grupo en la respuesta pública', async () => {
      const mockInscripciones: Partial<Inscripcion>[] = [
        {
          id: 5,
          partidosJugados: 1,
          partidosGanados: 1,
          partidosEmpatados: 0,
          partidosPerdidos: 0,
          puntosFavor: 3,
          puntosContra: 0,
          diferencia: 3,
          puntos: 3,
          grupo: 'C',
          estado: EstadoInscripcion.ACTIVO,
          equipo: {
            id: 30,
            nombre: 'Equipo Gamma',
            representante: 'Juan',
            telefono: '111',
            correo: 'j@g.com',
            deporte: DeporteEquipo.FUTBOL,
            foto: null,
          } as unknown as Equipo,
        },
      ];

      inscripcionesRepositoryMock.find.mockResolvedValue(mockInscripciones);

      const resultado = await service.findPublicByTorneo(2);

      expect(resultado[0]).toHaveProperty('grupo', 'C');
    });
  });

  describe('update - campo grupo', () => {
    it('debe actualizar el grupo de una inscripción correctamente', async () => {
      const mockUser: Partial<User> = { id: 1 };
      const mockInscripcion: Partial<Inscripcion> = {
        id: 10,
        grupo: null,
        estado: EstadoInscripcion.ACTIVO,
        user: mockUser as User,
        torneo: { id: 1 } as Torneo,
        equipo: { id: 1 } as Equipo,
      };

      const mockInscripcionActualizada: Partial<Inscripcion> = {
        ...mockInscripcion,
        grupo: 'B',
      };

      // findOne (primera llamada dentro de update)
      inscripcionesRepositoryMock.findOne
        .mockResolvedValueOnce(mockInscripcion)
        // findOne llamado por el return al final de update
        .mockResolvedValueOnce(mockInscripcionActualizada);

      inscripcionesRepositoryMock.merge.mockReturnValue(
        mockInscripcionActualizada,
      );
      inscripcionesRepositoryMock.save.mockResolvedValue(
        mockInscripcionActualizada,
      );

      const dto: UpdateInscripcionDto = { grupo: 'B' };
      const resultado = await service.update(10, dto, 1, Role.ADMIN);

      expect(inscripcionesRepositoryMock.merge).toHaveBeenCalledWith(
        mockInscripcion,
        expect.objectContaining({ grupo: 'B' }),
      );
      expect(inscripcionesRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ grupo: 'B' }),
      );
      expect(resultado.grupo).toBe('B');
    });
  });

  describe('UpdateInscripcionDto - validación de grupo', () => {
    it('debe rechazar un valor de grupo inválido (ej. "Z")', async () => {
      const dto = new UpdateInscripcionDto();
      dto.grupo = 'Z';

      const errors = await validate(dto);

      const grupoError = errors.find((e) => e.property === 'grupo');
      expect(grupoError).toBeDefined();
      expect(grupoError?.constraints?.isIn).toBe(
        'El grupo debe ser A, B, C o D.',
      );
    });

    it('debe aceptar valores de grupo válidos (A, B, C, D)', async () => {
      for (const valor of ['A', 'B', 'C', 'D']) {
        const dto = new UpdateInscripcionDto();
        dto.grupo = valor;

        const errors = await validate(dto);
        const grupoError = errors.find((e) => e.property === 'grupo');
        expect(grupoError).toBeUndefined();
      }
    });

    it('debe ser válido cuando grupo no se envía (campo opcional)', async () => {
      const dto = new UpdateInscripcionDto();
      // grupo no definido

      const errors = await validate(dto);
      const grupoError = errors.find((e) => e.property === 'grupo');
      expect(grupoError).toBeUndefined();
    });
  });
});
