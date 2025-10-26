
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
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, writeBatch, doc, serverTimestamp } from "firebase/firestore";
import { z } from "zod";

const TransactionSchema = z.object({
    description: z.string().min(1, "Description is required."),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
    transactionType: z.enum(["deposit", "withdrawal", "payment"]),
    category: z.string().min(1, "Category is required."),
    accountId: z.string().min(1, "Please select an account.")
});

type FormErrors = z.ZodFormattedError<z.infer<typeof TransactionSchema>>;


export function AddTransactionDialog() {
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

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<{ id: string, accountName: string; balance: number }>(accountsQuery);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    if (!user || !firestore || !accounts) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User or account data not available.",
      });
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

    const sourceAccount = accounts.find(acc => acc.id === accountId);
    if (!sourceAccount) {
      toast({ variant: "destructive", title: "Error", description: "Selected account not found." });
      setIsSubmitting(false);
      return;
    }

    try {
        const batch = writeBatch(firestore);

        const transactionAmount = transactionType === 'deposit' ? amount : -amount;
        
        const transactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
        batch.set(transactionRef, {
            id: transactionRef.id,
            accountId,
            userId: user.uid,
            description,
            amount: transactionAmount,
            transactionType,
            category,
            transactionDate: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        const accountRef = doc(firestore, `users/${user.uid}/accounts`, accountId);
        batch.update(accountRef, { balance: sourceAccount.balance + transactionAmount });

        await batch.commit();

        toast({
            title: "Success",
            description: "Transaction added successfully.",
        });
        setOpen(false);
        formRef.current?.reset();
        setErrors(null);

    } catch (e) {
        console.error("Error adding transaction:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to add transaction. ${errorMessage}`,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Reset errors when dialog is closed
  useEffect(() => {
    if(!open) {
      setErrors(null);
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter the details of your new transaction here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountId" className="text-right">
                    Account
                </Label>
                 <Select name="accountId">
                    <SelectTrigger className="col-span-3" aria-describedby="account-error">
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
                {errors?.accountId?._errors[0] && <p id="account-error" className="col-span-4 text-sm text-red-500 text-right">{errors.accountId._errors[0]}</p>}
            </div>

           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                    Description
                </Label>
                <Input
                    id="description"
                    name="description"
                    className="col-span-3"
                    aria-describedby="description-error"
                />
                {errors?.description?._errors[0] && <p id="description-error" className="col-span-4 text-sm text-red-500 text-right">{errors.description._errors[0]}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                    Amount
                </Label>
                <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                     aria-describedby="amount-error"
                />
                 {errors?.amount?._errors[0] && <p id="amount-error" className="col-span-4 text-sm text-red-500 text-right">{errors.amount._errors[0]}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="transactionType" className="text-right">
                    Type
                </Label>
                <RadioGroup name="transactionType" defaultValue="withdrawal" className="col-span-3 flex gap-4" aria-describedby="type-error">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="deposit" id="deposit" />
                        <Label htmlFor="deposit">Deposit</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="withdrawal" id="withdrawal" />
                        <Label htmlFor="withdrawal">Withdrawal</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="payment" id="payment" />
                        <Label htmlFor="payment">Payment</Label>
                    </div>
                </RadioGroup>
                 {errors?.transactionType?._errors[0] && <p id="type-error" className="col-span-4 text-sm text-red-500 text-right">{errors.transactionType._errors[0]}</p>}
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                    Category
                </Label>
                 <Input
                    id="category"
                    name="category"
                    className="col-span-3"
                    aria-describedby="category-error"
                />
                {errors?.category?._errors[0] && <p id="category-error" className="col-span-4 text-sm text-red-500 text-right">{errors.category._errors[0]}</p>}
            </div>
            <DialogFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        "Add Transaction"
                    )}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
