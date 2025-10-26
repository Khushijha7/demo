
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, doc, writeBatch, query, getDoc, Timestamp, serverTimestamp } from "firebase/firestore";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Investment {
    id: string;
    userId: string;
    investmentName: string;
    tickerSymbol: string;
    investmentType: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: Timestamp | string;
    currentValue: number;
    associatedTransactionId?: string;
}

const EditInvestmentSchema = z.object({
    investmentName: z.string().min(1, "Investment name is required."),
    tickerSymbol: z.string().min(1, "Ticker symbol is required.").toUpperCase(),
    investmentType: z.enum(["stock", "etf", "crypto", "other"]),
    quantity: z.coerce.number().min(0.000001, "Quantity must be positive."),
    purchasePrice: z.coerce.number().min(0.01, "Purchase price must be positive."),
    purchaseDate: z.date({ required_error: "Purchase date is required." }),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof EditInvestmentSchema>>;

export function EditInvestmentDialog({ investment, children }: { investment: Investment, children: React.ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialDate = investment.purchaseDate instanceof Timestamp ? investment.purchaseDate.toDate() : new Date(investment.purchaseDate);
  const [date, setDate] = useState<Date | undefined>(initialDate);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    if (!user || !firestore || !investment.associatedTransactionId) {
      toast({ variant: "destructive", title: "Error", description: "Cannot update investment. Critical data missing." });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const validatedFields = EditInvestmentSchema.safeParse({
        investmentName: formData.get('investmentName'),
        tickerSymbol: formData.get('tickerSymbol'),
        investmentType: formData.get('investmentType'),
        quantity: formData.get('quantity'),
        purchasePrice: formData.get('purchasePrice'),
        purchaseDate: date,
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { investmentName, tickerSymbol, investmentType, quantity, purchasePrice, purchaseDate } = validatedFields.data;

    try {
        const batch = writeBatch(firestore);

        // Fetch original transaction and account to calculate balance changes
        const transRef = doc(firestore, `users/${user.uid}/transactions`, investment.associatedTransactionId);
        const transDoc = await getDoc(transRef);
        if (!transDoc.exists()) {
            throw new Error("Associated transaction not found. Cannot update balance.");
        }
        const originalTransaction = transDoc.data();
        const accountRef = doc(firestore, `users/${user.uid}/accounts`, originalTransaction.accountId);
        const accountDoc = await getDoc(accountRef);
        if (!accountDoc.exists()) {
            throw new Error("Associated account not found. Cannot update balance.");
        }
        const originalAccount = accountDoc.data();

        const oldCost = Math.abs(originalTransaction.amount);
        const newCost = quantity * purchasePrice;
        const balanceChange = oldCost - newCost;

        // 1. Update Investment
        const investmentRef = doc(firestore, `users/${user.uid}/investments`, investment.id);
        batch.update(investmentRef, {
            investmentName,
            tickerSymbol,
            investmentType,
            quantity,
            purchasePrice,
            purchaseDate,
            currentValue: newCost, // Assume current value is cost until refreshed
            updatedAt: serverTimestamp(),
        });
        
        // 2. Update Transaction
        batch.update(transRef, {
            description: `Purchase of ${quantity} ${tickerSymbol}`,
            amount: -newCost,
            transactionDate: purchaseDate,
            updatedAt: serverTimestamp(),
        });

        // 3. Update Account Balance
        const newBalance = originalAccount.balance + balanceChange;
        batch.update(accountRef, {
            balance: newBalance,
            updatedAt: serverTimestamp(),
        });
        
        await batch.commit();

        toast({ title: "Success", description: "Investment updated successfully." });
        setOpen(false);

    } catch (e) {
        console.error("Error updating investment:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: "destructive", title: "Error", description: `Failed to update investment. ${errorMessage}` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if(!open) {
      setErrors(null);
      setDate(initialDate);
    }
  }, [open, initialDate])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Investment</DialogTitle>
          <DialogDescription>
            Update the details of your investment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investmentName" className="text-right">Name</Label>
                <Input id="investmentName" name="investmentName" defaultValue={investment.investmentName} className="col-span-3" />
                {errors?.investmentName && <p className="col-span-4 text-sm text-red-500 text-right">{errors.investmentName._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tickerSymbol" className="text-right">Ticker</Label>
                <Input id="tickerSymbol" name="tickerSymbol" defaultValue={investment.tickerSymbol} className="col-span-3" />
                {errors?.tickerSymbol && <p className="col-span-4 text-sm text-red-500 text-right">{errors.tickerSymbol._errors[0]}</p>}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investmentType" className="text-right">Type</Label>
                 <Select name="investmentType" defaultValue={investment.investmentType}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select an investment type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="etf">ETF</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                {errors?.investmentType && <p className="col-span-4 text-sm text-red-500 text-right">{errors.investmentType._errors[0]}</p>}
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchaseDate" className="text-right">Purchase Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal",!date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus/></PopoverContent>
                </Popover>
                 {errors?.purchaseDate && <p className="col-span-4 text-sm text-red-500 text-right">{errors.purchaseDate._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" step="any" defaultValue={investment.quantity} className="col-span-3" />
                {errors?.quantity && <p className="col-span-4 text-sm text-red-500 text-right">{errors.quantity._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchasePrice" className="text-right">Purchase Price</Label>
                 <Input id="purchasePrice" name="purchasePrice" type="number" step="any" defaultValue={investment.purchasePrice} className="col-span-3" />
                {errors?.purchasePrice && <p className="col-span-4 text-sm text-red-500 text-right">{errors.purchasePrice._errors[0]}</p>}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label className="text-right">Source Account</Label>
                 <Input className="col-span-3" disabled value="Cannot change source account" />
            </div>
            
            <DialogFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
