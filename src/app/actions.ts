
"use server";

import {
  personalizedFinancialInsights,
  type PersonalizedFinancialInsightsInput,
  type PersonalizedFinancialInsightsOutput,
} from "@/ai/flows/personalized-financial-insights";
import { getFirestore } from "@/firebase/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase/server";

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

export async function addTransaction(prevState: TransactionState, formData: FormData): Promise<TransactionState> {
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
    
    const auth = await getAuth();
    // This is a placeholder for getting the authenticated user's session.
    // In a real app with proper session management, you would get the user ID from the session.
    // For now, we are assuming no session is available and thus cannot get the user ID.
    // We will simulate a user ID for demonstration purposes. In a real scenario, this would
    // come from a verified token or session.
    const userId = "test-user";
    
    if (!userId) {
        return { message: 'Authentication required.', success: false };
    }

    const { description, amount, transactionType, category, accountId } = validatedFields.data;
    
    const transactionAmount = transactionType === 'deposit' ? amount : -amount;

    try {
        const firestore = await getFirestore();
        const transactionRef = firestore.collection(`users/${userId}/accounts/${accountId}/transactions`).doc();
        
        await transactionRef.set({
            id: transactionRef.id,
            userId: userId,
            accountId,
            description,
            amount: transactionAmount,
            transactionType,
            category,
            transactionDate: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        
        // Also update the account balance
        const accountRef = firestore.doc(`users/${userId}/accounts/${accountId}`);
        await accountRef.update({
            balance: FieldValue.increment(transactionAmount)
        });

        return { message: 'Transaction added successfully.', success: true };

    } catch (e) {
        console.error("Error adding transaction to Firestore:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { message: `Failed to add transaction. ${errorMessage}`, success: false };
    }
}


const AccountSchema = z.object({
    accountName: z.string().min(1, "Account name is required."),
    accountType: z.enum(["checking", "savings", "credit_card", "investment"]),
    balance: z.coerce.number(),
    currency: z.string().min(3, "Currency code must be 3 characters.").max(3, "Currency code must be 3 characters."),
});

type AccountState = {
    errors?: {
        accountName?: string[];
        accountType?: string[];
        balance?: string[];
        currency?: string[];
    };
    message?: string | null;
    success: boolean;
};

export async function addAccount(prevState: AccountState, formData: FormData): Promise<AccountState> {
    const validatedFields = AccountSchema.safeParse({
        accountName: formData.get('accountName'),
        accountType: formData.get('accountType'),
        balance: formData.get('balance'),
        currency: formData.get('currency'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Invalid account data.',
            success: false,
        };
    }
    
    // Placeholder for getting the authenticated user.
    const userId = "test-user"; 
    
    if (!userId) {
        return { message: 'Authentication required.', success: false };
    }

    const { accountName, accountType, balance, currency } = validatedFields.data;

    try {
        const firestore = await getFirestore();
        const accountRef = firestore.collection(`users/${userId}/accounts`).doc();
        
        await accountRef.set({
            id: accountRef.id,
            userId,
            accountName,
            accountType,
            balance,
            currency: currency.toUpperCase(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { message: 'Account added successfully.', success: true };

    } catch (e) {
        console.error("Error adding account to Firestore:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { message: `Failed to add account. ${errorMessage}`, success: false };
    }
}
