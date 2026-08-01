import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NoticiasService } from './noticias.service';
import { Noticia } from './noticia.entity';
import { DeporteNoticia } from './enums/deporte-noticia.enum';

describe('NoticiasService', () => {
  let service: NoticiasService;
  let noticiasRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    noticiasRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticiasService,
        {
          provide: getRepositoryToken(Noticia),
          useValue: noticiasRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<NoticiasService>(NoticiasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPublicAll', () => {
    it('debe retornar noticias ordenadas por fecha de creación descendente (máximo 30)', async () => {
      const mockNoticias: Partial<Noticia>[] = [
        {
          id: 1,
          titulo: 'Noticia Reciente',
          subtitulo: 'Subtítulo',
          descripcion: 'Descripción',
          deporte: DeporteNoticia.FUTBOL,
          createdAt: new Date('2026-08-01T12:00:00Z'),
        },
        {
          id: 2,
          titulo: 'Noticia Anterior',
          subtitulo: 'Subtítulo 2',
          descripcion: 'Descripción 2',
          deporte: DeporteNoticia.BALONCESTO,
          createdAt: new Date('2026-07-31T12:00:00Z'),
        },
      ];

      noticiasRepositoryMock.find.mockResolvedValue(mockNoticias);

      const result = await service.findPublicAll();

      expect(noticiasRepositoryMock.find).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC',
        },
        take: 30,
      });

      expect(result).toHaveLength(2);
      expect(result[0].titulo).toBe('Noticia Reciente');
    });
  });
});
