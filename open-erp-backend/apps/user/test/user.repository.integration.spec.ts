import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserRepository } from '../src/repositories/user.repository';
import { User, UserSchema } from '../src/schemas/user.schema';

describe('UserRepository Integration Tests', () => {
  let repository: UserRepository;
  let mongod: MongoMemoryServer;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Create testing module
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UserRepository],
    }).compile();

    repository = moduleRef.get<UserRepository>(UserRepository);
  });

  afterAll(async () => {
    await moduleRef.close();
    await mongod.stop();
  });

  afterEach(async () => {
    // Clean up between tests
    const model = moduleRef.get('UserModel');
    await model.deleteMany({});
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = await repository.create(userData);

      expect(user).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.status).toBe('active');
    });

    it('should fail to create user with duplicate email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
      };

      await repository.create(userData);

      // Try to create another user with same email
      await expect(
        repository.create({
          username: 'testuser2',
          email: 'test@example.com',
        }),
      ).rejects.toThrow();
    });

    it('should fail to create user with duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test1@example.com',
      };

      await repository.create(userData);

      // Try to create another user with same username
      await expect(
        repository.create({
          username: 'testuser',
          email: 'test2@example.com',
        }),
      ).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      await repository.create({
        username: 'user1',
        email: 'user1@example.com',
      });
      await repository.create({
        username: 'user2',
        email: 'user2@example.com',
      });

      const users = await repository.findAll();

      expect(users).toHaveLength(2);
      expect(users[0].username).toBe('user1');
      expect(users[1].username).toBe('user2');
    });

    it('should exclude soft-deleted users', async () => {
      const user1 = await repository.create({
        username: 'user1',
        email: 'user1@example.com',
      });
      await repository.create({
        username: 'user2',
        email: 'user2@example.com',
      });

      // Soft delete user1
      await repository.delete(user1._id.toString());

      const users = await repository.findAll();

      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('user2');
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const created = await repository.create({
        username: 'testuser',
        email: 'test@example.com',
      });

      const user = await repository.findById(created._id.toString());

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    it('should return null for non-existent id', async () => {
      const user = await repository.findById('507f1f77bcf86cd799439011');

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      await repository.create({
        username: 'testuser',
        email: 'test@example.com',
      });

      const user = await repository.findByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await repository.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      await repository.create({
        username: 'testuser',
        email: 'test@example.com',
      });

      const user = await repository.findByUsername('testuser');

      expect(user).toBeDefined();
      expect(user?.username).toBe('testuser');
    });

    it('should return null for non-existent username', async () => {
      const user = await repository.findByUsername('nonexistent');

      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const created = await repository.create({
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
      });

      const updated = await repository.update(created._id.toString(), {
        firstName: 'Updated',
        lastName: 'User',
      });

      expect(updated).toBeDefined();
      expect(updated?.firstName).toBe('Updated');
      expect(updated?.lastName).toBe('User');
      expect(updated?.username).toBe('testuser'); // unchanged
    });

    it('should return null for non-existent id', async () => {
      const updated = await repository.update('507f1f77bcf86cd799439011', {
        firstName: 'Updated',
      });

      expect(updated).toBeNull();
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete user', async () => {
      const created = await repository.create({
        username: 'testuser',
        email: 'test@example.com',
      });

      const deleted = await repository.delete(created._id.toString());

      expect(deleted).toBeDefined();
      expect(deleted?.deletedAt).toBeDefined();
      expect(deleted?.status).toBe('inactive');

      // Verify user is excluded from normal queries
      const found = await repository.findById(created._id.toString());
      expect(found).toBeNull();
    });

    it('should return null for non-existent id', async () => {
      const deleted = await repository.delete('507f1f77bcf86cd799439011');

      expect(deleted).toBeNull();
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted user', async () => {
      const created = await repository.create({
        username: 'testuser',
        email: 'test@example.com',
      });

      // Soft delete
      await repository.delete(created._id.toString());

      // Restore
      const restored = await repository.restore(created._id.toString());

      expect(restored).toBeDefined();
      expect(restored?.deletedAt).toBeNull();
      expect(restored?.status).toBe('active');

      // Verify user is included in normal queries
      const found = await repository.findById(created._id.toString());
      expect(found).toBeDefined();
    });
  });

  describe('count', () => {
    it('should count users', async () => {
      await repository.create({
        username: 'user1',
        email: 'user1@example.com',
      });
      await repository.create({
        username: 'user2',
        email: 'user2@example.com',
      });

      const count = await repository.count();

      expect(count).toBe(2);
    });

    it('should exclude soft-deleted users from count', async () => {
      const user1 = await repository.create({
        username: 'user1',
        email: 'user1@example.com',
      });
      await repository.create({
        username: 'user2',
        email: 'user2@example.com',
      });

      await repository.delete(user1._id.toString());

      const count = await repository.count();

      expect(count).toBe(1);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const created = await repository.create({
        username: 'testuser',
        email: 'test@example.com',
      });

      expect(created.lastLoginAt).toBeNull();

      const updated = await repository.updateLastLogin(created._id.toString());

      expect(updated).toBeDefined();
      expect(updated?.lastLoginAt).toBeDefined();
      expect(updated?.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('user profile fields', () => {
    it('should create user with address', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        address: {
          street: '123 Main St',
          district: 'Downtown',
          city: 'New York',
          province: 'NY',
          postalCode: '10001',
        },
      };

      const user = await repository.create(userData);

      expect(user).toBeDefined();
      expect(user.address).toBeDefined();
      expect(user.address?.street).toBe('123 Main St');
      expect(user.address?.city).toBe('New York');
    });

    it('should create user with dateOfBirth', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        dateOfBirth: new Date('1990-01-15'),
      };

      const user = await repository.create(userData);

      expect(user).toBeDefined();
      expect(user.dateOfBirth).toBeDefined();
      expect(user.dateOfBirth).toBeInstanceOf(Date);
    });

    it('should create user with education', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        education: [
          {
            degree: 'Bachelor of Science',
            institution: 'MIT',
            year: 2015,
          },
          {
            degree: 'Master of Science',
            institution: 'Stanford',
            year: 2017,
          },
        ],
      };

      const user = await repository.create(userData);

      expect(user).toBeDefined();
      expect(user.education).toBeDefined();
      expect(user.education).toHaveLength(2);
      expect(user.education?.[0].degree).toBe('Bachelor of Science');
      expect(user.education?.[1].institution).toBe('Stanford');
    });

    it('should create user with skills and hobbies', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
        hobbies: ['Reading', 'Swimming', 'Gaming'],
      };

      const user = await repository.create(userData);

      expect(user).toBeDefined();
      expect(user.skills).toBeDefined();
      expect(user.skills).toHaveLength(3);
      expect(user.skills).toContain('JavaScript');
      expect(user.hobbies).toBeDefined();
      expect(user.hobbies).toHaveLength(3);
      expect(user.hobbies).toContain('Reading');
    });

    it('should update user profile fields', async () => {
      const created = await repository.create({
        username: 'testuser',
        email: 'test@example.com',
      });

      const updated = await repository.update(created._id.toString(), {
        address: {
          street: '456 Oak Ave',
          city: 'Boston',
          province: 'MA',
        },
        dateOfBirth: new Date('1992-05-20'),
        education: [
          {
            degree: 'PhD',
            institution: 'Harvard',
            year: 2020,
          },
        ],
        skills: ['Python', 'Django', 'React'],
        hobbies: ['Hiking', 'Photography'],
      });

      expect(updated).toBeDefined();
      expect(updated?.address?.street).toBe('456 Oak Ave');
      expect(updated?.address?.city).toBe('Boston');
      expect(updated?.dateOfBirth).toBeInstanceOf(Date);
      expect(updated?.education).toHaveLength(1);
      expect(updated?.education?.[0].degree).toBe('PhD');
      expect(updated?.skills).toHaveLength(3);
      expect(updated?.skills).toContain('Python');
      expect(updated?.hobbies).toHaveLength(2);
      expect(updated?.hobbies).toContain('Hiking');
    });
  });
});
