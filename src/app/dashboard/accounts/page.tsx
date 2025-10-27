
import { AccountCards } from "@/app/components/dashboard/account-cards";
import { AddAccountDialog } from "./add-account-dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function AccountsPage() {
  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>Accounts</CardTitle>
                <CardDescription>
                    Your financial accounts at a glance.
                </CardDescription>
            </div>
            <AddAccountDialog />
        </CardHeader>
        <CardContent>
            <AccountCards />
        </CardContent>
      </Card>
    </div>
  );
}
