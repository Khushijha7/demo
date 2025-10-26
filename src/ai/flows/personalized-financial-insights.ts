'use server';

/**
 * @fileOverview A flow to provide personalized financial insights and recommendations based on user spending habits and financial goals.
 *
 * - personalizedFinancialInsights - A function that generates personalized financial insights.
 * - PersonalizedFinancialInsightsInput - The input type for the personalizedFinancialInsights function.
 * - PersonalizedFinancialInsightsOutput - The return type for the personalizedFinancialInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedFinancialInsightsInputSchema = z.object({
  spendingHabits: z.string().describe('Description of the user\'s spending habits.'),
  financialGoals: z.string().describe('Description of the user\'s financial goals.'),
});
export type PersonalizedFinancialInsightsInput = z.infer<typeof PersonalizedFinancialInsightsInputSchema>;

const PersonalizedFinancialInsightsOutputSchema = z.object({
  insights: z.string().describe('Personalized financial insights and recommendations.'),
});
export type PersonalizedFinancialInsightsOutput = z.infer<typeof PersonalizedFinancialInsightsOutputSchema>;

export async function personalizedFinancialInsights(input: PersonalizedFinancialInsightsInput): Promise<PersonalizedFinancialInsightsOutput> {
  return personalizedFinancialInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFinancialInsightsPrompt',
  input: {schema: PersonalizedFinancialInsightsInputSchema},
  output: {schema: PersonalizedFinancialInsightsOutputSchema},
  prompt: `You are a financial advisor providing personalized financial insights and recommendations.

  Based on the user's spending habits and financial goals, provide actionable insights and recommendations to improve their financial well-being.

  Spending Habits: {{{spendingHabits}}}
  Financial Goals: {{{financialGoals}}}

  Insights:`, 
});

const personalizedFinancialInsightsFlow = ai.defineFlow(
  {
    name: 'personalizedFinancialInsightsFlow',
    inputSchema: PersonalizedFinancialInsightsInputSchema,
    outputSchema: PersonalizedFinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
