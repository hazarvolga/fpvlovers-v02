import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#28d7df] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[#28d7df]/25 bg-[#28d7df]/8 text-[#9eeef2] hover:bg-[#28d7df]/14",
        secondary:
          "border-white/10 bg-white/8 text-[#d8d5cf] hover:bg-white/12",
        destructive:
          "border-transparent bg-red-500/20 text-red-400 hover:bg-red-500/30",
        outline: "text-[#d8d5cf] border-white/12",
        amber: "border-[#ff5a1f]/25 bg-[#ff5a1f]/10 text-[#ff9b71] hover:bg-[#ff5a1f]/18",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
