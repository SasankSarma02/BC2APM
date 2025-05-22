import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import { API_ENDPOINTS } from '@shared/schema';

export default function Transform() {
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get artifacts that need transformation (status=new)
  const { data: newArtifacts, isLoading: isLoadingArtifacts } = useQuery({
    queryKey: [API_ENDPOINTS.ARTIFACTS, 'new'],
    queryFn: async () => {
      const artifacts = await api.getArtifacts();
      return artifacts.filter((a: any) => a.status === 'new');
    },
  });

  // Get all artifacts for reference
  const { data: allArtifacts } = useQuery({
    queryKey: [API_ENDPOINTS.ARTIFACTS],
    queryFn: api.getArtifacts,
  });

  // Mutation for transforming a single artifact
  const transformArtifactMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.transformArtifact(id);
    },
    onSuccess: () => {
      toast({
        title: "Artifact transformed",
        description: "The artifact has been successfully transformed.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ARTIFACTS] });
    },
    onError: (error) => {
      toast({
        title: "Transformation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Mutation for transforming all new artifacts
  const transformAllMutation = useMutation({
    mutationFn: async () => {
      return api.transformAllNew();
    },
    onSuccess: (data) => {
      toast({
        title: "Transformation completed",
        description: `Successfully transformed ${data.transformed} artifacts.`,
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ARTIFACTS] });
    },
    onError: (error) => {
      toast({
        title: "Bulk transformation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle transform button click
  const handleTransformSelected = async () => {
    if (selectedArtifactIds.length === 0) {
      toast({
        title: "No artifacts selected",
        description: "Please select at least one artifact to transform.",
        variant: "destructive",
      });
      return;
    }

    for (const id of selectedArtifactIds) {
      await transformArtifactMutation.mutateAsync(id);
    }

    setSelectedArtifactIds([]);
  };

  // Handle transform all button click
  const handleTransformAll = () => {
    transformAllMutation.mutate();
  };

  // Handle select/deselect artifact
  const toggleArtifactSelection = (id: number) => {
    if (selectedArtifactIds.includes(id)) {
      setSelectedArtifactIds(selectedArtifactIds.filter(artifactId => artifactId !== id));
    } else {
      setSelectedArtifactIds([...selectedArtifactIds, id]);
    }
  };

  // Handle select all artifacts
  const selectAllArtifacts = () => {
    if (newArtifacts && newArtifacts.length > 0) {
      setSelectedArtifactIds(newArtifacts.map((a: any) => a.id));
    }
  };

  // Handle deselect all artifacts
  const deselectAllArtifacts = () => {
    setSelectedArtifactIds([]);
  };

  // Calculate transformation statistics
  const getTransformationStats = () => {
    if (!allArtifacts) return { total: 0, new: 0, pending: 0, migrated: 0, error: 0 };

    return {
      total: allArtifacts.length,
      new: allArtifacts.filter((a: any) => a.status === 'new').length,
      pending: allArtifacts.filter((a: any) => a.status === 'pending').length,
      migrated: allArtifacts.filter((a: any) => a.status === 'migrated').length,
      error: allArtifacts.filter((a: any) => a.status === 'error').length,
    };
  };

  const stats = getTransformationStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-neutral-800 mb-2">Transform Artifacts</h2>
        <p className="text-neutral-600">Convert BusinessConnect XML data to JSON format for Anypoint Partner Manager</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500">Total Artifacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500">New</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-neutral-800">{stats.new}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500">Migrated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-success">{stats.migrated}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neutral-500">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-error">{stats.error}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Artifacts Ready for Transformation</CardTitle>
              <CardDescription>
                Select artifacts to transform from XML to JSON format
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllArtifacts}
                disabled={isLoadingArtifacts || !newArtifacts || newArtifacts.length === 0}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={deselectAllArtifacts}
                disabled={selectedArtifactIds.length === 0}
              >
                Deselect All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingArtifacts ? (
            <p className="text-center text-neutral-600 py-4">Loading artifacts...</p>
          ) : newArtifacts && newArtifacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      <input 
                        type="checkbox" 
                        checked={selectedArtifactIds.length === newArtifacts.length}
                        onChange={e => e.target.checked ? selectAllArtifacts() : deselectAllArtifacts()}
                        className="rounded text-primary focus:ring-primary"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Original ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {newArtifacts.map((artifact: any) => (
                    <tr key={artifact.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          checked={selectedArtifactIds.includes(artifact.id)}
                          onChange={() => toggleArtifactSelection(artifact.id)}
                          className="rounded text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">{artifact.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">
                          {artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1).replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{artifact.originalId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => transformArtifactMutation.mutate(artifact.id)}
                          disabled={transformArtifactMutation.isPending}
                        >
                          <span className="material-icons text-sm mr-1">
                            {transformArtifactMutation.isPending ? "hourglass_empty" : "sync_alt"}
                          </span> Transform
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-neutral-600 py-8">
              No artifacts available for transformation. Extract artifacts from BusinessConnect first.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-neutral-600">
            {selectedArtifactIds.length} artifact(s) selected
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleTransformSelected}
              disabled={transformArtifactMutation.isPending || selectedArtifactIds.length === 0}
              className="flex items-center"
            >
              <span className="material-icons text-sm mr-1">sync_alt</span>
              Transform Selected
            </Button>
            <Button 
              onClick={handleTransformAll}
              disabled={transformAllMutation.isPending || !newArtifacts || newArtifacts.length === 0}
              className="flex items-center"
            >
              <span className="material-icons text-sm mr-1">
                {transformAllMutation.isPending ? "hourglass_empty" : "sync"}
              </span>
              {transformAllMutation.isPending ? "Transforming..." : "Transform All"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transformation Process</CardTitle>
          <CardDescription>
            How BusinessConnect artifacts are transformed for APM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <span className="material-icons text-primary mr-2">input</span>
                Extract
              </h3>
              <p className="text-sm text-neutral-600">
                The BC CLI exports artifacts as XML in a .csx file, which is a ZIP archive of XML fragments.
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Additional metadata can be collected via the REST API.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <span className="material-icons text-primary mr-2">swap_horiz</span>
                Transform
              </h3>
              <p className="text-sm text-neutral-600">
                XML artifacts are converted to a standardized JSON model that maps to APM's expected format.
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Transformations are stored locally for review before migration.
              </p>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2 flex items-center">
                <span className="material-icons text-primary mr-2">cloud_upload</span>
                Load
              </h3>
              <p className="text-sm text-neutral-600">
                After review, the transformed artifacts are pushed to Anypoint Partner Manager via its REST APIs.
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                References between artifacts are maintained in the migration process.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
