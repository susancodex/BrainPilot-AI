import { useTrends, useSubjectBreakdown } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Analytics() {
  const { data: trends, isLoading: trendsLoading } = useTrends();
  const { data: subjects, isLoading: subjectsLoading } = useSubjectBreakdown();

  const mockTrends = [
    { name: "Mon", hours: 2 },
    { name: "Tue", hours: 3.5 },
    { name: "Wed", hours: 1 },
    { name: "Thu", hours: 4 },
    { name: "Fri", hours: 2.5 },
    { name: "Sat", hours: 5 },
    { name: "Sun", hours: 3 },
  ];

  const mockSubjects = [
    { name: "Biology", value: 400 },
    { name: "Chemistry", value: 300 },
    { name: "Math", value: 300 },
    { name: "History", value: 200 },
  ];

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your study habits and performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              <CardTitle>Study Time Trends</CardTitle>
            </div>
            <CardDescription>Hours studied over the past week</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {trendsLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends || mockTrends}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-chart-2" />
              <CardTitle>Subject Breakdown</CardTitle>
            </div>
            <CardDescription>Time spent per subject</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {subjectsLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjects || mockSubjects}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(subjects || mockSubjects).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
