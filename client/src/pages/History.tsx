import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { History as HistoryIcon, BookOpen } from "lucide-react";
import { Link } from "wouter";
import type { ReadingHistory } from "@shared/schema";

export default function History() {
  const { data: history, isLoading } = useQuery<ReadingHistory[]>({
    queryKey: ["/api/reading-history"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cronologia di Lettura</h1>
        <p className="text-muted-foreground">
          Tieni traccia dei tuoi progressi e riprendi da dove hai lasciato
        </p>
      </section>

      {history && history.length > 0 ? (
        <div className="space-y-3">
          {history.map((item) => (
            <Card
              key={item.id}
              className="p-6 space-y-4 hover-elevate"
              data-testid={`card-history-${item.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Testo #{item.textId}</h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium" data-testid={`text-progress-${item.id}`}>
                        {item.progress}%
                      </span>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>

                  {item.lastPageNumber && (
                    <p className="text-sm text-muted-foreground">
                      Ultima pagina letta: {item.lastPageNumber}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Ultima lettura: {new Date(item.lastReadAt!).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <Button
                  asChild
                  data-testid={`button-continue-${item.id}`}
                >
                  <Link href={`/text/${item.textId}`}>
                    <a className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Continua
                    </a>
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Nessuna cronologia</h3>
          <p className="text-muted-foreground mb-4">
            La tua cronologia di lettura apparirà qui quando inizi a leggere
          </p>
          <Button asChild data-testid="button-start-reading">
            <Link href="/search">
              <a>Inizia a leggere</a>
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
