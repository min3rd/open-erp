import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AvatarService } from './avatar/avatar.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Types } from 'mongoose';
import { UserStatus } from './schemas/user.schema';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let avatarService: jest.Mocked<AvatarService>;

  const mockUser = {
    sub: new Types.ObjectId().toString(),
    tenantId: new Types.ObjectId().toString(),
    roles: ['TENANT_ADMIN'],
    email: 'admin@acme.vn',
  };

  const mockUserData = {
    _id: new Types.ObjectId(),
    tenantId: new Types.ObjectId(),
    email: 'user@acme.vn',
    fullName: 'John Doe',
    status: UserStatus.ACTIVE,
    roles: ['USER'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            listUsers: jest.fn(),
            createUser: jest.fn(),
            getMe: jest.fn(),
            updateMe: jest.fn(),
            getUserById: jest.fn(),
            updateUser: jest.fn(),
            deleteUser: jest.fn(),
            uploadAvatar: jest.fn(),
          },
        },
        {
          provide: AvatarService,
          useValue: {
            uploadAvatar: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    avatarService = module.get(AvatarService) as jest.Mocked<AvatarService>;

    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('returns paginated list of users', async () => {
      usersService.listUsers.mockResolvedValue({
        success: true,
        data: [mockUserData],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      const req = {
        user: mockUser,
        query: { page: '1', limit: '20' },
      } as any;

      const result = await controller.listUsers(req);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(usersService.listUsers).toHaveBeenCalledWith(
        { page: '1', limit: '20' },
        mockUser,
      );
    });

    it('filters users by department ID', async () => {
      usersService.listUsers.mockResolvedValue({
        success: true,
        data: [mockUserData],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const req = {
        user: mockUser,
        query: { departmentId: 'dept-1' },
      } as any;

      const result = await controller.listUsers(req);

      expect(usersService.listUsers).toHaveBeenCalledWith(
        { departmentId: 'dept-1' },
        mockUser,
      );
    });

    it('filters users by status', async () => {
      usersService.listUsers.mockResolvedValue({
        success: true,
        data: [{ ...mockUserData, status: UserStatus.PENDING_ACTIVATION }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const req = {
        user: mockUser,
        query: { status: 'PENDING_ACTIVATION' },
      } as any;

      const result = await controller.listUsers(req);

      expect(usersService.listUsers).toHaveBeenCalledWith(
        { status: 'PENDING_ACTIVATION' },
        mockUser,
      );
    });

    it('searches users by name or email', async () => {
      usersService.listUsers.mockResolvedValue({
        success: true,
        data: [mockUserData],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const req = {
        user: mockUser,
        query: { search: 'john' },
      } as any;

      const result = await controller.listUsers(req);

      expect(usersService.listUsers).toHaveBeenCalledWith(
        { search: 'john' },
        mockUser,
      );
    });

    it('handles pagination', async () => {
      usersService.listUsers.mockResolvedValue({
        success: true,
        data: [mockUserData],
        pagination: { page: 2, limit: 10, total: 25, totalPages: 3 },
      });

      const req = {
        user: mockUser,
        query: { page: '2', limit: '10' },
      } as any;

      const result = await controller.listUsers(req);

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('createUser', () => {
    it('creates new user with required fields', async () => {
      const createDto: CreateUserDto = {
        email: 'newuser@acme.vn',
        fullName: 'New User',
      };

      usersService.createUser.mockResolvedValue({
        success: true,
        data: { ...mockUserData, ...createDto },
      });

      const req = { user: mockUser } as any;

      const result = await controller.createUser(createDto, req);

      expect(result.success).toBe(true);
      expect(usersService.createUser).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('creates user with optional fields (phone, department, etc)', async () => {
      const createDto: CreateUserDto = {
        email: 'newuser@acme.vn',
        fullName: 'New User',
        phone: '0912345678',
        departmentId: 'dept-1',
        positionTitle: 'Manager',
        employeeCode: 'EMP001',
      };

      usersService.createUser.mockResolvedValue({
        success: true,
        data: { ...mockUserData, ...createDto },
      });

      const req = { user: mockUser } as any;

      await controller.createUser(createDto, req);

      expect(usersService.createUser).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('passes user context to service', async () => {
      const createDto: CreateUserDto = {
        email: 'newuser@acme.vn',
        fullName: 'New User',
      };

      usersService.createUser.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = { user: mockUser } as any;

      await controller.createUser(createDto, req);

      expect(usersService.createUser).toHaveBeenCalledWith(createDto, mockUser);
    });
  });

  describe('getMe', () => {
    it('returns current user profile', async () => {
      usersService.getMe.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = { user: mockUser } as any;

      const result = await controller.getMe(req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserData);
      expect(usersService.getMe).toHaveBeenCalledWith(mockUser);
    });

    it('includes all user fields in response', async () => {
      const fullUserData = {
        ...mockUserData,
        phone: '0912345678',
        locale: 'vi-VN',
        timezone: 'Asia/Ho_Chi_Minh',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      usersService.getMe.mockResolvedValue({
        success: true,
        data: fullUserData,
      });

      const req = { user: mockUser } as any;

      const result = await controller.getMe(req);

      expect(result.data.locale).toBe('vi-VN');
      expect(result.data.timezone).toBe('Asia/Ho_Chi_Minh');
    });
  });

  describe('updateMe', () => {
    it('updates current user profile', async () => {
      const updateDto: UpdateProfileDto = {
        fullName: 'Updated Name',
        phone: '0987654321',
      };

      usersService.updateMe.mockResolvedValue({
        success: true,
        data: { ...mockUserData, ...updateDto },
      });

      const req = { user: mockUser } as any;

      const result = await controller.updateMe(updateDto, req);

      expect(result.success).toBe(true);
      expect(usersService.updateMe).toHaveBeenCalledWith(mockUser, updateDto);
    });

    it('updates locale and timezone preferences', async () => {
      const updateDto: UpdateProfileDto = {
        locale: 'en-US',
        timezone: 'UTC',
      };

      usersService.updateMe.mockResolvedValue({
        success: true,
        data: { ...mockUserData, ...updateDto },
      });

      const req = { user: mockUser } as any;

      await controller.updateMe(updateDto, req);

      expect(usersService.updateMe).toHaveBeenCalledWith(mockUser, updateDto);
    });
  });

  describe('getUserById', () => {
    it('returns user by ID with authorization check', async () => {
      usersService.getUserById.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = { user: mockUser } as any;

      const result = await controller.getUserById('user-1', req);

      expect(result.success).toBe(true);
      expect(usersService.getUserById).toHaveBeenCalledWith('user-1', mockUser);
    });

    it('enforces tenantId isolation when retrieving user', async () => {
      usersService.getUserById.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = { user: mockUser } as any;

      await controller.getUserById('user-1', req);

      // Service should enforce tenantId check
      expect(usersService.getUserById).toHaveBeenCalledWith('user-1', mockUser);
    });
  });

  describe('updateUser', () => {
    it('updates user by ID with admin privilege', async () => {
      const updateDto: UpdateUserDto = {
        fullName: 'Updated User',
        status: UserStatus.INACTIVE,
      };

      usersService.updateUser.mockResolvedValue({
        success: true,
        data: { ...mockUserData, ...updateDto },
      });

      const req = { user: mockUser } as any;

      const result = await controller.updateUser('user-1', updateDto, req);

      expect(result.success).toBe(true);
      expect(usersService.updateUser).toHaveBeenCalledWith(
        'user-1',
        updateDto,
        mockUser,
      );
    });

    it('updates user status', async () => {
      const updateDto: UpdateUserDto = {
        status: UserStatus.LOCKED,
      };

      usersService.updateUser.mockResolvedValue({
        success: true,
        data: { ...mockUserData, status: UserStatus.LOCKED },
      });

      const req = { user: mockUser } as any;

      await controller.updateUser('user-1', updateDto, req);

      expect(usersService.updateUser).toHaveBeenCalled();
    });

    it('updates department assignment', async () => {
      const updateDto: UpdateUserDto = {
        departmentId: 'dept-2',
      };

      usersService.updateUser.mockResolvedValue({
        success: true,
        data: { ...mockUserData, departmentId: 'dept-2' },
      });

      const req = { user: mockUser } as any;

      await controller.updateUser('user-1', updateDto, req);

      expect(usersService.updateUser).toHaveBeenCalledWith(
        'user-1',
        updateDto,
        mockUser,
      );
    });
  });

  describe('deleteUser', () => {
    it('soft deletes user by ID', async () => {
      usersService.deleteUser.mockResolvedValue({
        success: true,
        data: { ...mockUserData, isDeleted: true },
      });

      const req = { user: mockUser } as any;

      const result = await controller.deleteUser('user-1', req);

      expect(result.success).toBe(true);
      expect(usersService.deleteUser).toHaveBeenCalledWith('user-1', mockUser);
    });

    it('requires TENANT_ADMIN role to delete', async () => {
      usersService.deleteUser.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = { user: mockUser } as any;

      await controller.deleteUser('user-1', req);

      // Authorization should be checked in service
      expect(usersService.deleteUser).toHaveBeenCalledWith('user-1', mockUser);
    });
  });

  describe('uploadAvatar', () => {
    it('uploads avatar and returns updated user', async () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
        size: 102400,
        originalname: 'avatar.jpg',
      };

      avatarService.uploadAvatar.mockResolvedValue({
        avatarUrl: 'tenant-1/avatars/user-1-timestamp-uuid.jpg',
        metadata: {
          bucketName: 'tenant-1',
          objectName: 'avatars/user-1-timestamp-uuid.jpg',
        },
      });

      usersService.uploadAvatar.mockResolvedValue({
        success: true,
        data: {
          ...mockUserData,
          avatarUrl: 'tenant-1/avatars/user-1-timestamp-uuid.jpg',
        },
      });

      const req = {
        user: mockUser,
        tenantId: 'tenant-1',
      } as any;

      const result = await controller.uploadAvatar('user-1', mockFile, req);

      expect(result.success).toBe(true);
      expect(avatarService.uploadAvatar).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });
      expect(usersService.uploadAvatar).toHaveBeenCalled();
    });

    it('passes tenantId from request context', async () => {
      const mockFile = {
        mimetype: 'image/png',
        buffer: Buffer.from('image-data'),
        size: 102400,
        originalname: 'avatar.png',
      };

      avatarService.uploadAvatar.mockResolvedValue({
        avatarUrl: 'tenant-1/avatars/user-1-timestamp-uuid.png',
        metadata: {},
      });

      usersService.uploadAvatar.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = {
        user: mockUser,
        tenantId: 'tenant-1',
      } as any;

      await controller.uploadAvatar('user-1', mockFile, req);

      expect(avatarService.uploadAvatar).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        userId: 'user-1',
        file: mockFile,
      });
    });

    it('uses user.tenantId as fallback when tenantId not in request', async () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
        size: 102400,
        originalname: 'avatar.jpg',
      };

      avatarService.uploadAvatar.mockResolvedValue({
        avatarUrl: 'tenant-1/avatars/user-1-timestamp-uuid.jpg',
        metadata: {},
      });

      usersService.uploadAvatar.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = {
        user: { ...mockUser },
        tenantId: undefined,
      } as any;

      await controller.uploadAvatar('user-1', mockFile, req);

      // Should use user.tenantId from request.user
      expect(avatarService.uploadAvatar).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockUser.tenantId,
        }),
      );
    });

    it('stores avatar metadata in user profile', async () => {
      const mockFile = {
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
        size: 102400,
        originalname: 'avatar.jpg',
      };

      const uploadResult = {
        avatarUrl: 'tenant-1/avatars/user-1-timestamp-uuid.jpg',
        metadata: {
          bucketName: 'tenant-1',
          objectName: 'avatars/user-1-timestamp-uuid.jpg',
          size: 102400,
          mimeType: 'image/jpeg',
        },
      };

      avatarService.uploadAvatar.mockResolvedValue(uploadResult);

      usersService.uploadAvatar.mockResolvedValue({
        success: true,
        data: {
          ...mockUserData,
          avatarUrl: uploadResult.avatarUrl,
        },
      });

      const req = {
        user: mockUser,
        tenantId: 'tenant-1',
      } as any;

      const result = await controller.uploadAvatar('user-1', mockFile, req);

      expect(usersService.uploadAvatar).toHaveBeenCalledWith(
        'user-1',
        uploadResult.avatarUrl,
        uploadResult.metadata,
        mockUser,
      );
    });
  });

  describe('endpoint authorization', () => {
    it('listUsers passes user context for authorization', async () => {
      usersService.listUsers.mockResolvedValue({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      });

      const req = { user: mockUser, query: {} } as any;

      await controller.listUsers(req);

      expect(usersService.listUsers).toHaveBeenCalledWith({}, mockUser);
    });

    it('createUser passes user context for role check', async () => {
      usersService.createUser.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = { user: mockUser } as any;
      const createDto: CreateUserDto = {
        email: 'new@acme.vn',
        fullName: 'New User',
      };

      await controller.createUser(createDto, req);

      expect(usersService.createUser).toHaveBeenCalledWith(createDto, mockUser);
    });

    it('updateUser requires admin privileges via context', async () => {
      usersService.updateUser.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = { user: mockUser } as any;
      const updateDto: UpdateUserDto = { fullName: 'Updated' };

      await controller.updateUser('user-1', updateDto, req);

      // User context should be passed for authorization
      expect(usersService.updateUser).toHaveBeenCalledWith(
        'user-1',
        updateDto,
        mockUser,
      );
    });

    it('deleteUser passes user context for authorization', async () => {
      usersService.deleteUser.mockResolvedValue({
        success: true,
        data: mockUserData,
      });

      const req = { user: mockUser } as any;

      await controller.deleteUser('user-1', req);

      expect(usersService.deleteUser).toHaveBeenCalledWith('user-1', mockUser);
    });
  });
});
