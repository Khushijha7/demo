import { AccountCards } from "@/app/components/dashboard/account-cards";
import { ExpenseCharts } from "@/app/components/dashboard/expense-charts";
import { InvestmentChart } from "@/app/components/dashboard/investment-chart";
import { PersonalizedInsights } from "@/app/components/dashboard/personalized-insights";
import { RecentTransactions } from "@/app/components/dashboard/recent-transactions";
import { SavingsGoals } from "@/app/components/dashboard/savings-goals";

export default function DashboardPage() {
  return (
    <div className="grid gap-6 md:gap-8">
      <AccountCards />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <InvestmentChart />
        </div>
        <div className="md:col-span-1">
           <ExpenseCharts />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <RecentTransactions />
        </div>
        <div>
           <SavingsGoals />
        </div>
      </div>
      <PersonalizedInsights />
    </div>
  );
}
