import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Bot, Download, Play, Zap, Shield, Globe, FileText, Film, Music, Image, Archive, ArrowRight } from "lucide-react";
import { SiTelegram } from "react-icons/si";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "video": return <Film className="w-4 h-4" />;
    case "audio": return <Music className="w-4 h-4" />;
    case "photo": return <Image className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

export default function Home() {
  const { data: stats } = useQuery<{ totalFiles: number; totalSize: number; totalDownloads: number }>({
    queryKey: ["/api/stats"],
  });

  const { data: botInfo } = useQuery<{ username: string; name: string }>({
    queryKey: ["/api/bot-info"],
  });

  const features = [
    {
      icon: <Download className="w-5 h-5" />,
      title: "Direct Downloads",
      description: "Get direct download links for any file shared with the bot. No speed limits.",
    },
    {
      icon: <Play className="w-5 h-5" />,
      title: "Stream in Browser",
      description: "Stream videos and audio directly in your browser without downloading.",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "High Speed",
      description: "Files are served through Telegram's CDN for maximum download speeds.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Secure Links",
      description: "Each file gets a unique short ID. No guessing or brute-forcing links.",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "No App Needed",
      description: "Share links with anyone. They can download without a Telegram account.",
    },
    {
      icon: <Archive className="w-5 h-5" />,
      title: "All File Types",
      description: "Documents, videos, audio, photos, archives — any file type supported.",
    },
  ];

  const steps = [
    { step: "1", title: "Send a file", description: "Forward or send any file to the bot on Telegram" },
    { step: "2", title: "Get your links", description: "Bot instantly replies with download and stream links" },
    { step: "3", title: "Share anywhere", description: "Share the link — anyone can download or stream it" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">FileToLink</span>
          </div>
          {botInfo?.username && (
            <a
              href={`https://t.me/${botInfo.username}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-open-bot"
            >
              <Button>
                <SiTelegram className="w-4 h-4" />
                Open Bot
              </Button>
            </a>
          )}
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Telegram File Sharing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Turn Telegram files into
            <span className="text-primary"> shareable links</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Send any file to our Telegram bot and instantly get a direct download link and stream link.
            Share with anyone — no Telegram needed to access.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {botInfo?.username && (
              <a
                href={`https://t.me/${botInfo.username}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-hero-open-bot"
              >
                <Button size="lg">
                  <SiTelegram className="w-5 h-5" />
                  Start Using Bot
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {stats && (
        <section className="pb-16 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-primary">{stats.totalFiles.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Files Shared</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-primary">{formatBytes(stats.totalSize)}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Data</p>
            </Card>
            <Card className="p-6 text-center">
              <p className="text-3xl font-bold text-primary">{stats.totalDownloads.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">Downloads</p>
            </Card>
          </div>
        </section>
      )}

      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to share files</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Features</h2>
            <p className="text-muted-foreground">Everything you need to share files effortlessly</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <Card key={f.title} className="p-5">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-3">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <span className="font-semibold">FileToLink</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by Telegram Bot API
          </p>
        </div>
      </footer>
    </div>
  );
}
