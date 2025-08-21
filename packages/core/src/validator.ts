/**
 * 数据验证工具
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证器类
 */
export class Validator {
  private rules: Record<string, ValidationRule> = {};

  /**
   * 添加验证规则
   */
  addRule(field: string, rule: ValidationRule): this {
    this.rules[field] = rule;
    return this;
  }

  /**
   * 验证数据
   */
  validate(data: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];

      // 必填验证
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} 是必填项`);
        continue;
      }

      // 如果值为空且不是必填，跳过其他验证
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // 最小长度验证
      if (rule.minLength && String(value).length < rule.minLength) {
        errors.push(`${field} 长度不能少于 ${rule.minLength} 个字符`);
      }

      // 最大长度验证
      if (rule.maxLength && String(value).length > rule.maxLength) {
        errors.push(`${field} 长度不能超过 ${rule.maxLength} 个字符`);
      }

      // 正则验证
      if (rule.pattern && !rule.pattern.test(String(value))) {
        errors.push(`${field} 格式不正确`);
      }

      // 自定义验证
      if (rule.custom) {
        const result = rule.custom(value);
        if (result !== true) {
          errors.push(typeof result === 'string' ? result : `${field} 验证失败`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}