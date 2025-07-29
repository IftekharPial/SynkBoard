/**
 * Rule Test Dialog Component for SynkBoard
 * Dialog for testing rule logic with sample data before deployment
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  FormField,
  Textarea,
  Badge,
} from '@/components/ui';
import { useTestRule } from '@/hooks/use-api';
import {
  XMarkIcon,
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { EntityWithFields, RuleCondition, RuleAction } from '@synkboard/types';

export interface RuleTestDialogProps {
  entity: EntityWithFields;
  conditions: RuleCondition[];
  actions: RuleAction[];
  onClose: () => void;
}

interface TestResult {
  matched: boolean;
  conditions_met: number;
  total_conditions: number;
  actions_would_execute: number;
  evaluation_details: Array<{
    condition: RuleCondition;
    matched: boolean;
    reason?: string;
  }>;
}

export function RuleTestDialog({
  entity,
  conditions,
  actions,
  onClose,
}: RuleTestDialogProps) {
  const [testData, setTestData] = useState<string>('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const testRule = useTestRule();

  const generateSampleData = () => {
    const sampleFields: Record<string, any> = {};
    
    entity.fields?.forEach(field => {
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

    setTestData(JSON.stringify(sampleFields, null, 2));
  };

  const handleTest = async () => {
    if (!testData.trim()) return;

    try {
      const parsedData = JSON.parse(testData);
      
      const response = await testRule.mutateAsync({
        conditions,
        actions,
        test_data: parsedData,
      });

      setTestResult(response.data);
    } catch (error: any) {
      console.error('Rule test failed:', error);
    }
  };

  const isValidJson = () => {
    try {
      JSON.parse(testData);
      return true;
    } catch {
      return false;
    }
  };

  const getConditionResultIcon = (matched: boolean) => {
    return matched ? (
      <CheckCircleIcon className="h-4 w-4 text-success" />
    ) : (
      <XCircleIcon className="h-4 w-4 text-destructive" />
    );
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <BeakerIcon className="h-5 w-5" />
              <span>Test Rule Logic</span>
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
          {/* Rule Summary */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">Rule Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Entity:</span>
                <span className="ml-2 font-medium">{entity.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Conditions:</span>
                <span className="ml-2 font-medium">{conditions.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Actions:</span>
                <span className="ml-2 font-medium">{actions.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Logic:</span>
                <span className="ml-2 font-medium">ALL conditions must match</span>
              </div>
            </div>
          </div>

          {/* Test Data Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <FormField label="Test Data (JSON)" required>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSampleData}
                  >
                    Generate Sample
                  </Button>
                </div>
              </FormField>
            </div>

            <Textarea
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder={`{
  "field1": "value1",
  "field2": 42,
  "field3": true
}`}
              rows={8}
              className="font-mono text-sm"
            />
            
            {testData && !isValidJson() && (
              <div className="mt-2 text-sm text-destructive">
                Invalid JSON format
              </div>
            )}
          </div>

          {/* Entity Fields Reference */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-3">
              Available Fields for {entity.name}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {entity.fields?.map(field => (
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

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-lg p-4 ${
              testResult.matched 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-muted border border-border'
            }`}>
              <div className="flex items-center space-x-2 mb-4">
                {testResult.matched ? (
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                ) : (
                  <InformationCircleIcon className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`font-medium ${
                  testResult.matched ? 'text-success' : 'text-foreground'
                }`}>
                  {testResult.matched ? 'Rule would trigger!' : 'Rule would not trigger'}
                </span>
                <Badge variant="outline" size="sm">
                  {testResult.conditions_met}/{testResult.total_conditions} conditions met
                </Badge>
                {testResult.matched && (
                  <Badge variant="success" size="sm">
                    {testResult.actions_would_execute} actions would execute
                  </Badge>
                )}
              </div>

              {/* Condition Details */}
              <div>
                <h5 className="font-medium text-foreground mb-3">Condition Results:</h5>
                <div className="space-y-2">
                  {testResult.evaluation_details.map((detail, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      {getConditionResultIcon(detail.matched)}
                      <div className="flex-1">
                        <span className="font-mono">
                          {detail.condition.field} {detail.condition.operator} {
                            typeof detail.condition.value === 'object' 
                              ? JSON.stringify(detail.condition.value)
                              : String(detail.condition.value)
                          }
                        </span>
                        {detail.reason && (
                          <div className="text-muted-foreground text-xs mt-1">
                            {detail.reason}
                          </div>
                        )}
                      </div>
                      <Badge 
                        variant={detail.matched ? 'success' : 'secondary'} 
                        size="sm"
                      >
                        {detail.matched ? 'Match' : 'No match'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Preview */}
              {testResult.matched && actions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h5 className="font-medium text-foreground mb-3">Actions that would execute:</h5>
                  <div className="space-y-2">
                    {actions.map((action, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Badge variant="primary" size="sm">
                          {action.type}
                        </Badge>
                        <span className="text-muted-foreground">
                          {action.type === 'webhook' && `POST to ${action.config.url}`}
                          {action.type === 'notify' && `Notification: ${action.config.title}`}
                          {action.type === 'tag' && `Add tag: ${action.config.tag}`}
                          {action.type === 'rate' && `Set ${action.config.field} = ${action.config.value}`}
                          {action.type === 'slack' && `Slack message to ${action.config.channel || 'default channel'}`}
                        </span>
                      </div>
                    ))}
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
              loading={testRule.isPending}
              disabled={!testData.trim() || !isValidJson()}
              leftIcon={<BeakerIcon className="h-4 w-4" />}
            >
              Test Rule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
