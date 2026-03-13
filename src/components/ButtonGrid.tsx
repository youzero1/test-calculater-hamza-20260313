'use client';

interface ButtonConfig {
  label: string;
  type: 'number' | 'operator' | 'special' | 'equals';
  wide?: boolean;
  action: string;
}

const BUTTONS: ButtonConfig[] = [
  { label: 'C', type: 'special', action: 'clear' },
  { label: '⌫', type: 'special', action: 'backspace' },
  { label: '%', type: 'operator', action: 'percent' },
  { label: '÷', type: 'operator', action: '/' },

  { label: '7', type: 'number', action: '7' },
  { label: '8', type: 'number', action: '8' },
  { label: '9', type: 'number', action: '9' },
  { label: '×', type: 'operator', action: '*' },

  { label: '4', type: 'number', action: '4' },
  { label: '5', type: 'number', action: '5' },
  { label: '6', type: 'number', action: '6' },
  { label: '−', type: 'operator', action: '-' },

  { label: '1', type: 'number', action: '1' },
  { label: '2', type: 'number', action: '2' },
  { label: '3', type: 'number', action: '3' },
  { label: '+', type: 'operator', action: '+' },

  { label: '+/−', type: 'special', action: 'negate' },
  { label: '0', type: 'number', action: '0' },
  { label: '.', type: 'number', action: '.' },
  { label: '=', type: 'equals', action: 'equals' },
];

interface ButtonGridProps {
  onAction: (action: string) => void;
}

export default function ButtonGrid({ onAction }: ButtonGridProps) {
  return (
    <div className="button-grid">
      {BUTTONS.map((btn, idx) => (
        <button
          key={idx}
          className={`btn btn-${btn.type}${btn.wide ? ' btn-wide' : ''}`}
          onClick={() => onAction(btn.action)}
          aria-label={btn.label}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
