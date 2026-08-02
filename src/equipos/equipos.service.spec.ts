import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EquiposService } from './equipos.service';
import { Equipo } from './equipo.entity';
import { User } from '../users/user.entity';
import { DeporteEquipo } from './enums/deporte.enum';
import { CreateEquipoDto } from './dto/create-equipo.dto';

describe('EquiposService', () => {
  let service: EquiposService;
  let equiposRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let usersRepositoryMock: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    equiposRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    usersRepositoryMock = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquiposService,
        {
          provide: getRepositoryToken(Equipo),
          useValue: equiposRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<EquiposService>(EquiposService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateEquipoDto = {
      nombre: 'Los Halcones',
      representante: 'Carlos Pérez',
      deporte: DeporteEquipo.FUTBOL,
    };
    const mockUser = { id: 10, name: 'Carlos' } as User;

    it('debe usar file.filename para el campo foto cuando se provee un archivo', async () => {
      const mockFile = { filename: 'foto-123456.png' } as Express.Multer.File;
      const createdEquipo = { id: 1, ...dto, foto: 'foto-123456.png', user: mockUser } as Equipo;

      usersRepositoryMock.findOne.mockResolvedValue(mockUser);
      equiposRepositoryMock.create.mockReturnValue(createdEquipo);
      equiposRepositoryMock.save.mockResolvedValue(createdEquipo);
      equiposRepositoryMock.findOne.mockResolvedValue(createdEquipo);

      const result = await service.create(dto, 10, mockFile);

      expect(usersRepositoryMock.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(equiposRepositoryMock.create).toHaveBeenCalledWith({
        ...dto,
        foto: 'foto-123456.png',
        user: mockUser,
      });
      expect(result.foto).toBe('foto-123456.png');
    });

    it('debe usar createEquipoDto.foto cuando no se suministra un archivo', async () => {
      const dtoWithFoto: CreateEquipoDto = { ...dto, foto: 'escudo-manual.png' };
      const createdEquipo = { id: 2, ...dtoWithFoto, user: mockUser } as Equipo;

      usersRepositoryMock.findOne.mockResolvedValue(mockUser);
      equiposRepositoryMock.create.mockReturnValue(createdEquipo);
      equiposRepositoryMock.save.mockResolvedValue(createdEquipo);
      equiposRepositoryMock.findOne.mockResolvedValue(createdEquipo);

      const result = await service.create(dtoWithFoto, 10);

      expect(equiposRepositoryMock.create).toHaveBeenCalledWith({
        ...dtoWithFoto,
        foto: 'escudo-manual.png',
        user: mockUser,
      });
      expect(result.foto).toBe('escudo-manual.png');
    });
  });
});
