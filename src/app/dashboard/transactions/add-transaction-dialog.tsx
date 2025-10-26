"use client";

import React, { useEffect, useRef } from "react";
import { useActionState } from "react";
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
import { addTransaction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const initialState = {
  message: null,
  errors: {},
  success: false,
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
    )
}

export function AddTransactionDialog({ accountId }: { accountId: string }) {
  const [state, formAction] = useActionState(addTransaction, initialState);
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const formRef = useRef<HTMLFormElement>(null);


  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success",
        description: state.message,
      });
      setOpen(false);
      formRef.current?.reset();
    } else if (state.message) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, toast]);

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
           <input type="hidden" name="accountId" value={accountId} />
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
