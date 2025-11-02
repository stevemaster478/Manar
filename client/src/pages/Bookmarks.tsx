import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bookmark, Trash2 } from "lucide-react";
import { Link } from "wouter";
import type { Bookmark as BookmarkType } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Bookmarks() {
  const { toast } = useToast();

  const { data: bookmarks, isLoading } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      return await apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Segnalibro eliminato",
        description: "Il segnalibro è stato rimosso con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">I Tuoi Segnalibri</h1>
        <p className="text-muted-foreground">
          Tutti i passaggi che hai salvato per riferimento futuro
        </p>
      </section>

      {bookmarks && bookmarks.length > 0 ? (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => (
            <Card
              key={bookmark.id}
              className="p-6 space-y-4 hover-elevate"
              data-testid={`card-bookmark-${bookmark.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Testo #{bookmark.textId}</h3>
                  </div>

                  {bookmark.excerpt && (
                    <div className="p-4 bg-muted/50 rounded-md">
                      <p
                        className="font-serif leading-relaxed"
                        dir="rtl"
                        data-testid={`text-excerpt-${bookmark.id}`}
                      >
                        {bookmark.excerpt}
                      </p>
                    </div>
                  )}

                  {bookmark.note && (
                    <div className="pl-4 border-l-2 border-primary/30">
                      <p className="text-sm italic text-muted-foreground" data-testid={`text-note-${bookmark.id}`}>
                        {bookmark.note}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Salvato il {new Date(bookmark.createdAt!).toLocaleDateString("it-IT")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    asChild
                    data-testid={`button-goto-${bookmark.id}`}
                  >
                    <Link href={`/text/${bookmark.textId}`}>
                      <a>Vai al testo</a>
                    </Link>
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-delete-${bookmark.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Elimina segnalibro</AlertDialogTitle>
                        <AlertDialogDescription>
                          Sei sicuro di voler eliminare questo segnalibro? Questa azione non può essere annullata.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(bookmark.id)}
                          data-testid="button-confirm-delete"
                        >
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Nessun segnalibro</h3>
          <p className="text-muted-foreground mb-4">
            Inizia a salvare i tuoi passaggi preferiti durante la lettura
          </p>
          <Button asChild data-testid="button-start-reading">
            <Link href="/search">
              <a>Esplora i testi</a>
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
