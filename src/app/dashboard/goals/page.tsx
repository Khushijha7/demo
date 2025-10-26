
import { SavingsGoals } from "@/app/components/dashboard/savings-goals";
import { AddGoalDialog } from "./add-goal-dialog";

export default function GoalsPage() {
  return (
    <div className="grid gap-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <AddGoalDialog />
      </div>
       <SavingsGoals />
    </div>
  );
}
