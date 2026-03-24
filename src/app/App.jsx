import { useRoutes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import CssBaseline from "@mui/material/CssBaseline";
import { MatxTheme } from "./components";
import SettingsProvider from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/JWTAuthContext";
import routes from "./routes";
import SnackbarCloseButton from "./components/SnackbarCloseButton";

export default function App() {
  const content = useRoutes(routes);
  const queryClient = new QueryClient();


  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        action={(key) => <SnackbarCloseButton snackbarKey={key} />}
      >
        <SettingsProvider>
          <AuthProvider>
            <MatxTheme>
              <CssBaseline />
              {content}
            </MatxTheme>
          </AuthProvider>
        </SettingsProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}
