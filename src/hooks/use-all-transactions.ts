
'use client';
import { useState, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, Timestamp, orderBy as firestoreOrderBy, limit as firestoreLimit, OrderByDirection } from 'firebase/firestore';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transactionType: string;
  category: string;
  transactionDate: string | Timestamp;
  accountId: string;
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const accountsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, `users/${user.uid}/accounts`));
  }, [user, firestore]);

  const { data: accounts, isLoading: isLoadingAccounts } = useCollection<{ id: string }>(accountsQuery);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!accounts || accounts.length === 0) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const allTransactions: Transaction[] = [];
        const transactionPromises = accounts.map(async (account) => {
          if (!firestore) return;
          const transactionsRef = collection(firestore, `users/${user!.uid}/accounts/${account.id}/transactions`);
          
          let q = query(transactionsRef);
          if (options.orderBy && options.orderDirection) {
            q = query(q, firestoreOrderBy(options.orderBy, options.orderDirection));
          }
           if (options.limit) {
             q = query(q, firestoreLimit(options.limit));
           }

          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            allTransactions.push({ id: doc.id, ...doc.data() } as Transaction);
          });
        });

        await Promise.all(transactionPromises);

        // Sort all transactions together if orderBy is provided
        if (options.orderBy) {
          allTransactions.sort((a, b) => {
            const dateA = a.transactionDate instanceof Timestamp ? a.transactionDate.toMillis() : new Date(a.transactionDate as string).getTime();
            const dateB = b.transactionDate instanceof Timestamp ? b.transactionDate.toMillis() : new Date(b.transactionDate as string).getTime();
            
            if (options.orderDirection === 'desc') {
                return dateB - dateA;
            }
            return dateA - dateB;
          });
        }
        
        // Apply limit after sorting all transactions together
        if(options.limit) {
            setTransactions(allTransactions.slice(0, options.limit));
        } else {
            setTransactions(allTransactions);
        }

      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoadingAccounts) {
        fetchTransactions();
    }
  }, [accounts, isLoadingAccounts, user, firestore, options.limit, options.orderBy, options.orderDirection]);

  return { transactions, isLoading, error };
}
