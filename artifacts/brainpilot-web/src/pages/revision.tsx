import { useState } from "react";
import { useRevisionTopics, useDueRevisionTopics, useWeakRevisionTopics, useRecordRevision, useCreateRevisionTopic } from "@/hooks/use-revision";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BookOpen, Check, Star, Clock, AlertTriangle, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

export default function Revision() {
  const { data: allTopics, isLoading: loadingAll } = useRevisionTopics();
  const { data: dueTopics, isLoading: loadingDue } = useDueRevisionTopics();
  const { data: weakTopics, isLoading: loadingWeak } = useWeakRevisionTopics();
  
  const recordRevision = useRecordRevision();
  const createTopic = useCreateRevisionTopic();

  const [newTopic, setNewTopic] = useState({ subject: "", topic: "", confidence_level: [3] });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({ duration_minutes: 15, confidence_after: [3], notes: "" });

  const handleAddTopic = () => {
    createTopic.mutate({ 
      subject: newTopic.subject, 
      topic: newTopic.topic, 
      confidence_level: newTopic.confidence_level[0] 
    }, {
      onSuccess: () => {
        setIsAddOpen(false);
        setNewTopic({ subject: "", topic: "", confidence_level: [3] });
      }
    });
  };

  const handleRecord = () => {
    if (!activeReviewId) return;
    recordRevision.mutate({
      topic_id: activeReviewId,
      duration_minutes: reviewData.duration_minutes,
      confidence_after: reviewData.confidence_after[0],
      notes: reviewData.notes
    }, {
      onSuccess: () => setActiveReviewId(null)
    });
  };

  const getConfidenceColor = (level: number) => {
    if (level >= 4) return "text-green-500 bg-green-500/10";
    if (level === 3) return "text-amber-500 bg-amber-500/10";
    return "text-red-500 bg-red-500/10";
  };

  const renderTopicCard = (topic: any) => (
    <Card key={topic.id} className="border-border flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider">{topic.subject}</div>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${getConfidenceColor(topic.confidence_level)}`}>
            <Star className="w-3 h-3 fill-current" /> LVL {topic.confidence_level}
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">{topic.topic}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Revisions</div>
            <div className="font-semibold text-foreground">{topic.revision_count}</div>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Next Review</div>
            <div className="font-semibold text-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              {topic.next_revision_at ? new Date(topic.next_revision_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : "—"}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        <Dialog open={activeReviewId === topic.id} onOpenChange={(o) => !o && setActiveReviewId(null)}>
          <DialogTrigger asChild>
            <Button 
              className="w-full gap-2" 
              variant={topic.next_revision_at && new Date(topic.next_revision_at) <= new Date() ? "default" : "outline"}
              onClick={() => setActiveReviewId(topic.id)}
            >
              <Check className="w-4 h-4" /> Review Now
            </Button>
          </DialogTrigger>
          {activeReviewId === topic.id && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Review: {topic.topic}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Time Spent (minutes)</Label>
                  <Input type="number" min={1} value={reviewData.duration_minutes} onChange={e => setReviewData({...reviewData, duration_minutes: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>New Confidence Level</Label>
                    <span className="font-bold text-primary">{reviewData.confidence_after[0]} / 5</span>
                  </div>
                  <Slider min={1} max={5} step={1} value={reviewData.confidence_after} onValueChange={v => setReviewData({...reviewData, confidence_after: v})} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Weak</span>
                    <span>Mastered</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea placeholder="What was hard? What stuck?" value={reviewData.notes} onChange={e => setReviewData({...reviewData, notes: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRecord} disabled={recordRevision.isPending}>Save Review</Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Spaced Repetition</h1>
          <p className="text-muted-foreground mt-1">Review topics at the perfect time to maximize retention.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Revision Topic</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Subject</Label><Input value={newTopic.subject} onChange={e => setNewTopic({...newTopic, subject: e.target.value})} /></div>
              <div className="space-y-2"><Label>Topic</Label><Input value={newTopic.topic} onChange={e => setNewTopic({...newTopic, topic: e.target.value})} /></div>
              <div className="space-y-4">
                <div className="flex justify-between"><Label>Current Confidence</Label><span className="font-bold">{newTopic.confidence_level[0]}/5</span></div>
                <Slider min={1} max={5} step={1} value={newTopic.confidence_level} onValueChange={v => setNewTopic({...newTopic, confidence_level: v})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTopic} disabled={createTopic.isPending || !newTopic.subject || !newTopic.topic}>Add Topic</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="due" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
          <TabsTrigger value="due" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Due Now</TabsTrigger>
          <TabsTrigger value="weak">Weak Topics</TabsTrigger>
          <TabsTrigger value="all">All Topics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="due">
          {loadingDue ? <div className="text-muted-foreground">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dueTopics?.length ? dueTopics.map(renderTopicCard) : (
                <div className="col-span-full text-center p-12 border border-dashed rounded-xl bg-card">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Zero Inbox!</h3>
                  <p className="text-muted-foreground">You have no topics due for review today.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="weak">
          {loadingWeak ? <div className="text-muted-foreground">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weakTopics?.length ? weakTopics.map(renderTopicCard) : (
                <div className="col-span-full text-center p-12 border border-dashed rounded-xl bg-card">
                  <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Looking Good</h3>
                  <p className="text-muted-foreground">You don't have any weak topics right now.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {loadingAll ? <div className="text-muted-foreground">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTopics?.length ? allTopics.map(renderTopicCard) : (
                <div className="col-span-full text-center p-12 border border-dashed rounded-xl bg-card">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Add your first topic to start using spaced repetition.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
