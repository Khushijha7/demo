
'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, Landmark, PiggyBank, MoreVertical } from "lucide-react";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddMoneyDialog } from "@/app/dashboard/accounts/add-money-dialog";

const iconMap: { [key: string]: React.ElementType } = {
  checking: Wallet,
  savings: PiggyBank,
  credit_card: CreditCard,
  investment: Landmark,
  default: Wallet,
};

export function AccountCards() {
  const { user } = useUser();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: accounts, isLoading } = useCollection<{
    id: string;
    accountName: string;
    balance: number;
    accountType: string;
    currency: string;
  }>(accountsQuery);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-1/2 animate-pulse rounded bg-muted"></div>
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!accounts || accounts.length === 0) {
    return (
        <Card className="md:col-span-2 lg:col-span-4">
            <CardHeader>
                <CardTitle>No Accounts Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please add a financial account to get started.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {accounts.map((account) => {
        const Icon = iconMap[account.accountType] || iconMap.default;
        return (
          <Card key={account.id} className="group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{account.accountName}</CardTitle>
               <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <AddMoneyDialog account={account}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Add Money</DropdownMenuItem>
                        </AddMoneyDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
               </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {account.balance.toLocaleString('en-US', { style: 'currency', currency: account.currency || 'USD' })}
              </div>
              <p className="text-xs text-muted-foreground">Current balance</p>
            </CardContent>
          </Card>
        )}
      )}
    </div>
  );
}
