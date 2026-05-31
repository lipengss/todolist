type StatCardKey = "pending" | "highPriority" | "dueSoon" | "completed";

interface StatsCardsProps {
  stats: {
    pending: number;
    highPriority: number;
    dueSoon: number;
    completed: number;
  };
  activeCard: StatCardKey | null;
  onCardClick: (key: StatCardKey) => void;
}

export function StatsCards({ stats, activeCard, onCardClick }: StatsCardsProps) {
  const cards: { key: StatCardKey; label: string; count: number; color: string; activeClass: string; hoverClass: string }[] = [
    { key: "pending", label: "待完成", count: stats.pending, color: "text-foreground", activeClass: "border-foreground/30 bg-foreground/5", hoverClass: "hover:border-foreground/20 hover:bg-foreground/[0.03]" },
    { key: "highPriority", label: "高优先级", count: stats.highPriority, color: "text-chart-2", activeClass: "border-chart-2/50 bg-chart-2/10", hoverClass: "hover:border-chart-2/30 hover:bg-chart-2/5" },
    { key: "dueSoon", label: "即将到期", count: stats.dueSoon, color: "text-chart-1", activeClass: "border-chart-1/50 bg-chart-1/10", hoverClass: "hover:border-chart-1/30 hover:bg-chart-1/5" },
    { key: "completed", label: "已完成", count: stats.completed, color: "text-chart-3", activeClass: "border-chart-3/50 bg-chart-3/10", hoverClass: "hover:border-chart-3/30 hover:bg-chart-3/5" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      {cards.map((card) => {
        const isActive = activeCard === card.key;
        return (
          <button
            type="button"
            key={card.key}
            onClick={() => onCardClick(card.key)}
            className={`bg-card rounded-lg p-3 md:p-5 border shadow-sm text-left transition-colors ${card.hoverClass} ${
              isActive ? card.activeClass : "border-border"
            }`}
          >
            <p className="text-muted-foreground text-xs md:text-sm mb-1 md:mb-2">{card.label}</p>
            <p className={`text-2xl md:text-3xl font-semibold leading-normal ${card.color}`}>
              {card.count} <span className="text-sm md:text-base font-normal text-muted-foreground">项</span>
            </p>
          </button>
        );
      })}
    </div>
  );
}
