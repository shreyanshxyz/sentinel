import React from "react";
import { buttonClass } from "@/components/ui/buttonStyles";
import type { ButtonSize, ButtonVariant } from "@/components/ui/buttonStyles";

export type { ButtonSize, ButtonVariant };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        type={type}
        ref={ref}
        className={buttonClass(variant, size, className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
