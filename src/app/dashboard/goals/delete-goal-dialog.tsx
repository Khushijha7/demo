
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
import { doc, deleteDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

interface DeleteGoalDialogProps {
  goalId: string;
  children: React.ReactNode;
}

export function DeleteGoalDialog({ goalId, children }: DeleteGoalDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const handleDelete = async () => {
    setIsDeleting(true);

    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete goal. Missing auth or data." });
      setIsDeleting(false);
      return;
    }
    
    try {
      const goalRef = doc(firestore, `users/${user.uid}/savingsGoals`, goalId);
      await deleteDoc(goalRef);
      
      toast({ title: "Success", description: "Savings goal deleted successfully." });
      setOpen(false);
    } catch (e) {
      console.error("Error deleting savings goal:", e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      toast({ variant: "destructive", title: "Error", description: `Failed to delete goal. ${errorMessage}` });
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
            This action cannot be undone. This will permanently delete this savings goal. Any funds contributed will remain as transactions in your accounts.
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
