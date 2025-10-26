
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
import { useFirestore, useUser } from "@/firebase";
import { doc, writeBatch, serverTimestamp, collection } from "firebase/firestore";
import { z } from "zod";

interface Account {
    id: string;
    accountName: string;
    balance: number;
    accountType: string;
}

interface AddMoneyDialogProps {
  account: Account;
  children: React.ReactNode;
}

const AddMoneySchema = z.object({
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof AddMoneySchema>>;

export function AddMoneyDialog({ account, children }: AddMoneyDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "User or Firestore not available." });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const validatedFields = AddMoneySchema.safeParse({
        amount: formData.get('amount'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { amount } = validatedFields.data;
    
    const newBalance = account.accountType === 'credit_card'
        ? account.balance - amount // Paying down credit card debt
        : account.balance + amount;

    try {
        const batch = writeBatch(firestore);

        // 1. Update Account Balance
        const accountRef = doc(firestore, `users/${user.uid}/accounts`, account.id);
        batch.update(accountRef, {
            balance: newBalance,
            updatedAt: serverTimestamp(),
        });
        
        // 2. Create Deposit Transaction
        const transactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
        const transactionAmount = account.accountType === 'credit_card' ? -amount : amount;
        const transactionType = account.accountType === 'credit_card' ? 'payment' : 'deposit';

        batch.set(transactionRef, {
            id: transactionRef.id,
            userId: user.uid,
            accountId: account.id,
            description: `Deposit to ${account.accountName}`,
            amount: transactionAmount,
            transactionType: transactionType,
            category: transactionType, // e.g., 'deposit' or 'payment'
            transactionDate: new Date(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        await batch.commit();

        toast({ title: "Success", description: `Added funds to ${account.accountName}.` });
        setOpen(false);
        formRef.current?.reset();

    } catch (e) {
        console.error("Error adding money:", e);
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
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Money to "{account.accountName}"</DialogTitle>
          <DialogDescription>
            Enter the amount you want to deposit. This will create a new deposit transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" name="amount" type="number" step="any" placeholder="e.g. 100" className="col-span-3" />
                {errors?.amount && <p className="col-span-4 text-sm text-red-500 text-right">{errors.amount._errors[0]}</p>}
            </div>
            
            <DialogFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Depositing...</> : "Add Money"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
