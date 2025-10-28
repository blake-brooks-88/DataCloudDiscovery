import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-[10px] py-[2px] text-[12px] font-semibold transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary-500 focus:ring-offset-[2px]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-500 text-primary-foreground hover:bg-primary-600',
        primary: 'border-transparent bg-primary-500 text-primary-foreground hover:bg-primary-600',
        secondary:
          'border-transparent bg-secondary-500 text-secondary-foreground hover:bg-secondary-600',
        destructive:
          'border-transparent bg-destructive-500 text-destructive-foreground hover:bg-destructive-700',
        outline: 'text-foreground',
        neutral: 'border-coolgray-200 bg-coolgray-50 text-coolgray-600',
        tertiary: 'border-tertiary-300 bg-tertiary-50 text-tertiary-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * A small badge component to display status or labels.
 * Utilizes cva for handling different visual variants.
 *
 * @param {object} props
 * @param {string} [props.className] - Additional classes to apply.
 * @param {('default'|'secondary'|'destructive'|'outline'|'neutral'|'tertiary')} [props.variant] - The visual style of the badge.
 * @returns {JSX.Element}
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
  // Render a div element applying the variant styles and any additional classes
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
