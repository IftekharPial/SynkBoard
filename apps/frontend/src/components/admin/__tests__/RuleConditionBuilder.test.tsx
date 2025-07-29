/**
 * RuleConditionBuilder Component Test Suite
 * Tests for the visual rule condition builder interface
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RuleConditionBuilder } from '../rule-condition-builder';

// Mock UI components
jest.mock('@/components/ui', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  FormField: ({ label, children }: any) => (
    <div>
      <label>{label}</label>
      {children}
    </div>
  ),
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  ),
  Select: ({ options, value, onChange, placeholder, ...props }: any) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} {...props}>
      <option value="">{placeholder}</option>
      {options?.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  DatePicker: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...props}
    />
  ),
}));

describe('RuleConditionBuilder Component', () => {
  const user = userEvent.setup();

  const mockEntity = global.testUtils.generateTestEntity({
    fields: [
      {
        id: 'field-1',
        key: 'name',
        name: 'Name',
        type: 'text',
        is_required: true,
        options: null,
      },
      {
        id: 'field-2',
        key: 'amount',
        name: 'Amount',
        type: 'number',
        is_required: false,
        options: null,
      },
      {
        id: 'field-3',
        key: 'status',
        name: 'Status',
        type: 'select',
        is_required: false,
        options: ['active', 'inactive', 'pending'],
      },
      {
        id: 'field-4',
        key: 'is_vip',
        name: 'Is VIP',
        type: 'boolean',
        is_required: false,
        options: null,
      },
      {
        id: 'field-5',
        key: 'created_at',
        name: 'Created At',
        type: 'date',
        is_required: false,
        options: null,
      },
    ],
  });

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders empty state when no conditions', () => {
      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/no conditions defined yet/i)).toBeInTheDocument();
      expect(screen.getByText(/add conditions to specify when this rule should trigger/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add condition/i })).toBeInTheDocument();
    });

    it('renders existing conditions', () => {
      const existingConditions = [
        {
          field: 'amount',
          operator: 'gt' as const,
          value: 1000,
        },
        {
          field: 'status',
          operator: 'eq' as const,
          value: 'active',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={existingConditions}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Condition 1')).toBeInTheDocument();
      expect(screen.getByText('Condition 2')).toBeInTheDocument();
      expect(screen.getByText(/and/i)).toBeInTheDocument();
    });

    it('disables add button when no entity provided', () => {
      render(
        <RuleConditionBuilder
          entity={undefined}
          conditions={[]}
          onChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe('Adding Conditions', () => {
    it('adds new condition when add button is clicked', async () => {
      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={[]}
          onChange={mockOnChange}
        />
      );

      const addButton = screen.getByRole('button', { name: /add condition/i });
      await user.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          field: '',
          operator: 'eq',
          value: '',
        },
      ]);
    });

    it('configures condition fields correctly', async () => {
      const conditions = [
        {
          field: '',
          operator: 'eq' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      // Select field
      const fieldSelect = screen.getByRole('combobox', { name: /field/i });
      await user.selectOptions(fieldSelect, 'amount');

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          field: 'amount',
          operator: 'eq',
          value: '',
        },
      ]);
    });

    it('updates operator when field type changes', async () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'eq' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      // Change operator
      const operatorSelect = screen.getByRole('combobox', { name: /operator/i });
      await user.selectOptions(operatorSelect, 'gt');

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          field: 'amount',
          operator: 'gt',
          value: '',
        },
      ]);
    });
  });

  describe('Field Type Handling', () => {
    it('shows appropriate operators for text fields', async () => {
      const conditions = [
        {
          field: 'name',
          operator: 'eq' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const operatorSelect = screen.getByRole('combobox', { name: /operator/i });
      
      // Text fields should have text-specific operators
      expect(operatorSelect).toHaveTextContent('equals');
      expect(operatorSelect).toHaveTextContent('contains');
      expect(operatorSelect).toHaveTextContent('starts with');
    });

    it('shows appropriate operators for number fields', async () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'eq' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const operatorSelect = screen.getByRole('combobox', { name: /operator/i });
      
      // Number fields should have numeric operators
      expect(operatorSelect).toHaveTextContent('greater than');
      expect(operatorSelect).toHaveTextContent('less than');
    });

    it('renders number input for number fields', () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'gt' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const valueInput = screen.getByPlaceholderText(/enter number/i);
      expect(valueInput).toHaveAttribute('type', 'number');
    });

    it('renders select input for boolean fields', () => {
      const conditions = [
        {
          field: 'is_vip',
          operator: 'eq' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const valueSelect = screen.getByRole('combobox');
      expect(valueSelect).toHaveTextContent('True');
      expect(valueSelect).toHaveTextContent('False');
    });

    it('renders date picker for date fields', () => {
      const conditions = [
        {
          field: 'created_at',
          operator: 'gt' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const dateInput = screen.getByPlaceholderText(/select date/i);
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('renders select options for select fields', () => {
      const conditions = [
        {
          field: 'status',
          operator: 'eq' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const valueSelect = screen.getByRole('combobox');
      expect(valueSelect).toHaveTextContent('active');
      expect(valueSelect).toHaveTextContent('inactive');
      expect(valueSelect).toHaveTextContent('pending');
    });

    it('hides value input for null check operators', () => {
      const conditions = [
        {
          field: 'name',
          operator: 'is_null' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      // Should not render value input for is_null operator
      expect(screen.queryByLabelText(/value/i)).not.toBeInTheDocument();
    });
  });

  describe('Removing Conditions', () => {
    it('removes condition when delete button is clicked', async () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'gt' as const,
          value: 1000,
        },
        {
          field: 'status',
          operator: 'eq' as const,
          value: 'active',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /remove/i });
      await user.click(deleteButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          field: 'status',
          operator: 'eq',
          value: 'active',
        },
      ]);
    });

    it('removes all conditions when last condition is deleted', async () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'gt' as const,
          value: 1000,
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /remove/i });
      await user.click(deleteButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Disabled State', () => {
    it('disables all controls when disabled prop is true', () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'gt' as const,
          value: 1000,
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const fieldSelect = screen.getByRole('combobox', { name: /field/i });
      const operatorSelect = screen.getByRole('combobox', { name: /operator/i });
      const addButton = screen.getByRole('button', { name: /add condition/i });
      const deleteButton = screen.getByRole('button', { name: /remove/i });

      expect(fieldSelect).toBeDisabled();
      expect(operatorSelect).toBeDisabled();
      expect(addButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Validation and Error Handling', () => {
    it('shows field validation errors', async () => {
      const conditions = [
        {
          field: '',
          operator: 'eq' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      // Try to set operator without field
      const operatorSelect = screen.getByRole('combobox', { name: /operator/i });
      expect(operatorSelect).toBeDisabled();
    });

    it('resets operator and value when field changes', async () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'gt' as const,
          value: 1000,
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      // Change field type
      const fieldSelect = screen.getByRole('combobox', { name: /field/i });
      await user.selectOptions(fieldSelect, 'name');

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          field: 'name',
          operator: 'eq',
          value: '',
        },
      ]);
    });

    it('resets value when operator changes', async () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'eq' as const,
          value: 1000,
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      // Change operator
      const operatorSelect = screen.getByRole('combobox', { name: /operator/i });
      await user.selectOptions(operatorSelect, 'gt');

      expect(mockOnChange).toHaveBeenCalledWith([
        {
          field: 'amount',
          operator: 'gt',
          value: '',
        },
      ]);
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      const conditions = [
        {
          field: 'amount',
          operator: 'gt' as const,
          value: 1000,
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/field/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/operator/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const conditions = [
        {
          field: '',
          operator: 'eq' as const,
          value: '',
        },
      ];

      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={conditions}
          onChange={mockOnChange}
        />
      );

      const fieldSelect = screen.getByRole('combobox', { name: /field/i });
      const addButton = screen.getByRole('button', { name: /add condition/i });

      fieldSelect.focus();
      expect(fieldSelect).toHaveFocus();

      await user.tab();
      expect(addButton).toHaveFocus();
    });

    it('provides helpful descriptions', () => {
      render(
        <RuleConditionBuilder
          entity={mockEntity}
          conditions={[
            { field: 'amount', operator: 'gt', value: 1000 },
            { field: 'status', operator: 'eq', value: 'active' },
          ]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/all conditions must be met for the rule to trigger/i)).toBeInTheDocument();
    });
  });
});
