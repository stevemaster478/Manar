import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import TextReader from "@/pages/TextReader";
import Bookmarks from "@/pages/Bookmarks";
import History from "@/pages/History";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/">
            <AppLayout>
              <Home />
            </AppLayout>
          </Route>
          <Route path="/search">
            <AppLayout>
              <Search />
            </AppLayout>
          </Route>
          <Route path="/text/:id">
            <AppLayout>
              <TextReader />
            </AppLayout>
          </Route>
          <Route path="/bookmarks">
            <AppLayout>
              <Bookmarks />
            </AppLayout>
          </Route>
          <Route path="/history">
            <AppLayout>
              <History />
            </AppLayout>
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
