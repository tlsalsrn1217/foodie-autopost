"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, children, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-semibold text-foreground inline-flex items-center gap-1",
      className,
    )}
    {...props}
  >
    {children}
    {required && <span className="text-primary">*</span>}
  </label>
));
Label.displayName = "Label";
