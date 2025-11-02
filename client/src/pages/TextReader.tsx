import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ZoomIn,
  ZoomOut,
  Bookmark,
  ArrowLeft,
  Languages,
  Loader2,
  ChevronRight,
  ChevronLeft,
  List,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Text, Translation } from "@shared/schema";

type TextSize = "small" | "medium" | "large" | "extra-large";

const TEXT_SIZE_CLASSES: Record<TextSize, string> = {
  small: "text-base md:text-lg",
  medium: "text-lg md:text-xl",
  large: "text-xl md:text-2xl",
  "extra-large": "text-2xl md:text-3xl",
};

export default function TextReader() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [textSize, setTextSize] = useState<TextSize>(
    (user?.textSize as TextSize) || "medium"
  );
  const [selectedText, setSelectedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [isTranslatingPage, setIsTranslatingPage] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  const { data: text, isLoading, refetch } = useQuery<Text>({
    queryKey: ["/api/texts", id, "fromShamela"],
    queryFn: async (): Promise<Text> => {
      // Se il testo proviene da Shamela (verificato dal metadata), forziamo il refresh
      const url = `/api/texts/${id}?fromShamela=true`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch text');
      }
      return response.json() as Promise<Text>;
    },
    enabled: !!id,
  });

  const chapters = text?.metadata && typeof text.metadata === 'object' && 'chapters' in text.metadata 
    ? (text.metadata.chapters as Array<{ id: number; title: string; page?: number }>)
    : undefined;

  const translateMutation = useMutation<Translation, Error, { textToTranslate: string; isFullPage?: boolean }>({
    mutationFn: async ({ textToTranslate, isFullPage = false }) => {
      const result = await apiRequest("POST", "/api/translate", {
        textId: id,
        originalText: textToTranslate,
        isFullPage,
      });
      return result as Promise<Translation>;
    },
    onSuccess: (data: Translation) => {
      setTranslatedText(data.translatedText);
      setShowTranslation(true);
      setIsTranslatingPage(false);
      toast({
        title: "Traduzione completata",
        description: "Il testo è stato tradotto con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore nella traduzione",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/bookmarks", {
        textId: id,
        excerpt: selectedText.substring(0, 300),
        note: bookmarkNote,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setShowBookmarkDialog(false);
      setBookmarkNote("");
      toast({
        title: "Segnalibro salvato",
        description: "Il segnalibro è stato aggiunto con successo",
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

  const handleTextSelection = (e: React.MouseEvent) => {
    // Aspetta che la selezione sia completa
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const text = selection.toString().trim();
        if (text && text.length > 0) {
          setSelectedText(text);
          // Mostra feedback visivo (opzionale)
          const range = selection.getRangeAt(0);
          // Reset translation view when new text is selected
          if (text !== selectedText) {
            setShowTranslation(false);
            setTranslatedText("");
          }
        }
      }
    }, 0);
  };

  const handleTranslate = () => {
    if (selectedText) {
      translateMutation.mutate({ textToTranslate: selectedText, isFullPage: false });
    } else {
      toast({
        title: "Seleziona del testo",
        description: "Seleziona un passaggio da tradurre",
        variant: "destructive",
      });
    }
  };

  const handleTranslatePage = () => {
    if (text?.content) {
      setIsTranslatingPage(true);
      translateMutation.mutate({ textToTranslate: text.content, isFullPage: true });
    }
  };

  const handleBookmark = () => {
    if (selectedText) {
      setShowBookmarkDialog(true);
    } else {
      toast({
        title: "Seleziona del testo",
        description: "Seleziona un passaggio da salvare",
        variant: "destructive",
      });
    }
  };

  const increaseFontSize = () => {
    const sizes: TextSize[] = ["small", "medium", "large", "extra-large"];
    const currentIndex = sizes.indexOf(textSize);
    if (currentIndex < sizes.length - 1) {
      setTextSize(sizes[currentIndex + 1]);
    }
  };

  const decreaseFontSize = () => {
    const sizes: TextSize[] = ["small", "medium", "large", "extra-large"];
    const currentIndex = sizes.indexOf(textSize);
    if (currentIndex > 0) {
      setTextSize(sizes[currentIndex - 1]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card className="p-8 space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </Card>
      </div>
    );
  }

  if (!text) {
    return (
      <Card className="p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Testo non trovato</h2>
        <p className="text-muted-foreground mb-4">
          Il testo richiesto non esiste o non è disponibile
        </p>
        <Button asChild data-testid="button-back-to-search">
          <Link href="/search">
            <a>Torna alla ricerca</a>
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/search">
            <a>
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-serif">{text.title}</h1>
          {text.author && (
            <p className="text-muted-foreground">di {text.author}</p>
          )}
        </div>
      </div>

      <Card className="p-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={decreaseFontSize}
            disabled={textSize === "small"}
            data-testid="button-decrease-font"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={increaseFontSize}
            disabled={textSize === "extra-large"}
            data-testid="button-increase-font"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1" />

        {/* Navigazione capitoli se disponibile */}
        {chapters && chapters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChapters(!showChapters)}
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Capitoli ({chapters.length})
          </Button>
        )}

        <Button
          variant="default"
          onClick={handleTranslate}
          disabled={!selectedText || translateMutation.isPending}
          data-testid="button-translate"
          className="gap-2"
        >
          {translateMutation.isPending && !isTranslatingPage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Traduzione...
            </>
          ) : (
            <>
              <Languages className="h-4 w-4" />
              Traduci selezione
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleTranslatePage}
          disabled={translateMutation.isPending || !text?.content}
          data-testid="button-translate-page"
          className="gap-2"
        >
          {translateMutation.isPending && isTranslatingPage ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Traduzione pagina...
            </>
          ) : (
            <>
              <Languages className="h-4 w-4" />
              Traduci pagina
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleBookmark}
          disabled={!selectedText}
          data-testid="button-add-bookmark"
          className="gap-2"
        >
          <Bookmark className="h-4 w-4" />
          Segnalibro
        </Button>
      </Card>

      {/* Introduzione se disponibile */}
      {text.introduction && (
        <Card className="p-6 mb-6 bg-muted/30 border-muted">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Introduzione
            </h3>
          </div>
          <div
            className="text-sm leading-relaxed font-serif"
            dir="rtl"
            lang="ar"
            style={{
              fontFamily: '"Noto Sans Arabic", "Arial Unicode MS", "Tahoma", sans-serif',
              lineHeight: "2",
            }}
          >
            {text.introduction.split('\n').map((paragraph, idx) => (
              paragraph.trim() ? (
                <p key={idx} className="mb-3 last:mb-0">
                  {paragraph}
                </p>
              ) : null
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-8 md:p-12 bg-gradient-to-b from-background to-muted/20">
          <div className="mb-4 pb-3 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Testo Arabo</h3>
            {selectedText && (
              <span className="text-xs text-muted-foreground">
                {selectedText.length} caratteri selezionati
              </span>
            )}
          </div>
          <div
            className={`font-serif leading-relaxed ${TEXT_SIZE_CLASSES[textSize]} select-text text-justify`}
            dir="rtl"
            lang="ar"
            style={{
              fontFamily: '"Noto Sans Arabic", "Arial Unicode MS", "Tahoma", sans-serif',
              lineHeight: "2.5",
              letterSpacing: "0.05em",
              userSelect: "text",
              WebkitUserSelect: "text",
              MozUserSelect: "text",
              msUserSelect: "text",
            }}
            onMouseUp={handleTextSelection}
            onSelect={() => {
              setTimeout(() => {
                const selection = window.getSelection();
                if (selection) {
                  const text = selection.toString().trim();
                  if (text && text.length > 0) {
                    setSelectedText(text);
                    if (text !== selectedText) {
                      setShowTranslation(false);
                      setTranslatedText("");
                    }
                  }
                }
              }, 0);
            }}
            data-testid="text-content"
          >
            {text.content.split('\n').map((paragraph, idx) => (
              paragraph.trim() ? (
                <p key={idx} className="mb-4 last:mb-0" style={{ marginBottom: "1.5rem" }}>
                  {paragraph}
                </p>
              ) : null
            ))}
          </div>
        </Card>

        {showTranslation && translatedText && (
          <Card className="p-8 md:p-12 bg-primary/5 border-primary/20">
            <div className="mb-4 pb-3 border-b border-primary/20">
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Traduzione Italiana</h3>
              </div>
            </div>
            <div
              className={`${TEXT_SIZE_CLASSES[textSize]} leading-relaxed text-justify`}
              dir="ltr"
              lang="it"
              style={{
                lineHeight: "2",
              }}
              data-testid="text-translation"
            >
              {translatedText.split('\n').map((paragraph, idx) => (
                paragraph.trim() ? (
                  <p key={idx} className="mb-4 last:mb-0" style={{ marginBottom: "1.5rem" }}>
                    {paragraph}
                  </p>
                ) : null
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Dialog capitoli */}
      {chapters && chapters.length > 0 && (
        <Dialog open={showChapters} onOpenChange={setShowChapters}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Naviga tra i Capitoli</DialogTitle>
              <DialogDescription>
                Seleziona un capitolo per navigare direttamente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <Button
                  key={chapter.id}
                  variant="ghost"
                  className="w-full justify-start text-left font-serif"
                  dir="rtl"
                  onClick={() => {
                    // TODO: Navigate to chapter (richiede implementazione backend)
                    setShowChapters(false);
                    toast({
                      title: "Navigazione capitoli",
                      description: "Funzionalità in fase di sviluppo",
                    });
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {chapter.title}
                  {chapter.page && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Pagina {chapter.page}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showBookmarkDialog} onOpenChange={setShowBookmarkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Segnalibro</DialogTitle>
            <DialogDescription>
              Salva questo passaggio con una nota personale (facoltativa)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-serif line-clamp-3" dir="rtl">
                {selectedText}
              </p>
            </div>
            <Textarea
              placeholder="Aggiungi una nota (facoltativa)..."
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              data-testid="input-bookmark-note"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowBookmarkDialog(false)}
              data-testid="button-cancel-bookmark"
            >
              Annulla
            </Button>
            <Button
              onClick={() => bookmarkMutation.mutate()}
              disabled={bookmarkMutation.isPending}
              data-testid="button-save-bookmark"
            >
              {bookmarkMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
