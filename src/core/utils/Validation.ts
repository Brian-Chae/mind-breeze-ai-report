/**
 * 고급 검증 시스템
 * 
 * 기능:
 * - 체인 가능한 검증 규칙
 * - 커스텀 검증자 지원
 * - 다국어 에러 메시지
 * - 복합 객체 검증
 * - 조건부 검증
 * - 스키마 기반 검증
 * - 실시간 검증
 */

import { createValidationError, ErrorContext } from './ErrorHandler';

// === 검증 타입 정의 ===

export interface ValidationRule<T = any> {
  name: string;
  message: string;
  validator: (value: T, context?: ValidationContext) => boolean | Promise<boolean>;
  async?: boolean;
}

export interface ValidationContext {
  field: string;
  object?: any;
  path?: string[];
  locale?: string;
  custom?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  data?: any;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value?: any;
  path?: string[];
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: any;
  path?: string[];
}

export interface SchemaDefinition {
  [key: string]: FieldSchema;
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'phone' | 'url';
  required?: boolean;
  rules?: ValidationRule[];
  default?: any;
  transform?: (value: any) => any;
  children?: SchemaDefinition; // for nested objects
  itemSchema?: FieldSchema;    // for arrays
  conditional?: {
    when: string | ((data: any) => boolean);
    then?: FieldSchema;
    otherwise?: FieldSchema;
  };
}

export type ValidatorFunction<T = any> = (value: T, context?: ValidationContext) => boolean | Promise<boolean>;

// === 내장 검증 규칙 ===

export const BuiltInRules = {
  // 기본 검증
  required: <ValidationRule<any>>{
    name: 'required',
    message: '필수 입력 항목입니다.',
    validator: (value) => value !== null && value !== undefined && value !== ''
  },

  // 문자열 검증
  minLength: (length: number): ValidationRule<string> => ({
    name: 'minLength',
    message: `최소 ${length}자 이상 입력해주세요.`,
    validator: (value) => !value || value.length >= length
  }),

  maxLength: (length: number): ValidationRule<string> => ({
    name: 'maxLength',
    message: `최대 ${length}자까지 입력 가능합니다.`,
    validator: (value) => !value || value.length <= length
  }),

  pattern: (regex: RegExp, message?: string): ValidationRule<string> => ({
    name: 'pattern',
    message: message || '올바른 형식이 아닙니다.',
    validator: (value) => !value || regex.test(value)
  }),

  // 이메일 검증
  email: <ValidationRule<string>>{
    name: 'email',
    message: '올바른 이메일 주소를 입력해주세요.',
    validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },

  // 전화번호 검증 (한국)
  phoneKR: <ValidationRule<string>>{
    name: 'phoneKR',
    message: '올바른 전화번호를 입력해주세요. (예: 010-1234-5678)',
    validator: (value) => !value || /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(value.replace(/[^0-9]/g, ''))
  },

  // URL 검증
  url: <ValidationRule<string>>{
    name: 'url',
    message: '올바른 URL을 입력해주세요.',
    validator: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  },

  // 숫자 검증
  min: (minValue: number): ValidationRule<number> => ({
    name: 'min',
    message: `${minValue} 이상의 값을 입력해주세요.`,
    validator: (value) => value === null || value === undefined || value >= minValue
  }),

  max: (maxValue: number): ValidationRule<number> => ({
    name: 'max',
    message: `${maxValue} 이하의 값을 입력해주세요.`,
    validator: (value) => value === null || value === undefined || value <= maxValue
  }),

  integer: <ValidationRule<number>>{
    name: 'integer',
    message: '정수를 입력해주세요.',
    validator: (value) => value === null || value === undefined || Number.isInteger(value)
  },

  positive: <ValidationRule<number>>{
    name: 'positive',
    message: '양수를 입력해주세요.',
    validator: (value) => value === null || value === undefined || value > 0
  },

  // 날짜 검증
  futureDate: <ValidationRule<Date | string>>{
    name: 'futureDate',
    message: '미래 날짜를 입력해주세요.',
    validator: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return date > new Date();
    }
  },

  pastDate: <ValidationRule<Date | string>>{
    name: 'pastDate',
    message: '과거 날짜를 입력해주세요.',
    validator: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return date < new Date();
    }
  },

  // 배열 검증
  arrayMinLength: (length: number): ValidationRule<any[]> => ({
    name: 'arrayMinLength',
    message: `최소 ${length}개 이상 선택해주세요.`,
    validator: (value) => !value || Array.isArray(value) && value.length >= length
  }),

  arrayMaxLength: (length: number): ValidationRule<any[]> => ({
    name: 'arrayMaxLength',
    message: `최대 ${length}개까지 선택 가능합니다.`,
    validator: (value) => !value || Array.isArray(value) && value.length <= length
  }),

  // 커스텀 비즈니스 로직
  uniqueEmail: <ValidationRule<string>>{
    name: 'uniqueEmail',
    message: '이미 사용 중인 이메일 주소입니다.',
    async: true,
    validator: async (value, context) => {
      if (!value) return true;
      // TODO: 실제 중복 검사 로직 구현
      // 예: await checkEmailExists(value)
      return true;
    }
  },

  strongPassword: <ValidationRule<string>>{
    name: 'strongPassword',
    message: '비밀번호는 8자 이상이며, 대소문자, 숫자, 특수문자를 포함해야 합니다.',
    validator: (value) => {
      if (!value) return true;
      const hasLower = /[a-z]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const hasMinLength = value.length >= 8;
      return hasLower && hasUpper && hasNumber && hasSpecial && hasMinLength;
    }
  },

  koreanName: <ValidationRule<string>>{
    name: 'koreanName',
    message: '올바른 한글 이름을 입력해주세요.',
    validator: (value) => !value || /^[가-힣]{2,5}$/.test(value)
  },

  businessNumber: <ValidationRule<string>>{
    name: 'businessNumber',
    message: '올바른 사업자등록번호를 입력해주세요.',
    validator: (value) => {
      if (!value) return true;
      const numbers = value.replace(/[^0-9]/g, '');
      if (numbers.length !== 10) return false;
      
      // 사업자등록번호 체크섬 검증
      const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(numbers[i]) * weights[i];
      }
      sum += Math.floor(parseInt(numbers[8]) * 5 / 10);
      
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === parseInt(numbers[9]);
    }
  }
};

