import * as React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`flex h-10 w-full rounded-none border border-border bg-code-bg px-3 py-2 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-20 focus:border-accent disabled:cursor-not-allowed disabled:bg-code-bg disabled:text-text-secondary text-text-primary transition-all duration-150 ${className}`}
      {...props}
    />
  )
)

Input.displayName = 'Input'

export { Input }
