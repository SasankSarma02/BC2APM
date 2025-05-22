import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import StatusCard from '@/components/dashboard/StatusCard';
import QuickActions from '@/components/dashboard/QuickActions';
import ArtifactTable from '@/components/dashboard/ArtifactTable';
import { Artifact } from '@shared/schema';
import { API_ENDPOINTS } from '@shared/schema';

export default function Dashboard() {
  const [lastExtracted, setLastExtracted] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: [API_ENDPOINTS.DASHBOARD],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch artifacts for the table
  const { data: artifactsData, isLoading: isLoadingArtifacts } = useQuery({
    queryKey: [API_ENDPOINTS.ARTIFACTS],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (dashboardStats) {
      // Format last extracted date
      if (dashboardStats.lastExtracted) {
        const date = new Date(dashboardStats.lastExtracted);
        setLastExtracted(date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }));
      }

      // Calculate progress percentage
      if (dashboardStats.artifactCount > 0) {
        const percent = Math.round((dashboardStats.migratedCount / dashboardStats.artifactCount) * 100);
        setProgressPercent(percent);
      }
    }
  }, [dashboardStats]);

  // Sort artifacts by last modified date (newest first)
  const sortedArtifacts = artifactsData ? 
    [...artifactsData].sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    ) : [];

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-medium text-neutral-800 mb-4">Migration Dashboard</h2>
      <p className="text-neutral-600 mb-6">BusinessConnect to Anypoint Partner Manager migration accelerator</p>
      
      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatusCard 
          title="Artifacts" 
          count={isLoadingStats ? "..." : dashboardStats?.artifactCount || 0}
          icon="inventory_2"
          iconBgColor="bg-primary bg-opacity-10"
          iconTextColor="text-primary"
          footer={
            <div>
              Last extracted: <span>{lastExtracted || "Never"}</span>
            </div>
          }
        />
        
        <StatusCard 
          title="Migrated" 
          count={isLoadingStats ? "..." : dashboardStats?.migratedCount || 0}
          icon="check_circle"
          iconBgColor="bg-success bg-opacity-10"
          iconTextColor="text-success"
          footer={
            <div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-success rounded-full h-2" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-success">{progressPercent}% complete</span>
            </div>
          }
        />
        
        <StatusCard 
          title="Pending" 
          count={isLoadingStats ? "..." : dashboardStats?.pendingCount || 0}
          icon="pending"
          iconBgColor="bg-warning bg-opacity-10"
          iconTextColor="text-warning"
          footer={
            <div>Ready for review</div>
          }
        />
        
        <StatusCard 
          title="Issues" 
          count={isLoadingStats ? "..." : dashboardStats?.errorCount || 0}
          icon="error"
          iconBgColor="bg-error bg-opacity-10"
          iconTextColor="text-error"
          footer={
            <div>Requires attention</div>
          }
        />
      </div>
      
      {/* Quick actions */}
      <QuickActions />
      
      {/* Artifacts table */}
      <ArtifactTable 
        artifacts={sortedArtifacts} 
        isLoading={isLoadingArtifacts} 
      />
    </div>
  );
}
