import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { Todo } from "./types";
import { ScrollArea } from "./ui/ScrollArea";

const getToday = () => new Date().toISOString().split("T")[0];

interface StatsViewProps {
  todos: Todo[];
  categoryMap: Map<string, { name: string; color: string }>;
}

const CAT_COLORS: Record<string, string> = {
  "bg-chart-1": "#fbbf24",
  "bg-chart-2": "#ef4444",
  "bg-chart-3": "#10b981",
  "bg-chart-4": "#3b82f6",
  "bg-chart-5": "#8b5cf6",
};

const AXIS_STYLE = {
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: "#9ca3af" },
};

export function StatsView({ todos, categoryMap }: StatsViewProps) {
  const stats = useMemo(() => {
    const unfinished = todos.filter((t) => !t.completed);
    const completed = todos.filter((t) => t.completed);
    const today = getToday();
    const todayTs = new Date(today).getTime();

    const priorityCounts = { high: 0, medium: 0, low: 0 };
    const categoryCounts = new Map<string, number>();
    let overdueCount = 0;
    let todayCount = 0;
    let thisWeekCount = 0;
    let laterCount = 0;
    let noDueDateCount = 0;

    for (const t of unfinished) {
      priorityCounts[t.priority]++;
      categoryCounts.set(t.category, (categoryCounts.get(t.category) ?? 0) + 1);

      if (t.dueDate) {
        const dueTs = new Date(t.dueDate).getTime();
        if (dueTs < todayTs) overdueCount++;
        else if (dueTs === todayTs) todayCount++;
        else if (dueTs <= todayTs + 7 * 24 * 60 * 60 * 1000) thisWeekCount++;
        else laterCount++;
      } else {
        noDueDateCount++;
      }
    }

    const total = todos.length;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    const categoryDistribution = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([catId, count]) => ({
        id: catId,
        name: categoryMap.get(catId)?.name ?? catId,
        color: categoryMap.get(catId)?.color ?? "bg-muted",
        count,
      }));

    return {
      total,
      completed: completed.length,
      unfinished: unfinished.length,
      completionRate,
      priorityCounts,
      categoryDistribution,
      dueDateBreakdown: { overdueCount, todayCount, thisWeekCount, laterCount, noDueDateCount },
    };
  }, [todos, categoryMap]);

  const trendData = useMemo(() => {
    const result: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      result.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, count: 0 });
    }
    for (const t of todos) {
      if (t.completed && t.completedAt) {
        const cd = t.completedAt.split("T")[0];
        const entry = result.find(
          (e) => e.label === `${new Date(cd).getMonth() + 1}/${new Date(cd).getDate()}`,
        );
        if (entry) entry.count++;
      }
    }
    return result;
  }, [todos]);

  return (
    <ScrollArea className="flex-1 min-h-0" viewportClassName="px-8 py-6">
      <main className="max-w-6xl mx-auto space-y-6">
        {/* Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-card rounded-xl border border-border p-2 flex items-center justify-center">
            <ReactECharts
              style={{ height: 160, width: "100%" }}
              option={{
                backgroundColor: "transparent",
                series: [
                  {
                    type: "gauge",
                    startAngle: 210,
                    endAngle: -30,
                    center: ["50%", "60%"],
                    radius: "85%",
                    min: 0,
                    max: stats.total || 1,
                    splitNumber: 10,
                    axisLine: { show: true, lineStyle: { width: 10, color: [[stats.completed / (stats.total || 1), "#10b981"], [1, "#252a39"]] } },
                    pointer: { show: false },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    detail: { valueAnimation: true, fontSize: 26, fontWeight: "bold", color: "#e8eaed", offsetCenter: [0, "-22%"], formatter: "{value}" },
                    title: { offsetCenter: [0, "28%"], color: "#9ca3af", fontSize: 11 },
                    data: [{ value: stats.completed, name: "已完成" }],
                  },
                ],
              }}
              opts={{ renderer: "svg" }}
            />
          </div>

          <div className="bg-card rounded-xl border border-border p-2 flex items-center justify-center">
            <ReactECharts
              style={{ height: 160, width: "100%" }}
              option={{
                backgroundColor: "transparent",
                series: [{
                  type: "gauge", startAngle: 210, endAngle: -30, center: ["50%", "60%"], radius: "85%",
                  min: 0, max: stats.total || 1, splitNumber: 10,
                  axisLine: { show: true, lineStyle: { width: 10, color: [[stats.unfinished / (stats.total || 1), "#8b5cf6"], [1, "#252a39"]] } },
                  pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                  detail: { valueAnimation: true, fontSize: 26, fontWeight: "bold", color: "#e8eaed", offsetCenter: [0, "-10%"], formatter: "{value}" },
                  title: { offsetCenter: [0, "20%"], color: "#9ca3af", fontSize: 11 },
                  data: [{ value: stats.unfinished, name: "待完成" }],
                }],
              }}
              opts={{ renderer: "svg" }}
            />
          </div>

          <div className="bg-card rounded-xl border border-border p-2 flex items-center justify-center">
            <ReactECharts
              style={{ height: 160, width: "100%" }}
              option={{
                backgroundColor: "transparent",
                series: [{
                  type: "gauge", startAngle: 210, endAngle: -30, center: ["50%", "60%"], radius: "85%",
                  min: 0, max: stats.unfinished || 1, splitNumber: 10,
                  axisLine: { show: true, lineStyle: { width: 10, color: [[stats.dueDateBreakdown.overdueCount / (stats.unfinished || 1), "#ef4444"], [1, "#252a39"]] } },
                  pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
                  detail: { valueAnimation: true, fontSize: 26, fontWeight: "bold", color: "#e8eaed", offsetCenter: [0, "-10%"], formatter: "{value}" },
                  title: { offsetCenter: [0, "20%"], color: "#9ca3af", fontSize: 11 },
                  data: [{ value: stats.dueDateBreakdown.overdueCount, name: "已逾期" }],
                }],
              }}
              opts={{ renderer: "svg" }}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Priority Distribution */}
          <section className="bg-card rounded-xl border border-border p-5">
            <ReactECharts
              style={{ height: 300 }}
              option={{
                backgroundColor: "transparent",
                title: {
                  text: "优先级分布",
                  left: "center",
                  top: 8,
                  textStyle: { color: "#e8eaed", fontSize: 14, fontWeight: 500 },
                },
                tooltip: { trigger: "axis" },
                grid: { left: 60, right: 40, top: 50, bottom: 30 },
                xAxis: {
                  type: "value",
                  ...AXIS_STYLE,
                  splitLine: { lineStyle: { color: "#2a2f3e" } },
                },
                yAxis: {
                  type: "category",
                  data: ["高", "中", "低"],
                  ...AXIS_STYLE,
                  axisLabel: { color: "#e8eaed", fontSize: 13 },
                },
                series: [
                  {
                    type: "bar",
                    data: [
                      { value: stats.priorityCounts.high, itemStyle: { color: "#ef4444", borderRadius: [0, 4, 4, 0] } },
                      { value: stats.priorityCounts.medium, itemStyle: { color: "#fbbf24", borderRadius: [0, 4, 4, 0] } },
                      { value: stats.priorityCounts.low, itemStyle: { color: "#3b82f6", borderRadius: [0, 4, 4, 0] } },
                    ],
                    barWidth: 18,
                    label: { show: true, position: "right", color: "#9ca3af", fontSize: 12 },
                  },
                ],
              }}
              opts={{ renderer: "svg" }}
            />
          </section>

          {/* Due Date Donut */}
          <section className="bg-card rounded-xl border border-border p-5">
            <ReactECharts
              style={{ height: 300 }}
              option={{
                backgroundColor: "transparent",
                title: {
                  text: "到期日分析",
                  left: "center",
                  top: 8,
                  textStyle: { color: "#e8eaed", fontSize: 14, fontWeight: 500 },
                },
                tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
                legend: {
                  bottom: 0,
                  textStyle: { color: "#9ca3af", fontSize: 11 },
                  itemWidth: 10,
                  itemHeight: 10,
                  itemGap: 16,
                },
                series: [
                  {
                    type: "pie",
                    center: ["50%", "48%"],
                    radius: ["45%", "75%"],
                    avoidLabelOverlap: false,
                    itemStyle: { borderRadius: 4, borderColor: "#1a1f2e", borderWidth: 3 },
                    label: { show: false },
                    emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
                    data: [
                      { value: stats.dueDateBreakdown.overdueCount, name: "已逾期", itemStyle: { color: "#ef4444" } },
                      { value: stats.dueDateBreakdown.todayCount, name: "今天到期", itemStyle: { color: "#fbbf24" } },
                      { value: stats.dueDateBreakdown.thisWeekCount, name: "本周到期", itemStyle: { color: "#3b82f6" } },
                      { value: stats.dueDateBreakdown.laterCount, name: "以后到期", itemStyle: { color: "#8b5cf6" } },
                      { value: stats.dueDateBreakdown.noDueDateCount, name: "无截止日期", itemStyle: { color: "#6b7280" } },
                    ],
                  },
                ],
              }}
              opts={{ renderer: "svg" }}
            />
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category Distribution */}
          <section className="bg-card rounded-xl border border-border p-5">
            <ReactECharts
              style={{ height: 300 }}
              option={{
                backgroundColor: "transparent",
                title: {
                  text: "分类分布",
                  left: "center",
                  top: 8,
                  textStyle: { color: "#e8eaed", fontSize: 14, fontWeight: 500 },
                },
                tooltip: { trigger: "axis" },
                grid: { left: 70, right: 40, top: 50, bottom: 30 },
                xAxis: {
                  type: "value",
                  ...AXIS_STYLE,
                  splitLine: { lineStyle: { color: "#2a2f3e" } },
                },
                yAxis: {
                  type: "category",
                  data: stats.categoryDistribution.map((c) => c.name).reverse(),
                  ...AXIS_STYLE,
                  axisLabel: { color: "#e8eaed", fontSize: 12 },
                },
                series: [
                  {
                    type: "bar",
                    data: stats.categoryDistribution
                      .map((c) => ({
                        value: c.count,
                        itemStyle: {
                          color: CAT_COLORS[c.color] ?? "#8b5cf6",
                          borderRadius: [0, 4, 4, 0],
                        },
                      }))
                      .reverse(),
                    barWidth: 18,
                    label: { show: true, position: "right", color: "#9ca3af", fontSize: 12 },
                  },
                ],
              }}
              opts={{ renderer: "svg" }}
            />
          </section>

          {/* 7-Day Trend */}
          <section className="bg-card rounded-xl border border-border p-5">
            <ReactECharts
              style={{ height: 300 }}
              option={{
                backgroundColor: "transparent",
                title: {
                  text: "近7天完成趋势",
                  left: "center",
                  top: 8,
                  textStyle: { color: "#e8eaed", fontSize: 14, fontWeight: 500 },
                },
                tooltip: { trigger: "axis" },
                grid: { left: 40, right: 20, top: 50, bottom: 30 },
                xAxis: {
                  type: "category",
                  data: trendData.map((d) => d.label),
                  ...AXIS_STYLE,
                  axisLabel: { color: "#9ca3af", fontSize: 11 },
                },
                yAxis: {
                  type: "value",
                  minInterval: 1,
                  ...AXIS_STYLE,
                  splitLine: { lineStyle: { color: "#2a2f3e" } },
                },
                series: [
                  {
                    type: "bar",
                    data: trendData.map((d) => d.count),
                    itemStyle: { color: "#10b981", borderRadius: [6, 6, 0, 0] },
                    barWidth: 24,
                  },
                  {
                    type: "line",
                    data: trendData.map((d) => d.count),
                    smooth: true,
                    lineStyle: { color: "#8b5cf6", width: 2 },
                    itemStyle: { color: "#8b5cf6" },
                    symbol: "circle",
                    symbolSize: 6,
                  },
                ],
              }}
              opts={{ renderer: "svg" }}
            />
          </section>
        </div>
      </main>
    </ScrollArea>
  );
}
