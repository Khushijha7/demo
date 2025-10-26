
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
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { doc, serverTimestamp, updateDoc, Timestamp } from "firebase/firestore";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SavingsGoal {
    id: string;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Timestamp | string;
}

const EditSavingsGoalSchema = z.object({
    goalName: z.string().min(1, "Goal name is required."),
    targetAmount: z.coerce.number().min(1, "Target amount must be greater than 0."),
    targetDate: z.date({ required_error: "Target date is required." }),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof EditSavingsGoalSchema>>;

export function EditGoalDialog({ goal, children }: { goal: SavingsGoal, children: React.ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialDate = goal.targetDate instanceof Timestamp ? goal.targetDate.toDate() : new Date(goal.targetDate);
  const [date, setDate] = useState<Date | undefined>(initialDate);
  
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
    const validatedFields = EditSavingsGoalSchema.safeParse({
        goalName: formData.get('goalName'),
        targetAmount: formData.get('targetAmount'),
        targetDate: date,
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { goalName, targetAmount, targetDate } = validatedFields.data;

    try {
        const goalRef = doc(firestore, `users/${user.uid}/savingsGoals`, goal.id);
        await updateDoc(goalRef, {
            goalName,
            targetAmount,
            targetDate,
            updatedAt: serverTimestamp(),
        });
        
        toast({ title: "Success", description: "Savings goal updated successfully." });
        setOpen(false);

    } catch (e) {
        console.error("Error updating savings goal:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: "destructive", title: "Error", description: `Failed to update goal. ${errorMessage}` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if(!open) {
      setErrors(null);
      const initialDate = goal.targetDate instanceof Timestamp ? goal.targetDate.toDate() : new Date(goal.targetDate);
      setDate(initialDate);
    }
  }, [open, goal.targetDate])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Savings Goal</DialogTitle>
          <DialogDescription>
            Update the details of your savings goal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goalName" className="text-right">Goal Name</Label>
                <Input id="goalName" name="goalName" defaultValue={goal.goalName} className="col-span-3" />
                {errors?.goalName && <p className="col-span-4 text-sm text-red-500 text-right">{errors.goalName._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetAmount" className="text-right">Target Amount</Label>
                <Input id="targetAmount" name="targetAmount" type="number" step="any" defaultValue={goal.targetAmount} className="col-span-3" />
                {errors?.targetAmount && <p className="col-span-4 text-sm text-red-500 text-right">{errors.targetAmount._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentAmount" className="text-right">Current Amount</Label>
                 <Input id="currentAmount" name="currentAmount" type="number" defaultValue={goal.currentAmount} className="col-span-3" disabled />
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetDate" className="text-right">Target Date</Label>
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
                 {errors?.targetDate && <p className="col-span-4 text-sm text-red-500 text-right">{errors.targetDate._errors[0]}</p>}
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
