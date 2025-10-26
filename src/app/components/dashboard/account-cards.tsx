import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wallet, CreditCard, Landmark, PiggyBank } from "lucide-react";

const accountData = [
  {
    id: 1,
    title: "Checking Account",
    balance: "$5,250.75",
    change: "+2.5%",
    icon: Wallet,
  },
  {
    id: 2,
    title: "Savings Account",
    balance: "$20,100.00",
    change: "+1.2%",
    icon: PiggyBank,
  },
  {
    id: 3,
    title: "Credit Card",
    balance: "$-1,234.56",
    change: "-$50.00",
    icon: CreditCard,
  },
  {
    id: 4,
    title: "Investment Portfolio",
    balance: "$150,890.32",
    change: "+5.8%",
    icon: Landmark,
  },
];

export function AccountCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {accountData.map((account) => (
        <Card key={account.id} style={{backgroundColor: '#9196cc'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{account.title}</CardTitle>
            <account.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{account.balance}</div>
            <p className={`text-xs ${account.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {account.change} vs last month
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
