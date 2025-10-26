
"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Timestamp } from "firebase/firestore";
import { EditInvestmentDialog } from "./edit-investment-dialog";
import { DeleteInvestmentDialog } from "./delete-investment-dialog";

interface Investment {
    id: string;
    userId: string;
    investmentName: string;
    tickerSymbol: string;
    investmentType: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: Timestamp | string;
    currentValue: number;
    associatedTransactionId?: string;
}

interface InvestmentActionsProps {
  investment: Investment;
}

export function InvestmentActions({ investment }: InvestmentActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <EditInvestmentDialog investment={investment}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
        </EditInvestmentDialog>
        <DeleteInvestmentDialog investment={investment}>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Delete</DropdownMenuItem>
        </DeleteInvestmentDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
