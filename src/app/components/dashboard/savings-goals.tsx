'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Target } from "lucide-react";

export function SavingsGoals() {
  const { user } = useUser();
  const firestore = useFirestore();

  const goalsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/savingsGoals`));
  }, [user, firestore]);

  const { data: goals, isLoading } = useCollection<{
    goalName: string;
    currentAmount: number;
    targetAmount: number;
  }>(goalsQuery);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Savings Goals
          </CardTitle>
          <CardDescription>Track your progress towards your financial goals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid gap-2">
              <div className="flex justify-between items-baseline">
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
                <div className="h-3 w-1/4 animate-pulse rounded bg-muted"></div>
              </div>
              <div className="h-4 w-full animate-pulse rounded-full bg-muted"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Savings Goals
        </CardTitle>
        <CardDescription>Track your progress towards your financial goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {!goals || goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't set any savings goals yet.</p>
          ) : (
            goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <div key={goal.id} className="grid gap-2">
                  <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-sm">{goal.goalName}</h3>
                      <span className="text-xs text-muted-foreground">
                          {`$${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()}`}
                      </span>
                  </div>
                  <Progress value={progress} aria-label={`${goal.goalName} progress`} />
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
