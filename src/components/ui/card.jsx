/* eslint-disable react/prop-types */
// src/components/ui/card.jsx
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
