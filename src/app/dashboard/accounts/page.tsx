import { AccountCards } from "@/app/components/dashboard/account-cards";

export default function AccountsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Accounts</h1>
      <AccountCards />
    </div>
  );
}
