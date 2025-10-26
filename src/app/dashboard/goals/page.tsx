import { SavingsGoals } from "@/app/components/dashboard/savings-goals";

export default function GoalsPage() {
  return (
    <div className="grid gap-6">
       <h1 className="text-3xl font-bold">Savings Goals</h1>
       <SavingsGoals />
    </div>
  );
}
