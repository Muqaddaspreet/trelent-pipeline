import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface GuideViewerProps {
  title: string;
  description?: string;
  html: string;
}

export function GuideViewer({ title, description, html }: GuideViewerProps) {
  return (
    <Card className="w-full max-w-3xl shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <article
          className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CardContent>
    </Card>
  );
}
