'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28d7df] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[#ff5a1f] text-white hover:bg-[#ff7a3d] shadow-[0_12px_30px_rgba(255,90,31,0.16)]",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        outline: "border border-white/12 text-white hover:bg-white/8 bg-white/[0.02] backdrop-blur-sm",
        secondary: "bg-white/8 text-[#d8d5cf] hover:bg-white/12 border border-white/8",
        ghost: "hover:bg-white/8 hover:text-white border border-transparent",
        link: "text-[#28d7df] underline-offset-4 hover:underline",
        cyber: "bg-white/[0.03] border border-[#28d7df]/35 text-[#9eeef2] hover:bg-[#28d7df]/10 hover:border-[#28d7df]/60",
        amber: "bg-[#ff5a1f] text-white hover:bg-[#ff7a3d] shadow-[0_12px_30px_rgba(255,90,31,0.16)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? (Slot as any) || "button" : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
