import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isPastDate', async: false })
export class IsPastDateConstraint implements ValidatorConstraintInterface {
  validate(dateString: string): boolean {
    if (!dateString) return true; // Allow optional fields
    const date = new Date(dateString);
    const now = new Date();
    return date <= now;
  }

  defaultMessage(): string {
    return 'Date of birth cannot be in the future';
  }
}

export function IsPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPastDateConstraint,
    });
  };
}
