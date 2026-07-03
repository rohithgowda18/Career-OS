import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden uppercase tracking-wider",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  statusColor?: "green" | "orange" | "red" | "blue" | "gray";
}

function Badge({
  className,
  variant,
  statusColor,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  const { themeTokens } = useTheme();

  let themeClasses = "";
  if (statusColor === "green" || statusColor === "blue") {
    themeClasses = themeTokens.badgeGreen;
  } else if (statusColor === "orange" || statusColor === "gray") {
    themeClasses = themeTokens.badgeOrange;
  } else if (statusColor === "red") {
    themeClasses = themeTokens.badgeRed;
  }

  // Special structural adjustments for brutalist theme
  const isBrutalist = themeTokens.id === "brutalist";
  const extraBrutalist = isBrutalist
    ? "border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] rounded-none"
    : "";

  return (
    <Comp
      data-slot="badge"
      className={cn(
        badgeVariants({ variant }),
        themeClasses,
        extraBrutalist,
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
