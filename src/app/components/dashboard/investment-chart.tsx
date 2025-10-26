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
  { month: "January", portfolioValue: 18600 },
  { month: "February", portfolioValue: 30500 },
  { month: "March", portfolioValue: 23700 },
  { month: "April", portfolioValue: 73000 },
  { month: "May", portfolioValue: 20900 },
  { month: "June", portfolioValue: 21400 },
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
        <CardDescription>Your portfolio has grown by 15.2% over the last 6 months.</CardDescription>
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
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing portfolio performance for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
