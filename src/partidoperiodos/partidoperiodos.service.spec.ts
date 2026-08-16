import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PartidoPeriodosService } from './partidoperiodos.service';
import { PartidoPeriodo } from './partidoperiodo.entity';
import { User } from '../users/user.entity';
import { Partido } from '../partidos/partido.entity';
import { TipoPeriodo } from './enums/tipo-periodo.enum';

describe('PartidoPeriodosService', () => {
  let service: PartidoPeriodosService;
  let partidoperiodosRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let usersRepositoryMock: {
    findOne: jest.Mock;
  };
  let partidosRepositoryMock: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    partidoperiodosRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    usersRepositoryMock = {
      findOne: jest.fn(),
    };
    partidosRepositoryMock = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartidoPeriodosService,
        {
          provide: getRepositoryToken(PartidoPeriodo),
          useValue: partidoperiodosRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepositoryMock,
        },
        {
          provide: getRepositoryToken(Partido),
          useValue: partidosRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<PartidoPeriodosService>(PartidoPeriodosService);
  });

  describe('findPublicByPartido', () => {
    it('debe retornar solo los campos públicos esperados sin relaciones de user ni partido', async () => {
      const partidoId = 1;
      const mockPeriodosPublicos = [
        {
          id: 1,
          nombrePeriodo: 'Primer Tiempo',
          tipoPeriodo: TipoPeriodo.REGULAR,
          scoreLocal: 2,
          scoreVisitante: 1,
        },
        {
          id: 2,
          nombrePeriodo: 'Segundo Tiempo',
          tipoPeriodo: TipoPeriodo.REGULAR,
          scoreLocal: 1,
          scoreVisitante: 0,
        },
      ];

      partidoperiodosRepositoryMock.find.mockResolvedValue(
        mockPeriodosPublicos,
      );

      const result = await service.findPublicByPartido(partidoId);

      expect(partidoperiodosRepositoryMock.find).toHaveBeenCalledWith({
        where: { partido: { id: partidoId } },
        select: {
          id: true,
          nombrePeriodo: true,
          tipoPeriodo: true,
          scoreLocal: true,
          scoreVisitante: true,
        },
        order: { id: 'ASC' },
      });

      expect(result).toEqual(mockPeriodosPublicos);
      result.forEach((item) => {
        expect(item).not.toHaveProperty('user');
        expect(item).not.toHaveProperty('partido');
      });
    });
  });
});
