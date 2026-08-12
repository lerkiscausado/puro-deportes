import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VisitasService, EstadisticasVisitas } from './visitas.service';
import { Visita } from './visita.entity';

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

  // ─── registrar ───────────────────────────────────────────────────────────────

  describe('registrar', () => {
    it('crea y guarda una nueva visita con la ruta indicada', async () => {
      const ruta = '/torneos';
      repositoryMock.save.mockResolvedValue({ id: 1, ruta, createdAt: new Date() });

      await service.registrar(ruta);

      expect(repositoryMock.create).toHaveBeenCalledWith({ ruta });
      expect(repositoryMock.save).toHaveBeenCalledTimes(1);
      // Verifica que save recibió el objeto creado por create()
      expect(repositoryMock.save).toHaveBeenCalledWith({ ruta });
    });

    it('no lanza error si la BD responde correctamente', async () => {
      repositoryMock.save.mockResolvedValue({ id: 2, ruta: '/noticias', createdAt: new Date() });
      await expect(service.registrar('/noticias')).resolves.toBeUndefined();
    });
  });

  // ─── obtenerEstadisticas ─────────────────────────────────────────────────────

  describe('obtenerEstadisticas', () => {
    /**
     * Configura el mock de QueryBuilder para que todas las consultas de conteo
     * devuelvan el valor indicado y getRawMany devuelva el array de rutas.
     */
    function setupQbMocks(
      conteoTotal: number,
      conteoHoy: number,
      conteo7Dias: number,
      conteo30Dias: number,
      rutasRaw: { ruta: string; cantidad: string }[],
    ) {
      // getRawOne se llama 4 veces (total, hoy, 7d, 30d).
      // Cada llamada sucesiva al qb.getRawOne devuelve el siguiente valor.
      qbMock['getRawOne']
        .mockResolvedValueOnce({ total: String(conteoTotal) })
        .mockResolvedValueOnce({ total: String(conteoHoy) })
        .mockResolvedValueOnce({ total: String(conteo7Dias) })
        .mockResolvedValueOnce({ total: String(conteo30Dias) });

      qbMock['getRawMany'].mockResolvedValue(rutasRaw);
    }

    it('retorna la estructura completa de estadísticas con los valores correctos', async () => {
      const rutasRaw = [
        { ruta: '/torneos', cantidad: '42' },
        { ruta: '/noticias', cantidad: '17' },
      ];

      setupQbMocks(1500, 45, 300, 900, rutasRaw);

      const result: EstadisticasVisitas = await service.obtenerEstadisticas();

      expect(result.totalVisitas).toBe(1500);
      expect(result.visitasHoy).toBe(45);
      expect(result.visitasUltimos7Dias).toBe(300);
      expect(result.visitasUltimos30Dias).toBe(900);

      expect(result.rutasMasVisitadas).toHaveLength(2);
      expect(result.rutasMasVisitadas[0]).toEqual({ ruta: '/torneos', cantidad: 42 });
      expect(result.rutasMasVisitadas[1]).toEqual({ ruta: '/noticias', cantidad: 17 });
    });

    it('convierte correctamente los strings de la BD a números', async () => {
      setupQbMocks(0, 0, 0, 0, [{ ruta: '/home', cantidad: '5' }]);

      const result = await service.obtenerEstadisticas();

      // Verifica que parseInt se aplicó correctamente
      expect(typeof result.totalVisitas).toBe('number');
      expect(typeof result.visitasHoy).toBe('number');
      expect(typeof result.rutasMasVisitadas[0].cantidad).toBe('number');
    });

    it('retorna ceros y array vacío cuando no hay visitas', async () => {
      setupQbMocks(0, 0, 0, 0, []);

      const result = await service.obtenerEstadisticas();

      expect(result.totalVisitas).toBe(0);
      expect(result.visitasHoy).toBe(0);
      expect(result.visitasUltimos7Dias).toBe(0);
      expect(result.visitasUltimos30Dias).toBe(0);
      expect(result.rutasMasVisitadas).toEqual([]);
    });

    it('usa createQueryBuilder para cada consulta', async () => {
      setupQbMocks(10, 2, 5, 8, []);

      await service.obtenerEstadisticas();

      // 4 veces para los contadores + 1 para rutasMasVisitadas = 5 llamadas
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledTimes(5);
    });

    it('filtra las rutas por los últimos 30 días y limita a 10 resultados', async () => {
      setupQbMocks(100, 10, 50, 80, []);

      await service.obtenerEstadisticas();

      expect(qbMock['limit']).toHaveBeenCalledWith(10);
      expect(qbMock['groupBy']).toHaveBeenCalledWith('v.ruta');
      expect(qbMock['orderBy']).toHaveBeenCalledWith('cantidad', 'DESC');
    });
  });
});
