'use client';

import { useState, useEffect, useCallback } from 'react';
import Display from './Display';
import ButtonGrid from './ButtonGrid';
import History from './History';

interface CalculationRecord {
  id: number;
  expression: string;
  result: string;
  createdAt: string;
}

type CalcState = {
  expression: string;
  displayValue: string;
  waitingForOperand: boolean;
  hasResult: boolean;
  isError: boolean;
};

const initialState: CalcState = {
  expression: '',
  displayValue: '0',
  waitingForOperand: false,
  hasResult: false,
  isError: false,
};

function safeEval(expression: string): string {
  try {
    // Replace display operators back to JS operators
    const sanitized = expression
      .replace(/[^0-9+\-*/.%()\s]/g, '')
      .trim();

    if (!sanitized) return 'Error';

    // eslint-disable-next-line no-new-func
    const result = new Function('return ' + sanitized)();

    if (result === undefined || result === null) return 'Error';
    if (!isFinite(result)) return 'Error';
    if (isNaN(result)) return 'Error';

    // Format the result nicely
    const num = Number(result);
    // Avoid floating point weirdness
    const fixed = parseFloat(num.toPrecision(12));
    return String(fixed);
  } catch {
    return 'Error';
  }
}

export default function Calculator() {
  const [state, setState] = useState<CalcState>(initialState);
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveCalculation = useCallback(async (expression: string, result: string) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression, result }),
      });
      await fetchHistory();
    } catch (err) {
      console.error('Failed to save calculation', err);
    }
  }, [fetchHistory]);

  const clearHistory = useCallback(async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  }, []);

  const handleAction = useCallback((action: string) => {
    setState((prev) => {
      // Handle clear
      if (action === 'clear') {
        return { ...initialState };
      }

      // If error state, only clear works (handled above)
      if (prev.isError) {
        return prev;
      }

      // Handle backspace
      if (action === 'backspace') {
        if (prev.hasResult) {
          return { ...initialState };
        }
        if (prev.displayValue.length <= 1) {
          return { ...prev, displayValue: '0' };
        }
        return {
          ...prev,
          displayValue: prev.displayValue.slice(0, -1),
        };
      }

      // Handle negate
      if (action === 'negate') {
        if (prev.displayValue === '0') return prev;
        if (prev.displayValue.startsWith('-')) {
          return { ...prev, displayValue: prev.displayValue.slice(1) };
        }
        return { ...prev, displayValue: '-' + prev.displayValue };
      }

      // Handle percent
      if (action === 'percent') {
        try {
          const val = parseFloat(prev.displayValue);
          if (isNaN(val)) return prev;
          const result = String(parseFloat((val / 100).toPrecision(12)));
          return {
            ...prev,
            displayValue: result,
            hasResult: false,
          };
        } catch {
          return prev;
        }
      }

      // Handle equals
      if (action === 'equals') {
        // Build the full expression
        const fullExpr = prev.hasResult
          ? prev.displayValue
          : prev.expression + prev.displayValue;

        if (!prev.expression && !prev.hasResult) {
          // No operation pending, just show current value
          return prev;
        }

        const result = safeEval(fullExpr);
        const isError = result === 'Error';

        // Save to history asynchronously
        if (!isError) {
          saveCalculation(fullExpr, result);
        }

        return {
          expression: fullExpr,
          displayValue: result,
          waitingForOperand: false,
          hasResult: !isError,
          isError,
        };
      }

      // Handle operators
      if (['+', '-', '*', '/'].includes(action)) {
        if (prev.hasResult) {
          // Continue from result
          return {
            expression: prev.displayValue + action,
            displayValue: prev.displayValue,
            waitingForOperand: true,
            hasResult: false,
            isError: false,
          };
        }

        if (prev.waitingForOperand) {
          // Replace last operator
          const trimmedExpr = prev.expression.replace(/[+\-*/]$/, '');
          return {
            ...prev,
            expression: trimmedExpr + action,
          };
        }

        // Evaluate any pending expression so far
        const pendingExpr = prev.expression + prev.displayValue;
        // If there's a pending expression, evaluate it first
        if (prev.expression) {
          const intermediate = safeEval(pendingExpr);
          if (intermediate === 'Error') {
            return {
              ...initialState,
              displayValue: 'Error',
              isError: true,
            };
          }
          return {
            expression: intermediate + action,
            displayValue: intermediate,
            waitingForOperand: true,
            hasResult: false,
            isError: false,
          };
        }

        return {
          ...prev,
          expression: prev.displayValue + action,
          waitingForOperand: true,
          hasResult: false,
        };
      }

      // Handle digits and decimal
      const isDigit = /^[0-9.]$/.test(action);
      if (!isDigit) return prev;

      // Handle decimal point
      if (action === '.') {
        if (prev.waitingForOperand || prev.hasResult) {
          return {
            ...prev,
            displayValue: '0.',
            waitingForOperand: false,
            hasResult: false,
          };
        }
        if (prev.displayValue.includes('.')) return prev;
        return {
          ...prev,
          displayValue: prev.displayValue + '.',
        };
      }

      // Handle digit input
      if (prev.waitingForOperand || prev.hasResult) {
        return {
          ...prev,
          displayValue: action,
          waitingForOperand: false,
          hasResult: false,
        };
      }

      if (prev.displayValue === '0') {
        return { ...prev, displayValue: action };
      }

      return {
        ...prev,
        displayValue: prev.displayValue + action,
      };
    });
  }, [saveCalculation]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '0' && key <= '9') handleAction(key);
      else if (key === '.') handleAction('.');
      else if (key === '+') handleAction('+');
      else if (key === '-') handleAction('-');
      else if (key === '*') handleAction('*');
      else if (key === '/') { e.preventDefault(); handleAction('/'); }
      else if (key === '%') handleAction('percent');
      else if (key === 'Enter' || key === '=') handleAction('equals');
      else if (key === 'Backspace') handleAction('backspace');
      else if (key === 'Escape') handleAction('clear');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAction]);

  const displayExpression = state.hasResult
    ? state.expression
    : state.expression
      ? state.expression.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−')
      : '';

  return (
    <div className="app-container">
      <div className="calculator">
        <Display
          expression={displayExpression}
          value={state.displayValue}
          isError={state.isError}
        />
        <ButtonGrid onAction={handleAction} />
      </div>
      <History
        history={history}
        loading={historyLoading}
        onClear={clearHistory}
      />
    </div>
  );
}
