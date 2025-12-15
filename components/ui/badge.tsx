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
                // Dota 2 Ranks - solid backgrounds with colored borders
                herald: "bg-zinc-900 text-zinc-300 border-2 border-zinc-500",
                guardian: "bg-amber-950/50 text-amber-700 border-2 border-amber-600/70",  // Bronze mais opaco
                crusader: "bg-slate-900 text-slate-200 border-2 border-slate-400",  // Prata mais brilhante
                archon: "bg-yellow-950 text-yellow-300 border-2 border-yellow-500",
                legend: "bg-sky-950 text-sky-300 border-2 border-sky-500",
                ancient: "bg-purple-950 text-purple-300 border-2 border-purple-500",
                divine: "bg-rose-950 text-rose-300 border-2 border-rose-500",
                immortal: "bg-gradient-to-r from-amber-900 to-orange-900 text-amber-200 border-2 border-amber-500 shadow-lg shadow-amber-500/20",
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
