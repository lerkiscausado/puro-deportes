import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import { EquiposService } from './equipos.service';
import { Equipo } from './equipo.entity';
import { User } from '../users/user.entity';
import { DeporteEquipo } from './enums/deporte.enum';
import { CreateEquipoDto } from './dto/create-equipo.dto';
import { UpdateEquipoDto } from './dto/update-equipo.dto';
import { Role } from '../users/enums/role.enum';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('EquiposService', () => {
  let service: EquiposService;
  let equiposRepositoryMock: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
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
      merge: jest.fn((entity, dto) => Object.assign({}, entity, dto)),
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

  afterEach(() => {
    jest.clearAllMocks();
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

  describe('update', () => {
    const mockUser = { id: 10, name: 'Carlos' } as User;
    const existingEquipo: Equipo = {
      id: 1,
      nombre: 'Los Halcones',
      representante: 'Carlos Pérez',
      deporte: DeporteEquipo.FUTBOL,
      foto: 'foto-antigua.png',
      user: mockUser,
    } as Equipo;

    it('caso 1: actualizar sin archivo nuevo conserva la foto actual del equipo', async () => {
      const updateDto: UpdateEquipoDto = { nombre: 'Los Halcones FC' };
      const updatedEquipo = { ...existingEquipo, nombre: 'Los Halcones FC' };

      equiposRepositoryMock.findOne.mockResolvedValue(existingEquipo);
      equiposRepositoryMock.save.mockResolvedValue(updatedEquipo);

      await service.update(1, updateDto, 10, Role.USER);

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(equiposRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          foto: 'foto-antigua.png',
          nombre: 'Los Halcones FC',
        }),
      );
    });

    it('caso 2: actualizar con archivo nuevo reemplaza la foto y elimina el archivo anterior del disco', async () => {
      const updateDto: UpdateEquipoDto = { nombre: 'Los Halcones FC' };
      const mockFile = { filename: 'foto-nueva.png' } as Express.Multer.File;

      equiposRepositoryMock.findOne.mockResolvedValue(existingEquipo);
      equiposRepositoryMock.save.mockResolvedValue({
        ...existingEquipo,
        nombre: 'Los Halcones FC',
        foto: 'foto-nueva.png',
      });

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.update(1, updateDto, 10, Role.USER, mockFile);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.unlinkSync).toHaveBeenCalled();
      expect(equiposRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          foto: 'foto-nueva.png',
        }),
      );
    });

    it('caso 3: actualizar sin foto previa + archivo nuevo asigna la foto nueva sin intentar borrar nada', async () => {
      const equipoSinFoto: Equipo = {
        ...existingEquipo,
        foto: null as any,
      };
      const updateDto: UpdateEquipoDto = { nombre: 'Los Halcones FC' };
      const mockFile = { filename: 'primer-escudo.png' } as Express.Multer.File;

      equiposRepositoryMock.findOne.mockResolvedValue(equipoSinFoto);
      equiposRepositoryMock.save.mockResolvedValue({
        ...equipoSinFoto,
        foto: 'primer-escudo.png',
      });

      await service.update(1, updateDto, 10, Role.USER, mockFile);

      expect(fs.existsSync).not.toHaveBeenCalled();
      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(equiposRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          foto: 'primer-escudo.png',
        }),
      );
    });
  });
});
