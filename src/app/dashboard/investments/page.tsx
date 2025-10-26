import { InvestmentChart } from "@/app/components/dashboard/investment-chart";
import { AddInvestmentDialog } from "./add-investment-dialog";
import { InvestmentsTable } from "./investments-table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function InvestmentsPage() {
  return (
    <div className="grid gap-6">
       <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold">Investments</h1>
         <AddInvestmentDialog />
       </div>
        <InvestmentChart />
        <InvestmentsTable />
    </div>
  );
}
