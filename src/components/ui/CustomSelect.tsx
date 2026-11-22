'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  color?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
  showColorDot?: boolean;
  id?: string;
  name?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className = '',
  menuClassName = '',
  showColorDot = false,
  id,
  name,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      if (!options[nextIndex].disabled) {
        onChange(options[nextIndex].value);
      }
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      if (!options[prevIndex].disabled) {
        onChange(options[prevIndex].value);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block w-full text-left font-sans ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {/* Hidden input for form compatibility */}
      {name && <input type="hidden" name={name} value={value} id={id} />}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex w-full items-center justify-between rounded-md border border-rule bg-white px-3 py-2 text-xs font-medium text-navy-900 shadow-sm transition-all hover:border-navy-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 ${
          isOpen ? 'border-navy-900 ring-1 ring-navy-900' : ''
        } ${className}`}
      >
        <span className="flex items-center gap-2 truncate text-left">
          {showColorDot && selectedOption?.color && (
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted truncate">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:text-navy-900 ${
            isOpen ? 'rotate-180 text-navy-900' : ''
          }`}
        />
      </button>

      {/* Styled Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-rule/90 bg-white p-1 text-xs shadow-xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-100 ${menuClassName}`}
          style={{ scrollbarWidth: 'thin' }}
        >
          {options.length === 0 ? (
            <div className="py-2 text-center text-muted text-xs">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (option.disabled) return;
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`group relative flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 transition-colors ${
                    option.disabled
                      ? 'cursor-not-allowed opacity-40'
                      : isSelected
                      ? 'bg-navy-50 font-semibold text-navy-900'
                      : 'text-ink hover:bg-wash hover:text-navy-900'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {showColorDot && option.color && (
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <div className="truncate">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block text-[10px] text-muted font-normal truncate mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {option.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          option.badgeColor || 'bg-navy-100 text-navy-900'
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                    {isSelected && <Check className="h-3.5 w-3.5 text-navy-900" />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
