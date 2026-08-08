"use client";

import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Rounded white boxes on the cream ground — the control should read as a
 * distinct surface you can type into, matching the card language.
 */
const CONTROL_BASE =
  "w-full rounded-lg border border-border-subtle bg-surface-raised px-4 text-sm text-ink " +
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
 * Owns the <label for>, hint, error and aria-describedby wiring for every
 * control in the app, so labelling cannot drift between screens.
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
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label htmlFor={id} className="label-xs text-ink">
          {label}
          {required && (
            <span className="text-coral ml-1" aria-hidden>
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
          <p id={hintId} className="text-ink-tertiary text-xs leading-snug">
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
          className={cn(CONTROL_BASE, "h-11", className)}
        />
      )}
    </Field>
  );
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
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
          className={cn(
            CONTROL_BASE,
            "min-h-32 py-3 leading-relaxed",
            className,
          )}
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
          className={cn(CONTROL_BASE, "h-11 pr-8", className)}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
