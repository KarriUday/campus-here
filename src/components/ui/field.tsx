"use client";

import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const CONTROL_BASE =
  "w-full rounded-xl border border-border bg-surface-raised px-3 text-sm text-ink " +
  "placeholder:text-ink-tertiary transition-colors " +
  "hover:border-ink-tertiary focus:border-primary " +
  "disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-tertiary " +
  "aria-[invalid=true]:border-error";

type FieldShellProps = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (controlProps: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => ReactNode;
};

/**
 * Wraps a control with a real <label for>, hint text and an error message that
 * is announced. Every form control in the app goes through this so labelling
 * and focus behaviour cannot drift between screens.
 */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-ink text-sm font-medium">
          {label}
          {required && (
            <span className="text-error ml-0.5" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error ? (
        <p id={errorId} role="alert" className="text-error-ink text-xs">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-ink-tertiary text-xs">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function Input({
  label,
  hint,
  error,
  required,
  className,
  wrapperClassName,
  ...props
}: InputProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      {(controlProps) => (
        <input
          {...controlProps}
          {...props}
          required={required}
          className={cn(CONTROL_BASE, "h-10", className)}
        />
      )}
    </Field>
  );
}

type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function Textarea({
  label,
  hint,
  error,
  required,
  className,
  wrapperClassName,
  ...props
}: TextareaProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      {(controlProps) => (
        <textarea
          {...controlProps}
          {...props}
          required={required}
          className={cn(CONTROL_BASE, "min-h-28 py-2 leading-relaxed", className)}
        />
      )}
    </Field>
  );
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function Select({
  label,
  hint,
  error,
  required,
  className,
  wrapperClassName,
  children,
  ...props
}: SelectProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      {(controlProps) => (
        <select
          {...controlProps}
          {...props}
          required={required}
          className={cn(CONTROL_BASE, "h-10 pr-8", className)}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