// === 검증자 클래스 ===

export class FieldValidator<T = string> {
  private rules: ValidationRule<T>[] = [];
  private transformFn?: (value: any) => T;

  constructor(
    private fieldName: string,
    private value: T,
    private context?: ValidationContext
  ) {
    this.context = {
      field: fieldName,
      ...context
    };
  }

  /**
   * 검증 규칙 추가
   */
  rule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * 여러 검증 규칙 추가
   */
  addRules(rules: ValidationRule<T>[]): this {
    this.rules.push(...rules);
    return this;
  }

  /**
   * 필수 입력 검증
   */
  required(message?: string): this {
    return this.rule({
      ...BuiltInRules.required,
      message: message || BuiltInRules.required.message
    });
  }

  /**
   * 최소 길이 검증
   */
  minLength(length: number, message?: string): this {
    const rule = BuiltInRules.minLength(length);
    return this.rule({
      ...rule,
      message: message || rule.message
    } as ValidationRule<T>);
  }

  /**
   * 최대 길이 검증
   */
  maxLength(length: number, message?: string): this {
    const rule = BuiltInRules.maxLength(length);
    return this.rule({
      ...rule,
      message: message || rule.message
    } as ValidationRule<T>);
  }

  /**
   * 이메일 형식 검증
   */
  email(message?: string): this {
    return this.rule({
      ...BuiltInRules.email,
      message: message || BuiltInRules.email.message
    } as ValidationRule<T>);
  }

