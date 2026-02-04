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

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return false;
    }

    // Normalize both dates to date-only (start of day) to avoid timezone/time-of-day issues
    const inputDateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const now = new Date();
    const todayDateOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return inputDateOnly <= todayDateOnly;
  }

  defaultMessage(): string {
    return 'Date of birth must be a valid date and cannot be in the future';
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
