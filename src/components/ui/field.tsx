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
 * Underline inputs rather than boxes: a hairline baseline that thickens to ink
 * on focus. Less furniture on screen, and it suits the ruled layout.
 */
const CONTROL_BASE =
  "w-full bg-transparent border-0 border-b border-border-subtle px-0 text-sm text-ink " +
  "placeholder:text-ink-tertiary transition-colors " +
  "hover:border-ink-tertiary focus:border-ink focus:ring-0 " +
  "disabled:cursor-not-allowed disabled:text-ink-tertiary disabled:border-dashed " +
  "aria-[invalid=true]:border-primary";

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
        <label htmlFor={id} className="label-xs text-ink-tertiary">
          {label}
          {required && (
            <span className="text-primary ml-1" aria-hidden>
              ✳
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
        <p id={errorId} role="alert" className="text-primary text-xs">
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
          className={cn(CONTROL_BASE, "h-10", className)}
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
            "border-border-subtle min-h-28 border px-3 py-2 leading-relaxed focus:border-ink",
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
          className={cn(CONTROL_BASE, "h-10 pr-6", className)}
        >
          {children}
        </select>
      )}
    </Field>
  );
}
