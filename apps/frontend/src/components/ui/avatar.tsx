/**
 * Avatar component for SynkBoard
 * User profile pictures and initials display
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        default: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  name?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, name, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    // Generate fallback text
    const fallbackText = React.useMemo(() => {
      if (fallback) return fallback;
      if (name) return getInitials(name);
      if (alt) return getInitials(alt);
      return '?';
    }, [fallback, name, alt]);

    const handleImageError = () => {
      setImageError(true);
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
    };

    const showImage = src && !imageError;
    const showFallback = !showImage || !imageLoaded;

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        {...props}
      >
        {showImage && (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className={cn(
              'aspect-square h-full w-full object-cover',
              !imageLoaded && 'opacity-0'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
        {showFallback && (
          <div className="flex h-full w-full items-center justify-center bg-muted font-medium text-muted-foreground">
            {fallbackText}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group Component
export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 5,
  size = 'default',
  className,
}) => {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = Math.max(0, childrenArray.length - max);

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className="ring-2 ring-background rounded-full"
          style={{ zIndex: visibleChildren.length - index }}
        >
          {React.isValidElement(child)
            ? React.cloneElement(child, { size } as any)
            : child}
        </div>
      ))}
      {remainingCount > 0 && (
        <Avatar
          size={size}
          fallback={`+${remainingCount}`}
          className="ring-2 ring-background bg-muted"
        />
      )}
    </div>
  );
};

// User Avatar Component with status
export interface UserAvatarProps extends AvatarProps {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  status,
  showStatus = false,
  ...props
}) => {
  const statusColors = {
    online: 'bg-success',
    offline: 'bg-muted-foreground',
    away: 'bg-warning',
    busy: 'bg-destructive',
  };

  return (
    <div className="relative">
      <Avatar
        src={user?.avatar}
        name={user?.name}
        alt={user?.name || user?.email}
        {...props}
      />
      {showStatus && status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
            statusColors[status]
          )}
        />
      )}
    </div>
  );
};

// Avatar with dropdown menu
export interface AvatarMenuProps extends UserAvatarProps {
  menuItems?: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    separator?: boolean;
    destructive?: boolean;
  }>;
}

const AvatarMenu: React.FC<AvatarMenuProps> = ({
  menuItems = [],
  ...avatarProps
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <UserAvatar {...avatarProps} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
          <div className="py-1">
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.separator && (
                  <div className="border-t border-border my-1" />
                )}
                <button
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center w-full px-4 py-2 text-sm text-left hover:bg-accent',
                    item.destructive && 'text-destructive hover:bg-destructive/10'
                  )}
                >
                  {item.icon && (
                    <span className="mr-3 h-4 w-4">
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Avatar Upload Component
export interface AvatarUploadProps extends AvatarProps {
  onUpload?: (file: File) => void;
  uploading?: boolean;
  accept?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  onUpload,
  uploading = false,
  accept = 'image/*',
  ...avatarProps
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={uploading}
        className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
      >
        <Avatar {...avatarProps} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
          {uploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export {
  Avatar,
  AvatarGroup,
  UserAvatar,
  AvatarMenu,
  AvatarUpload,
  avatarVariants,
};
