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
  price: z.number().describe('The current market price of the ticker symbol.'),
});
export type GetMarketDataOutput = z.infer<typeof GetMarketDataOutputSchema>;

// This is a mock tool for demonstration purposes.
// In a real application, this would call a financial data API.
const getCurrentStockPrice = ai.defineTool(
    {
      name: 'getCurrentStockPrice',
      description: 'Gets the current stock price for a given ticker symbol.',
      inputSchema: z.object({ ticker: z.string() }),
      outputSchema: z.object({ price: z.number() }),
    },
    async ({ ticker }) => {
        // Simulate a price fluctuation for demonstration.
        // This generates a random change between -15% and +15% of a base price.
        const basePrice = Math.random() * 500 + 50; // Simulate some base price
        const changePercent = (Math.random() - 0.5) * 0.3;
        const price = parseFloat((basePrice * (1 + changePercent)).toFixed(2));
        console.log(`[Tool] Faked price for ${ticker}: $${price}`);
        return { price };
    }
  );


export async function getMarketData(input: GetMarketDataInput): Promise<GetMarketDataOutput> {
  return getMarketDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMarketDataPrompt',
  input: {schema: GetMarketDataInputSchema},
  output: {schema: GetMarketDataOutputSchema},
  tools: [getCurrentStockPrice],
  prompt: `You are a financial data service. Use the provided tools to find the current market price for the stock with the ticker symbol: {{{tickerSymbol}}}.`,
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
