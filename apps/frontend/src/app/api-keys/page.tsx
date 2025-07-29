/**
 * API Keys Management Page for SynkBoard
 * Manage API keys for webhook integrations and external access
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@/components/ui';
import {
  KeyIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  status: 'active' | 'inactive';
  lastUsed: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { user } = useAuth();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Webhook Integration',
      key: 'sk_live_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
      permissions: ['webhook:create', 'entity:read'],
      status: 'active',
      lastUsed: '2 hours ago',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Analytics API',
      key: 'sk_live_xyz987wvu654tsr321qpo098nml765kji432hgf109edc876ba',
      permissions: ['dashboard:read', 'entity:read'],
      status: 'active',
      lastUsed: '1 day ago',
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      name: 'Legacy Integration',
      key: 'sk_live_old123old456old789old012old345old678old901old234old',
      permissions: ['entity:read'],
      status: 'inactive',
      lastUsed: '2 weeks ago',
      createdAt: '2023-12-01',
    },
  ]);

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '•'.repeat(20) + key.substring(key.length - 8);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground">
            Manage API keys for external integrations and webhook access
          </p>
        </div>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <KeyIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Total Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium">{apiKey.name}</h3>
                    <Badge variant={apiKey.status === 'active' ? 'success' : 'secondary'}>
                      {apiKey.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <code className="bg-muted px-3 py-1 rounded text-sm font-mono">
                      {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {showKeys[apiKey.id] ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.key)}
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {apiKey.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" size="sm">
                        {permission}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Last used: {apiKey.lastUsed}</span>
                    <span>Created: {apiKey.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Notice */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="h-5 w-5 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
              <div className="h-2 w-2 bg-yellow-600 rounded-full"></div>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Security Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep your API keys secure and never share them publicly</li>
                <li>• Rotate keys regularly and deactivate unused keys</li>
                <li>• Use the minimum required permissions for each key</li>
                <li>• Monitor API key usage and investigate unusual activity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
