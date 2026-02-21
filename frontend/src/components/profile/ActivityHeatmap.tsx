import { cn } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface ActivityHeatmapProps {
    timeline: { date: string; doubtsSolved: number; }[];
}

export default function ActivityHeatmap({ timeline }: ActivityHeatmapProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back ~365 days
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    // Shift to previous Sunday so columns align correctly
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek);

    // End Date to Saturday
    const endDate = new Date(today);
    const endDayOfWeek = endDate.getDay();
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

    const totalDaysRender = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const allDays = [];
    for (let i = 0; i < totalDaysRender; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        allDays.push(d);
    }

    // Create a quick lookup map by timestamp
    const timelineMap = new Map<number, number>();
    timeline.forEach(t => {
        const d = new Date(t.date);
        d.setHours(0, 0, 0, 0);
        timelineMap.set(d.getTime(), t.doubtsSolved);
    });

    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
        weeks.push(allDays.slice(i, i + 7));
    }

    const getLevel = (doubts: number) => {
        if (!doubts) return 0;
        if (doubts < 3) return 1;
        if (doubts < 6) return 2;
        if (doubts < 10) return 3;
        return 4;
    };

    return (
        <Card className="col-span-full border-[hsl(var(--glass-border))] bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
            <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Activity Hub</CardTitle>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Your doubt-solving activity over the last year</p>
            </CardHeader>
            <CardContent>
                <div className="flex overflow-x-auto custom-scrollbar pb-2">
                    {/* Container for the grid, centered using mx-auto */}
                    <div className="flex gap-[3px] mx-auto">
                        {weeks.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-[3px]">
                                {week.map((day, dIdx) => {
                                    const isFuture = day.getTime() > today.getTime();
                                    const doubts = timelineMap.get(day.getTime()) || 0;
                                    const level = getLevel(doubts);

                                    const formattedDate = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

                                    return (
                                        <div
                                            key={dIdx}
                                            title={isFuture ? undefined : `${doubts} doubt${doubts === 1 ? '' : 's'} solved on ${formattedDate}`}
                                            className={cn(
                                                "w-3 h-3 rounded-sm transition-colors",
                                                isFuture
                                                    ? "opacity-0 cursor-default"
                                                    : "hover:ring-2 ring-blue-500 cursor-help",
                                                !isFuture && (
                                                    level === 0 ? "bg-slate-200 dark:bg-slate-800" :
                                                        level === 1 ? "bg-blue-300 dark:bg-blue-900" :
                                                            level === 2 ? "bg-blue-400 dark:bg-blue-800" :
                                                                level === 3 ? "bg-blue-500 dark:bg-blue-600" :
                                                                    "bg-blue-600 dark:bg-blue-500"
                                                )
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800" />
                    <div className="w-3 h-3 rounded-sm bg-blue-300 dark:bg-blue-900" />
                    <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-800" />
                    <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-600" />
                    <div className="w-3 h-3 rounded-sm bg-blue-600 dark:bg-blue-500" />
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    );
}
