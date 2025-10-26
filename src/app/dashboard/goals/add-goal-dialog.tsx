
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
import { PlusCircle, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SavingsGoalSchema = z.object({
    goalName: z.string().min(1, "Goal name is required."),
    targetAmount: z.coerce.number().min(1, "Target amount must be greater than 0."),
    targetDate: z.date({ required_error: "Target date is required." }),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof SavingsGoalSchema>>;

export function AddGoalDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = React.useState<Date>();
  
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
    const dataToValidate = {
        goalName: formData.get('goalName'),
        targetAmount: formData.get('targetAmount'),
        targetDate: date,
    };

    const validatedFields = SavingsGoalSchema.safeParse(dataToValidate);

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { goalName, targetAmount, targetDate } = validatedFields.data;

    try {
        const goalsCollection = collection(firestore, `users/${user.uid}/savingsGoals`);
        
        const newGoalData = {
            userId: user.uid,
            goalName,
            targetAmount,
            currentAmount: 0,
            targetDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            automaticContributionAmount: 0,
            automaticContributionFrequency: 'none',
        };
        
        const goalRef = await addDoc(goalsCollection, newGoalData);
        await doc(firestore, `users/${user.uid}/savingsGoals`, goalRef.id).set({ id: goalRef.id }, { merge: true });

        toast({ title: "Success", description: "Savings goal added successfully." });
        setOpen(false);
        formRef.current?.reset();
        setDate(undefined);

    } catch (e) {
        console.error("Error adding savings goal:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: "destructive", title: "Error", description: `Failed to add goal. ${errorMessage}` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if(!open) {
      setErrors(null);
      setDate(undefined);
      if (formRef.current) {
        formRef.current.reset();
      }
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Savings Goal</DialogTitle>
          <DialogDescription>
            What are you saving up for? Let's set a goal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="goalName" className="text-right">Goal Name</Label>
                <Input id="goalName" name="goalName" placeholder="e.g. New Car Fund" className="col-span-3" />
                {errors?.goalName?._errors[0] && <p className="col-span-4 text-sm text-red-500 text-right">{errors.goalName._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetAmount" className="text-right">Target Amount</Label>
                <Input id="targetAmount" name="targetAmount" type="number" step="any" placeholder="e.g. 20000" className="col-span-3" />
                {errors?.targetAmount?._errors[0] && <p className="col-span-4 text-sm text-red-500 text-right">{errors.targetAmount._errors[0]}</p>}
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
                 {errors?.targetDate?._errors[0] && <p className="col-span-4 text-sm text-red-500 text-right">{errors.targetDate._errors[0]}</p>}
            </div>
            
            <DialogFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Goal"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
