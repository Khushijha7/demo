
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
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "User not authenticated." });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const validatedFields = AddFundSchema.safeParse({
        amount: formData.get('amount'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { amount } = validatedFields.data;
    const newCurrentAmount = goal.currentAmount + amount;

    try {
        const goalRef = doc(firestore, `users/${user.uid}/savingsGoals`, goal.id);
        
        await updateDoc(goalRef, {
            currentAmount: newCurrentAmount,
            updatedAt: serverTimestamp(),
        });

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
            Enter the amount you want to contribute to this goal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount</Label>
                <Input id="amount" name="amount" type="number" step="any" placeholder="e.g. 50" className="col-span-3" />
                {errors?.amount && <p className="col-span-4 text-sm text-red-500 text-right">{errors.amount._errors[0]}</p>}
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
