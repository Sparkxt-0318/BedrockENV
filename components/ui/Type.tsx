import { type ReactNode, type ElementType } from 'react';

interface TypeProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

export function Display({ children, className = '', as: Tag = 'h1' }: TypeProps) {
  return (
    <Tag
      className={`font-[family-name:var(--font-display)] text-text-primary leading-[1.08] tracking-[-0.02em] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Headline({ children, className = '', as: Tag = 'h2' }: TypeProps) {
  return (
    <Tag
      className={`font-[family-name:var(--font-display)] text-text-primary leading-[1.15] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Body({ children, className = '', as: Tag = 'p' }: TypeProps) {
  return (
    <Tag
      className={`font-[family-name:var(--font-sans)] text-text-secondary leading-[1.6] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Label({ children, className = '', as: Tag = 'span' }: TypeProps) {
  return (
    <Tag
      className={`font-[family-name:var(--font-sans)] text-xs font-medium uppercase tracking-[0.08em] text-text-tertiary ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Mono({ children, className = '', as: Tag = 'span' }: TypeProps) {
  return (
    <Tag
      className={`font-[family-name:var(--font-mono)] tabular-nums text-text-primary ${className}`}
    >
      {children}
    </Tag>
  );
}
