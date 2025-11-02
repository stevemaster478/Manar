import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Languages, Bookmark, History, Zap, Moon } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Salafiyyūn</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Accedi</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-12">
        <section className="text-center py-16 space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
            Scopri i Testi Arabi
            <br />
            <span className="text-primary">con Traduzioni AI</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Accedi alla biblioteca Shamela con ricerca avanzata, lettura ottimizzata
            e traduzioni contestuali in italiano tramite intelligenza artificiale.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login">Inizia Ora</a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
              <a href="#features">Scopri di più</a>
            </Button>
          </div>
        </section>

        <section id="features" className="py-16 space-y-12">
          <h3 className="text-3xl font-bold text-center">Funzionalità Principali</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold">Ricerca Avanzata</h4>
              <p className="text-muted-foreground">
                Cerca tra migliaia di testi arabi con filtri per autore, argomento ed epoca.
                Risultati istantanei e accurati.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Languages className="h-6 w-6 text-chart-2" />
              </div>
              <h4 className="text-xl font-semibold">Traduzioni AI</h4>
              <p className="text-muted-foreground">
                Traduci passaggi specifici dall'arabo all'italiano con Google Gemini.
                Sistema di caching per prestazioni ottimali.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <Bookmark className="h-6 w-6 text-chart-3" />
              </div>
              <h4 className="text-xl font-semibold">Segnalibri</h4>
              <p className="text-muted-foreground">
                Salva i tuoi passaggi preferiti con note personali. Accedi rapidamente
                ai contenuti importanti.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
                <History className="h-6 w-6 text-chart-4" />
              </div>
              <h4 className="text-xl font-semibold">Cronologia</h4>
              <p className="text-muted-foreground">
                Tieni traccia della tua lettura e riprendi da dove hai lasciato.
                Monitora i progressi nel tempo.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-xl font-semibold">Performance</h4>
              <p className="text-muted-foreground">
                Caricamento veloce, caching intelligente e interfaccia responsive
                ottimizzata per mobile e desktop.
              </p>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate">
              <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Moon className="h-6 w-6 text-chart-2" />
              </div>
              <h4 className="text-xl font-semibold">Modalità Scura</h4>
              <p className="text-muted-foreground">
                Riduci l'affaticamento degli occhi con la modalità scura ottimizzata.
                Testo regolabile per massima leggibilità.
              </p>
            </Card>
          </div>
        </section>

        <section className="py-16 text-center space-y-6 bg-muted/30 rounded-lg p-12 mt-16">
          <h3 className="text-3xl font-bold">Pronto per iniziare?</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Accedi gratuitamente e inizia a esplorare la biblioteca Shamela con
            traduzioni AI contestuali.
          </p>
          <Button size="lg" asChild data-testid="button-cta-login">
            <a href="/api/login">Accedi con Replit</a>
          </Button>
        </section>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Salafiyyūn - Biblioteca Shamela con Traduzioni AI</p>
        </div>
      </footer>
    </div>
  );
}
