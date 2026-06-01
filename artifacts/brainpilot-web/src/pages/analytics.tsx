import { useTrends, useSubjectBreakdown, useQuizPerformance, useRevisionStats } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, PieChart as PieChartIcon, BrainCircuit, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Analytics() {
  const [days, setDays] = useState("30");
  
  const { data: trends, isLoading: trendsLoading } = useTrends();
  const { data: subjects, isLoading: subjectsLoading } = useSubjectBreakdown();
  const { data: quizStats, isLoading: quizLoading } = useQuizPerformance(parseInt(days));
  const { data: revStats, isLoading: revLoading } = useRevisionStats();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep insights into your learning performance.</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2"><BrainCircuit className="w-4 h-4"/> Avg Score</div>
            <div className="text-3xl font-bold text-foreground">{quizStats?.avg_percentage || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2"><BookOpen className="w-4 h-4"/> Quizzes Taken</div>
            <div className="text-3xl font-bold text-foreground">{quizStats?.quiz_count || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2"><BarChart2 className="w-4 h-4"/> Pass Rate</div>
            <div className="text-3xl font-bold text-foreground">{quizStats?.pass_rate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2"><BookOpen className="w-4 h-4"/> Weak Topics</div>
            <div className="text-3xl font-bold text-destructive">{revStats?.weak_topic_count || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              <CardTitle>Study Time Trends</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {trendsLoading ? <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends || []}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}h`} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-chart-2" />
              <CardTitle>Quiz Performance Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {quizLoading ? <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizStats?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--chart-2))" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-chart-3" />
              <CardTitle>Subject Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {subjectsLoading ? <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={subjects || []} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value">
                    {(subjects || []).map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
