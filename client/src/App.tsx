import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Extract from "@/pages/Extract";
import Transform from "@/pages/Transform";
import Review from "@/pages/Review";
import Deploy from "@/pages/Deploy";
import History from "@/pages/History";
import Configuration from "@/pages/Configuration";
import Help from "@/pages/Help";

function Router() {
  const [location] = useLocation();

  return (
    <Layout currentPath={location}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/extract" component={Extract} />
        <Route path="/transform" component={Transform} />
        <Route path="/review" component={Review} />
        <Route path="/deploy" component={Deploy} />
        <Route path="/history" component={History} />
        <Route path="/configuration" component={Configuration} />
        <Route path="/help" component={Help} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
