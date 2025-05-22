import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function QuickActions() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const { toast } = useToast();

  const handleRunFullExport = async () => {
    setIsExtracting(true);
    try {
      // Get BC home path from configuration
      const configResponse = await fetch('/api/configurations/bc_home');
      if (!configResponse.ok) {
        throw new Error('BC home path not configured. Please set it in Configuration.');
      }
      
      const { value } = await configResponse.json();
      
      // Start extraction
      const response = await apiRequest('POST', '/api/extract', {
        method: 'cli',
        bcHome: value.path
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Extraction Started',
          description: `Extraction ID: ${result.extractionId}`,
        });
      } else {
        throw new Error('Failed to start extraction');
      }
    } catch (error) {
      toast({
        title: 'Extraction Failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSyncDeltaChanges = async () => {
    setIsTransforming(true);
    try {
      // Get BC home path and credentials from configuration
      const configResponse = await fetch('/api/configurations/bc_credentials');
      if (!configResponse.ok) {
        throw new Error('BC credentials not configured. Please set them in Configuration.');
      }
      
      const { value } = await configResponse.json();
      
      // Start REST extraction for delta changes
      const response = await apiRequest('POST', '/api/extract', {
        method: 'rest',
        bcHome: value.bcHome,
        credentials: {
          username: value.username,
          password: value.password
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Delta Sync Started',
          description: `Extraction ID: ${result.extractionId}`,
        });
      } else {
        throw new Error('Failed to start delta sync');
      }
    } catch (error) {
      toast({
        title: 'Delta Sync Failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsTransforming(false);
    }
  };

  const handlePushToApm = async () => {
    setIsPushing(true);
    try {
      // Get APM credentials from configuration
      const configResponse = await fetch('/api/configurations/apm_credentials');
      if (!configResponse.ok) {
        throw new Error('APM credentials not configured. Please set them in Configuration.');
      }
      
      const { value } = await configResponse.json();
      
      // Start migration of pending artifacts
      const response = await apiRequest('POST', '/api/migrate', {
        apmCredentials: {
          clientId: value.clientId,
          clientSecret: value.clientSecret
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Migration Completed',
          description: `Successfully processed ${result.results.filter((r: any) => r.success).length} artifacts`,
        });
      } else {
        throw new Error('Failed to push to APM');
      }
    } catch (error) {
      toast({
        title: 'Push to APM Failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            className="flex items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRunFullExport}
            disabled={isExtracting}
          >
            <span className="material-icons text-primary mr-3">
              {isExtracting ? "hourglass_empty" : "download"}
            </span>
            <span className="text-neutral-700 font-medium">
              {isExtracting ? "Running Export..." : "Run Full Export"}
            </span>
          </button>
          <button
            className="flex items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSyncDeltaChanges}
            disabled={isTransforming}
          >
            <span className="material-icons text-primary mr-3">
              {isTransforming ? "hourglass_empty" : "find_replace"}
            </span>
            <span className="text-neutral-700 font-medium">
              {isTransforming ? "Syncing Changes..." : "Sync Delta Changes"}
            </span>
          </button>
          <button
            className="flex items-center p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePushToApm}
            disabled={isPushing}
          >
            <span className="material-icons text-primary mr-3">
              {isPushing ? "hourglass_empty" : "publish"}
            </span>
            <span className="text-neutral-700 font-medium">
              {isPushing ? "Pushing to APM..." : "Push to APM"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
