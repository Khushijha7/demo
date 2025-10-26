
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

const TransactionSchema = z.object({
    description: z.string().min(1, "Description is required."),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    transactionType: z.enum(["deposit", "withdrawal", "payment"]),
    category: z.string().min(1, "Category is required."),
    accountId: z.string().min(1, "Please select an account.")
});

export async function addTransaction(prevState: any, formData: FormData) {
    const validatedFields = TransactionSchema.safeParse({
        description: formData.get('description'),
        amount: formData.get('amount'),
        transactionType: formData.get('transactionType'),
        category: formData.get('category'),
        accountId: formData.get('accountId'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { description, amount, transactionType, category, accountId } = validatedFields.data;
    const userId = "test-user"; // FIXME: This should come from an auth session

    try {
        const db = await getFirestore();
        const batch = db.batch();

        const transactionRef = db.collection(`users/${userId}/transactions`).doc();
        const transactionAmount = transactionType === 'deposit' ? amount : -amount;

        batch.set(transactionRef, {
            id: transactionRef.id,
            accountId,
            description,
            amount: transactionAmount,
            transactionType,
            category,
            transactionDate: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        const accountRef = db.doc(`users/${userId}/accounts/${accountId}`);
        batch.update(accountRef, { balance: FieldValue.increment(transactionAmount) });

        await batch.commit();
        return { success: true };
    } catch (e) {
        console.error("Error adding transaction:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { success: false, error: `Failed to add transaction. ${errorMessage}` };
    }
}
