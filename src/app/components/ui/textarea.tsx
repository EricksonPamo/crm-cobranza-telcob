import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border-2 border-gray-400 bg-gray-50 px-3 py-2 text-base transition-[color,box-shadow,border-color] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-gray-500",
        "focus-visible:border-blue-600 focus-visible:ring-blue-500/30 focus-visible:ring-[3px] focus-visible:bg-white",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };