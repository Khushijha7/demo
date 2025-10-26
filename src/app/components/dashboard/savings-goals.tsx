import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

const goals = [
  {
    id: 1,
    name: "New Car Fund",
    current: 12500,
    target: 30000,
  },
  {
    id: 2,
    name: "Vacation to Hawaii",
    current: 3800,
    target: 5000,
  },
  {
    id: 3,
    name: "Emergency Fund",
    current: 9500,
    target: 15000,
  },
    {
    id: 4,
    name: "House Down Payment",
    current: 45000,
    target: 100000,
  },
];

export function SavingsGoals() {
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
          {goals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <div key={goal.id} className="grid gap-2">
                <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm">{goal.name}</h3>
                    <span className="text-xs text-muted-foreground">
                        {`$${goal.current.toLocaleString()} / $${goal.target.toLocaleString()}`}
                    </span>
                </div>
                <Progress value={progress} aria-label={`${goal.name} progress`} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
