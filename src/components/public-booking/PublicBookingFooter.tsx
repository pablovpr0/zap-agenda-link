
import { Button } from '@/components/ui/button';
import { CompanySettings } from '@/types/publicBooking';

interface PublicBookingFooterProps {
  companySettings?: CompanySettings;
}

const PublicBookingFooter = ({ companySettings }: PublicBookingFooterProps) => {
  return (
    <>
      {/* Links sociais */}
      {companySettings?.instagram_url && (
        <div className="text-center mt-8">
          <Button variant="outline" asChild className="border-green-200 text-green-600 hover:bg-green-50 rounded-xl px-6 py-3">
            <a 
              href={companySettings.instagram_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              📱 Siga no Instagram
            </a>
          </Button>
        </div>
      )}

      <div className="text-center mt-8 text-sm text-gray-400">
        Powered by ZapAgenda
      </div>
    </>
  );
};

export default PublicBookingFooter;
