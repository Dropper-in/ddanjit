import type {
  ChangeEventHandler,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef } from 'react';
import { cx } from '@/shared/lib/ui';
import styles from './FormField.module.scss';

// 모든 폼 필드 — Win98 스타일 (paper + bevel-in).
// TextInput/Textarea/Select는 글로벌 'rpp-field' 훅 사용 (기존 _shared.scss + _apps.scss override 호환).

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: 'text' | 'number' | 'search' | 'email' | 'password' | 'url' | 'tel';
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, type = 'text', ...rest },
  ref,
) {
  return <input ref={ref} type={type} className={cx('rpp-field', className)} {...rest} />;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={cx('rpp-field', className)} {...rest} />;
});

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, className, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={cx('rpp-field', className)} {...rest}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  name?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled,
  children,
  className,
  style,
  name,
}: CheckboxProps) {
  const handle: ChangeEventHandler<HTMLInputElement> = (e) => onChange(e.target.checked);
  return (
    <label
      className={cx(styles.check, disabled ? styles.disabled : undefined, className)}
      style={style}
    >
      <input type="checkbox" checked={checked} onChange={handle} disabled={disabled} name={name} />
      <span className={styles.box}>{checked ? '✓' : ''}</span>
      {children}
    </label>
  );
}

export interface RadioProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Radio({
  name,
  value,
  checked,
  onChange,
  disabled,
  children,
  className,
  style,
}: RadioProps) {
  return (
    <label
      className={cx(styles.radio, disabled ? styles.disabled : undefined, className)}
      style={style}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
      />
      <span className={cx(styles.dot, checked ? styles.on : undefined)} />
      {children}
    </label>
  );
}
