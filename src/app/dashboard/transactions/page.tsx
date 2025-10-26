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
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { AddTransactionDialog } from "./add-transaction-dialog";

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // A real app would have a way to select an account.
  // For now, we'll assume a hardcoded account ID.
  // NOTE: This account ID must exist for the user in Firestore.
  const accountId = "default-account"; 

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const transactionsCol = collection(firestore, `users/${user.uid}/accounts/${accountId}/transactions`);
    return query(transactionsCol, orderBy("transactionDate", "desc"));
  }, [user, firestore, accountId]);

  const { data: transactions, isLoading } = useCollection<{
    description: string;
    amount: number;
    transactionType: string;
    status: string;
    transactionDate: string;
  }>(transactionsQuery);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
                A detailed history of your financial activities.
            </CardDescription>
        </div>
        <AddTransactionDialog accountId={accountId} />
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
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>}
            {!isLoading && transactions?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No transactions yet.</TableCell></TableRow>}
            {transactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant={transaction.status === 'Completed' ? 'default' : 'secondary'}
                    className={`${transaction.status === 'Completed' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : ''}`}
                    >
                      {transaction.status || 'Completed'}
                    </Badge>
                </TableCell>
                <TableCell className="text-right">{new Date(transaction.transactionDate).toLocaleDateString()}</TableCell>
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
