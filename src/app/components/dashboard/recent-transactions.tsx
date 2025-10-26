
'use client';
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
import { useAllTransactions } from "@/hooks/use-all-transactions";
import { Timestamp } from "firebase/firestore";

export function RecentTransactions() {
  const { transactions, isLoading } = useAllTransactions({
    limit: 6,
    orderBy: "transactionDate",
    orderDirection: "desc",
  });

  const formatDate = (date: string | Timestamp) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date.toDate();
    return d.toLocaleDateString();
  };

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
            <Link href="/dashboard/transactions">
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
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            )}
            {!isLoading && (!transactions || transactions.length === 0) && (
                 <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                        No recent transactions found.
                    </TableCell>
                </TableRow>
            )}
            {transactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={'default'}
                    className={'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'}
                    >
                      Completed
                    </Badge>
                </TableCell>
                <TableCell className="text-right">{formatDate(transaction.transactionDate)}</TableCell>
                <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-500' : ''}`}>
                   {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
