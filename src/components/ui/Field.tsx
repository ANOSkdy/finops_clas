import { forwardRef, useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

type Base = { label: string; error?: string; hint?: string; requiredLabel?: boolean };
export const TextField = forwardRef<HTMLInputElement, Base & InputHTMLAttributes<HTMLInputElement>>(function TextField({ label, error, hint, requiredLabel, id, className = "", ...props }, ref) {
  const generatedId = useId();
  const controlId = id ?? props.name ?? generatedId;
  const description = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;
  return <label className="field" htmlFor={controlId}><span className="field-label">{label}{requiredLabel ? <span className="required">必須</span> : null}</span><input ref={ref} id={controlId} className={`input ${className}`} aria-invalid={error ? true : undefined} aria-required={requiredLabel || undefined} aria-describedby={description} {...props} />{error ? <span id={`${controlId}-error`} className="field-error" role="alert">{error}</span> : hint ? <span id={`${controlId}-hint`} className="field-hint">{hint}</span> : null}</label>;
});

export function SelectField({ label, error, hint, requiredLabel, id, className = "", children, ...props }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId();
  const controlId = id ?? props.name ?? generatedId;
  const description = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;
  return <label className="field" htmlFor={controlId}><span className="field-label">{label}{requiredLabel ? <span className="required">必須</span> : null}</span><select id={controlId} className={`select ${className}`} aria-invalid={error ? true : undefined} aria-required={requiredLabel || undefined} aria-describedby={description} {...props}>{children}</select>{error ? <span id={`${controlId}-error`} className="field-error" role="alert">{error}</span> : hint ? <span id={`${controlId}-hint`} className="field-hint">{hint}</span> : null}</label>;
}

export function TextareaField({ label, error, hint, requiredLabel, id, className = "", ...props }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId();
  const controlId = id ?? props.name ?? generatedId;
  const description = error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined;
  return <label className="field" htmlFor={controlId}><span className="field-label">{label}{requiredLabel ? <span className="required">必須</span> : null}</span><textarea id={controlId} className={`textarea ${className}`} aria-invalid={error ? true : undefined} aria-required={requiredLabel || undefined} aria-describedby={description} {...props} />{error ? <span id={`${controlId}-error`} className="field-error" role="alert">{error}</span> : hint ? <span id={`${controlId}-hint`} className="field-hint">{hint}</span> : null}</label>;
}
