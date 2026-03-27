import * as React from "react";

import { cn } from "./utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const filteredProps = { ...props };
    for (const key in filteredProps) {
      if (key.startsWith('_fg')) {
        delete (filteredProps as any)[key];
      }
    }

    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border-2 border-gray-400 px-3 py-1 text-base bg-gray-50 transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "hover:border-gray-500",
          "focus-visible:border-blue-600 focus-visible:ring-blue-500/30 focus-visible:ring-[3px] focus-visible:bg-white",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className,
        )}
        ref={ref}
        {...filteredProps}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };