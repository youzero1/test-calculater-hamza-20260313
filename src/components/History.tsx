'use client';

interface CalculationRecord {
  id: number;
  expression: string;
  result: string;
  createdAt: string;
}

interface HistoryProps {
  history: CalculationRecord[];
  loading: boolean;
  onClear: () => void;
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function History({ history, loading, onClear }: HistoryProps) {
  return (
    <div className="history-panel">
      <div className="history-header">
        <h2 className="history-title">History</h2>
        {history.length > 0 && (
          <button className="history-clear-btn" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      <div className="history-list">
        {loading ? (
          <p className="history-loading">Loading...</p>
        ) : history.length === 0 ? (
          <p className="history-empty">No calculations yet</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="history-item-expression">{item.expression}</div>
              <div className="history-item-result">= {item.result}</div>
              <div className="history-item-time">{formatTime(item.createdAt)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
