
import { Button } from '@/components/ui/button';
import { Link, Loader2 } from 'lucide-react';

interface SlugUpdateButtonProps {
  canUpdate: boolean;
  isUpdating: boolean;
  onUpdate: () => void;
}

const SlugUpdateButton = ({ canUpdate, isUpdating, onUpdate }: SlugUpdateButtonProps) => {
  return (
    <Button 
      onClick={onUpdate}
      disabled={!canUpdate || isUpdating}
      className="w-full"
    >
      {isUpdating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Atualizando...
        </>
      ) : (
        <>
          <Link className="w-4 h-4 mr-2" />
          Atualizar Link Personalizado
        </>
      )}
    </Button>
  );
};

export default SlugUpdateButton;
