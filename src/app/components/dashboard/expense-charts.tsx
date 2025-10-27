
"use client"

import React from "react"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseChart } from "./expense-chart";
import { Skeleton } from "@/components/ui/skeleton";

interface Account {
    id: string;
    accountName: string;
}

export function ExpenseCharts() {
    const { user } = useUser();
    const firestore = useFirestore();

    const accountsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/accounts`));
    }, [user, firestore]);

    const { isLoading } = useCollection<Account>(accountsQuery);


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
                    <CardDescription>A summary of your expenses across all accounts.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-4">
                <ExpenseChart />
            </CardContent>
        </Card>
    )
}
