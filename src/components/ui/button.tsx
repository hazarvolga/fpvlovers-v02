import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F2FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30 active:scale-[0.98] hex-panel glitch-hover",
  {
    variants: {
      variant: {
        default: "bg-[#00F2FF] text-[#050505] font-black uppercase tracking-tighter hover:brightness-125 border-b-2 border-r-2 border-[#00A8B3]",
        destructive: "bg-[#FF5C00] text-white hover:brightness-125 border-b-2 border-r-2 border-[#B34000]",
        outline: "border-2 border-[#00F2FF] text-[#00F2FF] hover:bg-[#00F2FF]/10 bg-black/50 backdrop-blur-sm",
        secondary: "bg-[#1A1A1A] text-[#A0A0A0] hover:bg-[#333333] border-b-2 border-r-2 border-[#0A0A0A]",
        ghost: "hover:bg-[#1A1A1A] hover:text-[#00F2FF] border border-transparent",
        link: "text-[#00F2FF] underline-offset-4 hover:underline",
        cyber: "bg-transparent border-2 border-[#00F2FF]/50 text-[#00F2FF] uppercase font-black tracking-widest hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] hover:border-[#00F2FF] bg-black/50 backdrop-blur-sm",
        amber: "bg-[#FF5C00] text-[#050505] font-black uppercase tracking-tighter hover:brightness-125 border-b-2 border-r-2 border-[#B34000]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
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
