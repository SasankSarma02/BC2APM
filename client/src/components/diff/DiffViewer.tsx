import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type DiffViewerProps = {
  artifactId: number;
  artifactName: string;
  originalData: any;
  transformedData: any;
  onApprove?: () => void;
  onReject?: () => void;
};

const DiffLine = ({ type, content }: { type: 'added' | 'removed' | 'unchanged'; content: string }) => {
  let className = 'diff-line-unchanged';
  
  if (type === 'added') {
    className = 'diff-line-added';
  } else if (type === 'removed') {
    className = 'diff-line-removed';
  }
  
  return <code className={className}>{content}</code>;
};

export default function DiffViewer({ 
  artifactId, 
  artifactName, 
  originalData, 
  transformedData,
  onApprove,
  onReject
}: DiffViewerProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { toast } = useToast();
  
  // Generate diff lines by comparing original and transformed data
  const generateDiffContent = () => {
    if (!originalData || !transformedData) {
      return [{ type: 'unchanged' as const, content: 'No data to compare' }];
    }
    
    // Convert to JSON string with formatting
    const originalJson = JSON.stringify(originalData, null, 2);
    const transformedJson = JSON.stringify(transformedData, null, 2);
    
    // Split into lines
    const originalLines = originalJson.split('\n');
    const transformedLines = transformedJson.split('\n');
    
    // Simple line-by-line comparison
    // In a real implementation, you would use a proper diff algorithm
    const maxLines = Math.max(originalLines.length, transformedLines.length);
    const diffLines = [];
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const transformedLine = transformedLines[i] || '';
      
      if (originalLine === transformedLine) {
        diffLines.push({ type: 'unchanged' as const, content: transformedLine });
      } else {
        if (originalLine) {
          diffLines.push({ type: 'removed' as const, content: originalLine });
        }
        if (transformedLine) {
          diffLines.push({ type: 'added' as const, content: transformedLine });
        }
      }
    }
    
    return diffLines;
  };
  
  const diffContent = generateDiffContent();
  
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      // Get APM credentials from configuration
      const configResponse = await fetch('/api/configurations/apm_credentials');
      if (!configResponse.ok) {
        throw new Error('APM credentials not configured');
      }
      
      const { value } = await configResponse.json();
      
      // Migrate this artifact to APM
      const response = await apiRequest('POST', `/api/migrate/${artifactId}`, {
        apmCredentials: {
          clientId: value.clientId,
          clientSecret: value.clientSecret
        }
      });
      
      if (response.ok) {
        toast({
          title: 'Artifact Approved',
          description: 'Successfully migrated to APM',
        });
        
        if (onApprove) {
          onApprove();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve artifact');
      }
    } catch (error) {
      toast({
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async () => {
    setIsRejecting(true);
    try {
      // Mark this artifact as needing review again
      const response = await apiRequest('PATCH', `/api/artifacts/${artifactId}`, {
        status: 'new',
        transformedData: null
      });
      
      if (response.ok) {
        toast({
          title: 'Artifact Rejected',
          description: 'Marked for re-transformation',
        });
        
        if (onReject) {
          onReject();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject artifact');
      }
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-neutral-900">Diff Viewer - {artifactName}</h3>
          <div className="flex space-x-2">
            <button 
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleApprove}
              disabled={isApproving || isRejecting}
            >
              <span className="material-icons text-sm mr-1">
                {isApproving ? "hourglass_empty" : "check"}
              </span> 
              {isApproving ? "Approving..." : "Approve"}
            </button>
            <button 
              className="inline-flex items-center px-3 py-1.5 border border-neutral-300 text-sm font-medium rounded shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleReject}
              disabled={isApproving || isRejecting}
            >
              <span className="material-icons text-sm mr-1">
                {isRejecting ? "hourglass_empty" : "close"}
              </span> 
              {isRejecting ? "Rejecting..." : "Reject"}
            </button>
          </div>
        </div>
        
        <div className="flex space-x-6 mb-4">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-success rounded-full mr-2"></span>
            <span className="text-sm text-neutral-700">Added</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-error rounded-full mr-2"></span>
            <span className="text-sm text-neutral-700">Removed</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-neutral-300 rounded-full mr-2"></span>
            <span className="text-sm text-neutral-700">Unchanged</span>
          </div>
        </div>
        
        <div className="bg-neutral-50 rounded-lg p-4 overflow-x-auto">
          <pre className="font-mono text-sm leading-relaxed whitespace-pre">
            {diffContent.map((line, index) => (
              <DiffLine key={index} type={line.type} content={line.content} />
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
