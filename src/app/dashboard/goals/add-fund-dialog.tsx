
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
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, serverTimestamp, writeBatch, collection, query } from "firebase/firestore";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SavingsGoal {
    id: string;
    goalName: string;
    currentAmount: number;
    targetAmount: number;
    targetDate: Timestamp | string;
}

interface AddFundDialogProps {
  goal: SavingsGoal;
}

const AddFundSchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    accountId: z.string().min(1, "Please select an account.")
});

type FormErrors = z.ZodFormattedError<z.infer<typeof AddFundSchema>>;

export function AddFundDialog({ goal }: AddFundDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<{ accountName: string; balance: number; currency: string; accountType: string }>(accountsQuery);

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
    const validatedFields = AddFundSchema.safeParse({
        amount: formData.get('amount'),
        accountId: formData.get('accountId'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { amount, accountId } = validatedFields.data;
    const sourceAccount = accounts.find(acc => acc.id === accountId);

    if (!sourceAccount) {
      toast({ variant: "destructive", title: "Error", description: "Selected account not found." });
      setIsSubmitting(false);
      return;
    }

    if (sourceAccount.accountType !== 'credit_card' && sourceAccount.balance < amount) {
        toast({ variant: "destructive", title: "Insufficient Funds", description: `Your ${sourceAccount.accountName} does not have enough funds.` });
        setIsSubmitting(false);
        return;
    }

    const newCurrentAmount = goal.currentAmount + amount;

    try {
        const batch = writeBatch(firestore);

        // 1. Update Savings Goal
        const goalRef = doc(firestore, `users/${user.uid}/savingsGoals`, goal.id);
        batch.update(goalRef, {
            currentAmount: newCurrentAmount,
            updatedAt: serverTimestamp(),
        });
        
        // 2. Create Transaction
        const transactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
        batch.set(transactionRef, {
            id: transactionRef.id,
            userId: user.uid,
            accountId: accountId,
            description: `Contribution to ${goal.goalName}`,
            amount: -amount,
            transactionType: 'withdrawal',
            category: 'savings',
            transactionDate: new Date(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // 3. Update Account Balance
        const accountRef = doc(firestore, `users/${user.uid}/accounts`, accountId);
        const newBalance = sourceAccount.accountType === 'credit_card'
            ? sourceAccount.balance + amount
            : sourceAccount.balance - amount;
        batch.update(accountRef, {
            balance: newBalance,
            updatedAt: serverTimestamp(),
        });

        await batch.commit();

        toast({ title: "Success", description: `Added funds to ${goal.goalName}.` });
        setOpen(false);
        formRef.current?.reset();

    } catch (e) {
        console.error("Error adding funds:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: "destructive", title: "Error", description: `Failed to add funds. ${errorMessage}` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if(!open) {
      setErrors(null);
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" />
          Add Fund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Fund to "{goal.goalName}"</DialogTitle>
          <DialogDescription>
            Contribute to this goal from one of your accounts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" name="amount" type="number" step="any" placeholder="e.g. 50" className="col-span-3" />
                {errors?.amount && <p className="col-span-4 text-sm text-red-500 text-right">{errors.amount._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountId" className="text-right">
                    From Account
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
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Fund"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
