/**
 * Breadcrumb navigation component for SynkBoard
 * Hierarchical navigation with customizable separators
 */

import React from 'react';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
  homeHref?: string;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separator = <ChevronRightIcon className="h-4 w-4" />,
  showHome = true,
  homeHref = '/dashboard',
  className,
}) => {
  const allItems = showHome
    ? [
        {
          label: 'Home',
          href: homeHref,
          icon: <HomeIcon className="h-4 w-4" />,
        },
        ...items,
      ]
    : items;

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isCurrent = item.current || isLast;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-muted-foreground">
                  {separator}
                </span>
              )}
              
              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.icon && (
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center space-x-1',
                    isCurrent
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

// Breadcrumb with dropdown for long paths
export interface CollapsibleBreadcrumbProps extends BreadcrumbProps {
  maxItems?: number;
}

const CollapsibleBreadcrumb: React.FC<CollapsibleBreadcrumbProps> = ({
  items,
  maxItems = 3,
  ...props
}) => {
  const [showAll, setShowAll] = React.useState(false);

  if (items.length <= maxItems) {
    return <Breadcrumb items={items} {...props} />;
  }

  const visibleItems = showAll
    ? items
    : [
        ...items.slice(0, 1),
        {
          label: '...',
          onClick: () => setShowAll(true),
        },
        ...items.slice(-maxItems + 2),
      ];

  return (
    <Breadcrumb
      items={visibleItems.map(item => ({
        ...item,
        href: 'onClick' in item ? undefined : item.href,
      }))}
      {...props}
    />
  );
};

// Auto breadcrumb from pathname
export interface AutoBreadcrumbProps {
  pathname: string;
  labels?: Record<string, string>;
  icons?: Record<string, React.ReactNode>;
  className?: string;
}

const AutoBreadcrumb: React.FC<AutoBreadcrumbProps> = ({
  pathname,
  labels = {},
  icons = {},
  className,
}) => {
  const segments = pathname.split('/').filter(Boolean);
  
  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    return {
      label: labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : path,
      icon: icons[segment],
      current: isLast,
    };
  });

  return <Breadcrumb items={items} className={className} />;
};

export { Breadcrumb, CollapsibleBreadcrumb, AutoBreadcrumb };
