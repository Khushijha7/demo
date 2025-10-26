
'use client';
import { useState, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, Timestamp, orderBy as firestoreOrderBy, limit as firestoreLimit, OrderByDirection } from 'firebase/firestore';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transactionType: string;
  category: string;
  transactionDate: string | Timestamp;
  accountId: string;
  userId: string;
  [key: string]: any;
}

interface UseAllTransactionsOptions {
    limit?: number;
    orderBy?: string;
    orderDirection?: OrderByDirection;
}

export function useAllTransactions(options: UseAllTransactionsOptions = {}) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const transactionsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    
    const baseQuery = query(collection(firestore, `users/${user.uid}/transactions`));

    if (options.orderBy && options.orderDirection) {
        return query(baseQuery, firestoreOrderBy(options.orderBy, options.orderDirection), ...(options.limit ? [firestoreLimit(options.limit)] : []));
    }
    
    if (options.limit) {
      return query(baseQuery, firestoreLimit(options.limit));
    }
    
    return baseQuery;
  }, [user, firestore, options.limit, options.orderBy, options.orderDirection]);
  
  const { data: transactions, isLoading, error } = useCollection<Transaction>(transactionsQuery);

  return { transactions, isLoading, error };
}
