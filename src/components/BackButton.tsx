
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  text?: string;
  className?: string;
}

const BackButton = ({ onClick, text = "Voltar", className = "" }: BackButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {text}
    </Button>
  );
};

export default BackButton;
