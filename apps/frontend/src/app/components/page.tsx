/**
 * UI Components showcase page for SynkBoard
 * Demonstrates all available UI components
 */

'use client';

import React from 'react';
import { 
  Button, 
  Input, 
  PasswordInput, 
  Textarea, 
  Select, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  ConfirmDialog,
  Loading,
  Spinner,
  Skeleton,
  SkeletonCard,
  Table,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  DashboardCard,
  Badge,
  StatusBadge,
  RoleBadge,
  Avatar,
  UserAvatar,
  AvatarGroup,
  Breadcrumb,
  Tabs,
  TabsContent,
  Dropdown,
  DropdownButton,
  Form,
  FormField,
  FormGroup,
  FormActions,
  useForm,
  Progress,
  CircularProgress,
  StepProgress,
  DatePicker,
  DateRangePicker,
} from '@/components/ui';
import { 
  PlusIcon, 
  UserIcon, 
  ChartBarIcon, 
  CogIcon,
  HomeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function ComponentsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState('buttons');
  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const [dateRange, setDateRange] = React.useState<{start?: Date; end?: Date}>({});

  const form = useForm({
    name: '',
    email: '',
    message: '',
  }, {
    name: { required: true, minLength: 2 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    message: { required: true, minLength: 10 },
  });

  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'editor', status: 'active' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'viewer', status: 'inactive' },
  ];

  const tableColumns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { 
      key: 'role', 
      title: 'Role', 
      render: (value: string) => <RoleBadge role={value as any} />
    },
    { 
      key: 'status', 
      title: 'Status', 
      render: (value: string) => <StatusBadge status={value as any} />
    },
  ];

  const tabItems = [
    { value: 'buttons', label: 'Buttons', icon: <PlusIcon className="h-4 w-4" /> },
    { value: 'forms', label: 'Forms', icon: <DocumentTextIcon className="h-4 w-4" /> },
    { value: 'data', label: 'Data Display', icon: <ChartBarIcon className="h-4 w-4" /> },
    { value: 'feedback', label: 'Feedback', icon: <CogIcon className="h-4 w-4" /> },
  ];

  const dropdownItems = [
    { key: 'edit', label: 'Edit', onClick: () => console.log('Edit') },
    { key: 'duplicate', label: 'Duplicate', onClick: () => console.log('Duplicate') },
    { key: 'separator', separator: true },
    { key: 'delete', label: 'Delete', destructive: true, onClick: () => setConfirmOpen(true) },
  ];

  const breadcrumbItems = [
    { label: 'Components', href: '/components' },
    { label: 'UI Library', current: true },
  ];

  const stepProgressSteps = [
    { title: 'Setup', description: 'Configure your account', status: 'complete' as const },
    { title: 'Customize', description: 'Personalize your experience', status: 'current' as const },
    { title: 'Launch', description: 'Go live with your setup', status: 'pending' as const },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Breadcrumb items={breadcrumbItems} />
        <h1 className="text-3xl font-bold text-foreground mt-4">UI Components</h1>
        <p className="text-muted-foreground">
          Comprehensive showcase of all available UI components in SynkBoard.
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs
        items={tabItems}
        value={selectedTab}
        onValueChange={setSelectedTab}
        variant="underline"
      />

      {/* Buttons Tab */}
      {selectedTab === 'buttons' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button loading>Loading</Button>
                <Button leftIcon={<PlusIcon className="h-4 w-4" />}>With Icon</Button>
                <Button disabled>Disabled</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dropdowns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <DropdownButton items={dropdownItems}>
                  Actions
                </DropdownButton>
                
                <Dropdown
                  trigger={<Button variant="outline">Custom Trigger</Button>}
                  items={dropdownItems}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forms Tab */}
      {selectedTab === 'forms' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Components</CardTitle>
            </CardHeader>
            <CardContent>
              <Form onSubmit={(e) => { e.preventDefault(); form.validateAll(); }}>
                <FormGroup title="Basic Information">
                  <FormField label="Name" required>
                    <Input {...form.getFieldProps('name')} placeholder="Enter your name" />
                  </FormField>
                  
                  <FormField label="Email" required>
                    <Input 
                      {...form.getFieldProps('email')} 
                      type="email" 
                      placeholder="Enter your email" 
                    />
                  </FormField>
                  
                  <FormField label="Password">
                    <PasswordInput placeholder="Enter password" />
                  </FormField>
                  
                  <FormField label="Role">
                    <Select
                      options={[
                        { value: 'admin', label: 'Administrator' },
                        { value: 'editor', label: 'Editor' },
                        { value: 'viewer', label: 'Viewer' },
                      ]}
                      value=""
                      onChange={() => {}}
                      placeholder="Select a role"
                    />
                  </FormField>
                  
                  <FormField label="Message" required>
                    <Textarea 
                      {...form.getFieldProps('message')} 
                      placeholder="Enter your message" 
                    />
                  </FormField>
                  
                  <FormField label="Date">
                    <DatePicker
                      value={selectedDate}
                      onChange={setSelectedDate}
                      placeholder="Select date"
                    />
                  </FormField>
                  
                  <FormField label="Date Range">
                    <DateRangePicker
                      startDate={dateRange.start}
                      endDate={dateRange.end}
                      onChange={(start, end) => setDateRange({ start, end })}
                      placeholder="Select date range"
                    />
                  </FormField>
                </FormGroup>
                
                <FormActions>
                  <Button variant="outline" type="button">Cancel</Button>
                  <Button type="submit">Submit</Button>
                </FormActions>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Data Display Tab */}
      {selectedTab === 'data' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={1234}
              icon={<UserIcon className="h-6 w-6" />}
              trend={{ value: 12, isPositive: true, label: 'vs last month' }}
            />
            <StatCard
              title="Revenue"
              value="$45,678"
              icon={<ChartBarIcon className="h-6 w-6" />}
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard
              title="Conversion Rate"
              value="3.2%"
              trend={{ value: 2, isPositive: false }}
            />
            <StatCard
              title="Active Sessions"
              value={89}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
            </CardHeader>
            <CardContent>
              <Table
                columns={tableColumns}
                data={tableData}
                pagination={{
                  current: 1,
                  pageSize: 10,
                  total: 3,
                  onChange: () => {},
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Badges & Avatars</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <StatusBadge status="active" />
                <StatusBadge status="pending" />
                <RoleBadge role="admin" />
              </div>
              
              <div className="flex items-center gap-4">
                <Avatar name="John Doe" />
                <UserAvatar 
                  user={{ name: 'Jane Smith', email: 'jane@example.com' }}
                  status="online"
                  showStatus
                />
                <AvatarGroup max={3}>
                  <Avatar name="User 1" />
                  <Avatar name="User 2" />
                  <Avatar name="User 3" />
                  <Avatar name="User 4" />
                  <Avatar name="User 5" />
                </AvatarGroup>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Tab */}
      {selectedTab === 'feedback' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading States</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Spinner />
                <Spinner size="lg" />
                <Loading text="Loading data..." />
              </div>
              
              <div className="space-y-2">
                <Skeleton variant="heading" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="75%" />
              </div>
              
              <SkeletonCard />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress Indicators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Progress value={65} showLabel label="Upload Progress" />
                <Progress value={30} variant="warning" showLabel />
                <Progress value={85} variant="success" showLabel />
              </div>
              
              <div className="flex items-center gap-8">
                <CircularProgress value={75} label="Completion" />
                <CircularProgress value={45} variant="warning" size={80} />
              </div>
              
              <StepProgress steps={stepProgressSteps} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dialogs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => setDialogOpen(true)}>
                  Open Dialog
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Example Dialog</DialogTitle>
            <DialogDescription>
              This is an example dialog with various content and actions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Dialog content goes here. You can include forms, lists, or any other content.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDialogOpen(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => console.log('Item deleted')}
      />
    </div>
  );
}
