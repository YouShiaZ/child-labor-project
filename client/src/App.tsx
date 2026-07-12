import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import Beneficiaries from "./pages/Beneficiaries";
import NewBeneficiary from "./pages/NewBeneficiary";
import BeneficiaryDetail from "./pages/BeneficiaryDetail";
import Users from "./pages/Users";

// This system manages a SINGLE project (Child Labor Project).
// Legacy /projects* URLs redirect to the single project record.
function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={Login} />

      <Route path="/dashboard">
        <RequireAuth><Dashboard /></RequireAuth>
      </Route>

      <Route path="/project/new-beneficiary">
        <RequireAuth roles={["admin", "editor"]}><NewBeneficiary /></RequireAuth>
      </Route>
      <Route path="/project">
        <RequireAuth><ProjectDetail /></RequireAuth>
      </Route>

      {/* Legacy redirects */}
      <Route path="/projects" component={() => <Redirect to="/project" />} />
      <Route path="/projects/:id/new-beneficiary" component={() => <Redirect to="/project/new-beneficiary" />} />
      <Route path="/projects/:id" component={() => <Redirect to="/project" />} />

      <Route path="/beneficiaries">
        <RequireAuth><Beneficiaries /></RequireAuth>
      </Route>
      <Route path="/beneficiaries/:id">
        <RequireAuth><BeneficiaryDetail /></RequireAuth>
      </Route>

      <Route path="/users">
        <RequireAuth roles={["admin"]}><Users /></RequireAuth>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
