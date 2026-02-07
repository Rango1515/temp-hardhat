import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  ShieldX,
  ServerCrash,
  SearchX,
  WifiOff,
  Lock,
  AlertTriangle,
  Home,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorConfig {
  code: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  suggestion: string;
  showRetry?: boolean;
}

const ERROR_CONFIGS: Record<number, ErrorConfig> = {
  400: {
    code: 400,
    title: "Bad Request",
    description: "The server couldn't understand your request. Please check and try again.",
    icon: <AlertTriangle className="w-10 h-10" />,
    suggestion: "Check the URL or form data and try again.",
  },
  401: {
    code: 401,
    title: "Unauthorized",
    description: "You need to log in to access this page.",
    icon: <Lock className="w-10 h-10" />,
    suggestion: "Please log in with your credentials to continue.",
  },
  403: {
    code: 403,
    title: "Access Denied",
    description: "You don't have permission to view this page.",
    icon: <ShieldX className="w-10 h-10" />,
    suggestion: "Contact an administrator if you believe this is an error.",
  },
  404: {
    code: 404,
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or has been moved.",
    icon: <SearchX className="w-10 h-10" />,
    suggestion: "Check the URL or navigate back to a known page.",
  },
  408: {
    code: 408,
    title: "Request Timeout",
    description: "The server took too long to respond.",
    icon: <WifiOff className="w-10 h-10" />,
    suggestion: "Check your connection and try again.",
    showRetry: true,
  },
  500: {
    code: 500,
    title: "Server Error",
    description: "Something went wrong on our end. We're working to fix it.",
    icon: <ServerCrash className="w-10 h-10" />,
    suggestion: "Try again in a few moments.",
    showRetry: true,
  },
  502: {
    code: 502,
    title: "Bad Gateway",
    description: "The server received an invalid response from an upstream server.",
    icon: <ServerCrash className="w-10 h-10" />,
    suggestion: "This is usually temporary. Try again shortly.",
    showRetry: true,
  },
  503: {
    code: 503,
    title: "Service Unavailable",
    description: "The server is temporarily overloaded or under maintenance.",
    icon: <ServerCrash className="w-10 h-10" />,
    suggestion: "Please wait a moment and try again.",
    showRetry: true,
  },
};

const DEFAULT_CONFIG: ErrorConfig = {
  code: 0,
  title: "Unknown Error",
  description: "An unexpected error occurred.",
  icon: <AlertTriangle className="w-10 h-10" />,
  suggestion: "Try going back or returning to the home page.",
};

interface ErrorPageProps {
  code?: number;
}

export default function ErrorPage({ code }: ErrorPageProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Allow passing code via route state
  const errorCode = code || (location.state as any)?.code || 404;
  const config = ERROR_CONFIGS[errorCode] || { ...DEFAULT_CONFIG, code: errorCode };

  useEffect(() => {
    console.error(`[ErrorPage] ${config.code} Error at:`, location.pathname);
  }, [config.code, location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Error code */}
        <div className="space-y-4">
          <div className="text-8xl font-black text-muted-foreground/15 select-none leading-none">
            {config.code}
          </div>

          <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
            {config.icon}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>

        {/* Suggestion */}
        <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border">
          <p className="text-sm text-muted-foreground">{config.suggestion}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {config.showRetry && (
            <Button onClick={() => window.location.reload()} variant="default">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          )}
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
          <Button onClick={() => navigate("/")} variant="outline">
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
        </div>

        {/* Path info */}
        <p className="text-xs text-muted-foreground/50">
          Path: <code className="bg-muted/50 px-1.5 py-0.5 rounded text-xs">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
}
