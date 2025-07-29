/**
 * Dialog/Modal component for SynkBoard
 * Accessible modal with focus management and keyboard navigation
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
}

export interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

export interface DialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

export interface DialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>,
    document.body
  );
};

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
} | null>(null);

const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onEscapeKeyDown, onPointerDownOutside, ...props }, ref) => {
    const { onOpenChange } = useDialog();
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Handle escape key
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          if (onEscapeKeyDown) {
            onEscapeKeyDown(event);
          } else {
            onOpenChange(false);
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onEscapeKeyDown, onOpenChange]);

    // Handle click outside
    const handlePointerDown = (event: React.PointerEvent) => {
      if (event.target === event.currentTarget) {
        if (onPointerDownOutside) {
          onPointerDownOutside(event.nativeEvent);
        } else {
          onOpenChange(false);
        }
      }
    };

    // Focus management
    React.useEffect(() => {
      const focusableElements = contentRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }, []);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onPointerDown={handlePointerDown}
      >
        <div
          ref={contentRef}
          className={cn(
            'relative w-full max-w-lg max-h-[85vh] overflow-auto bg-background border border-border rounded-lg shadow-lg',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

DialogContent.displayName = 'DialogContent';

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children, ...props }) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0', className)}
    {...props}
  >
    {children}
  </div>
);

DialogHeader.displayName = 'DialogHeader';

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children, ...props }) => (
  <h2
    className={cn('text-lg font-semibold leading-none tracking-tight text-foreground', className)}
    {...props}
  >
    {children}
  </h2>
);

DialogTitle.displayName = 'DialogTitle';

const DialogDescription: React.FC<DialogDescriptionProps> = ({ className, children, ...props }) => (
  <p
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  >
    {children}
  </p>
);

DialogDescription.displayName = 'DialogDescription';

const DialogFooter: React.FC<DialogFooterProps> = ({ className, children, ...props }) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0', className)}
    {...props}
  >
    {children}
  </div>
);

DialogFooter.displayName = 'DialogFooter';

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { onOpenChange } = useDialog();

  return (
    <button
      ref={ref}
      className={cn(
        'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
        className
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {children || <XMarkIcon className="h-4 w-4" />}
      <span className="sr-only">Close</span>
    </button>
  );
});

DialogClose.displayName = 'DialogClose';

// Confirmation Dialog Component
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  ConfirmDialog,
};
