import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { StorageProvider } from "@/lib/storage";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/home";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </StorageProvider>
    </QueryClientProvider>
  );
}

export default App;