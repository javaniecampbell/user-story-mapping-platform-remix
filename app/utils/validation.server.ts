// app/utils/validation.server.ts
export function validateRequired(value: unknown, fieldName: string): string | null {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return `${fieldName} is required`;
    }
    return null;
  }
  
  export function validateLength(value: string, fieldName: string, min: number, max: number): string | null {
    if (value.length < min || value.length > max) {
      return `${fieldName} must be between ${min} and ${max} characters`;
    }
    return null;
  }
  
  export function validateType(value: unknown, fieldName: string, expectedType: string): string | null {
    if (typeof value !== expectedType) {
      return `${fieldName} must be a ${expectedType}`;
    }
    return null;
  }