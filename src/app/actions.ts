
"use server";

import {
  personalizedFinancialInsights,
  type PersonalizedFinancialInsightsInput,
  type PersonalizedFinancialInsightsOutput,
} from "@/ai/flows/personalized-financial-insights";
import { getFirestore } from "@/firebase/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

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
