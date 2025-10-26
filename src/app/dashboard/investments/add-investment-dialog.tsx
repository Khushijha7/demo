
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { z } from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const InvestmentSchema = z.object({
    investmentName: z.string().min(1, "Investment name is required."),
    investmentType: z.enum(["stock", "etf", "crypto", "other"], {
      errorMap: () => ({ message: "Please select an investment type." })
    }),
    quantity: z.coerce.number().min(0, "Quantity cannot be negative."),
    purchasePrice: z.coerce.number().min(0.01, "Purchase price must be positive."),
    purchaseDate: z.date({ required_error: "Purchase date is required." }),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof InvestmentSchema>>;

export function AddInvestmentDialog() {
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
    const validatedFields = InvestmentSchema.safeParse({
        investmentName: formData.get('investmentName'),
        investmentType: formData.get('investmentType'),
        quantity: formData.get('quantity'),
        purchasePrice: formData.get('purchasePrice'),
        purchaseDate: date,
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.format());
        setIsSubmitting(false);
        return;
    }

    const { investmentName, investmentType, quantity, purchasePrice, purchaseDate } = validatedFields.data;

    try {
        const investmentsCollection = collection(firestore, `users/${user.uid}/investments`);
        const investmentData = {
            userId: user.uid,
            investmentName,
            investmentType,
            quantity,
            purchasePrice,
            purchaseDate,
            currentValue: quantity * purchasePrice, // Initial current value is the purchase value
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(investmentsCollection, investmentData);
        await updateDoc(doc(firestore, `users/${user.uid}/investments`, docRef.id), { id: docRef.id });

        toast({ title: "Success", description: "Investment added successfully." });
        setOpen(false);
        formRef.current?.reset();
        setDate(undefined);

    } catch (e) {
        console.error("Error adding investment:", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        toast({ variant: "destructive", title: "Error", description: `Failed to add investment. ${errorMessage}` });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    if(!open) {
      setErrors(null);
      setDate(undefined);
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="ml-auto gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Investment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Investment</DialogTitle>
          <DialogDescription>
            Enter the details of your new investment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} ref={formRef} className="grid gap-4 py-4">
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investmentName" className="text-right">Name</Label>
                <Input id="investmentName" name="investmentName" className="col-span-3" />
                {errors?.investmentName && <p className="col-span-4 text-sm text-red-500 text-right">{errors.investmentName._errors[0]}</p>}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="investmentType" className="text-right">Type</Label>
                 <Select name="investmentType">
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select an investment type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="etf">ETF</SelectItem>
                        <SelectItem value="crypto">Crypto</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                {errors?.investmentType && <p className="col-span-4 text-sm text-red-500 text-right">{errors.investmentType._errors[0]}</p>}
            </div>

             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchaseDate" className="text-right">Purchase Date</Label>
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
                 {errors?.purchaseDate && <p className="col-span-4 text-sm text-red-500 text-right">{errors.purchaseDate._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" step="any" placeholder="e.g. 10" className="col-span-3" />
                {errors?.quantity && <p className="col-span-4 text-sm text-red-500 text-right">{errors.quantity._errors[0]}</p>}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="purchasePrice" className="text-right">Purchase Price</Label>
                 <Input id="purchasePrice" name="purchasePrice" type="number" step="any" placeholder="Price per unit" className="col-span-3" />
                {errors?.purchasePrice && <p className="col-span-4 text-sm text-red-500 text-right">{errors.purchasePrice._errors[0]}</p>}
            </div>
            
            <DialogFooter>
                 <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Investment"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
