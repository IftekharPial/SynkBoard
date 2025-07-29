/**
 * Dashboard Grid Component for SynkBoard
 * Provides drag-and-drop grid layout for dashboard widgets
 */

import React, { useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { DashboardWithWidgets } from '@synkboard/types';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface DashboardGridProps {
  dashboard: DashboardWithWidgets;
  isEditing: boolean;
  onLayoutChange: (layout: Layout[]) => void;
  onAddWidget: () => void;
  children: React.ReactNode;
}

export function DashboardGrid({
  dashboard,
  isEditing,
  onLayoutChange,
  onAddWidget,
  children,
}: DashboardGridProps) {
  const [layouts, setLayouts] = useState(() => {
    // Convert widget positions to grid layout format
    const layout: Layout[] = dashboard.widgets.map((widget) => ({
      i: widget.id,
      x: widget.position?.x || 0,
      y: widget.position?.y || 0,
      w: widget.position?.w || 4,
      h: widget.position?.h || 3,
      minW: getMinWidth(widget.type),
      minH: getMinHeight(widget.type),
      maxW: getMaxWidth(widget.type),
      maxH: getMaxHeight(widget.type),
    }));

    return { lg: layout, md: layout, sm: layout, xs: layout, xxs: layout };
  });

  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: any) => {
    setLayouts(allLayouts);
    
    if (isEditing) {
      // Only save layout changes when in editing mode
      onLayoutChange(layout);
    }
  }, [isEditing, onLayoutChange]);

  const breakpoints = {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0,
  };

  const cols = {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2,
  };

  const rowHeight = 60;
  const margin: [number, number] = [16, 16];

  return (
    <div className="relative">
      {/* Add Widget Button (when editing and no widgets) */}
      {isEditing && dashboard.widgets.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <Button
              onClick={onAddWidget}
              leftIcon={<PlusIcon className="h-5 w-5" />}
              size="lg"
            >
              Add Your First Widget
            </Button>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={rowHeight}
        margin={margin}
        containerPadding={[0, 0]}
        isDraggable={isEditing}
        isResizable={isEditing}
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
        style={{
          minHeight: dashboard.widgets.length === 0 ? '400px' : 'auto',
        }}
      >
        {children}
      </ResponsiveGridLayout>

      {/* Add Widget Floating Button (when editing and has widgets) */}
      {isEditing && dashboard.widgets.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={onAddWidget}
            leftIcon={<PlusIcon className="h-5 w-5" />}
            className="shadow-lg"
          >
            Add Widget
          </Button>
        </div>
      )}

      {/* Grid Overlay (when editing) */}
      {isEditing && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="grid-overlay" />
        </div>
      )}

      <style jsx>{`
        .layout {
          position: relative;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform;
        }
        
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBkPSJtMTUgMTJjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0wIDRjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0wIDRjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0tNS00YzAtLjU1Mi40NDgtMSAxLTFzMSAuNDQ4IDEgMS0uNDQ4IDEtMSAxLTEtLjQ0OC0xLTF6bTAgNGMwLS41NTIuNDQ4LTEgMS0xczEgLjQ0OCAxIDEtLjQ0OCAxLTEgMS0xLS40NDgtMS0xem0wLThjMC0uNTUyLjQ0OC0xIDEtMXMxIC40NDggMSAxLS40NDggMS0xIDEtMS0uNDQ4LTEtMXptNC00YzAtLjU1Mi40NDgtMSAxLTFzMSAuNDQ4IDEgMS0uNDQ4IDEtMSAxLTEtLjQ0OC0xLTF6bTAgNGMwLS41NTIuNDQ4LTEgMS0xczEgLjQ0OCAxIDEtLjQ0OCAxLTEgMS0xLS40NDgtMS0xeiIvPgo8L3N2Zz4K');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }

        .react-grid-item.react-grid-placeholder {
          background: rgb(var(--primary) / 0.2);
          opacity: 0.2;
          transition-duration: 100ms;
          z-index: 2;
          user-select: none;
          border-radius: 8px;
        }

        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 3;
          opacity: 0.8;
        }

        .react-grid-item.react-resizable-resizing {
          transition: none;
          z-index: 3;
          opacity: 0.8;
        }

        .grid-overlay {
          background-image: 
            linear-gradient(rgba(var(--border) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--border) / 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}

// Helper functions to determine widget size constraints
function getMinWidth(widgetType: string): number {
  switch (widgetType) {
    case 'kpi':
      return 2;
    case 'pie':
      return 3;
    case 'bar':
    case 'line':
      return 4;
    case 'table':
    case 'list':
      return 4;
    default:
      return 2;
  }
}

function getMinHeight(widgetType: string): number {
  switch (widgetType) {
    case 'kpi':
      return 2;
    case 'pie':
      return 3;
    case 'bar':
    case 'line':
      return 3;
    case 'table':
    case 'list':
      return 4;
    default:
      return 2;
  }
}

function getMaxWidth(widgetType: string): number {
  switch (widgetType) {
    case 'kpi':
      return 4;
    case 'pie':
      return 6;
    case 'bar':
    case 'line':
    case 'table':
    case 'list':
      return 12;
    default:
      return 12;
  }
}

function getMaxHeight(widgetType: string): number {
  switch (widgetType) {
    case 'kpi':
      return 3;
    case 'pie':
      return 6;
    case 'bar':
    case 'line':
      return 8;
    case 'table':
    case 'list':
      return 12;
    default:
      return 12;
  }
}
