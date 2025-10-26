
"use client"

import React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  expenses: {
    label: "Expenses",
  },
  groceries: { label: "Groceries", color: "hsl(var(--chart-1))" },
  transport: { label: "Transport", color: "hsl(var(--chart-2))" },
  housing: { label: "Housing", color: "hsl(var(--chart-3))" },
  entertainment: { label: "Entertainment", color: "hsl(var(--chart-4))" },
  utilities: { label: "Utilities", color: "hsl(var(--chart-5))" },
  other: { label: "Other", color: "hsl(var(--muted-foreground))" },
}

export function ExpenseChart() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/transactions`),
      where("transactionType", "in", ["withdrawal", "payment"])
    );
  }, [user, firestore]);

  const { data: transactions, isLoading } = useCollection<{
    category: string;
    amount: number;
  }>(transactionsQuery);

  const chartData = React.useMemo(() => {
    if (!transactions) return [];

    const expenseByCategory = transactions.reduce((acc, transaction) => {
      const category = transaction.category.toLowerCase();
      const amount = Math.abs(transaction.amount);
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(expenseByCategory).map(([category, expenses]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      expenses,
      fill: chartConfig[category as keyof typeof chartConfig]?.color || "hsl(var(--muted-foreground))",
    }));
  }, [transactions]);
  
  const totalExpenses = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.expenses, 0)
  }, [chartData])

  if(isLoading) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="items-center pb-0">
                <div className="h-6 w-3/5 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-2/5 animate-pulse rounded bg-muted"></div>
            </CardHeader>
            <CardContent className="flex-1 pb-0 flex items-center justify-center">
                 <div className="h-[200px] w-[200px] animate-pulse rounded-full bg-muted"></div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted"></div>
                 <div className="h-3 w-3/5 animate-pulse rounded bg-muted"></div>
            </CardFooter>
        </Card>
    )
  }
  
   if (chartData.length === 0) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="items-center">
          <CardTitle>Expense Breakdown</CardTitle>
          <CardDescription>No expenses recorded yet.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Add a transaction to see your expense breakdown.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Expense Breakdown</CardTitle>
        <CardDescription>Your spending by category</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="expenses"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Total Expenses
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total expenses across all accounts
        </div>
      </CardFooter>
    </Card>
  )
}
