/**
 * User Management Page for SynkBoard
 * Manage tenant users, roles, and permissions
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
  Table,
} from '@/components/ui';
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'analyst' | 'viewer';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@demo.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2 hours ago',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'John Editor',
      email: 'john@demo.com',
      role: 'editor',
      status: 'active',
      lastLogin: '1 day ago',
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      name: 'Sarah Analyst',
      email: 'sarah@demo.com',
      role: 'analyst',
      status: 'active',
      lastLogin: '3 days ago',
      createdAt: '2024-01-25',
    },
    {
      id: '4',
      name: 'Mike Viewer',
      email: 'mike@demo.com',
      role: 'viewer',
      status: 'inactive',
      lastLogin: '1 week ago',
      createdAt: '2024-02-01',
    },
  ]);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'editor': return 'default';
      case 'analyst': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'active' ? 'success' : 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions for your tenant
          </p>
        </div>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UsersIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">3</p>
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
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Last Login</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={getRoleBadgeVariant(user.role) as any}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusBadgeVariant(user.status) as any}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {user.lastLogin}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {user.createdAt}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
