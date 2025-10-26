
'use client';
import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, Timestamp, doc, updateDoc } from "firebase/firestore";
import { getRealTimePrice } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvestmentActions } from './investment-actions';
import { useAllTransactions } from '@/hooks/use-all-transactions';

interface Investment {
    id: string;
    userId: string;
    investmentName: string;
    tickerSymbol: string;
    investmentType: string;
    quantity: number;
    purchasePrice: number;
    currentValue: number;
    purchaseDate: Timestamp | string;
    associatedTransactionId?: string;
}

interface Account {
    id: string;
    accountName: string;
}

export function InvestmentsTable() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const investmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/investments`));
  }, [user, firestore]);

  const accountsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: investments, isLoading: isLoadingInvestments } = useCollection<Investment>(investmentsQuery);
  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<Account>(accountsQuery);
  const { transactions, isLoading: isLoadingTransactions } = useAllTransactions();

  const handleRefreshPrices = async (investment?: Investment) => {
    if (!firestore || !user) return;
    
    const investmentsToRefresh = investment ? [investment] : investments;
    if (!investmentsToRefresh) return;
    
    setIsRefreshing(true);
    if(investment) setRefreshingId(investment.id);

    const refreshPromises = investmentsToRefresh.map(async (inv) => {
      try {
        const result = await getRealTimePrice({ tickerSymbol: inv.tickerSymbol });
        if (result.success && result.data) {
          const newCurrentValue = result.data.price * inv.quantity;
          const investmentRef = doc(firestore, `users/${user.uid}/investments`, inv.id);
          await updateDoc(investmentRef, { currentValue: newCurrentValue, updatedAt: new Date() });
        } else {
          throw new Error(result.error || "Failed to get price from AI.");
        }
      } catch (error) {
        console.error(`Failed to refresh price for ${inv.investmentName}:`, error);
        toast({
            variant: "destructive",
            title: `Error refreshing ${inv.investmentName}`,
            description: error instanceof Error ? error.message : "An unknown error occurred."
        })
      }
    });

    await Promise.all(refreshPromises);

    setIsRefreshing(false);
    setRefreshingId(null);
    if (investment) {
        toast({
            title: "Success",
            description: `Refreshed price for ${investment.investmentName}.`
        })
    } else {
        toast({
            title: "Success",
            description: `Refreshed prices for all investments.`
        })
    }
  };
  
  const isLoading = isLoadingInvestments || isLoadingAccounts || isLoadingTransactions;

  const investmentsWithAccount = useMemo(() => {
    if (!investments || !transactions || !accounts) return [];
    
    const transactionMap = new Map(transactions.map(t => [t.id, t]));
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    return investments.map(investment => {
      const transaction = transactionMap.get(investment.associatedTransactionId || '');
      const account = transaction ? accountMap.get(transaction.accountId) : undefined;
      return {
        ...investment,
        sourceAccountName: account ? account.accountName : 'N/A',
      };
    });
  }, [investments, transactions, accounts]);

  const totalValue = investments?.reduce((sum, inv) => sum + inv.currentValue, 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Your Portfolio</CardTitle>
            <CardDescription>
                A detailed view of your current investments.
            </CardDescription>
        </div>
        <Button size="sm" className="ml-auto gap-1" onClick={() => handleRefreshPrices()} disabled={isRefreshing || isLoading}>
            {isRefreshing && !refreshingId ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
            Refresh All
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investment</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Current Value</TableHead>
              <TableHead>Source Account</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading investments...</TableCell></TableRow>}
            {!isLoading && investmentsWithAccount.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center">No investments yet.</TableCell></TableRow>}
            {investmentsWithAccount?.map((investment) => {
              const cost = investment.purchasePrice * investment.quantity;

              return (
              <TableRow key={investment.id}>
                <TableCell>
                    <div className="font-medium">{investment.investmentName} ({investment.tickerSymbol})</div>
                    <div className="text-sm text-muted-foreground">{investment.quantity} shares @ {investment.purchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
                </TableCell>
                <TableCell>{cost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                <TableCell>{investment.currentValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                <TableCell>{investment.sourceAccountName}</TableCell>
                <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleRefreshPrices(investment)} disabled={isRefreshing}>
                            {isRefreshing && refreshingId === investment.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                        <InvestmentActions investment={investment} />
                   </div>
                </TableCell>
              </TableRow>
            )})}
             {!isLoading && investments && investments.length > 0 && (
                <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={3} className="text-right">Total Portfolio Value</TableCell>
                    <TableCell colSpan={2}>{totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
