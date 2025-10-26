
"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { doc, writeBatch, getDoc, Timestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface Investment {
    id: string;
    userId: string;
    associatedTransactionId?: string;
}

export function DeleteInvestmentDialog({ investment, children }: { investment: Investment, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleDelete = async () => {
    setIsDeleting(true);

    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete investment. Missing auth or data." });
      setIsDeleting(false);
      return;
    }

    try {
      const batch = writeBatch(firestore);

      // 1. Delete the investment document
      const investmentRef = doc(firestore, `users/${user.uid}/investments`, investment.id);
      batch.delete(investmentRef);

      // 2. Delete the associated transaction and revert account balance
      if (investment.associatedTransactionId) {
        const transRef = doc(firestore, `users/${user.uid}/transactions`, investment.associatedTransactionId);
        const transDoc = await getDoc(transRef);

        if (transDoc.exists()) {
            const transactionData = transDoc.data();
            const accountRef = doc(firestore, `users/${user.uid}/accounts`, transactionData.accountId);
            const accountDoc = await getDoc(accountRef);

            if (accountDoc.exists()) {
                const accountData = accountDoc.data();
                const revertedBalance = accountData.balance - transactionData.amount;
                batch.update(accountRef, { balance: revertedBalance });
            }
            batch.delete(transRef);
        }
      }
      
      await batch.commit();

      toast({ title: "Success", description: "Investment deleted successfully." });
      setOpen(false);
    } catch (e) {
      console.error("Error deleting investment:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      toast({ variant: "destructive", title: "Error", description: `Failed to delete investment. ${errorMessage}` });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this investment and its associated purchase transaction, and revert the balance change on the source account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
