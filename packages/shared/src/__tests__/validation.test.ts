/**
 * Validation Utilities Test Suite
 * Tests for shared validation functions and helpers
 */

import {
  validateEmail,
  validateSlug,
  validatePassword,
  validateFieldValue,
  sanitizeInput,
  formatNumber,
  formatDate,
  generateSlug,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example.',
        '',
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email as any)).toBe(false);
      });
    });
  });

  describe('validateSlug', () => {
    it('should validate correct slugs', () => {
      const validSlugs = [
        'valid-slug',
        'another-valid-slug',
        'slug123',
        'a',
        'test-slug-with-numbers-123',
      ];

      validSlugs.forEach(slug => {
        expect(validateSlug(slug)).toBe(true);
      });
    });

    it('should reject invalid slugs', () => {
      const invalidSlugs = [
        'Invalid Slug',
        'slug_with_underscores',
        'slug.with.dots',
        'slug@with@symbols',
        'UPPERCASE-SLUG',
        '-starts-with-dash',
        'ends-with-dash-',
        '--double-dash',
        '',
        null,
        undefined,
      ];

      invalidSlugs.forEach(slug => {
        expect(validateSlug(slug as any)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'StrongPassword123!',
        'AnotherGood1@',
        'Complex#Pass9',
        'MySecure$Pass2024',
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        { password: 'short', expectedErrors: ['too_short', 'no_uppercase', 'no_number', 'no_special'] },
        { password: 'nouppercase123!', expectedErrors: ['no_uppercase'] },
        { password: 'NOLOWERCASE123!', expectedErrors: ['no_lowercase'] },
        { password: 'NoNumbers!', expectedErrors: ['no_number'] },
        { password: 'NoSpecialChars123', expectedErrors: ['no_special'] },
        { password: '', expectedErrors: ['too_short', 'no_uppercase', 'no_lowercase', 'no_number', 'no_special'] },
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expectedErrors.forEach(error => {
          expect(result.errors).toContain(error);
        });
      });
    });
  });

  describe('validateFieldValue', () => {
    it('should validate text fields', () => {
      const textField = {
        key: 'name',
        name: 'Name',
        type: 'text' as const,
        is_required: true,
        options: null,
      };

      expect(validateFieldValue('John Doe', textField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('', textField)).toEqual({
        isValid: false,
        errors: ['Field "Name" is required'],
      });
      expect(validateFieldValue(null, textField)).toEqual({
        isValid: false,
        errors: ['Field "Name" is required'],
      });

      // Optional field
      const optionalTextField = { ...textField, is_required: false };
      expect(validateFieldValue('', optionalTextField)).toEqual({ isValid: true, errors: [] });
    });

    it('should validate number fields', () => {
      const numberField = {
        key: 'age',
        name: 'Age',
        type: 'number' as const,
        is_required: true,
        options: null,
      };

      expect(validateFieldValue(25, numberField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('25', numberField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('not-a-number', numberField)).toEqual({
        isValid: false,
        errors: ['Field "Age" must be a valid number'],
      });
      expect(validateFieldValue('', numberField)).toEqual({
        isValid: false,
        errors: ['Field "Age" is required'],
      });
    });

    it('should validate boolean fields', () => {
      const booleanField = {
        key: 'active',
        name: 'Active',
        type: 'boolean' as const,
        is_required: true,
        options: null,
      };

      expect(validateFieldValue(true, booleanField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue(false, booleanField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('true', booleanField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('false', booleanField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('invalid', booleanField)).toEqual({
        isValid: false,
        errors: ['Field "Active" must be a valid boolean'],
      });
    });

    it('should validate date fields', () => {
      const dateField = {
        key: 'created_at',
        name: 'Created At',
        type: 'date' as const,
        is_required: true,
        options: null,
      };

      expect(validateFieldValue('2024-01-15', dateField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue(new Date().toISOString(), dateField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('invalid-date', dateField)).toEqual({
        isValid: false,
        errors: ['Field "Created At" must be a valid date'],
      });
    });

    it('should validate select fields', () => {
      const selectField = {
        key: 'status',
        name: 'Status',
        type: 'select' as const,
        is_required: true,
        options: ['active', 'inactive', 'pending'],
      };

      expect(validateFieldValue('active', selectField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('invalid-option', selectField)).toEqual({
        isValid: false,
        errors: ['Field "Status" must be one of: active, inactive, pending'],
      });
    });

    it('should validate multiselect fields', () => {
      const multiselectField = {
        key: 'tags',
        name: 'Tags',
        type: 'multiselect' as const,
        is_required: false,
        options: ['tag1', 'tag2', 'tag3'],
      };

      expect(validateFieldValue(['tag1', 'tag2'], multiselectField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue(['tag1', 'invalid-tag'], multiselectField)).toEqual({
        isValid: false,
        errors: ['Field "Tags" contains invalid options: invalid-tag'],
      });
      expect(validateFieldValue('not-an-array', multiselectField)).toEqual({
        isValid: false,
        errors: ['Field "Tags" must be an array'],
      });
    });

    it('should validate rating fields', () => {
      const ratingField = {
        key: 'rating',
        name: 'Rating',
        type: 'rating' as const,
        is_required: true,
        options: null,
      };

      expect(validateFieldValue(3, ratingField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue('4', ratingField)).toEqual({ isValid: true, errors: [] });
      expect(validateFieldValue(0, ratingField)).toEqual({
        isValid: false,
        errors: ['Field "Rating" must be between 1 and 5'],
      });
      expect(validateFieldValue(6, ratingField)).toEqual({
        isValid: false,
        errors: ['Field "Rating" must be between 1 and 5'],
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML input', () => {
      const maliciousInput = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).toContain('Safe content');
    });

    it('should preserve safe HTML tags', () => {
      const safeInput = '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>';
      const sanitized = sanitizeInput(safeInput);
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
    });

    it('should handle non-string input', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123 as any)).toBe('123');
      expect(sanitizeInput(true as any)).toBe('true');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with appropriate suffixes', () => {
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(2500000)).toBe('2.5M');
      expect(formatNumber(1000000000)).toBe('1.0B');
    });

    it('should handle decimal places correctly', () => {
      expect(formatNumber(1234)).toBe('1.2K');
      expect(formatNumber(1234567)).toBe('1.2M');
      expect(formatNumber(999)).toBe('999');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1.0K');
      expect(formatNumber(-1500000)).toBe('-1.5M');
    });

    it('should handle zero and edge cases', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(0.5)).toBe('0.5');
      expect(formatNumber(999.9)).toBe('999.9');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format dates in different formats', () => {
      expect(formatDate(testDate, 'short')).toMatch(/Jan 15, 2024/);
      expect(formatDate(testDate, 'long')).toMatch(/Monday, January 15, 2024/);
      expect(formatDate(testDate.toISOString(), 'short')).toMatch(/Jan 15, 2024/);
    });

    it('should format relative dates', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(formatDate(now, 'relative')).toBe('Today');
      expect(formatDate(yesterday, 'relative')).toBe('Yesterday');
      expect(formatDate(lastWeek, 'relative')).toMatch(/days ago/);
    });

    it('should handle invalid dates', () => {
      expect(() => formatDate('invalid-date', 'short')).toThrow();
      expect(() => formatDate(null as any, 'short')).toThrow();
    });
  });

  describe('generateSlug', () => {
    it('should generate valid slugs from strings', () => {
      expect(generateSlug('My Test Entity')).toBe('my-test-entity');
      expect(generateSlug('Another Example!')).toBe('another-example');
      expect(generateSlug('  Spaces  Everywhere  ')).toBe('spaces-everywhere');
      expect(generateSlug('Special@#$%Characters')).toBe('specialcharacters');
    });

    it('should handle edge cases', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug('   ')).toBe('');
      expect(generateSlug('123')).toBe('123');
      expect(generateSlug('a')).toBe('a');
    });

    it('should remove consecutive dashes', () => {
      expect(generateSlug('Multiple---Dashes')).toBe('multiple-dashes');
      expect(generateSlug('Start-  -End')).toBe('start-end');
    });

    it('should handle unicode characters', () => {
      expect(generateSlug('Café & Restaurant')).toBe('caf-restaurant');
      expect(generateSlug('Naïve résumé')).toBe('nave-rsum');
    });
  });

  describe('Integration Tests', () => {
    it('should validate complete entity field definitions', () => {
      const entityFields = [
        {
          key: 'name',
          name: 'Customer Name',
          type: 'text' as const,
          is_required: true,
          options: null,
        },
        {
          key: 'email',
          name: 'Email',
          type: 'text' as const,
          is_required: true,
          options: null,
        },
        {
          key: 'age',
          name: 'Age',
          type: 'number' as const,
          is_required: false,
          options: null,
        },
        {
          key: 'status',
          name: 'Status',
          type: 'select' as const,
          is_required: true,
          options: ['active', 'inactive'],
        },
      ];

      const validRecord = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        status: 'active',
      };

      const invalidRecord = {
        name: '',
        email: 'invalid-email',
        age: 'not-a-number',
        status: 'invalid-status',
      };

      // Validate valid record
      entityFields.forEach(field => {
        const result = validateFieldValue(validRecord[field.key as keyof typeof validRecord], field);
        expect(result.isValid).toBe(true);
      });

      // Validate invalid record
      const nameResult = validateFieldValue(invalidRecord.name, entityFields[0]);
      expect(nameResult.isValid).toBe(false);

      const emailResult = validateFieldValue(invalidRecord.email, entityFields[1]);
      expect(emailResult.isValid).toBe(true); // Email validation is separate

      const ageResult = validateFieldValue(invalidRecord.age, entityFields[2]);
      expect(ageResult.isValid).toBe(false);

      const statusResult = validateFieldValue(invalidRecord.status, entityFields[3]);
      expect(statusResult.isValid).toBe(false);
    });

    it('should handle complete form validation workflow', () => {
      const formData = {
        name: 'My New Entity',
        slug: generateSlug('My New Entity'),
        email: 'admin@example.com',
        password: 'StrongPassword123!',
      };

      // Validate all fields
      expect(formData.slug).toBe('my-new-entity');
      expect(validateSlug(formData.slug)).toBe(true);
      expect(validateEmail(formData.email)).toBe(true);
      expect(validatePassword(formData.password).isValid).toBe(true);

      // Sanitize input
      const sanitizedName = sanitizeInput(formData.name);
      expect(sanitizedName).toBe('My New Entity');
    });
  });
});
