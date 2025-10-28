
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SupportPage() {
  return (
    <div className="grid gap-6">
       <h1 className="text-3xl font-bold">Support</h1>
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>Have a question or need help? Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g., Issue with my account" />
            </div>
           <div className="grid gap-2">
              <Label htmlFor="message">Your Message</Label>
              <Textarea id="message" placeholder="Please describe your issue in detail..." rows={6} />
            </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button>Submit Request</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
