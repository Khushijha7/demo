import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const transactions = [
  {
    id: "txn_1",
    description: "Monthly Subscription",
    date: "2024-06-01",
    amount: "-$15.99",
    status: "Completed",
  },
  {
    id: "txn_2",
    description: "Salary Deposit",
    date: "2024-06-01",
    amount: "+$4,500.00",
    status: "Completed",
  },
  {
    id: "txn_3",
    description: "Grocery Shopping",
    date: "2024-06-02",
    amount: "-$78.50",
    status: "Completed",
  },
  {
    id: "txn_4",
    description: "Online Transfer to John D.",
    date: "2024-06-03",
    amount: "-$250.00",
    status: "Pending",
  },
    {
    id: "txn_5",
    description: "Restaurant Bill",
    date: "2024-06-04",
    amount: "-$55.20",
    status: "Completed",
  },
  {
    id: "txn_6",
    description: "Stock Dividend",
    date: "2024-06-05",
    amount: "+$120.00",
    status: "Completed",
  },
];

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
                A quick look at your recent financial activities.
            </CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="#">
                View All
                <ArrowUpRight className="h-4 w-4" />
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={transaction.status === 'Completed' ? 'default' : 'secondary'}
                    className={`${transaction.status === 'Completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : ''}`}
                    >
                      {transaction.status}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">{transaction.date}</TableCell>
                <TableCell className={`text-right font-medium ${transaction.amount.startsWith('+') ? 'text-green-500' : ''}`}>
                  {transaction.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
