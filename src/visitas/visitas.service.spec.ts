import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VisitasService, EstadisticasVisitas } from './visitas.service';
import { Visita } from './visita.entity';
import { TipoDispositivo } from './enums/tipo-dispositivo.enum';

// ── Helpers para el mock del QueryBuilder ───────────────────────────────────

/**
 * Crea un mock de QueryBuilder encadenable.
 * Cada método del builder retorna `this` para soportar la API fluida de TypeORM.
 * `getRawOne` y `getRawMany` deben configurarse por test con .mockResolvedValue().
 */
function makeQbMock() {
  const qb: Record<string, jest.Mock> = {};

  const chainable = [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'groupBy',
    'orderBy',
    'limit',
  ];

  chainable.forEach((method) => {
    qb[method] = jest.fn().mockReturnThis();
  });

  qb['getRawOne'] = jest.fn();
  qb['getRawMany'] = jest.fn();

  return qb;
}

describe('VisitasService', () => {
  let service: VisitasService;
  let repositoryMock: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let qbMock: ReturnType<typeof makeQbMock>;

  beforeEach(async () => {
    qbMock = makeQbMock();

    repositoryMock = {
      create: jest.fn((data) => ({ ...data })),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qbMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisitasService,
        {
          provide: getRepositoryToken(Visita),
          useValue: repositoryMock,
        },
      ],
    }).compile();

    service = module.get<VisitasService>(VisitasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── registrar / detectarDispositivo ───────────────────────────────────────

  describe('registrar', () => {
    it('crea y guarda una nueva visita con la ruta y dispositivo detectado', async () => {
      const ruta = '/torneos';
      repositoryMock.save.mockResolvedValue({
        id: 1,
        ruta,
        dispositivo: TipoDispositivo.ESCRITORIO,
        createdAt: new Date(),
      });

      await service.registrar(ruta);

      expect(repositoryMock.create).toHaveBeenCalledWith({
        ruta,
        dispositivo: TipoDispositivo.ESCRITORIO,
      });
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    });

    it('detecta un dispositivo móvil a partir del User-Agent de iPhone', async () => {
      const iphoneUA =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1';
      await service.registrar('/torneos', iphoneUA);

      expect(repositoryMock.create).toHaveBeenCalledWith({
        ruta: '/torneos',
        dispositivo: TipoDispositivo.MOVIL,
      });
    });

    it('detecta un dispositivo móvil a partir del User-Agent de Android', async () => {
      const androidUA =
        'Mozilla/5.0 (Linux; Android 10; SM-A505FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
      await service.registrar('/noticias', androidUA);

      expect(repositoryMock.create).toHaveBeenCalledWith({
        ruta: '/noticias',
        dispositivo: TipoDispositivo.MOVIL,
      });
    });

    it('detecta un dispositivo escritorio a partir del User-Agent de Chrome Desktop', async () => {
      const desktopUA =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      await service.registrar('/partidos', desktopUA);

      expect(repositoryMock.create).toHaveBeenCalledWith({
        ruta: '/partidos',
        dispositivo: TipoDispositivo.ESCRITORIO,
      });
    });

    it('asigna escritorio por defecto si User-Agent es vacío o undefined', async () => {
      await service.registrar('/equipos');

      expect(repositoryMock.create).toHaveBeenCalledWith({
        ruta: '/equipos',
        dispositivo: TipoDispositivo.ESCRITORIO,
      });
    });

    it('no lanza error si la BD responde correctamente', async () => {
      repositoryMock.save.mockResolvedValue({
        id: 2,
        ruta: '/noticias',
        dispositivo: TipoDispositivo.ESCRITORIO,
        createdAt: new Date(),
      });
      await expect(service.registrar('/noticias')).resolves.toBeUndefined();
    });
  });

  // ─── obtenerEstadisticas ─────────────────────────────────────────────────────

  describe('obtenerEstadisticas', () => {
    /**
     * Configura el mock de QueryBuilder para las consultas de conteo, rutas y dispositivos.
     */
    function setupQbMocks(
      conteoTotal: number,
      conteoHoy: number,
      conteo7Dias: number,
      conteo30Dias: number,
      rutasRaw: { ruta: string; cantidad: string }[],
      dispositivosRaw: { dispositivo: string; cantidad: string }[] = [],
    ) {
      qbMock['getRawOne']
        .mockResolvedValueOnce({ total: String(conteoTotal) })
        .mockResolvedValueOnce({ total: String(conteoHoy) })
        .mockResolvedValueOnce({ total: String(conteo7Dias) })
        .mockResolvedValueOnce({ total: String(conteo30Dias) });

      qbMock['getRawMany']
        .mockResolvedValueOnce(rutasRaw)
        .mockResolvedValueOnce(dispositivosRaw);
    }

    it('retorna la estructura completa de estadísticas incluyendo desglose de dispositivos', async () => {
      const rutasRaw = [
        { ruta: '/torneos', cantidad: '42' },
        { ruta: '/noticias', cantidad: '17' },
      ];
      const dispositivosRaw = [
        { dispositivo: 'movil', cantidad: '500' },
        { dispositivo: 'escritorio', cantidad: '400' },
      ];

      setupQbMocks(1500, 45, 300, 900, rutasRaw, dispositivosRaw);

      const result: EstadisticasVisitas = await service.obtenerEstadisticas();

      expect(result.totalVisitas).toBe(1500);
      expect(result.visitasHoy).toBe(45);
      expect(result.visitasUltimos7Dias).toBe(300);
      expect(result.visitasUltimos30Dias).toBe(900);

      expect(result.rutasMasVisitadas).toHaveLength(2);
      expect(result.rutasMasVisitadas[0]).toEqual({
        ruta: '/torneos',
        cantidad: 42,
      });
      expect(result.rutasMasVisitadas[1]).toEqual({
        ruta: '/noticias',
        cantidad: 17,
      });

      expect(result.dispositivos).toEqual({
        movil: 500,
        escritorio: 400,
      });
    });

    it('convierte correctamente los strings de la BD a números', async () => {
      setupQbMocks(
        0,
        0,
        0,
        0,
        [{ ruta: '/home', cantidad: '5' }],
        [{ dispositivo: 'movil', cantidad: '3' }],
      );

      const result = await service.obtenerEstadisticas();

      expect(typeof result.totalVisitas).toBe('number');
      expect(typeof result.visitasHoy).toBe('number');
      expect(typeof result.rutasMasVisitadas[0].cantidad).toBe('number');
      expect(typeof result.dispositivos.movil).toBe('number');
      expect(typeof result.dispositivos.escritorio).toBe('number');
    });

    it('retorna ceros y array vacío cuando no hay visitas', async () => {
      setupQbMocks(0, 0, 0, 0, [], []);

      const result = await service.obtenerEstadisticas();

      expect(result.totalVisitas).toBe(0);
      expect(result.visitasHoy).toBe(0);
      expect(result.visitasUltimos7Dias).toBe(0);
      expect(result.visitasUltimos30Dias).toBe(0);
      expect(result.rutasMasVisitadas).toEqual([]);
      expect(result.dispositivos).toEqual({ movil: 0, escritorio: 0 });
    });

    it('usa createQueryBuilder para cada consulta', async () => {
      setupQbMocks(10, 2, 5, 8, [], []);

      await service.obtenerEstadisticas();

      // 4 veces para los contadores + 1 para rutasMasVisitadas + 1 para dispositivos = 6 llamadas
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(6);
    });

    it('filtra las rutas por los últimos 30 días y limita a 10 resultados', async () => {
      setupQbMocks(100, 10, 50, 80, [], []);

      await service.obtenerEstadisticas();

      expect(qbMock['limit']).toHaveBeenCalledWith(10);
      expect(qbMock['groupBy']).toHaveBeenCalledWith('v.ruta');
      expect(qbMock['orderBy']).toHaveBeenCalledWith('cantidad', 'DESC');
    });
  });
});
