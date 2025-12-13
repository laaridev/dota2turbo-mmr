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
                // Dota 2 Ranks
                herald: "border-transparent bg-zinc-600/30 text-zinc-400 border-zinc-500/50",
                guardian: "border-transparent bg-teal-600/20 text-teal-400 border-teal-500/50",
                crusader: "border-transparent bg-lime-600/20 text-lime-400 border-lime-500/50",
                archon: "border-transparent bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
                legend: "border-transparent bg-sky-500/20 text-sky-400 border-sky-500/50",
                ancient: "border-transparent bg-purple-500/20 text-purple-400 border-purple-500/50",
                divine: "border-transparent bg-rose-500/20 text-rose-400 border-rose-500/50",
                immortal: "border-transparent bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border-amber-500/50 box-glow",
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
