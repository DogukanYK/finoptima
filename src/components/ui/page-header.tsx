export function PageHeader({
  title,
  description,
  action,
  kicker,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  kicker?: string;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {kicker && (
          <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            {kicker}
          </span>
        )}
        <h1 className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </div>
      <p className="font-heading text-lg font-bold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
