import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { GuideRunPanel } from "@/components/guide-run-panel";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-8 bg-background">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            Turn docs into guides
          </CardTitle>
          <CardDescription className="text-base">
            Upload internal guides or PDFs and watch them become clean HTML
            guides.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <GuideRunPanel />

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Want to see a finished guide layout?{" "}
              <Link
                href="/example-guide"
                className="text-primary hover:underline font-medium transition-colors"
              >
                View the sample guide
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
