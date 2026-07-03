import { cn } from "@/lib/utils";
import * as React from "react";
import { useTheme } from "@/contexts/ThemeContext";

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  const { themeTokens } = useTheme();
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        themeTokens.input,
        "placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
