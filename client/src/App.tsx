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
import Offices from "./pages/Offices";
import OfficeDetail from "./pages/OfficeDetail";
import Beneficiaries from "./pages/Beneficiaries";
import NewBeneficiary from "./pages/NewBeneficiary";
import BeneficiaryDetail from "./pages/BeneficiaryDetail";
import Analytics from "./pages/Analytics";
import Approvals from "./pages/Approvals";
import Users from "./pages/Users";

const EDITORS = ["super_admin", "office_admin", "editor"] as const;

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={Login} />

      <Route path="/dashboard">
        <RequireAuth><Dashboard /></RequireAuth>
      </Route>

      <Route path="/offices">
        <RequireAuth><Offices /></RequireAuth>
      </Route>
      <Route path="/offices/:officeId/new-beneficiary">
        <RequireAuth roles={[...EDITORS]}><NewBeneficiary /></RequireAuth>
      </Route>
      <Route path="/offices/:officeId">
        <RequireAuth><OfficeDetail /></RequireAuth>
      </Route>

      <Route path="/beneficiaries">
        <RequireAuth><Beneficiaries /></RequireAuth>
      </Route>
      <Route path="/beneficiaries/:id">
        <RequireAuth><BeneficiaryDetail /></RequireAuth>
      </Route>

      <Route path="/analytics">
        <RequireAuth><Analytics /></RequireAuth>
      </Route>

      <Route path="/approvals">
        <RequireAuth roles={["super_admin", "office_admin"]}><Approvals /></RequireAuth>
      </Route>

      <Route path="/users">
        <RequireAuth roles={["super_admin"]}><Users /></RequireAuth>
      </Route>

      {/* Legacy redirects */}
      <Route path="/project" component={() => <Redirect to="/offices" />} />
      <Route path="/project/new-beneficiary" component={() => <Redirect to="/offices" />} />
      <Route path="/projects" component={() => <Redirect to="/offices" />} />
      <Route path="/projects/:id" component={() => <Redirect to="/offices" />} />

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
