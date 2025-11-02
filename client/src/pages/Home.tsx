import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Bookmark, History, Search } from "lucide-react";
import { Link } from "wouter";
import type { ReadingHistory, Bookmark as BookmarkType } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Non autorizzato",
        description: "Accesso in corso...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: recentHistory, isLoading: historyLoading } = useQuery<ReadingHistory[]>({
    queryKey: ["/api/reading-history/recent"],
    enabled: isAuthenticated,
  });

  const { data: recentBookmarks, isLoading: bookmarksLoading } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks/recent"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Benvenuto</h1>
        <p className="text-muted-foreground">
          Esplora la biblioteca Shamela e traduci testi arabi con AI
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 hover-elevate">
          <Link href="/search">
            <a className="space-y-2 block" data-testid="link-search">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Cerca Testi</h3>
              <p className="text-sm text-muted-foreground">
                Trova testi arabi con filtri avanzati
              </p>
            </a>
          </Link>
        </Card>

        <Card className="p-6 hover-elevate">
          <Link href="/bookmarks">
            <a className="space-y-2 block" data-testid="link-bookmarks">
              <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Bookmark className="h-6 w-6 text-chart-2" />
              </div>
              <h3 className="font-semibold">Segnalibri</h3>
              <p className="text-sm text-muted-foreground">
                Accedi ai tuoi passaggi salvati
              </p>
            </a>
          </Link>
        </Card>

        <Card className="p-6 hover-elevate">
          <Link href="/history">
            <a className="space-y-2 block" data-testid="link-history">
              <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <History className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="font-semibold">Cronologia</h3>
              <p className="text-sm text-muted-foreground">
                Riprendi la tua lettura
              </p>
            </a>
          </Link>
        </Card>

        <Card className="p-6 hover-elevate">
          <div className="space-y-2">
            <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-chart-4" />
            </div>
            <h3 className="font-semibold">Biblioteca</h3>
            <p className="text-sm text-muted-foreground">
              Migliaia di testi arabi disponibili
            </p>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Letture Recenti</h2>
          <Button variant="ghost" size="sm" asChild data-testid="button-view-all-history">
            <Link href="/history">
              <a>Vedi tutto</a>
            </Link>
          </Button>
        </div>
        {historyLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : recentHistory && recentHistory.length > 0 ? (
          <div className="space-y-3">
            {recentHistory.slice(0, 3).map((item) => (
              <Card key={item.id} className="p-4 hover-elevate" data-testid={`card-history-${item.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium line-clamp-1">Testo #{item.textId}</h4>
                    <p className="text-sm text-muted-foreground">
                      Progresso: {item.progress}%
                    </p>
                  </div>
                  <Button size="sm" asChild data-testid={`button-continue-${item.textId}`}>
                    <Link href={`/text/${item.textId}`}>
                      <a>Continua</a>
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessuna lettura recente</p>
            <Button className="mt-4" asChild data-testid="button-start-reading">
              <Link href="/search">
                <a>Inizia a leggere</a>
              </Link>
            </Button>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Segnalibri Recenti</h2>
          <Button variant="ghost" size="sm" asChild data-testid="button-view-all-bookmarks">
            <Link href="/bookmarks">
              <a>Vedi tutto</a>
            </Link>
          </Button>
        </div>
        {bookmarksLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : recentBookmarks && recentBookmarks.length > 0 ? (
          <div className="space-y-3">
            {recentBookmarks.slice(0, 3).map((bookmark) => (
              <Card key={bookmark.id} className="p-4 hover-elevate" data-testid={`card-bookmark-${bookmark.id}`}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-medium">Testo #{bookmark.textId}</h4>
                    <Button size="sm" variant="outline" asChild data-testid={`button-goto-bookmark-${bookmark.id}`}>
                      <Link href={`/text/${bookmark.textId}`}>
                        <a>Vai</a>
                      </Link>
                    </Button>
                  </div>
                  {bookmark.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 font-serif">
                      {bookmark.excerpt}
                    </p>
                  )}
                  {bookmark.note && (
                    <p className="text-sm italic">{bookmark.note}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessun segnalibro salvato</p>
            <Button className="mt-4" asChild data-testid="button-add-bookmark">
              <Link href="/search">
                <a>Esplora i testi</a>
              </Link>
            </Button>
          </Card>
        )}
      </section>
    </div>
  );
}
