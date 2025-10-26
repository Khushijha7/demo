
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { z } from "zod";

const AccountSchema = z.object({
    accountName: z.string().min(1, "Account name is required."),
    accountType: z.enum(["checking", "savings", "credit_card", "investment"], {
      errorMap: () => ({ message: "Please select an account type." })
    }),
    balance: z.coerce.number(),
    currency: z.string().min(3, "Currency code must be 3 characters.").max(3, "Currency code must be 3 characters."),
});

type FormErrors = {
    accountName?: string[];
    accountType?: string[];
    balance?: string[];
    currency?: string[];
};

export function AddAccountDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not authenticated or Firestore not available.",
      });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const validatedFields = AccountSchema.safeParse({
        accountName: formData.get('accountName'),
        accountType: formData.get('accountType'),
        balance: formData.get('balance'),
        currency: formData.get('currency'),
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
    }

    const { accountName, accountType, balance, currency } = validatedFields.data;

    try {
        const accountsCollection = collection(firestore, `users/${user.uid}/accounts`);
        const accountData = {
            userId: user.uid,
            accountName,
            accountType,
            balance,
            currency: currency.toUpperCase(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const accountRef = await addDoc(accountsCollection, accountData);
        await updateDoc(doc(firestore, `users/${user.uid}/accounts`, accountRef.id), { id: accountRef.id });

        toast({
            title: "Success",
            description: "Account added successfully.",
        });
        setOpen(false);
        formRef.current?.reset();

    } catch (e) {
        console.error("Error adding account:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to add account. ${errorMessage}`,
        });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Reset errors when dialog is closed
  useEffect(() => {
    if(!open) {
      setErrors({});
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Enter the details of your new financial account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountName" className="text-right">
                    Account Name
                </Label>
                <Input
                    id="accountName"
                    name="accountName"
                    className="col-span-3"
                    aria-describedby="name-error"
                />
                {errors?.accountName && <p id="name-error" className="col-span-4 text-sm text-red-500 text-right">{errors.accountName[0]}</p>}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountType" className="text-right">
                    Account Type
                </Label>
                 <Select name="accountType">
                    <SelectTrigger className="col-span-3" aria-describedby="type-error">
                        <SelectValue placeholder="Select an account type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                </Select>
                {errors?.accountType && <p id="type-error" className="col-span-4 text-sm text-red-500 text-right">{errors.accountType[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="balance" className="text-right">
                    Initial Balance
                </Label>
                <Input
                    id="balance"
                    name="balance"
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="col-span-3"
                     aria-describedby="balance-error"
                />
                 {errors?.balance && <p id="balance-error" className="col-span-4 text-sm text-red-500 text-right">{errors.balance[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currency" className="text-right">
                    Currency
                </Label>
                 <Input
                    id="currency"
                    name="currency"
                    placeholder="e.g. USD"
                    defaultValue="USD"
                    className="col-span-3"
                    aria-describedby="currency-error"
                />
                {errors?.currency && <p id="currency-error" className="col-span-4 text-sm text-red-500 text-right">{errors.currency[0]}</p>}
            </div>
            
            <DialogFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        "Add Account"
                    )}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
