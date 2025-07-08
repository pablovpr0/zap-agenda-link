
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePublicBookingUrl } from '@/lib/domainConfig';

interface SlugPreviewProps {
  slug: string;
}

const SlugPreview = ({ slug }: SlugPreviewProps) => {
  const { toast } = useToast();
  const previewUrl = generatePublicBookingUrl(slug);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      toast({
        title: "Link copiado!",
        description: "A URL foi copiada para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a URL.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-gray-50 p-3 rounded-md border">
      <Label className="text-sm font-medium text-gray-700 mb-2 block">
        Preview da URL:
      </Label>
      <div className="flex items-center gap-2">
        <code className="bg-white px-2 py-1 rounded border text-sm flex-1 text-gray-800 break-all">
          {previewUrl}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyUrl}
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(previewUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SlugPreview;
