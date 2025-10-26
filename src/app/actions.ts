"use server";

import {
  personalizedFinancialInsights,
  type PersonalizedFinancialInsightsInput,
  type PersonalizedFinancialInsightsOutput,
} from "@/ai/flows/personalized-financial-insights";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { getAuth, getFirestore } from "@/firebase/server";
import { collection } from "firebase/firestore";
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

const TransactionSchema = z.object({
    description: z.string().min(1, "Description is required."),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    transactionType: z.enum(["deposit", "withdrawal", "payment"]),
    category: z.string().min(1, "Category is required."),
    accountId: z.string().min(1, "Please select an account.")
});

type TransactionState = {
    errors?: {
        description?: string[];
        amount?: string[];
        transactionType?: string[];
        category?: string[];
        accountId?: string[];
    };
    message?: string | null;
    success: boolean;
};

export async function addTransaction(prevState: TransactionState, formData: FormData) {
    const validatedFields = TransactionSchema.safeParse({
        description: formData.get('description'),
        amount: formData.get('amount'),
        transactionType: formData.get('transactionType'),
        category: formData.get('category'),
        accountId: formData.get('accountId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid transaction data.',
            success: false,
        };
    }
    
    const auth = getAuth();
    const firestore = getFirestore();
    const user = auth.currentUser;
    if (!user) {
        return { message: 'Authentication required.', success: false };
    }

    const { description, amount, transactionType, category, accountId } = validatedFields.data;
    
    const transactionAmount = transactionType === 'deposit' ? amount : -amount;

    try {
        const transactionsColRef = collection(firestore, `users/${user.uid}/accounts/${accountId}/transactions`);
        
        await addDocumentNonBlocking(transactionsColRef, {
            description,
            amount: transactionAmount,
            transactionType,
            category,
            accountId,
            transactionDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        
        return { message: 'Transaction added successfully.', success: true };

    } catch (e) {
        console.error(e);
        return { message: 'Failed to add transaction.', success: false };
    }
}
