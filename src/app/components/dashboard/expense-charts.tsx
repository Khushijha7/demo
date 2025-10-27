
"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseChart } from "./expense-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllTransactions } from "@/hooks/use-all-transactions";

export function ExpenseCharts() {
    const { isLoading } = useAllTransactions();

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
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>A summary of your expenses across all accounts.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center pb-4">
                <ExpenseChart />
            </CardContent>
        </Card>
    )
}
