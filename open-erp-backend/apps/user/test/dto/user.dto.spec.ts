import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateUserDto, CreateUserDto, AddressDto, EducationDto } from '../../src/dto/user.dto';

describe('User DTO Validation', () => {
  describe('AddressDto', () => {
    it('should validate valid address', async () => {
      const address = plainToClass(AddressDto, {
        street: '123 Main St',
        district: 'Downtown',
        city: 'New York',
        province: 'NY',
        postalCode: '10001',
      });

      const errors = await validate(address);
      expect(errors).toHaveLength(0);
    });

    it('should accept partial address', async () => {
      const address = plainToClass(AddressDto, {
        city: 'New York',
        province: 'NY',
      });

      const errors = await validate(address);
      expect(errors).toHaveLength(0);
    });

    it('should fail for too long fields', async () => {
      const address = plainToClass(AddressDto, {
        street: 'a'.repeat(201),
      });

      const errors = await validate(address);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('EducationDto', () => {
    it('should validate valid education', async () => {
      const education = plainToClass(EducationDto, {
        degree: 'Bachelor of Science',
        institution: 'MIT',
        year: 2020,
      });

      const errors = await validate(education);
      expect(errors).toHaveLength(0);
    });

    it('should accept partial education', async () => {
      const education = plainToClass(EducationDto, {
        degree: 'Bachelor of Science',
      });

      const errors = await validate(education);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateUserDto', () => {
    it('should validate user with new profile fields', async () => {
      const dto = plainToClass(UpdateUserDto, {
        username: 'testuser',
        email: 'test@example.com',
        address: {
          street: '123 Main St',
          city: 'New York',
          province: 'NY',
        },
        dateOfBirth: '1990-01-15',
        education: [
          {
            degree: 'Bachelor of Science',
            institution: 'MIT',
            year: 2015,
          },
        ],
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
        hobbies: ['Reading', 'Swimming'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail for future date of birth', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const dto = plainToClass(UpdateUserDto, {
        email: 'test@example.com',
        dateOfBirth: futureDate.toISOString().split('T')[0],
      });

      const errors = await validate(dto);
      // Should have error for date in the future
      const dateError = errors.find(e => e.property === 'dateOfBirth');
      expect(dateError).toBeDefined();
    });

    it('should fail for too many skills', async () => {
      const dto = plainToClass(UpdateUserDto, {
        email: 'test@example.com',
        skills: Array(51).fill('skill'), // More than 50
      });

      const errors = await validate(dto);
      const skillsError = errors.find(e => e.property === 'skills');
      expect(skillsError).toBeDefined();
    });

    it('should fail for too long skill', async () => {
      const dto = plainToClass(UpdateUserDto, {
        email: 'test@example.com',
        skills: ['a'.repeat(101)], // More than 100 chars
      });

      const errors = await validate(dto);
      const skillsError = errors.find(e => e.property === 'skills');
      expect(skillsError).toBeDefined();
    });

    it('should fail for too many hobbies', async () => {
      const dto = plainToClass(UpdateUserDto, {
        email: 'test@example.com',
        hobbies: Array(51).fill('hobby'), // More than 50
      });

      const errors = await validate(dto);
      const hobbiesError = errors.find(e => e.property === 'hobbies');
      expect(hobbiesError).toBeDefined();
    });

    it('should fail for too many education entries', async () => {
      const dto = plainToClass(UpdateUserDto, {
        email: 'test@example.com',
        education: Array(21).fill({
          degree: 'Degree',
          institution: 'Institution',
          year: 2020,
        }), // More than 20
      });

      const errors = await validate(dto);
      const educationError = errors.find(e => e.property === 'education');
      expect(educationError).toBeDefined();
    });

    it('should accept empty skills and hobbies arrays', async () => {
      const dto = plainToClass(UpdateUserDto, {
        email: 'test@example.com',
        skills: [],
        hobbies: [],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateUserDto', () => {
    it('should validate user creation with profile fields', async () => {
      const dto = plainToClass(CreateUserDto, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        address: {
          city: 'New York',
          province: 'NY',
        },
        dateOfBirth: '1990-01-15',
        skills: ['JavaScript', 'TypeScript'],
        hobbies: ['Reading'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
