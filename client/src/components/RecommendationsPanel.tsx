import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, TrendingUp, Calendar, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Recommendation {
  eventType: string;
  reasoning: string;
  successRate: number;
  suggestedEvents: Array<{
    name: string;
    url: string;
  }>;
  bestTimeToApply: string;
  tips: string[];
}

export default function RecommendationsPanel() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const applicationsQuery = trpc.applications.list.useQuery();
  const recommendationsQuery = trpc.recommendations.generate.useQuery();
  
  const handleGenerateRecommendationsInternal = async () => {
    await recommendationsQuery.refetch();
    toast.success("Recommendations generated successfully!");
  };
  
  // Handle recommendations
  useEffect(() => {
    if (recommendationsQuery.data) {
      if (Array.isArray(recommendationsQuery.data)) {
        setRecommendations(recommendationsQuery.data as Recommendation[]);
      } else if ('recommendations' in recommendationsQuery.data) {
        setRecommendations((recommendationsQuery.data as any).recommendations || []);
      }
      setHasGenerated(true);
    }
  }, [recommendationsQuery.data]);
  
  useEffect(() => {
    if (recommendationsQuery.isError) {
      toast.error("Failed to generate recommendations");
    }
  }, [recommendationsQuery.isError]);

  const handleGenerateRecommendations = async () => {
    setIsLoading(true);
    try {
      await handleGenerateRecommendationsInternal();
    } finally {
      setIsLoading(false);
    }
  };



  const applicationCount = applicationsQuery.data?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-bold text-foreground">Smart Recommendations</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Get personalized event recommendations based on your application history and success patterns.
        </p>
      </div>

      {/* Generate Button */}
      {applicationCount > 0 && (
        <Button
          onClick={handleGenerateRecommendations}
          disabled={isLoading || recommendationsQuery.isLoading}
          className="w-full md:w-auto"
        >
          {isLoading || recommendationsQuery.isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Your History...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate Recommendations
            </>
          )}
        </Button>
      )}

      {/* Empty State */}
      {applicationCount === 0 && !hasGenerated && (
        <Card className="p-8 text-center border-dashed">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">
            Add some applications first to get personalized recommendations
          </p>
          <p className="text-sm text-muted-foreground">
            The more applications you track, the better recommendations we can provide!
          </p>
        </Card>
      )}

      {/* Recommendations Grid */}
      {hasGenerated && recommendations.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, idx) => (
            <Card key={idx} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              {/* Event Type Badge */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{rec.eventType}</h3>
                </div>
                <Badge variant="secondary" className="whitespace-nowrap">
                  {rec.successRate}% match
                </Badge>
              </div>

              {/* Reasoning */}
              <p className="text-sm text-muted-foreground">{rec.reasoning}</p>

              {/* Success Rate Indicator */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${rec.successRate}%` }}
                  />
                </div>
              </div>

              {/* Best Time to Apply */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Best Time to Apply</span>
                </div>
                <p className="text-sm text-muted-foreground">{rec.bestTimeToApply}</p>
              </div>

              {/* Suggested Events */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Suggested Events</h4>
                <div className="space-y-2">
                  {rec.suggestedEvents.map((event, eventIdx) => (
                    <div key={eventIdx} className="flex items-start gap-2">
                      <span className="text-accent text-sm font-semibold">•</span>
                      <a 
                        href={event.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline"
                      >
                        {event.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground">Tips for Success</h4>
                <ul className="space-y-1">
                  {rec.tips.map((tip, tipIdx) => (
                    <li key={tipIdx} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-accent">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
            <p className="text-muted-foreground">
              Analyzing your application history with AI...
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      {hasGenerated && (
        <Card className="p-4 bg-accent/5 border-accent/20">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">
              <p className="font-medium mb-1">How we generate recommendations</p>
              <p className="text-muted-foreground">
                Our AI analyzes your application history, success rates by event type, and optimal application timing to provide personalized suggestions. The more applications you track, the more accurate our recommendations become.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
