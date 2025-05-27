import { FieldError, UseFormRegister, Path, FieldValues } from 'react-hook-form'

interface InputProps<T extends FieldValues> {
  type?: string
  label: string
  name: Path<T>
  placeholder?: string
  register?: UseFormRegister<T>
  error?: FieldError
  required?: boolean | string
  className?: string
  validate?: (value: string) => string | boolean
}

export function Input<T extends FieldValues>({
  type = 'text',
  label,
  name,
  placeholder = '',
  register,
  error,
  required = false,
  className = '',
  validate
}: InputProps<T>) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        {...(register && register(name as Path<T>, { 
          required,
          validate: validate,
        }))}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        placeholder={placeholder}
      />
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {typeof required === 'string' ? required : error.message}
        </div>
      )}
    </div>
  )
}
