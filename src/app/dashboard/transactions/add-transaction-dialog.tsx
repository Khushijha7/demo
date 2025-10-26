
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addTransaction } from "@/app/actions";

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
import { collection, query } from "firebase/firestore";

const initialState = {
  success: false,
  errors: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        "Add Transaction"
      )}
    </Button>
  );
}


export function AddTransactionDialog() {
  const [state, formAction] = useFormState(addTransaction, initialState);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { user } = useUser();
  const firestore = useFirestore();
  
  const accountsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<{ accountName: string }>(accountsQuery);

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success",
        description: "Transaction added successfully.",
      });
      setOpen(false);
      formRef.current?.reset();
    } else if (state.error) {
      toast({
        variant: "destructive",
        title: "Error adding transaction",
        description: state.error,
      });
    }
  }, [state, toast]);

  // Reset form state when dialog is closed
  useEffect(() => {
    if(!open) {
      // A bit of a hack to reset the form state
     (initialState as any).ts = new Date();
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
        <form action={formAction} ref={formRef} className="grid gap-4 py-4">
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
                {state.errors?.accountId && <p id="account-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.accountId[0]}</p>}
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
                {state.errors?.description && <p id="description-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.description[0]}</p>}
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
                 {state.errors?.amount && <p id="amount-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.amount[0]}</p>}
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
                 {state.errors?.transactionType && <p id="type-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.transactionType[0]}</p>}
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
                {state.errors?.category && <p id="category-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.category[0]}</p>}
            </div>
            <DialogFooter>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
