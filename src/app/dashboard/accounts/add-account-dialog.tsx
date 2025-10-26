
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
import { addAccount } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
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
                "Add Account"
            )}
        </Button>
    )
}

export function AddAccountDialog() {
  const [state, formAction] = useActionState(addAccount, initialState);
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
    } else if (state.message && !state.success) {
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
        <form action={formAction} ref={formRef} className="grid gap-4 py-4">
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
                {state.errors?.accountName && <p id="name-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.accountName[0]}</p>}
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
                {state.errors?.accountType && <p id="type-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.accountType[0]}</p>}
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
                 {state.errors?.balance && <p id="balance-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.balance[0]}</p>}
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
                {state.errors?.currency && <p id="currency-error" className="col-span-4 text-sm text-red-500 text-right">{state.errors.currency[0]}</p>}
            </div>
            
            <DialogFooter>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
