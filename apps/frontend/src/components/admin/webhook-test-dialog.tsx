/**
 * Webhook Test Dialog Component for SynkBoard
 * Dialog for testing webhook endpoints with sample payloads
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  FormField,
  FormGroup,
  Input,
  Select,
  Textarea,
  Badge,
} from '@/components/ui';
import { useEntities } from '@/hooks/use-api';
import { api } from '@/lib/api';
import { XMarkIcon, BeakerIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { EntityWithFields } from '@synkboard/types';

export interface WebhookTestDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface TestResult {
  success: boolean;
  status: number;
  message: string;
  duration: number;
  response?: any;
  error?: string;
}

export function WebhookTestDialog({ onClose, onSuccess }: WebhookTestDialogProps) {
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [payload, setPayload] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const { data: entities } = useEntities();

  const entityOptions = entities?.data?.entities?.map(entity => ({
    value: entity.slug,
    label: entity.name,
  })) || [];

  const selectedEntityData = entities?.data?.entities?.find(
    (e: EntityWithFields) => e.slug === selectedEntity
  );

  const generateSamplePayload = () => {
    if (!selectedEntityData) return;

    const sampleFields: Record<string, any> = {};
    
    selectedEntityData.fields?.forEach(field => {
      switch (field.type) {
        case 'text':
          sampleFields[field.key] = `Sample ${field.name.toLowerCase()}`;
          break;
        case 'number':
          sampleFields[field.key] = Math.floor(Math.random() * 100);
          break;
        case 'boolean':
          sampleFields[field.key] = Math.random() > 0.5;
          break;
        case 'date':
          sampleFields[field.key] = new Date().toISOString();
          break;
        case 'select':
          if (field.options && field.options.length > 0) {
            sampleFields[field.key] = field.options[0];
          }
          break;
        case 'multiselect':
          if (field.options && field.options.length > 0) {
            sampleFields[field.key] = [field.options[0]];
          }
          break;
        case 'rating':
          sampleFields[field.key] = Math.floor(Math.random() * 5) + 1;
          break;
        case 'user':
          sampleFields[field.key] = 'sample-user-id';
          break;
        case 'json':
          sampleFields[field.key] = { key: 'value', number: 42 };
          break;
        default:
          sampleFields[field.key] = `Sample ${field.type}`;
      }
    });

    const samplePayload = {
      entity: selectedEntity,
      fields: sampleFields,
    };

    setPayload(JSON.stringify(samplePayload, null, 2));
  };

  const handleTest = async () => {
    if (!payload.trim()) return;

    setIsLoading(true);
    setTestResult(null);

    try {
      const parsedPayload = JSON.parse(payload);
      const startTime = Date.now();
      
      const response = await api.webhooks.testEndpoint(parsedPayload);
      const duration = Date.now() - startTime;

      setTestResult({
        success: true,
        status: 200,
        message: 'Webhook test successful',
        duration,
        response: response.data,
      });

      onSuccess();
    } catch (error: any) {
      const duration = Date.now() - Date.now();
      
      setTestResult({
        success: false,
        status: error.status || 500,
        message: error.message || 'Webhook test failed',
        duration,
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidJson = () => {
    try {
      JSON.parse(payload);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <BeakerIcon className="h-5 w-5" />
              <span>Test Webhook Endpoint</span>
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

        <div className="space-y-6">
          {/* Entity Selection */}
          <FormGroup>
            <FormField label="Target Entity" required>
              <Select
                options={entityOptions}
                value={selectedEntity}
                onChange={setSelectedEntity}
                placeholder="Select an entity to test"
              />
            </FormField>

            {selectedEntity && (
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateSamplePayload}
                >
                  Generate Sample Payload
                </Button>
              </div>
            )}
          </FormGroup>

          {/* Payload Editor */}
          <FormField 
            label="Webhook Payload" 
            required
            description="JSON payload to send to the webhook endpoint"
          >
            <Textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder={`{
  "entity": "your-entity-slug",
  "fields": {
    "field1": "value1",
    "field2": "value2"
  }
}`}
              rows={12}
              className="font-mono text-sm"
            />
            
            {payload && !isValidJson() && (
              <div className="mt-2 text-sm text-destructive">
                Invalid JSON format
              </div>
            )}
          </FormField>

          {/* Entity Fields Reference */}
          {selectedEntityData && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-3">
                Available Fields for {selectedEntityData.name}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedEntityData.fields?.map(field => (
                  <div key={field.id} className="flex items-center space-x-2 text-sm">
                    <Badge variant="outline" size="sm">
                      {field.type}
                    </Badge>
                    <span className="font-mono">{field.key}</span>
                    <span className="text-muted-foreground">({field.name})</span>
                    {field.is_required && (
                      <Badge variant="destructive" size="sm">Required</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-lg p-4 ${
              testResult.success 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                {testResult.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-destructive" />
                )}
                <span className={`font-medium ${
                  testResult.success ? 'text-success' : 'text-destructive'
                }`}>
                  {testResult.message}
                </span>
                <Badge variant="outline" size="sm">
                  {testResult.status}
                </Badge>
                <Badge variant="secondary" size="sm">
                  {testResult.duration}ms
                </Badge>
              </div>

              {testResult.response && (
                <div>
                  <h5 className="font-medium text-foreground mb-2">Response:</h5>
                  <pre className="bg-background rounded p-3 text-sm overflow-x-auto">
                    {JSON.stringify(testResult.response, null, 2)}
                  </pre>
                </div>
              )}

              {testResult.error && (
                <div>
                  <h5 className="font-medium text-destructive mb-2">Error:</h5>
                  <div className="bg-background rounded p-3 text-sm text-destructive">
                    {testResult.error}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleTest}
              loading={isLoading}
              disabled={!payload.trim() || !isValidJson()}
              leftIcon={<BeakerIcon className="h-4 w-4" />}
            >
              Test Webhook
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