  /**
   * 전화번호 형식 검증
   */
  phone(message?: string): this {
    return this.rule({
      ...BuiltInRules.phoneKR,
      message: message || BuiltInRules.phoneKR.message
    } as ValidationRule<T>);
  }

  /**
   * 정규식 패턴 검증
   */
  pattern(regex: RegExp, message?: string): this {
    return this.rule(BuiltInRules.pattern(regex, message) as ValidationRule<T>);
  }

  /**
   * 최소값 검증
   */
  min(minValue: number, message?: string): this {
    const rule = BuiltInRules.min(minValue);
    return this.rule({
      ...rule,
      message: message || rule.message
    } as ValidationRule<T>);
  }

  /**
   * 최대값 검증
   */
  max(maxValue: number, message?: string): this {
    const rule = BuiltInRules.max(maxValue);
    return this.rule({
      ...rule,
      message: message || rule.message
    } as ValidationRule<T>);
  }

  /**
   * 커스텀 검증자 추가
   */
  custom(
    name: string,
    validator: ValidatorFunction<T>,
    message: string,
    async: boolean = false
  ): this {
    return this.rule({
      name,
      message,
      validator,
      async
    });
  }

  /**
   * 값 변환 함수 설정
   */
  transform(fn: (value: any) => T): this {
    this.transformFn = fn;
    return this;
  }

