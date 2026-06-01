import { useQuizzes, useGenerateQuiz } from "@/hooks/use-quizzes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BrainCircuit, Play, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Quizzes() {
  const { data: quizzes, isLoading } = useQuizzes();
  const generateQuiz = useGenerateQuiz();
  const [topic, setTopic] = useState("");

  const handleGenerate = () => {
    if (!topic) return;
    generateQuiz.mutate({ topic, num_questions: 5 });
    setTopic("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Quizzes</h1>
          <p className="text-muted-foreground mt-1">Test your knowledge with AI-generated quizzes.</p>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Generate Quiz</CardTitle>
          <CardDescription>Enter a topic and let AI test you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input 
              placeholder="E.g. The French Revolution, Machine Learning basics..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={handleGenerate} disabled={generateQuiz.isPending || !topic} className="gap-2">
              <BrainCircuit className="w-4 h-4" />
              {generateQuiz.isPending ? "Generating..." : "Create Quiz"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Quizzes</h2>
        {isLoading ? (
          <div className="text-muted-foreground">Loading quizzes...</div>
        ) : quizzes?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz: any) => (
              <Card key={quiz.id} className="border-border flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">{quiz.topic}</CardTitle>
                  <CardDescription>{quiz.questions?.length || 0} questions</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full gap-2">
                    <Play className="w-4 h-4" fill="currentColor" />
                    Take Quiz
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed rounded-xl text-muted-foreground">
            <BrainCircuit className="w-12 h-12 mx-auto mb-4 text-muted" />
            <p>No quizzes generated yet. Try creating one above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
