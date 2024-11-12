/* eslint-disable react/prop-types */
// src/components/ui/slider.jsx
import { useState } from 'react';

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 0,
  value,
  onValueChange,
  className = '',
}) {
  const [localValue, setLocalValue] = useState(defaultValue);

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value ?? localValue}
      onChange={handleChange}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
        dark:bg-gray-700 accent-blue-500 ${className}`}
    />
  );
}
