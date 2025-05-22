import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DiffViewer from '@/components/diff/DiffViewer';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import { API_ENDPOINTS } from '@shared/schema';

// Component to display a single artifact for review
const ArtifactReview = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id ? parseInt(params.id) : undefined;
  
  const { data: artifact, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ARTIFACT(id || 0)],
    queryFn: () => id ? api.getArtifact(id) : Promise.reject('No artifact ID provided'),
    enabled: !!id,
  });

  const handleApproveSuccess = () => {
    toast({
      title: "Artifact approved",
      description: "The artifact has been successfully migrated to APM.",
    });
    queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ARTIFACTS] });
    navigate('/review');
  };

  const handleRejectSuccess = () => {
    toast({
      title: "Artifact rejected",
      description: "The artifact has been marked for re-transformation.",
    });
    queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ARTIFACTS] });
    navigate('/review');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-neutral-600">Loading artifact...</p>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-neutral-600 mb-4">Artifact not found.</p>
        <Button asChild>
          <Link href="/review">Back to Review</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium text-neutral-800 mb-2">Review Artifact</h2>
          <p className="text-neutral-600">Examine and approve the transformed artifact</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/review">
            <span className="material-icons text-sm mr-1">arrow_back</span>
            Back to List
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{artifact.name}</CardTitle>
              <CardDescription>
                Type: {artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1).replace('_', ' ')} | 
                Status: <Badge variant={
                  artifact.status === 'migrated' ? 'success' :
                  artifact.status === 'pending' ? 'warning' :
                  artifact.status === 'error' ? 'error' : 'default'
                }>{artifact.status}</Badge>
              </CardDescription>
            </div>
            <div>
              <p className="text-sm text-neutral-600">
                Original ID: {artifact.originalId}
                {artifact.apmId && <span> | APM ID: {artifact.apmId}</span>}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DiffViewer 
            artifactId={artifact.id}
            artifactName={artifact.name}
            originalData={artifact.originalData}
            transformedData={artifact.transformedData}
            onApprove={handleApproveSuccess}
            onReject={handleRejectSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Main review component with list of artifacts to review
export default function Review() {
  const params = useParams();
  const id = params.id;
  
  // If an ID is provided, show the single artifact review
  if (id) {
    return <ArtifactReview />;
  }

  const [filter, setFilter] = useState('pending');
  const { toast } = useToast();
  
  // Get artifacts based on filter
  const { data: artifacts, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ARTIFACTS, filter],
    queryFn: async () => {
      const allArtifacts = await api.getArtifacts();
      if (filter === 'all') return allArtifacts;
      return allArtifacts.filter((a: any) => a.status === filter);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-neutral-800 mb-2">Review Artifacts</h2>
        <p className="text-neutral-600">Review and approve transformed artifacts before migration to APM</p>
      </div>

      <Tabs defaultValue={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="migrated">Migrated</TabsTrigger>
          <TabsTrigger value="error">Errors</TabsTrigger>
          <TabsTrigger value="all">All Artifacts</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'pending' ? 'Artifacts Pending Review' :
             filter === 'migrated' ? 'Migrated Artifacts' :
             filter === 'error' ? 'Artifacts with Errors' :
             'All Artifacts'}
          </CardTitle>
          <CardDescription>
            {filter === 'pending' ? 'Review and approve these artifacts to migrate to APM' :
             filter === 'migrated' ? 'These artifacts have been successfully migrated to APM' :
             filter === 'error' ? 'These artifacts encountered errors during transformation or migration' :
             'Complete list of all artifacts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-neutral-600 py-4">Loading artifacts...</p>
          ) : artifacts && artifacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Modified</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {artifacts.map((artifact: any) => (
                    <tr key={artifact.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">{artifact.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">
                          {artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1).replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          artifact.status === 'migrated' ? 'success' :
                          artifact.status === 'pending' ? 'warning' :
                          artifact.status === 'error' ? 'error' : 'default'
                        }>
                          {artifact.status.charAt(0).toUpperCase() + artifact.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {new Date(artifact.lastModified).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/review/${artifact.id}`}>
                            <span className="material-icons text-sm mr-1">
                              {artifact.status === 'pending' ? 'rate_review' :
                               artifact.status === 'error' ? 'error_outline' : 'visibility'}
                            </span>
                            {artifact.status === 'pending' ? 'Review' :
                             artifact.status === 'error' ? 'Fix' : 'View'}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-neutral-600 py-8">
              {filter === 'pending' ? 'No artifacts pending review. Transform artifacts first.' :
               filter === 'migrated' ? 'No migrated artifacts yet.' :
               filter === 'error' ? 'No artifacts with errors.' :
               'No artifacts found.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
