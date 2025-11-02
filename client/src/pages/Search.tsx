import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search as SearchIcon, BookOpen, Filter } from "lucide-react";
import { Link } from "wouter";
import type { Text } from "@shared/schema";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [author, setAuthor] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [era, setEra] = useState<string>("");

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("q", searchQuery);
    if (author && author !== "all") params.append("author", author);
    if (category && category !== "all") params.append("category", category);
    if (era && era !== "all") params.append("era", era);
    return params.toString();
  };

  const hasFilters = searchQuery.length > 0 || (!!author && author !== "all") || (!!category && category !== "all") || (!!era && era !== "all");

  const { data: texts, isLoading } = useQuery<Text[]>({
    queryKey: ["/api/texts/search", searchQuery, author, category, era],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const url = `/api/texts/search${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch texts');
      }
      return response.json();
    },
    enabled: hasFilters,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cerca Testi</h1>
        <p className="text-muted-foreground">
          Esplora migliaia di testi arabi dalla biblioteca Shamela
        </p>
      </section>

      <Card className="p-6 space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca per titolo, contenuto o parole chiave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              data-testid="input-search"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Autore
              </label>
              <Select value={author} onValueChange={setAuthor}>
                <SelectTrigger data-testid="select-author">
                  <SelectValue placeholder="Tutti gli autori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli autori</SelectItem>
                  <SelectItem value="ibn_taymiyyah">Ibn Taymiyyah</SelectItem>
                  <SelectItem value="ibn_qayyim">Ibn al-Qayyim</SelectItem>
                  <SelectItem value="al_bukhari">Al-Bukhari</SelectItem>
                  <SelectItem value="muslim">Muslim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Categoria
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Tutte le categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  <SelectItem value="hadith">Hadith</SelectItem>
                  <SelectItem value="tafsir">Tafsir</SelectItem>
                  <SelectItem value="fiqh">Fiqh</SelectItem>
                  <SelectItem value="aqeedah">Aqeedah</SelectItem>
                  <SelectItem value="sirah">Sirah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Epoca
              </label>
              <Select value={era} onValueChange={setEra}>
                <SelectTrigger data-testid="select-era">
                  <SelectValue placeholder="Tutte le epoche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le epoche</SelectItem>
                  <SelectItem value="classical">Classica (fino al 1258)</SelectItem>
                  <SelectItem value="medieval">Medievale (1258-1517)</SelectItem>
                  <SelectItem value="ottoman">Ottomana (1517-1924)</SelectItem>
                  <SelectItem value="modern">Moderna (1924+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {((author && author !== "all") || (category && category !== "all") || (era && era !== "all")) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAuthor("all");
                setCategory("all");
                setEra("all");
              }}
              data-testid="button-clear-filters"
            >
              Cancella filtri
            </Button>
          )}
        </form>
      </Card>

      <section className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-9 w-24" />
              </Card>
            ))}
          </div>
        ) : texts && texts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {texts.map((text) => (
              <Card
                key={text.id}
                className="p-6 space-y-3 hover-elevate"
                data-testid={`card-text-${text.id}`}
              >
                <h3 className="font-semibold line-clamp-2 font-serif text-lg">
                  {text.title}
                </h3>
                {text.author && (
                  <p className="text-sm text-muted-foreground">
                    di {text.author}
                  </p>
                )}
                {text.category && (
                  <p className="text-xs text-muted-foreground">
                    {text.category} {text.era && `• ${text.era}`}
                  </p>
                )}
                <p className="text-sm line-clamp-3 font-serif" dir="rtl">
                  {text.content.substring(0, 150)}...
                </p>
                <Button asChild data-testid={`button-read-${text.id}`}>
                  <Link href={`/text/${text.id}`}>
                    <a className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Leggi
                    </a>
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        ) : searchQuery || author || category || era ? (
          <Card className="p-12 text-center">
            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Nessun risultato trovato</h3>
            <p className="text-muted-foreground">
              Prova a modificare i criteri di ricerca o i filtri
            </p>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Inizia la tua ricerca</h3>
            <p className="text-muted-foreground">
              Inserisci una parola chiave o seleziona dei filtri per iniziare
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
