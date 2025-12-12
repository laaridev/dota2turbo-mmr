import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                bronze: "border-transparent bg-orange-700/20 text-orange-500 border-orange-500/50",
                silver: "border-transparent bg-slate-400/20 text-slate-300 border-slate-400/50",
                gold: "border-transparent bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
                diamond: "border-transparent bg-blue-400/20 text-blue-400 border-blue-400/50",
                master: "border-transparent bg-purple-500/20 text-purple-400 border-purple-500/50",
                divine: "border-transparent bg-rose-500/20 text-rose-400 border-rose-500/50 box-glow",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
