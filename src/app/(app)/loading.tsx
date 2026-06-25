export default function AppLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Yükleniyor">
      {/* Sayfa başlığı */}
      <div className="space-y-2">
        <div className="skeleton h-8 w-52 rounded-[calc(var(--app-radius)*0.6)]" />
        <div className="skeleton h-4 w-72 rounded-[calc(var(--app-radius)*0.5)]" />
      </div>

      {/* Jenerik kart blokları — her sayfaya uyan nötr şekil */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="skeleton mb-4 h-5 w-40 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div
                key={j}
                className="skeleton h-11 w-full rounded-[calc(var(--app-radius)*0.5)]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
