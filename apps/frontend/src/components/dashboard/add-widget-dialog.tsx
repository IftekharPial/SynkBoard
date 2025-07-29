/**
 * Add Widget Dialog Component for SynkBoard
 * Dialog for creating new dashboard widgets with configuration
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  FormField,
  FormGroup,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { useEntities, useCreateWidget } from '@/hooks/use-api';
import { getWidgetTypeIcon, getWidgetTypeDescription } from './widget-renderer';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { CreateWidget, WidgetType, MetricType } from '@synkboard/types';

export interface AddWidgetDialogProps {
  dashboardId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const WIDGET_TYPES: { value: WidgetType; label: string; description: string }[] = [
  { value: 'kpi', label: 'KPI', description: 'Key Performance Indicator with trend' },
  { value: 'bar', label: 'Bar Chart', description: 'Compare categories with bars' },
  { value: 'line', label: 'Line Chart', description: 'Show trends over time' },
  { value: 'pie', label: 'Pie Chart', description: 'Show proportions as slices' },
  { value: 'table', label: 'Table', description: 'Display data in rows and columns' },
  { value: 'list', label: 'List', description: 'Simple list of items' },
];

const METRIC_TYPES: { value: MetricType; label: string }[] = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

export function AddWidgetDialog({ dashboardId, onClose, onSuccess }: AddWidgetDialogProps) {
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    entity_id: '',
    metric_type: 'count' as MetricType,
    target_field: '',
    is_public: false,
    refresh_rate: 30,
  });

  const { data: entities } = useEntities();
  const createWidget = useCreateWidget();

  const entityOptions = entities?.data?.entities?.map(entity => ({
    value: entity.id,
    label: entity.name,
  })) || [];

  const selectedEntity = entities?.data?.entities?.find(e => e.id === formData.entity_id);
  const fieldOptions = selectedEntity?.fields?.map(field => ({
    value: field.key,
    label: field.name,
  })) || [];

  const handleTypeSelect = (type: WidgetType) => {
    setSelectedType(type);
    setFormData(prev => ({
      ...prev,
      title: prev.title || `New ${type.toUpperCase()} Widget`,
    }));
    setStep('config');
  };

  const handleSubmit = async () => {
    if (!selectedType || !formData.entity_id || !formData.title) {
      return;
    }

    try {
      const widgetData: CreateWidget = {
        dashboard_id: dashboardId,
        entity_id: formData.entity_id,
        type: selectedType,
        title: formData.title,
        config: {
          entity_slug: selectedEntity?.slug || '',
          metric_type: formData.metric_type,
          target_field: formData.target_field || undefined,
          ...(selectedType === 'kpi' && {
            show_trend: true,
            trend_period_days: 7,
          }),
        },
        is_public: formData.is_public,
        refresh_rate: formData.refresh_rate,
        position: {
          x: 0,
          y: 0,
          w: getDefaultWidth(selectedType),
          h: getDefaultHeight(selectedType),
        },
      };

      await createWidget.mutateAsync(widgetData);
      onSuccess();
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {step === 'type' ? 'Choose Widget Type' : 'Configure Widget'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {step === 'type' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select the type of widget you want to add to your dashboard.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {WIDGET_TYPES.map((type) => (
                <Card
                  key={type.value}
                  className="cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                  onClick={() => handleTypeSelect(type.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">
                        {getWidgetTypeIcon(type.value)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">
                          {type.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 'config' && selectedType && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Widget Type:</span>
              <span className="font-medium text-foreground">
                {getWidgetTypeIcon(selectedType)} {WIDGET_TYPES.find(t => t.value === selectedType)?.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('type')}
                className="text-xs"
              >
                Change
              </Button>
            </div>

            <FormGroup>
              <FormField label="Widget Title" required>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter widget title"
                />
              </FormField>

              <FormField label="Data Source" required>
                <Select
                  options={entityOptions}
                  value={formData.entity_id}
                  onChange={(value) => setFormData(prev => ({ ...prev, entity_id: value }))}
                  placeholder="Select an entity"
                />
              </FormField>

              <FormField label="Metric Type" required>
                <Select
                  options={METRIC_TYPES}
                  value={formData.metric_type}
                  onChange={(value) => setFormData(prev => ({ ...prev, metric_type: value as MetricType }))}
                />
              </FormField>

              {formData.metric_type !== 'count' && (
                <FormField label="Target Field">
                  <Select
                    options={fieldOptions}
                    value={formData.target_field}
                    onChange={(value) => setFormData(prev => ({ ...prev, target_field: value }))}
                    placeholder="Select a field"
                    disabled={!formData.entity_id}
                  />
                </FormField>
              )}

              <FormField label="Refresh Rate (seconds)">
                <Select
                  options={[
                    { value: '30', label: '30 seconds' },
                    { value: '60', label: '1 minute' },
                    { value: '300', label: '5 minutes' },
                    { value: '900', label: '15 minutes' },
                    { value: '3600', label: '1 hour' },
                  ]}
                  value={String(formData.refresh_rate)}
                  onChange={(value) => setFormData(prev => ({ ...prev, refresh_rate: parseInt(value) }))}
                />
              </FormField>

              <FormField label="Visibility">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="visibility"
                      checked={!formData.is_public}
                      onChange={() => setFormData(prev => ({ ...prev, is_public: false }))}
                      className="h-4 w-4 text-primary focus:ring-primary border-border"
                    />
                    <span className="text-sm">Private (dashboard visibility)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="visibility"
                      checked={formData.is_public}
                      onChange={() => setFormData(prev => ({ ...prev, is_public: true }))}
                      className="h-4 w-4 text-primary focus:ring-primary border-border"
                    />
                    <span className="text-sm">Public (always visible)</span>
                  </label>
                </div>
              </FormField>
            </FormGroup>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep('type')}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                loading={createWidget.isPending}
                disabled={!formData.title || !formData.entity_id}
              >
                Create Widget
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for default widget sizes
function getDefaultWidth(type: WidgetType): number {
  switch (type) {
    case 'kpi':
      return 3;
    case 'pie':
      return 4;
    case 'bar':
    case 'line':
      return 6;
    case 'table':
    case 'list':
      return 8;
    default:
      return 4;
  }
}

function getDefaultHeight(type: WidgetType): number {
  switch (type) {
    case 'kpi':
      return 2;
    case 'pie':
      return 4;
    case 'bar':
    case 'line':
      return 4;
    case 'table':
    case 'list':
      return 5;
    default:
      return 3;
  }
}