  /**
   * 검증 실행
   */
  async validate(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    let transformedValue = this.value;

    // 값 변환
    if (this.transformFn) {
      try {
        transformedValue = this.transformFn(this.value);
      } catch (error) {
        errors.push({
          field: this.fieldName,
          rule: 'transform',
          message: '값 변환 중 오류가 발생했습니다.',
          value: this.value
        });
        return {
          isValid: false,
          errors,
          warnings: []
        };
      }
    }

    // 규칙별 검증
    for (const rule of this.rules) {
      try {
        let isValid: boolean;
        
        if (rule.async) {
          isValid = await rule.validator(transformedValue, this.context);
        } else {
          isValid = rule.validator(transformedValue, this.context) as boolean;
        }

        if (!isValid) {
          errors.push({
            field: this.fieldName,
            rule: rule.name,
            message: rule.message,
            value: transformedValue,
            path: this.context?.path
          });
        }
      } catch (error) {
        errors.push({
          field: this.fieldName,
          rule: rule.name,
          message: `검증 중 오류 발생: ${(error as Error).message}`,
          value: transformedValue
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      data: transformedValue
    };
  }
}

// === 스키마 검증자 ===

export class SchemaValidator {
  constructor(private schema: SchemaDefinition) {}

  /**
   * 객체 검증
   */
  async validate(data: any, context?: Partial<ValidationContext>): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const result: any = {};

    for (const [fieldName, fieldSchema] of Object.entries(this.schema)) {
      const fieldValue = data?.[fieldName];
      const fieldContext: ValidationContext = {
        field: fieldName,
        object: data,
        path: [fieldName],
        ...context
      };

      // 조건부 스키마 적용
      const activeSchema = this.resolveConditionalSchema(fieldSchema, data);

      // 필수 필드 검증
      if (activeSchema.required && (fieldValue === null || fieldValue === undefined || fieldValue === '')) {
        errors.push({
          field: fieldName,
          rule: 'required',
          message: '필수 입력 항목입니다.',
          value: fieldValue,
          path: fieldContext.path
        });
        continue;
      }

      // 값이 없고 필수가 아닌 경우 기본값 설정
      if (!fieldValue && !activeSchema.required) {
        if (activeSchema.default !== undefined) {
          result[fieldName] = activeSchema.default;
        }
        continue;
      }

      // 타입 검증
      const typeValidation = this.validateType(fieldValue, activeSchema.type, fieldName);
      if (!typeValidation.isValid) {
        errors.push(...typeValidation.errors);
        continue;
      }

      // 값 변환
      let transformedValue = fieldValue;
      if (activeSchema.transform) {
        try {
          transformedValue = activeSchema.transform(fieldValue);
        } catch (error) {
          errors.push({
            field: fieldName,
            rule: 'transform',
            message: '값 변환 중 오류가 발생했습니다.',
            value: fieldValue,
            path: fieldContext.path
          });
          continue;
        }
      }

      // 커스텀 규칙 검증
      if (activeSchema.rules) {
        const validator = new FieldValidator(fieldName, transformedValue, fieldContext);
        validator.addRules(activeSchema.rules);
        
        const fieldResult = await validator.validate();
        if (!fieldResult.isValid) {
          errors.push(...fieldResult.errors);
        }
        warnings.push(...fieldResult.warnings);
        
        transformedValue = fieldResult.data || transformedValue;
      }

      // 중첩 객체 검증
      if (activeSchema.type === 'object' && activeSchema.children) {
        const nestedValidator = new SchemaValidator(activeSchema.children);
        const nestedResult = await nestedValidator.validate(transformedValue, {
          ...fieldContext,
          path: [...(fieldContext.path || []), fieldName]
        });
        
        if (!nestedResult.isValid) {
          errors.push(...nestedResult.errors);
        }
        warnings.push(...nestedResult.warnings);
        
        transformedValue = nestedResult.data || transformedValue;
      }

      // 배열 검증
      if (activeSchema.type === 'array' && activeSchema.itemSchema && Array.isArray(transformedValue)) {
        const arrayErrors: ValidationError[] = [];
        const arrayResult: any[] = [];
        
        for (let i = 0; i < transformedValue.length; i++) {
          const item = transformedValue[i];
          const itemContext: ValidationContext = {
            ...fieldContext,
            path: [...(fieldContext.path || []), i.toString()]
          };
          
          if (activeSchema.itemSchema.type === 'object' && activeSchema.itemSchema.children) {
            const itemValidator = new SchemaValidator(activeSchema.itemSchema.children);
            const itemResult = await itemValidator.validate(item, itemContext);
            
            if (!itemResult.isValid) {
              arrayErrors.push(...itemResult.errors);
            } else {
              arrayResult.push(itemResult.data);
            }
          } else {
            // 원시 타입 배열
            const itemValidator = new FieldValidator(`${fieldName}[${i}]`, item, itemContext);
            if (activeSchema.itemSchema.rules) {
              itemValidator.addRules(activeSchema.itemSchema.rules);
            }
            
            const itemResult = await itemValidator.validate();
            if (!itemResult.isValid) {
              arrayErrors.push(...itemResult.errors);
            } else {
              arrayResult.push(itemResult.data);
            }
          }
        }
        
        if (arrayErrors.length > 0) {
          errors.push(...arrayErrors);
        } else {
          transformedValue = arrayResult;
        }
      }

      result[fieldName] = transformedValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: result
    };
  }

  /**
   * 조건부 스키마 해결
   */
  private resolveConditionalSchema(schema: FieldSchema, data: any): FieldSchema {
    if (!schema.conditional) {
      return schema;
    }

    const { when, then, otherwise } = schema.conditional;
    let condition: boolean;

    if (typeof when === 'string') {
      condition = !!data[when];
    } else {
      condition = when(data);
    }

    const conditionalSchema = condition ? then : otherwise;
    
    return {
      ...schema,
      ...conditionalSchema
    };
  }

  /**
   * 타입 검증
   */
  private validateType(value: any, type: FieldSchema['type'], fieldName: string): ValidationResult {
    const errors: ValidationError[] = [];

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: '문자열이어야 합니다.',
            value
          });
        }
        break;
      
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: '숫자여야 합니다.',
            value
          });
        }
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: 'true 또는 false여야 합니다.',
            value
          });
        }
        break;
      
      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: '배열이어야 합니다.',
            value
          });
        }
        break;
      
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: '객체여야 합니다.',
            value
          });
        }
        break;
      
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: '올바른 날짜여야 합니다.',
            value
          });
        }
        break;
      
      case 'email':
        if (typeof value !== 'string' || !BuiltInRules.email.validator(value)) {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: '올바른 이메일 주소여야 합니다.',
            value
          });
        }
        break;
      
      case 'phone':
        if (typeof value !== 'string' || !BuiltInRules.phoneKR.validator(value)) {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: '올바른 전화번호여야 합니다.',
            value
          });
        }
        break;
      
      case 'url':
        if (typeof value !== 'string' || !BuiltInRules.url.validator(value)) {
          errors.push({
            field: fieldName,
            rule: 'type',
            message: '올바른 URL이어야 합니다.',
            value
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }
}

// === 편의 함수들 ===

/**
 * 단일 필드 검증
 */
export function validateField<T>(
  fieldName: string,
  value: T,
  rules: ValidationRule<T>[],
  context?: ValidationContext
): Promise<ValidationResult> {
  const validator = new FieldValidator(fieldName, value, context);
  return validator.addRules(rules).validate();
}

/**
 * 스키마 기반 객체 검증
 */
export function validateSchema(
  data: any,
  schema: SchemaDefinition,
  context?: Partial<ValidationContext>
): Promise<ValidationResult> {
  const validator = new SchemaValidator(schema);
  return validator.validate(data, context);
}

/**
 * 빠른 검증 (체인 가능)
 */
export function validate<T>(fieldName: string, value: T, context?: ValidationContext): FieldValidator<T> {
  return new FieldValidator(fieldName, value, context);
}

/**
 * 검증 에러를 ServiceError로 변환
 */
export function throwValidationErrors(result: ValidationResult, context?: ErrorContext): void {
  if (!result.isValid) {
    const firstError = result.errors[0];
    throw createValidationError(
      firstError.field,
      firstError.value,
      firstError.message,
      context
    );
  }
}

/**
 * 여러 필드 병렬 검증
 */
export async function validateFields(
  validations: Array<{
    name: string;
    value: any;
    rules: ValidationRule[];
    context?: ValidationContext;
  }>
): Promise<ValidationResult> {
  const results = await Promise.all(
    validations.map(({ name, value, rules, context }) =>
      validateField(name, value, rules, context)
    )
  );

  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  for (const result of results) {
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

// === 커스텀 검증자 팩토리 ===

export const ValidationRuleFactory = {
  /**
   * 값 비교 검증
   */
  equals: (expectedValue: any, message?: string): ValidationRule => ({
    name: 'equals',
    message: message || `${expectedValue}와 일치해야 합니다.`,
    validator: (value) => value === expectedValue
  }),

  /**
   * 다른 필드와 일치 검증 (비밀번호 확인 등)
   */
  matchField: (fieldName: string, message?: string): ValidationRule => ({
    name: 'matchField',
    message: message || `${fieldName}와 일치해야 합니다.`,
    validator: (value, context) => {
      const otherValue = context?.object?.[fieldName];
      return value === otherValue;
    }
  }),

  /**
   * 목록에 포함 여부 검증
   */
  oneOf: (allowedValues: any[], message?: string): ValidationRule => ({
    name: 'oneOf',
    message: message || `허용된 값 중 하나여야 합니다: ${allowedValues.join(', ')}`,
    validator: (value) => allowedValues.includes(value)
  }),

  /**
   * 날짜 범위 검증
   */
  dateRange: (startDate: Date, endDate: Date, message?: string): ValidationRule<Date | string> => ({
    name: 'dateRange',
    message: message || `${startDate.toLocaleDateString()}와 ${endDate.toLocaleDateString()} 사이의 날짜여야 합니다.`,
    validator: (value) => {
      if (!value) return true;
      const date = new Date(value);
      return date >= startDate && date <= endDate;
    }
  }),

  /**
   * 비동기 중복 검사
   */
  unique: (
    checkFunction: (value: any) => Promise<boolean>,
    message?: string
  ): ValidationRule => ({
    name: 'unique',
    message: message || '이미 사용 중인 값입니다.',
    async: true,
    validator: async (value) => {
      if (!value) return true;
      return await checkFunction(value);
    }
  })
}; 