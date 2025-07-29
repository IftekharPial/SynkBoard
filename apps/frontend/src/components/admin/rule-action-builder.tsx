/**
 * Rule Action Builder Component for SynkBoard
 * Visual builder for creating rule actions with type-specific configuration
 */

import React from 'react';
import {
  Button,
  FormField,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import {
  PlusIcon,
  TrashIcon,
  BellIcon,
  GlobeAltIcon,
  TagIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import type { EntityWithFields, RuleAction } from '@synkboard/types';

type ActionType = 'webhook' | 'notify' | 'tag' | 'rate' | 'slack';

export interface RuleActionBuilderProps {
  entity?: EntityWithFields;
  actions: RuleAction[];
  onChange: (actions: RuleAction[]) => void;
  disabled?: boolean;
}

const ACTION_TYPES: { value: ActionType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'webhook',
    label: 'Webhook',
    description: 'Send HTTP request to external URL',
    icon: <GlobeAltIcon className="h-4 w-4" />,
  },
  {
    value: 'notify',
    label: 'Notification',
    description: 'Send in-app notification',
    icon: <BellIcon className="h-4 w-4" />,
  },
  {
    value: 'tag',
    label: 'Add Tag',
    description: 'Add a tag to the record',
    icon: <TagIcon className="h-4 w-4" />,
  },
  {
    value: 'rate',
    label: 'Set Rating',
    description: 'Set a rating field value',
    icon: <StarIcon className="h-4 w-4" />,
  },
  {
    value: 'slack',
    label: 'Slack Message',
    description: 'Send message to Slack channel',
    icon: <BellIcon className="h-4 w-4" />,
  },
];

export function RuleActionBuilder({
  entity,
  actions,
  onChange,
  disabled = false,
}: RuleActionBuilderProps) {
  const addAction = () => {
    const newAction: RuleAction = {
      type: 'webhook',
      config: {},
    };
    onChange([...actions, newAction]);
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], ...updates };
    onChange(newActions);
  };

  const removeAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    onChange(newActions);
  };

  const renderActionConfig = (action: RuleAction, index: number) => {
    switch (action.type) {
      case 'webhook':
        return (
          <div className="space-y-4">
            <FormField label="Webhook URL" required>
              <Input
                value={action.config.url || ''}
                onChange={(e) => updateAction(index, {
                  config: { ...action.config, url: e.target.value }
                })}
                placeholder="https://example.com/webhook"
                disabled={disabled}
              />
            </FormField>

            <FormField label="HTTP Method">
              <Select
                options={[
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'PATCH', label: 'PATCH' },
                ]}
                value={action.config.method || 'POST'}
                onChange={(value) => updateAction(index, {
                  config: { ...action.config, method: value }
                })}
                disabled={disabled}
              />
            </FormField>

            <FormField label="Headers (JSON)">
              <Textarea
                value={action.config.headers ? JSON.stringify(action.config.headers, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const headers = e.target.value ? JSON.parse(e.target.value) : {};
                    updateAction(index, {
                      config: { ...action.config, headers }
                    });
                  } catch {
                    // Invalid JSON, keep the text value for editing
                  }
                }}
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
                disabled={disabled}
              />
            </FormField>
          </div>
        );

      case 'notify':
        return (
          <div className="space-y-4">
            <FormField label="Notification Title" required>
              <Input
                value={action.config.title || ''}
                onChange={(e) => updateAction(index, {
                  config: { ...action.config, title: e.target.value }
                })}
                placeholder="Rule triggered"
                disabled={disabled}
              />
            </FormField>

            <FormField label="Message" required>
              <Textarea
                value={action.config.message || ''}
                onChange={(e) => updateAction(index, {
                  config: { ...action.config, message: e.target.value }
                })}
                placeholder="A rule has been triggered for record {{record.id}}"
                rows={3}
                disabled={disabled}
              />
            </FormField>

            <FormField label="Priority">
              <Select
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
                value={action.config.priority || 'normal'}
                onChange={(value) => updateAction(index, {
                  config: { ...action.config, priority: value }
                })}
                disabled={disabled}
              />
            </FormField>
          </div>
        );

      case 'tag':
        return (
          <div className="space-y-4">
            <FormField label="Tag Name" required>
              <Input
                value={action.config.tag || ''}
                onChange={(e) => updateAction(index, {
                  config: { ...action.config, tag: e.target.value }
                })}
                placeholder="high-priority"
                disabled={disabled}
              />
            </FormField>

            <FormField label="Tag Color">
              <Select
                options={[
                  { value: 'red', label: 'Red' },
                  { value: 'orange', label: 'Orange' },
                  { value: 'yellow', label: 'Yellow' },
                  { value: 'green', label: 'Green' },
                  { value: 'blue', label: 'Blue' },
                  { value: 'purple', label: 'Purple' },
                  { value: 'gray', label: 'Gray' },
                ]}
                value={action.config.color || 'blue'}
                onChange={(value) => updateAction(index, {
                  config: { ...action.config, color: value }
                })}
                disabled={disabled}
              />
            </FormField>
          </div>
        );

      case 'rate':
        const ratingFields = entity?.fields?.filter(field => field.type === 'rating') || [];
        
        return (
          <div className="space-y-4">
            <FormField label="Rating Field" required>
              <Select
                options={ratingFields.map(field => ({
                  value: field.key,
                  label: field.name,
                }))}
                value={action.config.field || ''}
                onChange={(value) => updateAction(index, {
                  config: { ...action.config, field: value }
                })}
                placeholder="Select rating field"
                disabled={disabled}
              />
            </FormField>

            <FormField label="Rating Value" required>
              <Select
                options={[
                  { value: '1', label: '1 Star' },
                  { value: '2', label: '2 Stars' },
                  { value: '3', label: '3 Stars' },
                  { value: '4', label: '4 Stars' },
                  { value: '5', label: '5 Stars' },
                ]}
                value={String(action.config.value || '')}
                onChange={(value) => updateAction(index, {
                  config: { ...action.config, value: parseInt(value) }
                })}
                disabled={disabled}
              />
            </FormField>
          </div>
        );

      case 'slack':
        return (
          <div className="space-y-4">
            <FormField label="Slack Webhook URL" required>
              <Input
                value={action.config.webhook_url || ''}
                onChange={(e) => updateAction(index, {
                  config: { ...action.config, webhook_url: e.target.value }
                })}
                placeholder="https://hooks.slack.com/services/..."
                disabled={disabled}
              />
            </FormField>

            <FormField label="Channel">
              <Input
                value={action.config.channel || ''}
                onChange={(e) => updateAction(index, {
                  config: { ...action.config, channel: e.target.value }
                })}
                placeholder="#general"
                disabled={disabled}
              />
            </FormField>

            <FormField label="Message" required>
              <Textarea
                value={action.config.text || ''}
                onChange={(e) => updateAction(index, {
                  config: { ...action.config, text: e.target.value }
                })}
                placeholder="Rule triggered for record {{record.id}}"
                rows={3}
                disabled={disabled}
              />
            </FormField>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            Configuration for {action.type} actions is not yet implemented.
          </div>
        );
    }
  };

  const actionTypeOptions = ACTION_TYPES.map(type => ({
    value: type.value,
    label: type.label,
  }));

  return (
    <div className="space-y-4">
      {actions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No actions defined yet.</p>
          <p className="text-sm">Add actions to specify what should happen when conditions are met.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map((action, index) => {
            const actionType = ACTION_TYPES.find(type => type.value === action.type);

            return (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {actionType?.icon}
                    <h4 className="font-medium">
                      Action {index + 1}: {actionType?.label}
                    </h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(index)}
                    disabled={disabled}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <FormField label="Action Type" required>
                    <Select
                      options={actionTypeOptions}
                      value={action.type}
                      onChange={(value) => updateAction(index, { 
                        type: value as ActionType,
                        config: {}, // Reset config when type changes
                      })}
                      disabled={disabled}
                    />
                  </FormField>

                  {renderActionConfig(action, index)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={addAction}
          disabled={disabled}
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Add Action
        </Button>
      </div>

      {actions.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          All actions will be executed when the rule conditions are met
        </div>
      )}
    </div>
  );
}
