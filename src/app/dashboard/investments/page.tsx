import { InvestmentChart } from "@/app/components/dashboard/investment-chart";

export default function InvestmentsPage() {
  return (
    <div className="grid gap-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <InvestmentChart />
    </div>
  );
}
