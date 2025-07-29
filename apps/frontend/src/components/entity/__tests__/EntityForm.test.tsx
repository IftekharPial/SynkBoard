/**
 * EntityForm Component Test Suite
 * Tests for entity creation and editing form
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EntityForm } from '../EntityForm';

// Mock the API hooks
jest.mock('@/hooks/use-api', () => ({
  useCreateEntity: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ data: { entity: { id: 'new-entity-id' } } }),
    isPending: false,
  }),
  useUpdateEntity: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ data: { entity: { id: 'updated-entity-id' } } }),
    isPending: false,
  }),
}));

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('EntityForm Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      expect(screen.getByRole('heading', { name: /create entity/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/entity name/i)).toHaveValue('');
      expect(screen.getByLabelText(/slug/i)).toHaveValue('');
      expect(screen.getByRole('button', { name: /create entity/i })).toBeInTheDocument();
    });

    it('auto-generates slug from entity name', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/entity name/i);
      const slugInput = screen.getByLabelText(/slug/i);

      await user.type(nameInput, 'My Test Entity');

      await waitFor(() => {
        expect(slugInput).toHaveValue('my-test-entity');
      });
    });

    it('allows manual slug editing', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const slugInput = screen.getByLabelText(/slug/i);

      await user.clear(slugInput);
      await user.type(slugInput, 'custom-slug');

      expect(slugInput).toHaveValue('custom-slug');
    });

    it('validates required fields', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /create entity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/entity name is required/i)).toBeInTheDocument();
      });
    });

    it('validates slug format', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const slugInput = screen.getByLabelText(/slug/i);
      await user.type(slugInput, 'Invalid Slug!');

      const submitButton = screen.getByRole('button', { name: /create entity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/slug must contain only lowercase letters/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      const mockCreate = jest.fn().mockResolvedValue({ data: { entity: { id: 'new-id' } } });
      jest.mocked(require('@/hooks/use-api').useCreateEntity).mockReturnValue({
        mutateAsync: mockCreate,
        isPending: false,
      });

      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/entity name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(nameInput, 'Test Entity');
      await user.type(descriptionInput, 'Test description');

      const submitButton = screen.getByRole('button', { name: /create entity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({
          name: 'Test Entity',
          slug: 'test-entity',
          description: 'Test description',
          fields: [],
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/entities');
    });
  });

  describe('Edit Mode', () => {
    const existingEntity = global.testUtils.generateTestEntity({
      name: 'Existing Entity',
      slug: 'existing-entity',
      description: 'Existing description',
    });

    it('renders edit form with existing data', () => {
      render(
        <EntityForm mode="edit" entity={existingEntity} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('heading', { name: /edit entity/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Entity')).toBeInTheDocument();
      expect(screen.getByDisplayValue('existing-entity')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update entity/i })).toBeInTheDocument();
    });

    it('prevents slug editing in edit mode', () => {
      render(
        <EntityForm mode="edit" entity={existingEntity} />,
        { wrapper: createWrapper() }
      );

      const slugInput = screen.getByLabelText(/slug/i);
      expect(slugInput).toBeDisabled();
    });

    it('submits update with changed data', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ data: { entity: { id: 'updated-id' } } });
      jest.mocked(require('@/hooks/use-api').useUpdateEntity).mockReturnValue({
        mutateAsync: mockUpdate,
        isPending: false,
      });

      render(
        <EntityForm mode="edit" entity={existingEntity} />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByDisplayValue('Existing Entity');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Entity');

      const submitButton = screen.getByRole('button', { name: /update entity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(existingEntity.slug, {
          name: 'Updated Entity',
          description: 'Existing description',
          fields: existingEntity.fields,
        });
      });

      expect(mockPush).toHaveBeenCalledWith('/entities');
    });
  });

  describe('Field Management', () => {
    it('renders existing fields', () => {
      const entityWithFields = global.testUtils.generateTestEntity({
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
            key: 'status',
            name: 'Status',
            type: 'select',
            is_required: false,
            options: ['active', 'inactive'],
          },
        ],
      });

      render(
        <EntityForm mode="edit" entity={entityWithFields} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByDisplayValue('Name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Status')).toBeInTheDocument();
      expect(screen.getByDisplayValue('name')).toBeInTheDocument();
      expect(screen.getByDisplayValue('status')).toBeInTheDocument();
    });

    it('adds new field when add button is clicked', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const addFieldButton = screen.getByRole('button', { name: /add field/i });
      await user.click(addFieldButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/field name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/field key/i)).toBeInTheDocument();
      });
    });

    it('removes field when remove button is clicked', async () => {
      const entityWithFields = global.testUtils.generateTestEntity({
        fields: [
          {
            id: 'field-1',
            key: 'name',
            name: 'Name',
            type: 'text',
            is_required: true,
            options: null,
          },
        ],
      });

      render(
        <EntityForm mode="edit" entity={entityWithFields} />,
        { wrapper: createWrapper() }
      );

      const removeButton = screen.getByRole('button', { name: /remove field/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue('Name')).not.toBeInTheDocument();
      });
    });

    it('validates field data', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      // Add a field
      const addFieldButton = screen.getByRole('button', { name: /add field/i });
      await user.click(addFieldButton);

      // Try to submit without filling field data
      const submitButton = screen.getByRole('button', { name: /create entity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/field key is required/i)).toBeInTheDocument();
      });
    });

    it('auto-generates field key from field name', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const addFieldButton = screen.getByRole('button', { name: /add field/i });
      await user.click(addFieldButton);

      const fieldNameInput = screen.getByPlaceholderText(/field name/i);
      const fieldKeyInput = screen.getByPlaceholderText(/field key/i);

      await user.type(fieldNameInput, 'My Field Name');

      await waitFor(() => {
        expect(fieldKeyInput).toHaveValue('my_field_name');
      });
    });

    it('shows options input for select field types', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const addFieldButton = screen.getByRole('button', { name: /add field/i });
      await user.click(addFieldButton);

      const fieldTypeSelect = screen.getByRole('combobox', { name: /field type/i });
      await user.selectOptions(fieldTypeSelect, 'select');

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter options/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state during submission', async () => {
      const mockCreate = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      jest.mocked(require('@/hooks/use-api').useCreateEntity).mockReturnValue({
        mutateAsync: mockCreate,
        isPending: true,
      });

      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /creating/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('disables form during submission', async () => {
      const mockCreate = jest.fn().mockImplementation(() => new Promise(() => {})); // Never resolves
      jest.mocked(require('@/hooks/use-api').useCreateEntity).mockReturnValue({
        mutateAsync: mockCreate,
        isPending: true,
      });

      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/entity name/i);
      const slugInput = screen.getByLabelText(/slug/i);

      expect(nameInput).toBeDisabled();
      expect(slugInput).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message on submission failure', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('Creation failed'));
      jest.mocked(require('@/hooks/use-api').useCreateEntity).mockReturnValue({
        mutateAsync: mockCreate,
        isPending: false,
      });

      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/entity name/i);
      await user.type(nameInput, 'Test Entity');

      const submitButton = screen.getByRole('button', { name: /create entity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and structure', () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/entity name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/entity name/i);
      const slugInput = screen.getByLabelText(/slug/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      nameInput.focus();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(slugInput).toHaveFocus();

      await user.tab();
      expect(descriptionInput).toHaveFocus();
    });

    it('announces form errors to screen readers', async () => {
      render(<EntityForm mode="create" />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /create entity/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/entity name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
