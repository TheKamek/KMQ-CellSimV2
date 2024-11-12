/* eslint-disable react/prop-types */
// src/components/ui/button.jsx
export function Button({
  children,
  onClick,
  className = '',
  variant = 'default',
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${
          variant === 'default'
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : ''
        }
        ${
          variant === 'outline'
            ? 'border border-gray-300 hover:bg-gray-100'
            : ''
        }
        ${className}`}
    >
      {children}
    </button>
  );
}
