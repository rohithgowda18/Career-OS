import { cn } from "@/lib/utils";
import * as React from "react";
import { useTheme } from "@/contexts/ThemeContext";

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  const { themeTokens } = useTheme();
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        themeTokens.input,
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:ring-[3px]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
