"use client"

import React, { useState } from "react"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseChart } from "./expense-chart";
import { Skeleton } from "@/components/ui/skeleton";

interface Account {
    id: string;
    accountName: string;
}

export function ExpenseCharts() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>('all');

    const accountsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/accounts`));
    }, [user, firestore]);

    const { data: accounts, isLoading } = useCollection<Account>(accountsQuery);

    if (isLoading) {
        return (
            <Card className="flex flex-col h-full">
                <CardHeader className="items-center pb-0">
                    <Skeleton className="h-6 w-3/5 rounded bg-muted" />
                    <Skeleton className="h-4 w-2/5 rounded bg-muted mt-2" />
                </CardHeader>
                <CardContent className="flex-1 pb-0 flex items-center justify-center">
                    <Skeleton className="h-[200px] w-[200px] rounded-full bg-muted" />
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="items-center">
                 <div className="flex flex-col items-center gap-2 text-center">
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>Your spending by category.</CardDescription>
                </div>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="w-[200px] mt-4">
                        <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {accounts?.map(account => (
                            <SelectItem key={account.id} value={account.id}>{account.accountName}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-4">
                <ExpenseChart accountId={selectedAccountId === 'all' ? undefined : selectedAccountId} />
            </CardContent>
        </Card>
    )
}
