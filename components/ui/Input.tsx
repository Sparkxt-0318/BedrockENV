import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-4 py-2.5 rounded-[var(--radius-md)]
            border border-border bg-bg-surface text-text-primary
            placeholder:text-text-tertiary
            focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
            ${error ? 'border-exposure-high' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-exposure-high">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
