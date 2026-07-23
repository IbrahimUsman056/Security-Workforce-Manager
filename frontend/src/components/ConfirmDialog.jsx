export default function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <h4 style={{ marginTop: 0 }}>{title}</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13.5 }}>{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}