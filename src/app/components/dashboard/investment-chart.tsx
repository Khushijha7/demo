
"use client"

import React from "react";
import { TrendingUp, CalendarDays } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, Timestamp } from "firebase/firestore";
import { differenceInDays, format } from 'date-fns';

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
  invested: {
    label: "Invested",
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

const dummyChartData = [
    { date: 'Jan', invested: 1000 },
    { date: 'Feb', invested: 1500 },
    { date: 'Mar', invested: 2500 },
    { date: 'Apr', invested: 3000 },
    { date: 'May', invested: 4000 },
    { date: 'Jun', invested: 5500 },
];
const dummyTotalInvested = 5500;
const dummyDaysInvesting = 180;


export function InvestmentChart() {
  const { user } = useUser();
  const firestore = useFirestore();

  const investmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/investments`));
  }, [user, firestore]);

  const { data: investments, isLoading } = useCollection<Investment>(investmentsQuery);

  const { chartData, totalInvested, daysInvesting } = React.useMemo(() => {
    if (!investments || investments.length === 0) {
      return { 
        chartData: dummyChartData, 
        totalInvested: dummyTotalInvested,
        daysInvesting: dummyDaysInvesting
      };
    }

    const sortedInvestments = [...investments].sort((a, b) => {
        const dateA = a.purchaseDate instanceof Timestamp ? a.purchaseDate.toMillis() : new Date(a.purchaseDate).getTime();
        const dateB = b.purchaseDate instanceof Timestamp ? b.purchaseDate.toMillis() : new Date(b.purchaseDate).getTime();
        return dateA - dateB;
    });
    
    let cumulativeInvestment = 0;
    const data = sortedInvestments.map(inv => {
        const cost = inv.purchasePrice * inv.quantity;
        cumulativeInvestment += cost;
        const date = inv.purchaseDate instanceof Timestamp ? inv.purchaseDate.toDate() : new Date(inv.purchaseDate);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            invested: cumulativeInvestment,
        }
    });

    const finalTotalInvested = investments.reduce((sum, inv) => sum + (inv.purchasePrice * inv.quantity), 0);
    const firstInvestmentDate = sortedInvestments[0].purchaseDate instanceof Timestamp 
      ? sortedInvestments[0].purchaseDate.toDate()
      : new Date(sortedInvestments[0].purchaseDate);

    const finalDaysInvesting = differenceInDays(new Date(), firstInvestmentDate);

    return { chartData: data, totalInvested: finalTotalInvested, daysInvesting: finalDaysInvesting };
  }, [investments]);

  const hasRealData = investments && investments.length > 0;

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Investment Growth</CardTitle>
        <CardDescription>
            {hasRealData ? 
                `You have invested a total of ${totalInvested.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`
                : "Showing dummy data. Add an investment to see your real performance."
            }
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
                nameKey="invested"
                labelKey="date"
            />} />
            <defs>
                <linearGradient id="fillInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-invested)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-invested)" stopOpacity={0.1}/>
                </linearGradient>
            </defs>
            <Area
              dataKey="invested"
              type="monotone"
              fill="url(#fillInvested)"
              stroke="var(--color-invested)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
         <div className="flex gap-2 font-medium leading-none">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <div className="text-muted-foreground">
            Showing total amount invested over time
          </div>
        </div>
        <div className="flex gap-2 font-medium leading-none text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <div>
                Investing for {daysInvesting} days
            </div>
        </div>
      </CardFooter>
    </Card>
  )
}
