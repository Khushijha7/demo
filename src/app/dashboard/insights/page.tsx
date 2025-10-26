import { PersonalizedInsights } from "@/app/components/dashboard/personalized-insights";

export default function InsightsPage() {
  return (
    <div className="grid gap-6">
        <h1 className="text-3xl font-bold">AI Powered Insights</h1>
        <PersonalizedInsights />
    </div>
  );
}
