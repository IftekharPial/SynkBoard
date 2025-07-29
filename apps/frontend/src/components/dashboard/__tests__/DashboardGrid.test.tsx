/**
 * DashboardGrid Component Test Suite
 * Tests for the drag-and-drop dashboard grid system
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardGrid } from '../DashboardGrid';

// Mock react-grid-layout
jest.mock('react-grid-layout', () => {
  const MockGridLayout = ({ children, onLayoutChange, ...props }: any) => (
    <div data-testid="grid-layout" {...props}>
      {children}
    </div>
  );
  MockGridLayout.Responsive = MockGridLayout;
  return MockGridLayout;
});

// Mock the API hooks
const mockUpdateDashboard = jest.fn();
const mockDeleteWidget = jest.fn();

jest.mock('@/hooks/use-api', () => ({
  useUpdateDashboard: () => ({
    mutateAsync: mockUpdateDashboard,
    isPending: false,
  }),
  useDeleteWidget: () => ({
    mutateAsync: mockDeleteWidget,
    isPending: false,
  }),
  useWidgetData: (widgetId: string) => ({
    data: { data: { count: 42, trend: 5.2 } },
    isLoading: false,
    error: null,
  }),
}));

// Mock auth context
jest.mock('@/contexts/auth-context', () => ({
  usePermissions: () => ({
    hasPermission: jest.fn().mockReturnValue(true),
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

describe('DashboardGrid Component', () => {
  const user = userEvent.setup();

  const mockDashboard = global.testUtils.generateTestDashboard({
    widgets: [
      global.testUtils.generateTestWidget({
        id: 'widget-1',
        type: 'kpi',
        config: { metric: 'count', title: 'Total Records' },
        position: { x: 0, y: 0, w: 2, h: 2 },
      }),
      global.testUtils.generateTestWidget({
        id: 'widget-2',
        type: 'bar',
        config: { metric: 'sum', field: 'amount', title: 'Revenue' },
        position: { x: 2, y: 0, w: 4, h: 3 },
      }),
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dashboard grid with widgets', () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('grid-layout')).toBeInTheDocument();
      expect(screen.getByText('Total Records')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('renders empty state when no widgets', () => {
      const emptyDashboard = global.testUtils.generateTestDashboard({
        widgets: [],
      });

      render(
        <DashboardGrid dashboard={emptyDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/no widgets configured/i)).toBeInTheDocument();
      expect(screen.getByText(/add your first widget/i)).toBeInTheDocument();
    });

    it('shows add widget button in edit mode', () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('button', { name: /add widget/i })).toBeInTheDocument();
    });

    it('hides add widget button in view mode', () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByRole('button', { name: /add widget/i })).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('shows widget edit controls in edit mode', () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      // Should show edit overlays
      const editButtons = screen.getAllByRole('button', { name: /edit widget/i });
      expect(editButtons).toHaveLength(2);

      const deleteButtons = screen.getAllByRole('button', { name: /delete widget/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it('hides widget edit controls in view mode', () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByRole('button', { name: /edit widget/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete widget/i })).not.toBeInTheDocument();
    });

    it('opens add widget dialog when add button is clicked', async () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      const addButton = screen.getByRole('button', { name: /add widget/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/add widget/i)).toBeInTheDocument();
      });
    });

    it('deletes widget when delete button is clicked', async () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete widget/i });
      await user.click(deleteButtons[0]);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/delete widget/i)).toBeInTheDocument();
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteWidget).toHaveBeenCalledWith('widget-1');
      });
    });
  });

  describe('Layout Management', () => {
    it('saves layout changes when widgets are moved', async () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      // Simulate layout change from react-grid-layout
      const gridLayout = screen.getByTestId('grid-layout');
      
      // Mock the onLayoutChange callback
      const mockLayoutChange = [
        { i: 'widget-1', x: 1, y: 0, w: 2, h: 2 },
        { i: 'widget-2', x: 2, y: 0, w: 4, h: 3 },
      ];

      // Trigger layout change
      fireEvent(gridLayout, new CustomEvent('layoutchange', {
        detail: mockLayoutChange,
      }));

      await waitFor(() => {
        expect(mockUpdateDashboard).toHaveBeenCalledWith(
          mockDashboard.slug,
          expect.objectContaining({
            layout: mockLayoutChange,
          })
        );
      });
    });

    it('applies responsive breakpoints correctly', () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      const gridLayout = screen.getByTestId('grid-layout');
      
      // Should have responsive breakpoints
      expect(gridLayout).toHaveAttribute('data-breakpoints', expect.stringContaining('lg'));
      expect(gridLayout).toHaveAttribute('data-breakpoints', expect.stringContaining('md'));
      expect(gridLayout).toHaveAttribute('data-breakpoints', expect.stringContaining('sm'));
    });
  });

  describe('Widget Rendering', () => {
    it('renders KPI widgets correctly', () => {
      const kpiDashboard = global.testUtils.generateTestDashboard({
        widgets: [
          global.testUtils.generateTestWidget({
            type: 'kpi',
            config: { metric: 'count', title: 'Total Users' },
          }),
        ],
      });

      render(
        <DashboardGrid dashboard={kpiDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument(); // Mock data
    });

    it('renders bar chart widgets correctly', () => {
      const barDashboard = global.testUtils.generateTestDashboard({
        widgets: [
          global.testUtils.generateTestWidget({
            type: 'bar',
            config: { metric: 'sum', field: 'revenue', title: 'Monthly Revenue' },
          }),
        ],
      });

      render(
        <DashboardGrid dashboard={barDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('shows loading state for widgets', () => {
      jest.mocked(require('@/hooks/use-api').useWidgetData).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getAllByTestId('loading-spinner')).toHaveLength(2);
    });

    it('shows error state for widgets', () => {
      jest.mocked(require('@/hooks/use-api').useWidgetData).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load data'),
      });

      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getAllByText(/failed to load/i)).toHaveLength(2);
    });
  });

  describe('Permissions', () => {
    it('hides edit controls when user lacks permissions', () => {
      jest.mocked(require('@/contexts/auth-context').usePermissions).mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
      });

      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByRole('button', { name: /add widget/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit widget/i })).not.toBeInTheDocument();
    });

    it('shows read-only message when user lacks edit permissions', () => {
      jest.mocked(require('@/contexts/auth-context').usePermissions).mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
      });

      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/read-only access/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adjusts grid columns for mobile', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      const gridLayout = screen.getByTestId('grid-layout');
      expect(gridLayout).toHaveAttribute('data-cols', '1'); // Single column on mobile
    });

    it('uses full columns for desktop', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      const gridLayout = screen.getByTestId('grid-layout');
      expect(gridLayout).toHaveAttribute('data-cols', '12'); // Full columns on desktop
    });
  });

  describe('Performance', () => {
    it('memoizes widget components to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      const initialWidgets = screen.getAllByTestId('widget-container');
      
      // Re-render with same props
      rerender(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />
      );

      const rerenderedWidgets = screen.getAllByTestId('widget-container');
      
      // Widgets should be the same instances (memoized)
      expect(initialWidgets).toEqual(rerenderedWidgets);
    });

    it('debounces layout change updates', async () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      const gridLayout = screen.getByTestId('grid-layout');
      
      // Trigger multiple rapid layout changes
      for (let i = 0; i < 5; i++) {
        fireEvent(gridLayout, new CustomEvent('layoutchange', {
          detail: [{ i: 'widget-1', x: i, y: 0, w: 2, h: 2 }],
        }));
      }

      // Should only call update once after debounce
      await waitFor(() => {
        expect(mockUpdateDashboard).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for grid and widgets', () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={false} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Dashboard grid');
      
      const widgets = screen.getAllByRole('article');
      expect(widgets).toHaveLength(2);
      widgets.forEach(widget => {
        expect(widget).toHaveAttribute('aria-label', expect.stringContaining('widget'));
      });
    });

    it('supports keyboard navigation in edit mode', async () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      const addButton = screen.getByRole('button', { name: /add widget/i });
      const editButtons = screen.getAllByRole('button', { name: /edit widget/i });

      addButton.focus();
      expect(addButton).toHaveFocus();

      await user.tab();
      expect(editButtons[0]).toHaveFocus();

      await user.tab();
      expect(screen.getAllByRole('button', { name: /delete widget/i })[0]).toHaveFocus();
    });

    it('announces layout changes to screen readers', async () => {
      render(
        <DashboardGrid dashboard={mockDashboard} editMode={true} />,
        { wrapper: createWrapper() }
      );

      const gridLayout = screen.getByTestId('grid-layout');
      
      fireEvent(gridLayout, new CustomEvent('layoutchange', {
        detail: [{ i: 'widget-1', x: 1, y: 0, w: 2, h: 2 }],
      }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/layout updated/i);
      });
    });
  });
});
