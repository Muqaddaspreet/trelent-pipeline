"use client";

import { useEffect, useState, useCallback } from "react";
import { GuideViewer } from "@/components/guide-viewer";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type JobStatus = "idle" | "queued" | "running" | "completed" | "failed";

export function GuideRunPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [markdownUrl, setMarkdownUrl] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] ?? null;
      handleFileSelect(selectedFile);
    },
    [handleFileSelect]
  );

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setHtml(null);
    setMarkdownUrl(null);
    setJobId(null);
    setStatus("idle");

    if (!file) {
      setError("Please choose a file first.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/runs", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            `Non-JSON response from /api/runs (status ${res.status})`
          );
        }
      }

      if (!res.ok || !data.ok) {
        throw new Error(
          data.error ?? `Failed to start run (status ${res.status})`
        );
      }

      setJobId(data.jobId as string);
      setStatus("queued");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong starting the run.");
      setStatus("failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Polling for status whenever we have a jobId
  useEffect(() => {
    if (!jobId) return;

    const currentJobId: string = jobId;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/runs/status?jobId=${encodeURIComponent(currentJobId)}`
        );

        const text = await res.text();
        let data: any = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error(
              `Non-JSON response from /api/runs/status (status ${res.status})`
            );
          }
        }

        if (!res.ok || !data.ok) {
          throw new Error(
            data.error ?? `Failed to fetch status (status ${res.status})`
          );
        }

        const s = data.job.status as JobStatus;
        setStatus(s);

        if (data.job.markdownUrl) {
          setMarkdownUrl(data.job.markdownUrl as string);
        }

        if (s === "completed" || s === "failed") {
          return;
        }

        if (!cancelled) {
          setTimeout(poll, 2000);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setError(err.message ?? "Error while polling job status.");
        setStatus("failed");
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  // When job is completed and we have a markdownUrl, fetching Markdown and calling OpenAI
  useEffect(() => {
    if (status !== "completed" || !markdownUrl || html || isRewriting) {
      return;
    }

    const currentMarkdownUrl: string = markdownUrl;

    let cancelled = false;

    async function generateGuide() {
      try {
        setIsRewriting(true);

        // Fetching Markdown from Trelent's signed URL
        const mdRes = await fetch(currentMarkdownUrl);
        const markdown = await mdRes.text();

        // Sending to our rewrite-guide API
        const res = await fetch("/api/rewrite-guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(
            data.error ?? `Failed to rewrite guide (status ${res.status})`
          );
        }

        if (!cancelled) {
          setHtml(data.html as string);
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setError(err.message ?? "Failed to generate guide HTML.");
        setStatus("failed");
      } finally {
        if (!cancelled) {
          setIsRewriting(false);
        }
      }
    }

    generateGuide();

    return () => {
      cancelled = true;
    };
  }, [status, markdownUrl, html, isRewriting]);

  const statusLabel =
    status === "idle"
      ? "Not started"
      : status === "queued"
      ? "Queued"
      : status === "running"
      ? "Processing…"
      : status === "completed"
      ? isRewriting
        ? "Completed ingestion, generating guide…"
        : "Completed"
      : "Failed";

  const getStatusIcon = () => {
    if (status === "completed") {
      return (
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      );
    }
    if (status === "failed") {
      return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
    if (status === "running" || status === "queued" || isRewriting) {
      return (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
      );
    }
    return null;
  };

  const getStatusColor = () => {
    if (status === "completed") {
      return "text-green-600 dark:text-green-400";
    }
    if (status === "failed") {
      return "text-red-600 dark:text-red-400";
    }
    if (status === "running" || status === "queued" || isRewriting) {
      return "text-blue-600 dark:text-blue-400";
    }
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleStart} className="space-y-4">
        {/* File upload card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
            file && "border-primary/50 bg-primary/5"
          )}
        >
          <input
            type="file"
            id="file-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileInputChange}
            accept=".pdf,.doc,.docx,.txt,.md"
            disabled={
              isSubmitting || status === "running" || status === "queued"
            }
          />

          <div className="flex flex-col items-center justify-center p-8 text-center">
            {file ? (
              <>
                <div className="mb-4 p-3 rounded-full bg-primary/10">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileSelect(null);
                  }}
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
                  disabled={
                    isSubmitting || status === "running" || status === "queued"
                  }
                >
                  <X className="h-3 w-3 inline mr-1" />
                  Remove file
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 p-3 rounded-full bg-muted">
                  <Upload
                    className={cn(
                      "h-8 w-8 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {isDragging
                    ? "Drop your file here"
                    : "Drag and drop your file here"}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Supports PDF, DOC, DOCX, TXT, MD
                </p>
              </>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={
            !file || isSubmitting || status === "running" || status === "queued"
          }
          className={cn(
            "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200",
            "cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "shadow-sm hover:shadow-md active:scale-[0.98]"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Starting guide run…</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Start guide run</span>
            </>
          )}
        </button>
      </form>

      {/* Status card */}
      {(status !== "idle" || error) && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-sm font-medium", getStatusColor())}>
                  {statusLabel}
                </span>
                {jobId && (
                  <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                    {jobId.slice(0, 8)}...
                  </span>
                )}
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generated guide */}
      {status === "completed" && html && (
        <div className="pt-6 border-t animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GuideViewer
            title="Generated Guide"
            description="This HTML was produced by Trelent ingestion + OpenAI rewriting."
            html={html}
          />
        </div>
      )}
    </div>
  );
}
