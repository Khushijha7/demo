
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, writeBatch, query } from "firebase/firestore";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const InvestmentSchema = z.object({
    investmentName: z.string().min(1, "Investment name is required."),
    tickerSymbol: z.string().min(1, "Ticker symbol is required.").toUpperCase(),
    investmentType: z.enum(["stock", "etf", "crypto", "other"], {
      errorMap: () => ({ message: "Please select an investment type." })
    }),
    quantity: z.coerce.number().min(0.000001, "Quantity must be positive."),
    purchasePrice: z.coerce.number().min(0.01, "Purchase price must be positive."),
    purchaseDate: z.date({ required_error: "Purchase date is required." }),
    accountId: z.string().min(1, "Please select an account.")
});

type FormErrors = z.ZodFormattedError<z.infer<typeof InvestmentSchema>>;

export function AddInvestmentDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = React.useState<Date>();
  
  const { user } = useUser();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<{ accountName: string; balance: number; currency: string; accountType: string; }>(accountsQuery);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    if (!user || !firestore || !accounts) {
      toast({ variant: "destructive", title: "Error", description: "User or accounts not available." });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const validatedFields = InvestmentSchema.safeParse({
        investmentName: formData.get('investmentName'),
        tickerSymbol: formData.get('tickerSymbol'),
        investmentType: formData.get('investmentType'),
        quantity: formData.get('quantity'),
        purchasePrice: formData.get('purchasePrice'),
        purchaseDate: date,
        accountId: formData.get('accountId'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { investmentName, tickerSymbol, investmentType, quantity, purchasePrice, purchaseDate, accountId } = validatedFields.data;

    const sourceAccount = accounts.find(acc => acc.id === accountId);
    if (!sourceAccount) {
      toast({ variant: "destructive", title: "Error", description: "Selected account not found." });
      setIsSubmitting(false);
      return;
    }

    const investmentCost = quantity * purchasePrice;
    
    if (sourceAccount.accountType !== 'credit_card' && sourceAccount.balance < investmentCost) {
        toast({ variant: "destructive", title: "Insufficient Funds", description: `Your ${sourceAccount.accountName} does not have enough funds.` });
        setIsSubmitting(false);
        return;
    }

    try {
        const batch = writeBatch(firestore);

        // 1. Create Transaction first to get its ID
        const transactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
        batch.set(transactionRef, {
            id: transactionRef.id,
            userId: user.uid,
            accountId: accountId,
            description: `Purchase of ${quantity} ${tickerSymbol}`,
            amount: -investmentCost,
            transactionType: 'withdrawal',
            category: 'investment',
            transactionDate: purchaseDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // 2. Create Investment and link it to the transaction
        const investmentRef = doc(collection(firestore, `users/${user.uid}/investments`));
        batch.set(investmentRef, {
            id: investmentRef.id,
            userId: user.uid,
            investmentName,
            tickerSymbol,
            investmentType,
            quantity,
            purchasePrice,
            purchaseDate,
            currentValue: investmentCost,
            associatedTransactionId: transactionRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        // 3. Update Account Balance
        const accountRef = doc(firestore, `users/${user.uid}/accounts`, accountId);
        const newBalance = sourceAccount.accountType === 'credit_card'
            ? sourceAccount.balance + investmentCost
            : sourceAccount.balance - investmentCost;

        batch.update(accountRef, {
            balance: newBalance,
            updatedAt: serverTimestamp(),
        });
        
        await batch.commit();

        toast({ title: "Success", description: "Investment added and account balance updated." });
        setOpen(false);
        formRef.current?.reset();
        setDate(undefined);

    } catch (e) {
        console.error("Error adding investment:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: "destructive", title: "Error", description: `Failed to add investment. ${errorMessage}` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if(!open) {
      setErrors(null);
      setDate(undefined);
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Investment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Investment</DialogTitle>
          <DialogDescription>
            Enter the details of your new investment. The cost will be deducted from a selected account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investmentName" className="text-right">Name</Label>
                <Input id="investmentName" name="investmentName" placeholder="e.g. Apple Stock" className="col-span-3" />
                {errors?.investmentName && <p className="col-span-4 text-sm text-red-500 text-right">{errors.investmentName._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tickerSymbol" className="text-right">Ticker</Label>
                <Input id="tickerSymbol" name="tickerSymbol" placeholder="e.g. AAPL" className="col-span-3" />
                {errors?.tickerSymbol && <p className="col-span-4 text-sm text-red-500 text-right">{errors.tickerSymbol._errors[0]}</p>}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investmentType" className="text-right">Type</Label>
                 <Select name="investmentType">
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
                        <Button
                        variant={"outline"}
                        className={cn(
                            "col-span-3 justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
                 {errors?.purchaseDate && <p className="col-span-4 text-sm text-red-500 text-right">{errors.purchaseDate._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" step="any" placeholder="e.g. 10" className="col-span-3" />
                {errors?.quantity && <p className="col-span-4 text-sm text-red-500 text-right">{errors.quantity._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchasePrice" className="text-right">Purchase Price</Label>
                 <Input id="purchasePrice" name="purchasePrice" type="number" step="any" placeholder="Price per unit" className="col-span-3" />
                {errors?.purchasePrice && <p className="col-span-4 text-sm text-red-500 text-right">{errors.purchasePrice._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountId" className="text-right">
                    Source Account
                </Label>
                 <Select name="accountId">
                    <SelectTrigger className="col-span-3" aria-describedby="account-error">
                        <SelectValue placeholder={isLoadingAccounts ? "Loading..." : "Select an account"} />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts?.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.accountName} ({account.balance.toLocaleString('en-US', { style: 'currency', currency: account.currency || 'USD' })})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.accountId && <p id="account-error" className="col-span-4 text-sm text-red-500 text-right">{errors.accountId._errors[0]}</p>}
            </div>
            
            <DialogFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Investment"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
