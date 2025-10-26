"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { getPersonalizedInsights } from "@/app/actions";
import { Bot, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const initialState = {
  data: null,
  error: null,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Insights
        </>
      )}
    </Button>
  );
}

export function PersonalizedInsights() {
  const [state, formAction] = useActionState(getPersonalizedInsights, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.error,
      });
    }
  }, [state.error, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          Personalized AI Insights
        </CardTitle>
        <CardDescription>
          Tell us about your spending habits and financial goals to receive personalized advice from our AI.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="spendingHabits">Describe your current spending habits.</Label>
            <Textarea
              id="spendingHabits"
              name="spendingHabits"
              placeholder="e.g., 'I spend a lot on dining out, about $400/month. I also have a monthly subscription for a streaming service...'"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="financialGoals">What are your financial goals?</Label>
            <Textarea
              id="financialGoals"
              name="financialGoals"
              placeholder="e.g., 'I want to save for a down payment on a house in 5 years. I also want to build an emergency fund of $10,000...'"
              rows={3}
            />
          </div>
          {state.success && state.data && (
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-lg">Your Personalized Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="whitespace-pre-wrap font-mono text-sm">{state.data.insights}</p>
                </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
