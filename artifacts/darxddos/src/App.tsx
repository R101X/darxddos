import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import IpLookup from "@/pages/IpLookup";
import DnsLookup from "@/pages/DnsLookup";
import Whois from "@/pages/Whois";
import Ping from "@/pages/Ping";
import WebsiteStatus from "@/pages/WebsiteStatus";
import HttpHeaders from "@/pages/HttpHeaders";
import ApiTester from "@/pages/ApiTester";
import PortScanner from "@/pages/PortScanner";
import LoadTest from "@/pages/LoadTest";
import DdosSimulator from "@/pages/DdosSimulator";
import NetworkMonitor from "@/pages/NetworkMonitor";
import LiveLogs from "@/pages/LiveLogs";
import History from "@/pages/History";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#080808" }}
      >
        <div
          style={{
            color: "#ff4444",
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 14,
            letterSpacing: "0.2em",
          }}
        >
          INITIALIZING...
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/ip-lookup" component={IpLookup} />
        <Route path="/dns-lookup" component={DnsLookup} />
        <Route path="/whois" component={Whois} />
        <Route path="/ping" component={Ping} />
        <Route path="/website-status" component={WebsiteStatus} />
        <Route path="/http-headers" component={HttpHeaders} />
        <Route path="/api-tester" component={ApiTester} />
        <Route path="/port-scanner" component={PortScanner} />
        <Route path="/load-test" component={LoadTest} />
        <Route path="/ddos-simulator" component={DdosSimulator} />
        <Route path="/network-monitor" component={NetworkMonitor} />
        <Route path="/live-logs" component={LiveLogs} />
        <Route path="/history" component={History} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
