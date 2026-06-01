import { useRevisionTopics, useRecordRevision } from "@/hooks/use-revision";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Revision() {
  const { data: topics, isLoading } = useRevisionTopics();
  const recordRevision = useRecordRevision();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Revision</h1>
          <p className="text-muted-foreground mt-1">Review topics based on spaced repetition.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading topics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics?.length ? (
            topics.map((topic: any) => (
              <Card key={topic.id} className="border-border">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{topic.name}</CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <BookOpen className="w-3 h-3" />
                      {topic.subject}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => recordRevision.mutate({ topic_id: topic.id })}
                    disabled={recordRevision.isPending}
                  >
                    <Check className="w-4 h-4" />
                    Review Now
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mastery</span>
                      <span>{Math.round(topic.mastery_score * 100)}%</span>
                    </div>
                    <Progress value={topic.mastery_score * 100} className="h-2" />
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Next review: {new Date(topic.next_review_date).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center p-12 border border-dashed rounded-xl text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted" />
              <p>No revision topics due right now. Great job!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
