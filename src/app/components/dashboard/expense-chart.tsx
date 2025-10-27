
"use client"

import React from "react"
import { Label, Pie, PieChart } from "recharts"
import { useAllTransactions } from "@/hooks/use-all-transactions";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  expenses: {
    label: "Expenses",
  },
  food: { label: "Food", color: "hsl(var(--chart-1))" },
  transport: { label: "Transport", color: "hsl(var(--chart-2))" },
  housing: { label: "Housing", color: "hsl(var(--chart-3))" },
  entertainment: { label: "Entertainment", color: "hsl(var(--chart-4))" },
  utilities: { label: "Utilities", color: "hsl(var(--chart-5))" },
  investment: { label: "Investment", color: "hsl(var(--chart-2))" },
  savings: { label: "Savings", color: "hsl(var(--chart-3))" },
  other: { label: "Other", color: "hsl(var(--muted-foreground))" },
}

interface ExpenseChartProps {
  accountId?: string;
  className?: string;
}

export function ExpenseChart({ accountId, className }: ExpenseChartProps) {
  const { transactions, isLoading } = useAllTransactions();

  const { chartData, totalExpenses } = React.useMemo(() => {
    if (!transactions) return { chartData: [], totalExpenses: 0 };

    const filteredTransactions = accountId
      ? transactions.filter(t => t.accountId === accountId)
      : transactions;

    const expenseTransactions = filteredTransactions.filter(t => t.transactionType === 'withdrawal' || t.transactionType === 'payment');

    const expenseByCategory = expenseTransactions.reduce((acc, transaction) => {
      const category = (transaction.category || 'other').toLowerCase();
      const amount = Math.abs(transaction.amount);
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += amount;
      return acc;
    }, {} as { [key: string]: number });

    const data = Object.entries(expenseByCategory).map(([category, expenses]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      expenses,
      fill: chartConfig[category as keyof typeof chartConfig]?.color || "hsl(var(--muted-foreground))",
    }));

    const total = data.reduce((acc, curr) => acc + curr.expenses, 0)
    
    return { chartData: data, totalExpenses: total };
  }, [transactions, accountId]);
  

  if(isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[250px]">
        <div className="h-[200px] w-[200px] animate-pulse rounded-full bg-muted"></div>
      </div>
    )
  }
  
   if (chartData.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[250px]">
          <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">No expenses recorded</h3>
              <p className="text-sm text-muted-foreground">
                  You have not recorded any expenses yet.
              </p>
          </div>
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square min-h-[250px] w-full h-full"
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
  )
}
