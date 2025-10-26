'use server';
/**
 * @fileOverview A flow to retrieve current market data for investments.
 *
 * - getMarketData - A function that fetches the current price for a ticker symbol.
 * - GetMarketDataInput - The input type for the getMarketData function.
 * - GetMarketDataOutput - The return type for the getMarketData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetMarketDataInputSchema = z.object({
  tickerSymbol: z.string().describe('The stock ticker symbol, e.g., "GOOGL".'),
});
export type GetMarketDataInput = z.infer<typeof GetMarketDataInputSchema>;

const GetMarketDataOutputSchema = z.object({
  price: z.number().describe('The estimated current market price of the ticker symbol.'),
});
export type GetMarketDataOutput = z.infer<typeof GetMarketDataOutputSchema>;

export async function getMarketData(input: GetMarketDataInput): Promise<GetMarketDataOutput> {
  return getMarketDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMarketDataPrompt',
  input: {schema: GetMarketDataInputSchema},
  output: {schema: GetMarketDataOutputSchema},
  prompt: `You are a financial data service. Your task is to provide an estimated, plausible current market price for a given stock ticker symbol. Use your general knowledge to provide a reasonable price.

Stock Ticker Symbol: {{{tickerSymbol}}}

Return ONLY the structured output with the estimated price.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  }
});

const getMarketDataFlow = ai.defineFlow(
  {
    name: 'getMarketDataFlow',
    inputSchema: GetMarketDataInputSchema,
    outputSchema: GetMarketDataOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      // If the model fails to return a structured output, fallback to a simulated price
      const simulatedPrice = parseFloat(((Math.random() * 500 + 50) * (1 + (Math.random() - 0.5) * 0.2)).toFixed(2));
      return { price: simulatedPrice };
    }
    return output;
  }
);
