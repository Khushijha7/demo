
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
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, writeBatch, query } from "firebase/firestore";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const SavingsGoalSchema = z.object({
    goalName: z.string().min(1, "Goal name is required."),
    targetAmount: z.coerce.number().min(1, "Target amount must be greater than 0."),
    currentAmount: z.coerce.number().min(0, "Current amount cannot be negative."),
    targetDate: z.date({ required_error: "Target date is required." }),
    accountId: z.string().optional(),
}).refine(data => data.currentAmount === 0 || (data.currentAmount > 0 && data.accountId), {
    message: "An account must be selected if there is a starting amount.",
    path: ["accountId"],
});

type FormErrors = z.ZodFormattedError<z.infer<typeof SavingsGoalSchema>>;

export function AddGoalDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = React.useState<Date>();
  const [currentAmount, setCurrentAmount] = useState(0);
  
  const { user } = useUser();
  const firestore = useFirestore();

  const accountsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<{ accountName: string; balance: number; currency: string; accountType: string; }>(accountsQuery);

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
    const validatedFields = SavingsGoalSchema.safeParse({
        goalName: formData.get('goalName'),
        targetAmount: formData.get('targetAmount'),
        currentAmount: formData.get('currentAmount'),
        targetDate: date,
        accountId: formData.get('accountId'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { goalName, targetAmount, currentAmount, targetDate, accountId } = validatedFields.data;

    const sourceAccount = accounts?.find(acc => acc.id === accountId);
    if (currentAmount > 0 && !sourceAccount) {
        toast({ variant: "destructive", title: "Error", description: "Selected account not found." });
        setIsSubmitting(false);
        return;
    }
    
    if (sourceAccount && sourceAccount.accountType !== 'credit_card' && sourceAccount.balance < currentAmount) {
        toast({ variant: "destructive", title: "Insufficient Funds", description: `Your ${sourceAccount.accountName} does not have enough funds.` });
        setIsSubmitting(false);
        return;
    }

    try {
        const batch = writeBatch(firestore);

        const goalRef = doc(collection(firestore, `users/${user.uid}/savingsGoals`));
        batch.set(goalRef, {
            id: goalRef.id,
            userId: user.uid,
            goalName,
            targetAmount,
            currentAmount,
            targetDate,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            automaticContributionAmount: 0,
            automaticContributionFrequency: 'none',
        });
        
        if (currentAmount > 0 && sourceAccount && accountId) {
             // 2. Create Transaction
            const transactionRef = doc(collection(firestore, `users/${user.uid}/transactions`));
            batch.set(transactionRef, {
                id: transactionRef.id,
                userId: user.uid,
                accountId: accountId,
                description: `Initial contribution to ${goalName}`,
                amount: -currentAmount,
                transactionType: 'withdrawal',
                category: 'savings',
                transactionDate: new Date(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 3. Update Account Balance
            const accountRef = doc(firestore, `users/${user.uid}/accounts`, accountId);
            const newBalance = sourceAccount.accountType === 'credit_card'
                ? sourceAccount.balance + currentAmount
                : sourceAccount.balance - currentAmount;
            batch.update(accountRef, {
                balance: newBalance,
                updatedAt: serverTimestamp(),
            });
        }
        
        await batch.commit();

        toast({ title: "Success", description: "Savings goal added successfully." });
        setOpen(false);
        formRef.current?.reset();
        setDate(undefined);
        setCurrentAmount(0);

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
      setCurrentAmount(0);
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
                {errors?.goalName && <p className="col-span-4 text-sm text-red-500 text-right">{errors.goalName._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetAmount" className="text-right">Target Amount</Label>
                <Input id="targetAmount" name="targetAmount" type="number" step="any" placeholder="e.g. 20000" className="col-span-3" />
                {errors?.targetAmount && <p className="col-span-4 text-sm text-red-500 text-right">{errors.targetAmount._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentAmount" className="text-right">Current Amount</Label>
                 <Input id="currentAmount" name="currentAmount" type="number" step="any" placeholder="e.g. 500" defaultValue="0" className="col-span-3" onChange={(e) => setCurrentAmount(parseFloat(e.target.value) || 0)}/>
                {errors?.currentAmount && <p className="col-span-4 text-sm text-red-500 text-right">{errors.currentAmount._errors[0]}</p>}
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
            
            {currentAmount > 0 && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="accountId" className="text-right">
                        Source Account
                    </Label>
                    <Select name="accountId">
                        <SelectTrigger className="col-span-3" aria-describedby="account-error">
                            <SelectValue placeholder={isLoadingAccounts ? "Loading..." : "Select an account"} />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts?.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.accountName} ({account.balance.toLocaleString('en-US', { style: 'currency', currency: account.currency || 'USD' })})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors?.accountId && <p id="account-error" className="col-span-4 text-sm text-red-500 text-right">{errors.accountId._errors[0]}</p>}
                </div>
            )}
            
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
