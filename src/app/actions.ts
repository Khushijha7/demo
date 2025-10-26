
"use server";

import {
  personalizedFinancialInsights,
  type PersonalizedFinancialInsightsInput,
  type PersonalizedFinancialInsightsOutput,
} from "@/ai/flows/personalized-financial-insights";
import { 
  getMarketData, 
  type GetMarketDataInput, 
  type GetMarketDataOutput 
} from "@/ai/flows/get-market-data";
import { z } from "zod";

const InsightsSchema = z.object({
  spendingHabits: z.string().min(10, { message: "Please describe your spending habits in more detail." }),
  financialGoals: z.string().min(10, { message: "Please describe your financial goals in more detail." }),
});

type InsightsState = {
  data: PersonalizedFinancialInsightsOutput | null;
  error: string | null;
  success: boolean;
};

export async function getPersonalizedInsights(
  prevState: InsightsState,
  formData: FormData
): Promise<InsightsState> {
  const validatedFields = InsightsSchema.safeParse({
    spendingHabits: formData.get("spendingHabits"),
    financialGoals: formData.get("financialGoals"),
  });

  if (!validatedFields.success) {
    return {
      data: null,
      success: false,
      error: validatedFields.error.flatten().fieldErrors.spendingHabits?.[0] || validatedFields.error.flatten().fieldErrors.financialGoals?.[0] || 'Invalid input.',
    };
  }

  try {
    const result = await personalizedFinancialInsights(validatedFields.data);
    return { data: result, success: true, error: null };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      success: false,
      error: "Failed to generate insights. Please try again.",
    };
  }
}

const MarketDataSchema = z.object({
  tickerSymbol: z.string(),
});

type MarketDataState = {
  data: GetMarketDataOutput | null;
  error: string | null;
  success: boolean;
};

export async function getRealTimePrice(
  input: GetMarketDataInput
): Promise<MarketDataState> {
  const validatedFields = MarketDataSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      data: null,
      success: false,
      error: "Invalid input for market data.",
    };
  }

  try {
    const result = await getMarketData(validatedFields.data);
    return { data: result, success: true, error: null };
  } catch (e) {
    console.error(e);
    return {
      data: null,
      success: false,
      error: "Failed to fetch real-time price. Please try again.",
    };
  }
}
