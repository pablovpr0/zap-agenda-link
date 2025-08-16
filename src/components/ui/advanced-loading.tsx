import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedLoadingProps {
  isLoading: boolean;
  error?: string | null;
  isConnected?: boolean;
  onRetry?: () => void;
  loadingText?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
  size?: 'sm' | 'md' | 'lg';
}

const loadingVariants = {
  default: {
    container: "flex flex-col items-center justify-center p-8 space-y-4",
    spinner: "w-8 h-8",
    text: "text-base"
  },
  minimal: {
    container: "flex items-center justify-center p-4 space-x-2",
    spinner: "w-5 h-5",
    text: "text-sm"
  },
  card: {
    container: "flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border space-y-6",
    spinner: "w-10 h-10",
    text: "text-lg"
  }
};

const sizeVariants = {
  sm: { spinner: "w-4 h-4", text: "text-xs" },
  md: { spinner: "w-6 h-6", text: "text-sm" },
  lg: { spinner: "w-8 h-8", text: "text-base" }
};

export const AdvancedLoading: React.FC<AdvancedLoadingProps> = ({
  isLoading,
  error,
  isConnected = true,
  onRetry,
  loadingText = "Carregando...",
  className,
  variant = 'default',
  size = 'md'
}) => {
  const variantStyles = loadingVariants[variant];
  const sizeStyles = sizeVariants[size];

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={cn(variantStyles.container, className)}
        >
          {/* Spinner Animado */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={cn(sizeStyles.spinner, "text-blue-500")}
          >
            <Loader2 className="w-full h-full" />
          </motion.div>

          {/* Texto de Loading */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(sizeStyles.text, "text-gray-600 font-medium")}
          >
            {loadingText}
          </motion.p>

          {/* Indicador de Conexão */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-2"
          >
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs text-gray-500">
              {isConnected ? 'Conectado' : 'Sem conexão'}
            </span>
          </motion.div>

          {/* Barra de Progresso Animada */}
          <div className="w-full max-w-xs bg-gray-200 rounded-full h-1 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className={cn(variantStyles.container, className)}
        >
          {/* Ícone de Erro */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center"
          >
            <WifiOff className="w-6 h-6 text-red-500" />
          </motion.div>

          {/* Mensagem de Erro */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center space-y-2"
          >
            <p className="text-red-600 font-medium">Erro ao carregar</p>
            <p className="text-sm text-gray-500">{error}</p>
          </motion.div>

          {/* Botão de Retry */}
          {onRetry && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar novamente</span>
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para controle de loading states
export const useAdvancedLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isConnected, setIsConnected] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    isConnected,
    startLoading,
    stopLoading,
    setLoadingError,
    reset
  };
};

export default AdvancedLoading;