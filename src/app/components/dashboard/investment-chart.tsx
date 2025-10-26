
"use client"

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"
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
  gainLoss: {
    label: "Gain/Loss",
    color: "hsl(var(--primary))",
  },
}

interface Investment {
    id: string;
    purchaseDate: Timestamp | string;
    currentValue: number;
    purchasePrice: number;
    quantity: number;
}

export function InvestmentChart() {
  const { user } = useUser();
  const firestore = useFirestore();

  const investmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/investments`));
  }, [user, firestore]);

  const { data: investments, isLoading } = useCollection<Investment>(investmentsQuery);

  const { chartData, totalGainLoss, totalGainLossPercent } = React.useMemo(() => {
    if (!investments || investments.length === 0) {
      return { chartData: [], totalGainLoss: 0, totalGainLossPercent: 0 };
    }

    const sortedInvestments = [...investments].sort((a, b) => {
        const dateA = a.purchaseDate instanceof Timestamp ? a.purchaseDate.toMillis() : new Date(a.purchaseDate).getTime();
        const dateB = b.purchaseDate instanceof Timestamp ? b.purchaseDate.toMillis() : new Date(b.purchaseDate).getTime();
        return dateA - dateB;
    });
    
    let cumulativeGainLoss = 0;
    let totalCost = 0;
    const data = sortedInvestments.map(inv => {
        const gainLoss = inv.currentValue - (inv.purchasePrice * inv.quantity);
        cumulativeGainLoss += gainLoss;
        totalCost += inv.purchasePrice * inv.quantity;
        const date = inv.purchaseDate instanceof Timestamp ? inv.purchaseDate.toDate() : new Date(inv.purchaseDate);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            gainLoss: cumulativeGainLoss,
        }
    });

    const finalTotalCost = investments.reduce((sum, inv) => sum + (inv.purchasePrice * inv.quantity), 0);
    const finalTotalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const finalGainLoss = finalTotalValue - finalTotalCost;
    const finalGainLossPercent = finalTotalCost > 0 ? (finalGainLoss / finalTotalCost) * 100 : 0;

    return { chartData: data, totalGainLoss: finalGainLoss, totalGainLossPercent: finalGainLossPercent };
  }, [investments]);

  const isGain = totalGainLoss >= 0;

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
            Your total portfolio gain/loss is {totalGainLoss.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} ({totalGainLossPercent.toFixed(2)}%).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
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
                nameKey="gainLoss"
                labelKey="date"
            />} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Area
              dataKey="gainLoss"
              type="monotone"
              fill={isGain ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"}
              fillOpacity={0.4}
              stroke={isGain ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))"}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
         <div className="flex gap-2 font-medium leading-none">
          {isGain ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          <div className="text-muted-foreground">
            Showing total portfolio gain/loss over time
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
