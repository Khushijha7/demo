"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis } from "recharts"

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

const chartData = [
  { month: "January", portfolioValue: 0 },
  { month: "February", portfolioValue: 0 },
  { month: "March", portfolioValue: 0 },
  { month: "April", portfolioValue: 0 },
  { month: "May", portfolioValue: 0 },
  { month: "June", portfolioValue: 0 },
]

const chartConfig = {
  portfolioValue: {
    label: "Portfolio Value",
    color: "hsl(var(--primary))",
  },
}

export function InvestmentChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investment Performance</CardTitle>
        <CardDescription>Data is not yet available for your investment portfolio.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <RechartsLineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="portfolioValue"
              type="monotone"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={true}
            />
          </RechartsLineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing placeholder data.
        </div>
      </CardFooter>
    </Card>
  )
}
