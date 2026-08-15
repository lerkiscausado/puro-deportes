import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TiposEstadisticaService } from './tipos-estadistica.service';
import { TipoEstadistica } from './tipo-estadistica.entity';
import { Deporte } from '../torneos/enums/deporte.enum';

describe('TiposEstadisticaService', () => {
  let service: TiposEstadisticaService;
  let tipoEstadisticaRepoMock: { find: jest.Mock };

  beforeEach(async () => {
    tipoEstadisticaRepoMock = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiposEstadisticaService,
        {
          provide: getRepositoryToken(TipoEstadistica),
          useValue: tipoEstadisticaRepoMock,
        },
      ],
    }).compile();

    service = module.get<TiposEstadisticaService>(TiposEstadisticaService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('findByDeporte retorna tipos de estadística ordenados por id ASC', async () => {
    const mockList = [
      { id: 1, deporte: Deporte.FUTBOL, nombre: 'Gol', puntos: 1 },
      { id: 2, deporte: Deporte.FUTBOL, nombre: 'Asistencia', puntos: 1 },
    ];
    tipoEstadisticaRepoMock.find.mockResolvedValue(mockList);

    const res = await service.findByDeporte(Deporte.FUTBOL);

    expect(tipoEstadisticaRepoMock.find).toHaveBeenCalledWith({
      where: { deporte: Deporte.FUTBOL },
      order: { id: 'ASC' },
    });
    expect(res).toEqual(mockList);
  });
});
