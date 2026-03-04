import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrganizationMembershipService } from '../../src/services/organization-membership.service';
import { UserRepository } from '../../src/repositories/user.repository';
import { OrganizationMemberRepository } from '../../src/repositories/organization-member.repository';
import { RABBITMQ_NOTIFICATION_CLIENT } from '@shared/rabbitmq';
import { MemberRole, MemberStatus } from '@shared/schemas';

describe('OrganizationMembershipService', () => {
  let service: OrganizationMembershipService;
  let userRepository: jest.Mocked<UserRepository>;
  let organizationMemberRepository: jest.Mocked<OrganizationMemberRepository>;
  let notificationClient: jest.Mocked<any>;

  const mockUser = {
    _id: { toString: () => 'user123' },
    username: 'testuser',
    email: 'test@example.com',
    status: 'active',
  };

  const mockMembership = {
    _id: { toString: () => 'membership123' },
    userId: 'user123',
    organizationId: 'org123',
    role: MemberRole.MEMBER,
    status: MemberStatus.ACTIVE,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
    };

    const mockOrganizationMemberRepository = {
      findByUserAndOrganization: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      listOrganizationMembers: jest.fn(),
    };

    const mockNotificationClient = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationMembershipService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: OrganizationMemberRepository,
          useValue: mockOrganizationMemberRepository,
        },
        {
          provide: RABBITMQ_NOTIFICATION_CLIENT,
          useValue: mockNotificationClient,
        },
      ],
    }).compile();

    service = module.get<OrganizationMembershipService>(
      OrganizationMembershipService,
    );
    userRepository = module.get(UserRepository);
    organizationMemberRepository = module.get(OrganizationMemberRepository);
    notificationClient = module.get(RABBITMQ_NOTIFICATION_CLIENT);
  });

  describe('inviteMember', () => {
    it('should invite existing user by email', async () => {
      const inviteDto = {
        identifier: 'test@example.com',
        role: MemberRole.MEMBER,
        sendInviteEmail: true,
      };

      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        null,
      );
      organizationMemberRepository.create.mockResolvedValue(
        mockMembership as any,
      );

      const result = await service.inviteMember(
        'org123',
        inviteDto,
        'inviter123',
      );

      expect(result).toEqual(mockMembership);
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(organizationMemberRepository.create).toHaveBeenCalled();
      expect(notificationClient.emit).toHaveBeenCalledWith(
        'organization.member.invited',
        expect.any(Object),
      );
    });

    it('should invite existing user by username', async () => {
      const inviteDto = {
        identifier: 'testuser',
        role: MemberRole.ADMIN,
        sendInviteEmail: false,
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(mockUser as any);
      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        null,
      );
      organizationMemberRepository.create.mockResolvedValue(
        mockMembership as any,
      );

      const result = await service.inviteMember(
        'org123',
        inviteDto,
        'inviter123',
      );

      expect(result).toEqual(mockMembership);
      expect(userRepository.findByUsername).toHaveBeenCalledWith('testuser');
      expect(notificationClient.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already member', async () => {
      const inviteDto = {
        identifier: 'test@example.com',
        role: MemberRole.MEMBER,
      };

      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        mockMembership as any,
      );

      await expect(
        service.inviteMember('org123', inviteDto, 'inviter123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reactivate revoked membership', async () => {
      const inviteDto = {
        identifier: 'test@example.com',
        role: MemberRole.MEMBER,
      };

      const revokedMembership = {
        ...mockMembership,
        status: MemberStatus.REVOKED,
      };

      userRepository.findByEmail.mockResolvedValue(mockUser as any);
      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        revokedMembership as any,
      );
      organizationMemberRepository.update.mockResolvedValue(
        mockMembership as any,
      );

      const result = await service.inviteMember(
        'org123',
        inviteDto,
        'inviter123',
      );

      expect(organizationMemberRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user not found with username', async () => {
      const inviteDto = {
        identifier: 'nonexistentuser',
        role: MemberRole.MEMBER,
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(null);

      await expect(
        service.inviteMember('org123', inviteDto, 'inviter123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listOrganizationMembers', () => {
    it('should list organization members with filters', async () => {
      const query = {
        role: MemberRole.ADMIN,
        status: MemberStatus.ACTIVE,
        page: 1,
        size: 10,
      };

      const mockResult = {
        members: [mockMembership],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      organizationMemberRepository.listOrganizationMembers.mockResolvedValue(
        mockResult as any,
      );

      const result = await service.listOrganizationMembers('org123', query);

      expect(result).toEqual(mockResult);
      expect(
        organizationMemberRepository.listOrganizationMembers,
      ).toHaveBeenCalledWith({
        organizationId: 'org123',
        role: MemberRole.ADMIN,
        status: MemberStatus.ACTIVE,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('updateMembership', () => {
    it('should update membership role', async () => {
      const updateDto = {
        role: MemberRole.ADMIN,
      };

      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        mockMembership as any,
      );
      organizationMemberRepository.update.mockResolvedValue({
        ...mockMembership,
        role: MemberRole.ADMIN,
      } as any);

      const result = await service.updateMembership(
        'org123',
        'user123',
        updateDto,
        'updater123',
      );

      expect(organizationMemberRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if membership not found', async () => {
      const updateDto = { role: MemberRole.ADMIN };

      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        null,
      );

      await expect(
        service.updateMembership('org123', 'user123', updateDto, 'updater123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent removing last owner', async () => {
      const updateDto = { role: MemberRole.MEMBER };
      const ownerMembership = {
        ...mockMembership,
        role: MemberRole.OWNER,
      };

      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        ownerMembership as any,
      );
      organizationMemberRepository.listOrganizationMembers.mockResolvedValue({
        members: [ownerMembership],
        total: 1,
        page: 1,
        totalPages: 1,
      } as any);

      await expect(
        service.updateMembership('org123', 'user123', updateDto, 'updater123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        mockMembership as any,
      );
      organizationMemberRepository.delete.mockResolvedValue(
        mockMembership as any,
      );
      organizationMemberRepository.listOrganizationMembers.mockResolvedValue({
        members: [mockMembership, mockMembership],
        total: 2,
        page: 1,
        totalPages: 1,
      } as any);

      await service.removeMember('org123', 'user123', 'remover123');

      expect(organizationMemberRepository.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if membership not found', async () => {
      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        null,
      );

      await expect(
        service.removeMember('org123', 'user123', 'remover123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent removing last owner', async () => {
      const ownerMembership = {
        ...mockMembership,
        role: MemberRole.OWNER,
      };

      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        ownerMembership as any,
      );
      organizationMemberRepository.listOrganizationMembers.mockResolvedValue({
        members: [ownerMembership],
        total: 1,
        page: 1,
        totalPages: 1,
      } as any);

      await expect(
        service.removeMember('org123', 'user123', 'remover123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMembershipDetails', () => {
    it('should return membership details', async () => {
      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        mockMembership as any,
      );

      const result = await service.getMembershipDetails('org123', 'user123');

      expect(result).toEqual(mockMembership);
    });

    it('should throw NotFoundException if membership not found', async () => {
      organizationMemberRepository.findByUserAndOrganization.mockResolvedValue(
        null,
      );

      await expect(
        service.getMembershipDetails('org123', 'user123'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
