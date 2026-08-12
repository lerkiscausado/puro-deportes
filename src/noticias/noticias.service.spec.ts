import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NoticiasService } from './noticias.service';
import { Noticia } from './noticia.entity';
import { DeporteNoticia } from './enums/deporte-noticia.enum';
import { CreateNoticiaDto } from './dto/create-noticia.dto';

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
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('genera un slug correcto a partir del título con acentos y caracteres especiales', async () => {
      const dto: CreateNoticiaDto = {
        titulo: '¡Victoria épica! Equipo A vs. Equipo B',
        subtitulo: 'Subtítulo del partido',
        descripcion: 'Detalles de la victoria del equipo A',
        deporte: DeporteNoticia.FUTBOL,
      };

      noticiasRepositoryMock.findOne.mockResolvedValue(null);

      const result = await service.create(dto);

      expect(noticiasRepositoryMock.create).toHaveBeenCalledWith({
        ...dto,
        slug: 'victoria-epica-equipo-a-vs-equipo-b',
        foto: null,
      });
      expect(result.slug).toBe('victoria-epica-equipo-a-vs-equipo-b');
    });

    it('agrega el sufijo -2 cuando el slug generado ya existe', async () => {
      const dto: CreateNoticiaDto = {
        titulo: 'Noticia Repetida',
        subtitulo: 'Subtítulo',
        descripcion: 'Descripción',
        deporte: DeporteNoticia.FUTBOL,
      };

      // Primera llamada a findOne busca 'noticia-repetida' y retorna una noticia existente.
      // Segunda llamada busca 'noticia-repetida-2' y retorna null (libre).
      noticiasRepositoryMock.findOne
        .mockResolvedValueOnce({ id: 10, slug: 'noticia-repetida' })
        .mockResolvedValueOnce(null);

      const result = await service.create(dto);

      expect(result.slug).toBe('noticia-repetida-2');
      expect(noticiasRepositoryMock.findOne).toHaveBeenCalledTimes(2);
    });
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
          slug: 'noticia-reciente',
          createdAt: new Date('2026-08-01T12:00:00Z'),
        },
        {
          id: 2,
          titulo: 'Noticia Anterior',
          subtitulo: 'Subtítulo 2',
          descripcion: 'Descripción 2',
          deporte: DeporteNoticia.BALONCESTO,
          slug: 'noticia-anterior',
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

  describe('findPublicBySlug', () => {
    it('retorna la noticia correspondiente cuando el slug existe', async () => {
      const mockNoticia: Partial<Noticia> = {
        id: 1,
        titulo: 'Noticia Encontrada',
        slug: 'noticia-encontrada',
        subtitulo: 'Subtítulo',
        descripcion: 'Descripción',
        deporte: DeporteNoticia.FUTBOL,
      };

      noticiasRepositoryMock.findOne.mockResolvedValue(mockNoticia);

      const result = await service.findPublicBySlug('noticia-encontrada');

      expect(noticiasRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { slug: 'noticia-encontrada' },
      });
      expect(result).toEqual(mockNoticia);
    });

    it('lanza NotFoundException si la noticia con ese slug no existe', async () => {
      noticiasRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.findPublicBySlug('slug-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
