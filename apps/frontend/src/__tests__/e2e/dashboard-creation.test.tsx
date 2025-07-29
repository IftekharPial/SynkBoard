/**
 * Dashboard Creation End-to-End Test Suite
 * Tests complete dashboard creation workflow from entity to visualization
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => '/dashboards/new',
}));

// Mock API responses
const mockApiResponses = {
  entities: {
    data: {
      entities: [
        global.testUtils.generateTestEntity({
          id: 'entity-1',
          name: 'Sales Data',
          slug: 'sales-data',
          fields: [
            {
              id: 'field-1',
              key: 'amount',
              name: 'Amount',
              type: 'number',
              is_required: true,
              options: null,
            },
            {
              id: 'field-2',
              key: 'status',
              name: 'Status',
              type: 'select',
              is_required: false,
              options: ['pending', 'completed', 'cancelled'],
            },
          ],
        }),
      ],
    },
  },
  createDashboard: {
    data: {
      dashboard: global.testUtils.generateTestDashboard({
        id: 'new-dashboard-id',
        name: 'Sales Dashboard',
        slug: 'sales-dashboard',
      }),
    },
  },
  createWidget: {
    data: {
      widget: global.testUtils.generateTestWidget({
        id: 'new-widget-id',
        type: 'kpi',
        config: { metric: 'sum', field: 'amount', title: 'Total Sales' },
      }),
    },
  },
  widgetData: {
    data: {
      value: 125000,
      trend: 12.5,
      previous_value: 111111,
    },
  },
};

// Mock API hooks
jest.mock('@/hooks/use-api', () => ({
  useEntities: () => ({
    data: mockApiResponses.entities,
    isLoading: false,
    error: null,
  }),
  useCreateDashboard: () => ({
    mutateAsync: jest.fn().mockResolvedValue(mockApiResponses.createDashboard),
    isPending: false,
  }),
  useCreateWidget: () => ({
    mutateAsync: jest.fn().mockResolvedValue(mockApiResponses.createWidget),
    isPending: false,
  }),
  useWidgetData: () => ({
    data: mockApiResponses.widgetData,
    isLoading: false,
    error: null,
  }),
  useDashboard: () => ({
    data: { data: { dashboard: mockApiResponses.createDashboard.data.dashboard } },
    isLoading: false,
    error: null,
  }),
}));

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({
    user: global.testUtils.mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
  usePermissions: () => ({
    hasPermission: jest.fn().mockReturnValue(true),
  }),
}));

// Import components after mocks
import DashboardCreatePage from '@/app/dashboards/new/page';
import DashboardViewPage from '@/app/dashboards/[slug]/page';

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Creation E2E Workflow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Dashboard Creation Flow', () => {
    it('should create dashboard and add widgets through complete user journey', async () => {
      const mockCreateDashboard = jest.fn().mockResolvedValue(mockApiResponses.createDashboard);
      const mockCreateWidget = jest.fn().mockResolvedValue(mockApiResponses.createWidget);

      jest.mocked(require('@/hooks/use-api').useCreateDashboard).mockReturnValue({
        mutateAsync: mockCreateDashboard,
        isPending: false,
      });

      jest.mocked(require('@/hooks/use-api').useCreateWidget).mockReturnValue({
        mutateAsync: mockCreateWidget,
        isPending: false,
      });

      // Step 1: Render dashboard creation page
      render(<DashboardCreatePage />, { wrapper: createTestWrapper() });

      // Verify page loads correctly
      expect(screen.getByRole('heading', { name: /create dashboard/i })).toBeInTheDocument();

      // Step 2: Fill in dashboard details
      const nameInput = screen.getByLabelText(/dashboard name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(nameInput, 'Sales Dashboard');
      await user.type(descriptionInput, 'Dashboard for tracking sales metrics');

      // Verify slug is auto-generated
      const slugInput = screen.getByLabelText(/slug/i);
      await waitFor(() => {
        expect(slugInput).toHaveValue('sales-dashboard');
      });

      // Step 3: Set dashboard visibility
      const publicRadio = screen.getByLabelText(/public/i);
      await user.click(publicRadio);

      // Step 4: Submit dashboard creation
      const createButton = screen.getByRole('button', { name: /create dashboard/i });
      await user.click(createButton);

      // Verify dashboard creation API call
      await waitFor(() => {
        expect(mockCreateDashboard).toHaveBeenCalledWith({
          name: 'Sales Dashboard',
          slug: 'sales-dashboard',
          description: 'Dashboard for tracking sales metrics',
          is_public: true,
        });
      });

      // Verify navigation to dashboard view
      expect(mockPush).toHaveBeenCalledWith('/dashboards/sales-dashboard');
    });

    it('should handle dashboard creation with widget addition', async () => {
      const mockCreateDashboard = jest.fn().mockResolvedValue(mockApiResponses.createDashboard);
      const mockCreateWidget = jest.fn().mockResolvedValue(mockApiResponses.createWidget);

      jest.mocked(require('@/hooks/use-api').useCreateDashboard).mockReturnValue({
        mutateAsync: mockCreateDashboard,
        isPending: false,
      });

      jest.mocked(require('@/hooks/use-api').useCreateWidget).mockReturnValue({
        mutateAsync: mockCreateWidget,
        isPending: false,
      });

      // Step 1: Create dashboard (simulate successful creation)
      render(<DashboardCreatePage />, { wrapper: createTestWrapper() });

      const nameInput = screen.getByLabelText(/dashboard name/i);
      await user.type(nameInput, 'Sales Dashboard');

      const createButton = screen.getByRole('button', { name: /create dashboard/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockCreateDashboard).toHaveBeenCalled();
      });

      // Step 2: Navigate to dashboard view (simulate navigation)
      const { unmount } = render(<DashboardCreatePage />, { wrapper: createTestWrapper() });
      unmount();

      // Mock dashboard with edit mode
      jest.mocked(require('@/hooks/use-api').useDashboard).mockReturnValue({
        data: {
          data: {
            dashboard: {
              ...mockApiResponses.createDashboard.data.dashboard,
              widgets: [],
            },
          },
        },
        isLoading: false,
        error: null,
      });

      render(<DashboardViewPage params={{ slug: 'sales-dashboard' }} searchParams={{ edit: 'true' }} />, {
        wrapper: createTestWrapper(),
      });

      // Step 3: Add widget to dashboard
      const addWidgetButton = screen.getByRole('button', { name: /add widget/i });
      await user.click(addWidgetButton);

      // Verify add widget dialog opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/add widget/i)).toBeInTheDocument();
      });

      // Step 4: Select widget type
      const kpiWidgetCard = screen.getByRole('button', { name: /kpi widget/i });
      await user.click(kpiWidgetCard);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Step 5: Configure widget
      const widgetTitleInput = screen.getByLabelText(/widget title/i);
      await user.type(widgetTitleInput, 'Total Sales');

      const entitySelect = screen.getByRole('combobox', { name: /entity/i });
      await user.selectOptions(entitySelect, 'entity-1');

      const metricSelect = screen.getByRole('combobox', { name: /metric/i });
      await user.selectOptions(metricSelect, 'sum');

      const fieldSelect = screen.getByRole('combobox', { name: /field/i });
      await user.selectOptions(fieldSelect, 'amount');

      // Step 6: Create widget
      const createWidgetButton = screen.getByRole('button', { name: /create widget/i });
      await user.click(createWidgetButton);

      // Verify widget creation API call
      await waitFor(() => {
        expect(mockCreateWidget).toHaveBeenCalledWith({
          dashboard_id: 'new-dashboard-id',
          entity_id: 'entity-1',
          type: 'kpi',
          config: {
            title: 'Total Sales',
            metric: 'sum',
            field: 'amount',
          },
          position: { x: 0, y: 0, w: 2, h: 2 },
          is_public: true,
        });
      });

      // Step 7: Verify widget appears on dashboard
      await waitFor(() => {
        expect(screen.getByText('Total Sales')).toBeInTheDocument();
        expect(screen.getByText('125,000')).toBeInTheDocument(); // Formatted value
        expect(screen.getByText('+12.5%')).toBeInTheDocument(); // Trend
      });
    });
  });

  describe('Dashboard Editing Workflow', () => {
    it('should handle dashboard editing and widget management', async () => {
      const mockUpdateDashboard = jest.fn().mockResolvedValue({ data: { dashboard: {} } });
      const mockDeleteWidget = jest.fn().mockResolvedValue({ data: { message: 'Widget deleted' } });

      jest.mocked(require('@/hooks/use-api').useUpdateDashboard).mockReturnValue({
        mutateAsync: mockUpdateDashboard,
        isPending: false,
      });

      jest.mocked(require('@/hooks/use-api').useDeleteWidget).mockReturnValue({
        mutateAsync: mockDeleteWidget,
        isPending: false,
      });

      // Mock dashboard with existing widgets
      const dashboardWithWidgets = {
        ...mockApiResponses.createDashboard.data.dashboard,
        widgets: [
          global.testUtils.generateTestWidget({
            id: 'widget-1',
            type: 'kpi',
            config: { title: 'Total Sales', metric: 'sum', field: 'amount' },
          }),
          global.testUtils.generateTestWidget({
            id: 'widget-2',
            type: 'bar',
            config: { title: 'Sales by Status', metric: 'count', field: 'status' },
          }),
        ],
      };

      jest.mocked(require('@/hooks/use-api').useDashboard).mockReturnValue({
        data: { data: { dashboard: dashboardWithWidgets } },
        isLoading: false,
        error: null,
      });

      // Step 1: Load dashboard in edit mode
      render(<DashboardViewPage params={{ slug: 'sales-dashboard' }} searchParams={{ edit: 'true' }} />, {
        wrapper: createTestWrapper(),
      });

      // Verify dashboard loads with widgets
      expect(screen.getByText('Total Sales')).toBeInTheDocument();
      expect(screen.getByText('Sales by Status')).toBeInTheDocument();

      // Step 2: Edit widget
      const editButtons = screen.getAllByRole('button', { name: /edit widget/i });
      await user.click(editButtons[0]);

      // Verify edit dialog opens
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Total Sales')).toBeInTheDocument();
      });

      // Update widget title
      const titleInput = screen.getByDisplayValue('Total Sales');
      await user.clear(titleInput);
      await user.type(titleInput, 'Monthly Revenue');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Verify widget update
      await waitFor(() => {
        expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
      });

      // Step 3: Delete widget
      const deleteButtons = screen.getAllByRole('button', { name: /delete widget/i });
      await user.click(deleteButtons[1]);

      // Verify confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/delete widget/i)).toBeInTheDocument();
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmDeleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmDeleteButton);

      // Verify widget deletion API call
      await waitFor(() => {
        expect(mockDeleteWidget).toHaveBeenCalledWith('widget-2');
      });

      // Step 4: Save dashboard layout
      const saveLayoutButton = screen.getByRole('button', { name: /save layout/i });
      await user.click(saveLayoutButton);

      // Verify layout save
      await waitFor(() => {
        expect(mockUpdateDashboard).toHaveBeenCalledWith(
          'sales-dashboard',
          expect.objectContaining({
            layout: expect.any(Array),
          })
        );
      });
    });
  });

  describe('Error Handling in Dashboard Workflow', () => {
    it('should handle dashboard creation errors gracefully', async () => {
      const mockCreateDashboard = jest.fn().mockRejectedValue(new Error('Dashboard creation failed'));

      jest.mocked(require('@/hooks/use-api').useCreateDashboard).mockReturnValue({
        mutateAsync: mockCreateDashboard,
        isPending: false,
      });

      render(<DashboardCreatePage />, { wrapper: createTestWrapper() });

      // Fill form and submit
      const nameInput = screen.getByLabelText(/dashboard name/i);
      await user.type(nameInput, 'Test Dashboard');

      const createButton = screen.getByRole('button', { name: /create dashboard/i });
      await user.click(createButton);

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText(/dashboard creation failed/i)).toBeInTheDocument();
      });

      // Verify user stays on creation page
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should handle widget creation errors gracefully', async () => {
      const mockCreateWidget = jest.fn().mockRejectedValue(new Error('Widget creation failed'));

      jest.mocked(require('@/hooks/use-api').useCreateWidget).mockReturnValue({
        mutateAsync: mockCreateWidget,
        isPending: false,
      });

      jest.mocked(require('@/hooks/use-api').useDashboard).mockReturnValue({
        data: { data: { dashboard: mockApiResponses.createDashboard.data.dashboard } },
        isLoading: false,
        error: null,
      });

      render(<DashboardViewPage params={{ slug: 'sales-dashboard' }} searchParams={{ edit: 'true' }} />, {
        wrapper: createTestWrapper(),
      });

      // Open add widget dialog
      const addWidgetButton = screen.getByRole('button', { name: /add widget/i });
      await user.click(addWidgetButton);

      // Configure and create widget
      const kpiWidgetCard = screen.getByRole('button', { name: /kpi widget/i });
      await user.click(kpiWidgetCard);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      const createWidgetButton = screen.getByRole('button', { name: /create widget/i });
      await user.click(createWidgetButton);

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByText(/widget creation failed/i)).toBeInTheDocument();
      });

      // Verify dialog remains open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Responsive Dashboard Behavior', () => {
    it('should adapt dashboard layout for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      jest.mocked(require('@/hooks/use-api').useDashboard).mockReturnValue({
        data: {
          data: {
            dashboard: {
              ...mockApiResponses.createDashboard.data.dashboard,
              widgets: [
                global.testUtils.generateTestWidget({
                  type: 'kpi',
                  config: { title: 'Mobile Widget' },
                }),
              ],
            },
          },
        },
        isLoading: false,
        error: null,
      });

      render(<DashboardViewPage params={{ slug: 'sales-dashboard' }} searchParams={{}} />, {
        wrapper: createTestWrapper(),
      });

      // Verify mobile-optimized layout
      const gridContainer = screen.getByTestId('dashboard-grid');
      expect(gridContainer).toHaveClass('mobile-layout');

      // Verify widgets stack vertically on mobile
      const widgets = screen.getAllByTestId('widget-container');
      widgets.forEach(widget => {
        expect(widget).toHaveClass('mobile-widget');
      });
    });
  });

  describe('Dashboard Sharing and Permissions', () => {
    it('should handle public dashboard access correctly', async () => {
      const publicDashboard = {
        ...mockApiResponses.createDashboard.data.dashboard,
        is_public: true,
      };

      jest.mocked(require('@/hooks/use-api').useDashboard).mockReturnValue({
        data: { data: { dashboard: publicDashboard } },
        isLoading: false,
        error: null,
      });

      // Mock unauthenticated user
      jest.mocked(require('@/contexts/auth-context').useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      render(<DashboardViewPage params={{ slug: 'sales-dashboard' }} searchParams={{}} />, {
        wrapper: createTestWrapper(),
      });

      // Verify public dashboard loads without authentication
      expect(screen.getByText('Sales Dashboard')).toBeInTheDocument();

      // Verify edit controls are hidden for unauthenticated users
      expect(screen.queryByRole('button', { name: /edit dashboard/i })).not.toBeInTheDocument();
    });

    it('should restrict private dashboard access to authenticated users', async () => {
      const privateDashboard = {
        ...mockApiResponses.createDashboard.data.dashboard,
        is_public: false,
      };

      jest.mocked(require('@/hooks/use-api').useDashboard).mockReturnValue({
        data: { data: { dashboard: privateDashboard } },
        isLoading: false,
        error: null,
      });

      // Mock unauthenticated user
      jest.mocked(require('@/contexts/auth-context').useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      render(<DashboardViewPage params={{ slug: 'sales-dashboard' }} searchParams={{}} />, {
        wrapper: createTestWrapper(),
      });

      // Verify access denied message
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in to view/i)).toBeInTheDocument();
    });
  });
});
