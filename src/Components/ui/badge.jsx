import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success:
          "border-transparent bg-emerald-500 dark:bg-emerald-600/20 dark:text-emerald-400 text-white hover:bg-emerald-600",
        pending:
          "border-transparent bg-amber-500 dark:bg-amber-500/20 dark:text-amber-400 text-white hover:bg-amber-600",
        in_progress:
          "border-transparent bg-blue-500 dark:bg-blue-500/20 dark:text-blue-400 text-white hover:bg-blue-600",
        destructive:
          "border-transparent bg-red-500 dark:bg-red-600/20 dark:text-red-400 text-white hover:bg-red-600",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props} />
  );
}

export { Badge, badgeVariants }
