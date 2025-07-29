/**
 * Dynamic Entity UI Components for SynkBoard
 * Centralized exports for all entity-related UI components
 */

// Field Renderer
export {
  DynamicFieldRenderer,
  getFieldTypeIcon,
  getFieldTypeDescription,
} from './dynamic-field-renderer';
export type { DynamicFieldRendererProps, FieldRenderMode } from './dynamic-field-renderer';

// Entity Form
export {
  DynamicEntityForm,
  validateDynamicForm,
  getInitialFormValues,
  prepareFormValuesForSubmission,
} from './dynamic-entity-form';
export type { DynamicEntityFormProps } from './dynamic-entity-form';

// Entity Table
export {
  DynamicEntityTable,
  FieldSelector,
  generateEntityStats,
} from './dynamic-entity-table';
export type { 
  DynamicEntityTableProps,
  EntityTableAction,
  FieldSelectorProps,
} from './dynamic-entity-table';

// Field Builder
export {
  FieldBuilder,
  validateFields,
} from './field-builder';
export type { FieldBuilderProps } from './field-builder';
