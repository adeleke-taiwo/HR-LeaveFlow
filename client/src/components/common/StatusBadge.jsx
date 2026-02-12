import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants';

export default function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      style={{
        padding: '0.375rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: colors.bg,
        color: colors.color,
      }}
    >
      {label}
    </span>
  );
}
