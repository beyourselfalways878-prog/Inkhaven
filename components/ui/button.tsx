import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95 transition-all',
  {
    variants: {
      variant: {
        default: 'bg-teal-600 text-white shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:bg-teal-500 hover:shadow-[0_0_30px_rgba(20,184,166,0.4)]',
        secondary: 'bg-slate-900/40 backdrop-blur-2xl border border-white/10 text-gray-100 hover:bg-slate-800/60 shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:border-white/20',
        ghost: 'bg-transparent text-gray-200 hover:bg-white/10'
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-12 px-6 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
