
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, Timestamp } from "firebase/firestore";

interface Investment {
    id: string;
    investmentName: string;
    investmentType: string;
    quantity: number;
    purchasePrice: number;
    currentValue: number;
    purchaseDate: Timestamp | string;
}

export function InvestmentsTable() {
  const { user } = useUser();
  const firestore = useFirestore();

  const investmentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/investments`));
  }, [user, firestore]);

  const { data: investments, isLoading } = useCollection<Investment>(investmentsQuery);

  const formatDate = (date: string | Timestamp) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date.toDate();
    return d.toLocaleDateString();
  };

  const totalValue = investments?.reduce((sum, inv) => sum + inv.currentValue, 0) || 0;
  const totalCost = investments?.reduce((sum, inv) => sum + (inv.purchasePrice * inv.quantity), 0) || 0;
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;


  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Your Portfolio</CardTitle>
            <CardDescription>
                A detailed view of your current investments.
            </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Purchase Date</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading investments...</TableCell></TableRow>}
            {!isLoading && investments?.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center">No investments yet.</TableCell></TableRow>}
            {investments?.map((investment) => (
              <TableRow key={investment.id}>
                <TableCell className="font-medium">{investment.investmentName}</TableCell>
                <TableCell><Badge variant="outline">{investment.investmentType}</Badge></TableCell>
                <TableCell className="text-right">{investment.quantity}</TableCell>
                <TableCell className="text-right">{investment.purchasePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                <TableCell className="text-right">{formatDate(investment.purchaseDate)}</TableCell>
                <TableCell className="text-right font-medium">{investment.currentValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
              </TableRow>
            ))}
             {!isLoading && investments && investments.length > 0 && (
                <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={5} className="text-right">Total Portfolio Value</TableCell>
                    <TableCell className="text-right">{totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                </TableRow>
             )}
             {!isLoading && investments && investments.length > 0 && (
                <TableRow className="font-bold">
                    <TableCell colSpan={5} className="text-right">Total Gain/Loss</TableCell>
                    <TableCell className={`text-right ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalGainLoss.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} ({totalGainLossPercent.toFixed(2)}%)
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
