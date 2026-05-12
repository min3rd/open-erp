import { Test, TestingModule } from '@nestjs/testing';

describe('Test import check', () => {
  it('should load Test module', () => {
    console.log('Test typeof:', typeof Test);
    console.log('Test:', Test);
    expect(typeof Test).toBe('object');
    expect(Test.createTestingModule).toBeDefined();
  });
});
