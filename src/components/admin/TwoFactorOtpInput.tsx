import React, { useRef, useEffect } from 'react';

interface TwoFactorOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  accentColor?: 'indigo' | 'blue' | 'purple';
  error?: boolean;
}

export const TwoFactorOtpInput: React.FC<TwoFactorOtpInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  accentColor = 'indigo',
  error = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into 6 individual characters
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  // Color schemes for active rings & borders
  const accentClasses = {
    indigo: {
      focus: 'focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/20 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20',
      activeBorder: 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40 dark:border-indigo-400',
      text: 'text-indigo-950 dark:text-indigo-100',
    },
    blue: {
      focus: 'focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20',
      activeBorder: 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 dark:border-blue-400',
      text: 'text-blue-950 dark:text-blue-100',
    },
    purple: {
      focus: 'focus:border-purple-600 focus:ring-4 focus:ring-purple-500/20 dark:focus:border-purple-400 dark:focus:ring-purple-400/20',
      activeBorder: 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/40 dark:border-purple-400',
      text: 'text-purple-950 dark:text-purple-100',
    },
  }[accentColor];

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigit = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    const combined = newDigits.join('').slice(0, 6);
    onChange(combined);

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (combined.length === 6 && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    const cleanNumbers = pastedText.replace(/\D/g, '').slice(0, 6);
    if (!cleanNumbers) return;

    onChange(cleanNumbers);
    const targetFocus = Math.min(cleanNumbers.length, 5);
    inputRefs.current[targetFocus]?.focus();

    if (cleanNumbers.length === 6 && onComplete) {
      onComplete(cleanNumbers);
    }
  };

  return (
    <div className="grid w-full min-w-0 grid-cols-6 items-center gap-2 py-1 sm:gap-3">
      {Array.from({ length: 6 }).map((_, index) => {
        const isFilled = Boolean(digits[index]);

        return (
          <React.Fragment key={index}>
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              value={digits[index]}
              disabled={disabled}
              onChange={(e) => handleInputChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              aria-label={`Digit ${index + 1} of 6-digit authentication code`}
              className={`
                h-12 w-full min-w-0 px-0 text-center text-xl font-mono font-black
                sm:h-14 sm:text-2xl
                rounded-xl border transition-all duration-200 select-all outline-hidden
                ${error
                  ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
                  : isFilled
                  ? `${accentClasses.activeBorder} ${accentClasses.text}`
                  : 'border-slate-200 bg-slate-50/80 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'
                }
                ${accentClasses.focus}
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-xs hover:border-slate-300 dark:hover:border-slate-700
              `}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};
