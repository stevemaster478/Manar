import { useState } from "react";
import { useParams, Link } from "wouter";
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
  const { toast } = useToast();
  const { user } = useAuth();
  const [textSize, setTextSize] = useState<TextSize>(
    (user?.textSize as TextSize) || "medium"
  );
  const [selectedText, setSelectedText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState("");

  const { data: text, isLoading } = useQuery<Text>({
    queryKey: ["/api/texts", id],
    enabled: !!id,
  });

  const translateMutation = useMutation({
    mutationFn: async (textToTranslate: string) => {
      return await apiRequest("POST", "/api/translate", {
        textId: id,
        originalText: textToTranslate,
      });
    },
    onSuccess: (data: Translation) => {
      setSelectedText(data.translatedText);
      setShowTranslation(true);
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

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0) {
      setSelectedText(text);
    }
  };

  const handleTranslate = () => {
    if (selectedText) {
      translateMutation.mutate(selectedText);
    } else {
      toast({
        title: "Seleziona del testo",
        description: "Seleziona un passaggio da tradurre",
        variant: "destructive",
      });
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

        <Button
          variant="default"
          onClick={handleTranslate}
          disabled={!selectedText || translateMutation.isPending}
          data-testid="button-translate"
          className="gap-2"
        >
          {translateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Traduzione...
            </>
          ) : (
            <>
              <Languages className="h-4 w-4" />
              Traduci
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

      <Card className="p-8 md:p-12">
        <div
          className={`font-serif leading-loose ${TEXT_SIZE_CLASSES[textSize]} select-text`}
          dir="rtl"
          lang="ar"
          onMouseUp={handleTextSelection}
          data-testid="text-content"
        >
          {text.content}
        </div>
      </Card>

      {showTranslation && selectedText && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Traduzione</h3>
            </div>
            <p className="text-base leading-relaxed" data-testid="text-translation">
              {selectedText}
            </p>
          </div>
        </Card>
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
