"use client"

import React from "react";
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from "recharts"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, Timestamp } from "firebase/firestore";

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
  portfolioValue: {
    label: "Portfolio Value",
    color: "hsl(var(--primary))",
  },
}

interface Investment {
    id: string;
    purchaseDate: Timestamp | string;
    currentValue: number;
}

export function InvestmentChart() {
  const { user } = useUser();
  const firestore = useFirestore();

  const investmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/investments`));
  }, [user, firestore]);

  const { data: investments, isLoading } = useCollection<Investment>(investmentsQuery);

  const { chartData, totalValue } = React.useMemo(() => {
    if (!investments || investments.length === 0) {
      return { chartData: [], totalValue: 0 };
    }

    const sortedInvestments = [...investments].sort((a, b) => {
        const dateA = a.purchaseDate instanceof Timestamp ? a.purchaseDate.toMillis() : new Date(a.purchaseDate).getTime();
        const dateB = b.purchaseDate instanceof Timestamp ? b.purchaseDate.toMillis() : new Date(b.purchaseDate).getTime();
        return dateA - dateB;
    });

    let cumulativeValue = 0;
    const data = sortedInvestments.map(inv => {
        cumulativeValue += inv.currentValue;
        const date = inv.purchaseDate instanceof Timestamp ? inv.purchaseDate.toDate() : new Date(inv.purchaseDate);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            portfolioValue: cumulativeValue,
        }
    });

    return { chartData: data, totalValue: cumulativeValue };
  }, [investments]);

  if(isLoading) {
    return (
        <Card>
            <CardHeader>
                <div className="h-6 w-3/5 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted mt-2"></div>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full animate-pulse rounded bg-muted"></div>
            </CardContent>
            <CardFooter>
                 <div className="h-4 w-2/5 animate-pulse rounded bg-muted"></div>
            </CardFooter>
        </Card>
    )
  }

  if (!investments || investments.length === 0) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Investment Performance</CardTitle>
                <CardDescription>No investments found. Add one to see your portfolio performance.</CardDescription>
            </CardHeader>
             <CardContent className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No data to display.</p>
            </CardContent>
             <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="leading-none text-muted-foreground">
                    Add an investment to get started.
                </div>
            </CardFooter>
        </Card>
     )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Performance</CardTitle>
        <CardDescription>
            Your portfolio is currently valued at {totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <RechartsLineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${value/1000}k`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent 
                formatter={(value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                nameKey="portfolioValue"
                labelKey="date"
            />} />
            <Line
              dataKey="portfolioValue"
              type="monotone"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={true}
              name="Portfolio Value"
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing portfolio value over time.
        </div>
      </CardFooter>
    </Card>
  )
}
