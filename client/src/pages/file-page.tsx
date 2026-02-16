import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Download, Play, FileText, Film, Music, Image as ImageIcon, Archive, Clock, User, HardDrive, ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import type { TelegramFile } from "@shared/schema";
import { useState } from "react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getFileTypeInfo(fileType: string, mimeType: string) {
  if (fileType === "video" || mimeType.startsWith("video/")) return { icon: <Film className="w-8 h-8" />, label: "Video", color: "text-blue-500" };
  if (fileType === "audio" || mimeType.startsWith("audio/")) return { icon: <Music className="w-8 h-8" />, label: "Audio", color: "text-purple-500" };
  if (fileType === "photo" || mimeType.startsWith("image/")) return { icon: <ImageIcon className="w-8 h-8" />, label: "Image", color: "text-green-500" };
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar") || mimeType.includes("7z")) return { icon: <Archive className="w-8 h-8" />, label: "Archive", color: "text-orange-500" };
  return { icon: <FileText className="w-8 h-8" />, label: "Document", color: "text-muted-foreground" };
}

function isStreamable(mimeType: string, fileType: string): boolean {
  return (
    mimeType.startsWith("video/") ||
    mimeType.startsWith("audio/") ||
    mimeType.startsWith("image/") ||
    fileType === "video" ||
    fileType === "audio" ||
    fileType === "photo"
  );
}

export default function FilePage() {
  const params = useParams<{ id: string }>();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const { data: file, isLoading, error } = useQuery<TelegramFile>({
    queryKey: ["/api/file", params.id],
  });

  const copyLink = (url: string, type: string) => {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-8">
          <div className="space-y-4">
            <Skeleton className="h-16 w-16 rounded-md mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-8 text-center">
          <div className="w-16 h-16 rounded-md bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">File Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This file may have been removed or the link is invalid.
          </p>
          <a href="/" data-testid="link-go-home">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </Button>
          </a>
        </Card>
      </div>
    );
  }

  const typeInfo = getFileTypeInfo(file.fileType, file.mimeType);
  const streamable = isStreamable(file.mimeType, file.fileType);
  const downloadUrl = `/dl/${file.id}`;
  const streamUrl = `/stream/${file.id}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <a href="/" className="flex items-center gap-2" data-testid="link-header-home">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">FileToLink</span>
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-16 h-16 rounded-md bg-card flex items-center justify-center mb-4 ${typeInfo.color}`}>
              {typeInfo.icon}
            </div>
            <h1 className="text-xl font-bold break-all mb-2" data-testid="text-file-name">
              {file.fileName}
            </h1>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Badge variant="secondary">{typeInfo.label}</Badge>
              <Badge variant="outline">{formatBytes(file.fileSize)}</Badge>
              {file.duration && (
                <Badge variant="outline">
                  <Clock className="w-3 h-3" />
                  {formatDuration(file.duration)}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between gap-2 text-sm py-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Size
              </span>
              <span className="font-medium" data-testid="text-file-size">{formatBytes(file.fileSize)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm py-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Type
              </span>
              <span className="font-medium" data-testid="text-file-type">{file.mimeType}</span>
            </div>
            {file.width && file.height && (
              <div className="flex items-center justify-between gap-2 text-sm py-2 border-b">
                <span className="text-muted-foreground">Resolution</span>
                <span className="font-medium">{file.width} x {file.height}</span>
              </div>
            )}
            {file.senderName && (
              <div className="flex items-center justify-between gap-2 text-sm py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Shared by
                </span>
                <span className="font-medium" data-testid="text-sender-name">{file.senderName}</span>
              </div>
            )}
          </div>

          {streamable && (file.mimeType.startsWith("video/") || file.fileType === "video") && (
            <div className="mb-6 rounded-md overflow-hidden bg-black">
              <video
                controls
                className="w-full max-h-[400px]"
                preload="metadata"
                data-testid="video-player"
              >
                <source src={streamUrl} type={file.mimeType !== "application/octet-stream" ? file.mimeType : "video/mp4"} />
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {streamable && (file.mimeType.startsWith("audio/") || file.fileType === "audio") && (
            <div className="mb-6">
              <audio
                controls
                className="w-full"
                preload="metadata"
                data-testid="audio-player"
              >
                <source src={streamUrl} type={file.mimeType !== "application/octet-stream" ? file.mimeType : "audio/mpeg"} />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {streamable && (file.mimeType.startsWith("image/") || file.fileType === "photo") && (
            <div className="mb-6 rounded-md overflow-hidden">
              <img
                src={streamUrl}
                alt={file.fileName}
                className="w-full object-contain max-h-[500px]"
                data-testid="image-preview"
              />
            </div>
          )}

          <div className="space-y-3">
            <a href={downloadUrl} download data-testid="link-download">
              <Button className="w-full" size="lg">
                <Download className="w-5 h-5" />
                Download File
              </Button>
            </a>

            {streamable && (
              <a href={streamUrl} target="_blank" rel="noopener noreferrer" data-testid="link-stream">
                <Button variant="outline" className="w-full" size="lg">
                  <Play className="w-5 h-5" />
                  Open Stream Link
                </Button>
              </a>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyLink(downloadUrl, "download")}
                data-testid="button-copy-download"
              >
                {copiedLink === "download" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink === "download" ? "Copied!" : "Copy Download Link"}
              </Button>
              {streamable && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyLink(streamUrl, "stream")}
                  data-testid="button-copy-stream"
                >
                  {copiedLink === "stream" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink === "stream" ? "Copied!" : "Copy Stream Link"}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="text-center mt-8">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-home">
            <Bot className="w-4 h-4 inline mr-1" />
            FileToLink Bot
          </a>
        </div>
      </main>
    </div>
  );
}
