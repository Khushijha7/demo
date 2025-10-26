
"use client"

import React from "react"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
                <CardFooter className="flex-col gap-2 text-sm">
                    <Skeleton className="h-4 w-4/5 rounded bg-muted" />
                    <Skeleton className="h-3 w-3/5 rounded bg-muted mt-1" />
                </CardFooter>
            </Card>
        )
    }
    
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="items-center">
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Your spending by category for each account.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <TabsTrigger value="all">All Accounts</TabsTrigger>
                        {accounts?.map(account => (
                            <TabsTrigger key={account.id} value={account.id}>{account.accountName}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="all">
                        <ExpenseChart />
                    </TabsContent>
                    {accounts?.map(account => (
                         <TabsContent key={account.id} value={account.id}>
                            <ExpenseChart accountId={account.id} />
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
