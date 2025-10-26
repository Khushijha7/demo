
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, Timestamp } from "firebase/firestore";
import { Target, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { AddFundDialog } from "@/app/dashboard/goals/add-fund-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EditGoalDialog } from "@/app/dashboard/goals/edit-goal-dialog";
import { DeleteGoalDialog } from "@/app/dashboard/goals/delete-goal-dialog";


interface SavingsGoal {
    id: string;
    goalName: string;
    currentAmount: number;
    targetAmount: number;
    targetDate: Timestamp | string;
}

export function SavingsGoals() {
  const { user } = useUser();
  const firestore = useFirestore();

  const goalsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/savingsGoals`));
  }, [user, firestore]);

  const { data: goals, isLoading } = useCollection<SavingsGoal>(goalsQuery);

  const formatDate = (date: string | Timestamp) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date.toDate();
    return format(d, "PPP");
  };

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
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted mt-1"></div>
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
            <div className="text-center text-muted-foreground py-8">
                <Target className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No Savings Goals Yet</h3>
                <p className="mt-2 text-sm">Create a goal to start tracking your savings.</p>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <div key={goal.id} className="grid gap-2 group">
                  <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold text-sm">{goal.goalName}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {`$${goal.currentAmount.toLocaleString()} / $${goal.targetAmount.toLocaleString()}`}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4"/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <EditGoalDialog goal={goal}>
                                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit Goal</DropdownMenuItem>
                                </EditGoalDialog>
                                <DeleteGoalDialog goalId={goal.id}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">Delete Goal</DropdownMenuItem>
                                </DeleteGoalDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                  </div>
                  <Progress value={progress} aria-label={`${goal.goalName} progress`} />
                   <div className="flex justify-between items-center mt-1">
                        <div className="text-xs text-muted-foreground">
                            Target Date: {formatDate(goal.targetDate)}
                        </div>
                        <AddFundDialog goal={goal} />
                    </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
