
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
import { AddTransactionDialog } from "./add-transaction-dialog";
import { useAllTransactions } from "@/hooks/use-all-transactions";
import { Timestamp } from "firebase/firestore";
import { TransactionActions } from "./transaction-actions";

export default function TransactionsPage() {
  const { transactions, isLoading } = useAllTransactions({
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
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
                A detailed history of your financial activities.
            </CardDescription>
        </div>
        <AddTransactionDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>}
            {!isLoading && transactions?.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No transactions yet.</TableCell></TableRow>}
            {transactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                </TableCell>
                <TableCell>
                   <Badge variant="outline">{transaction.category}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={transaction.transactionType === 'deposit' ? 'default' : 'secondary'}
                    className={`${transaction.transactionType === 'deposit' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : ''}`}
                    >
                      {transaction.transactionType}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">{formatDate(transaction.transactionDate)}</TableCell>
                <TableCell className={`text-right font-medium ${transaction.amount > 0 ? 'text-green-500' : ''}`}>
                  {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </TableCell>
                <TableCell className="text-right">
                    <TransactionActions transaction={transaction} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
