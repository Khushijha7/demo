
"use client"

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
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, writeBatch, Timestamp, collection, query } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface Transaction {
    id: string;
    accountId: string;
    amount: number;
    userId: string;
}

export function DeleteTransactionDialog({ transaction, children }: { transaction: Transaction, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const accountQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // We fetch the single account to get its current balance for adjustment
    return query(collection(firestore, `users/${user.uid}/accounts`), );
  }, [user, firestore, transaction.accountId]);
  
  const { data: accounts } = useCollection<{id: string, balance: number}>(accountQuery);
  

  const handleDelete = async () => {
    setIsDeleting(true);

    if (!user || !firestore || !accounts) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete transaction. Missing auth or data." });
      setIsDeleting(false);
      return;
    }
    
    const account = accounts.find(acc => acc.id === transaction.accountId);

    if (!account) {
      toast({ variant: "destructive", title: "Error", description: "Source account not found." });
      setIsDeleting(false);
      return;
    }

    try {
      const batch = writeBatch(firestore);

      // 1. Delete the transaction document
      const transactionRef = doc(firestore, `users/${user.uid}/accounts/${transaction.accountId}/transactions`, transaction.id);
      batch.delete(transactionRef);

      // 2. Revert the balance on the associated account
      const accountRef = doc(firestore, `users/${user.uid}/accounts`, transaction.accountId);
      const revertedBalance = account.balance - transaction.amount; // Subtracting the transaction amount (which could be pos or neg)
      batch.update(accountRef, { balance: revertedBalance });
      
      await batch.commit();

      toast({ title: "Success", description: "Transaction deleted successfully." });
      setOpen(false);
    } catch (e) {
      console.error("Error deleting transaction:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      toast({ variant: "destructive", title: "Error", description: `Failed to delete transaction. ${errorMessage}` });
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
            This action cannot be undone. This will permanently delete this transaction and revert the balance change from the associated account.
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
