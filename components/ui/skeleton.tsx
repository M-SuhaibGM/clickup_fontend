import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-muted dark:bg-[color:var(--c-2a2b2e)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
