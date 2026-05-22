interface StatsCardsProps {
  stats: {
    pending: number;
    highPriority: number;
    dueSoon: number;
    completed: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: "待完成", count: stats.pending, color: "text-foreground" },
    { label: "高优先级", count: stats.highPriority, color: "text-chart-2" },
    { label: "即将到期", count: stats.dueSoon, color: "text-chart-1" },
    { label: "已完成", count: stats.completed, color: "text-chart-3" },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-muted-foreground text-sm mb-2">{card.label}</p>
          <p className={`text-3xl font-semibold leading-normal ${card.color}`}>
            {card.count} <span className="text-base font-normal text-muted-foreground">项</span>
          </p>
        </div>
      ))}
    </div>
  );
}
