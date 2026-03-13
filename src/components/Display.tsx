'use client';

interface DisplayProps {
  expression: string;
  value: string;
  isError: boolean;
}

export default function Display({ expression, value, isError }: DisplayProps) {
  return (
    <div className="display">
      <div className="display-expression">{expression || '\u00a0'}</div>
      <div className={`display-value${isError ? ' error' : ''}`}>
        {value || '0'}
      </div>
    </div>
  );
}
