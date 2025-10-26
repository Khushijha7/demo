
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, writeBatch, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { z } from "zod";

interface Transaction {
    id: string;
    accountId: string;
    description: string;
    amount: number;
    transactionType: string;
    category: string;
    transactionDate: Timestamp | string;
    userId: string;
}

const TransactionSchema = z.object({
    description: z.string().min(1, "Description is required."),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    transactionType: z.enum(["deposit", "withdrawal", "payment"]),
    category: z.string().min(1, "Category is required."),
    accountId: z.string().min(1, "Please select an account.")
});

type FormErrors = z.ZodFormattedError<z.infer<typeof TransactionSchema>>;


export function EditTransactionDialog({ transaction, children }: { transaction: Transaction, children: React.ReactNode }) {
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

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<{ id: string; accountName: string; balance: number }>(accountsQuery);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    if (!user || !firestore || !accounts) {
      toast({ variant: "destructive", title: "Error", description: "User or account data not available." });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const validatedFields = TransactionSchema.safeParse({
        description: formData.get('description'),
        amount: formData.get('amount'),
        transactionType: formData.get('transactionType'),
        category: formData.get('category'),
        accountId: formData.get('accountId'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { description, amount, transactionType, category, accountId } = validatedFields.data;
    
    const originalAccount = accounts.find(acc => acc.id === transaction.accountId);
    const newAccount = accounts.find(acc => acc.id === accountId);

    if(!originalAccount) {
        toast({ variant: "destructive", title: "Error", description: "Original account not found." });
        setIsSubmitting(false);
        return;
    }

    try {
        const batch = writeBatch(firestore);

        // Transaction Details
        const transactionRef = doc(firestore, `users/${user.uid}/accounts/${transaction.accountId}/transactions`, transaction.id);
        
        const newTransactionAmount = transactionType === 'deposit' ? amount : -amount;

        batch.update(transactionRef, {
            description,
            amount: newTransactionAmount,
            transactionType,
            category,
            accountId, // This can change if user moves transaction
            updatedAt: serverTimestamp(),
        });
        
        // Account Balance Adjustments
        const originalAccountRef = doc(firestore, `users/${user.uid}/accounts`, transaction.accountId);
        const oldAmountForBalance = transaction.amount; // The actual value from DB (+ or -)
        
        if (transaction.accountId === accountId) { // Account has not changed
            const balanceCorrection = newTransactionAmount - oldAmountForBalance;
            batch.update(originalAccountRef, { balance: originalAccount.balance + balanceCorrection });
        } else { // Account has changed
            if(!newAccount) {
                toast({ variant: "destructive", title: "Error", description: "New account not found." });
                setIsSubmitting(false);
                return;
            }
            const newAccountRef = doc(firestore, `users/${user.uid}/accounts`, accountId);
            // Revert original transaction from old account
            batch.update(originalAccountRef, { balance: originalAccount.balance - oldAmountForBalance });
            // Apply new transaction to new account
            batch.update(newAccountRef, { balance: newAccount.balance + newTransactionAmount });

            // We are not actually moving the doc, just updating its accountId field.
            // Firestore doesn't support moving a doc to a new subcollection directly.
            // For this app's logic, just updating the accountId and balances is sufficient.
        }

        await batch.commit();

        toast({ title: "Success", description: "Transaction updated successfully." });
        setOpen(false);

    } catch (e) {
        console.error("Error updating transaction:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: "destructive", title: "Error", description: `Failed to update transaction. ${errorMessage}` });
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update the details of your transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountId" className="text-right">Account</Label>
                 <Select name="accountId" defaultValue={transaction.accountId}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={isLoadingAccounts ? "Loading..." : "Select an account"} />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts?.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                                {account.accountName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors?.accountId?._errors[0] && <p className="col-span-4 text-sm text-red-500 text-right">{errors.accountId._errors[0]}</p>}
            </div>

           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Input id="description" name="description" defaultValue={transaction.description} className="col-span-3"/>
                {errors?.description?._errors[0] && <p className="col-span-4 text-sm text-red-500 text-right">{errors.description._errors[0]}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={Math.abs(transaction.amount)} className="col-span-3"/>
                 {errors?.amount?._errors[0] && <p className="col-span-4 text-sm text-red-500 text-right">{errors.amount._errors[0]}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="transactionType" className="text-right">Type</Label>
                <RadioGroup name="transactionType" defaultValue={transaction.transactionType} className="col-span-3 flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="deposit" id="deposit" /><Label htmlFor="deposit">Deposit</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="withdrawal" id="withdrawal" /><Label htmlFor="withdrawal">Withdrawal</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="payment" id="payment" /><Label htmlFor="payment">Payment</Label></div>
                </RadioGroup>
                 {errors?.transactionType?._errors[0] && <p className="col-span-4 text-sm text-red-500 text-right">{errors.transactionType._errors[0]}</p>}
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                 <Input id="category" name="category" defaultValue={transaction.category} className="col-span-3"/>
                {errors?.category?._errors[0] && <p className="col-span-4 text-sm text-red-500 text-right">{errors.category._errors[0]}</p>}
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
