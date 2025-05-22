import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as api from '@/lib/api';
import { API_ENDPOINTS } from '@shared/schema';

// Form schema for APM credentials
const apmCredentialsSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required')
});

export default function Deploy() {
  const [selectedArtifactIds, setSelectedArtifactIds] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get artifacts ready for migration (status=pending)
  const { data: pendingArtifacts, isLoading: isLoadingArtifacts } = useQuery({
    queryKey: [API_ENDPOINTS.ARTIFACTS, 'pending'],
    queryFn: async () => {
      const artifacts = await api.getArtifacts();
      return artifacts.filter((a: any) => a.status === 'pending');
    },
  });

  // Get APM credentials from configuration
  const { data: apmCredentialsConfig } = useQuery({
    queryKey: [API_ENDPOINTS.CONFIGURATION('apm_credentials')],
    queryFn: () => api.getConfiguration('apm_credentials'),
  });

  // Form for APM credentials
  const form = useForm<z.infer<typeof apmCredentialsSchema>>({
    resolver: zodResolver(apmCredentialsSchema),
    defaultValues: {
      clientId: apmCredentialsConfig?.value?.clientId || '',
      clientSecret: apmCredentialsConfig?.value?.clientSecret || ''
    }
  });

  // Update form values when config loads
  useState(() => {
    if (apmCredentialsConfig?.value) {
      form.setValue('clientId', apmCredentialsConfig.value.clientId || '');
      form.setValue('clientSecret', apmCredentialsConfig.value.clientSecret || '');
    }
  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      return api.setConfiguration(key, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CONFIGURATIONS] });
    }
  });

  // Mutation for migrating a single artifact
  const migrateArtifactMutation = useMutation({
    mutationFn: async ({ id, credentials }: { id: number, credentials: { clientId: string, clientSecret: string } }) => {
      return api.migrateArtifact(id, credentials);
    },
    onSuccess: () => {
      toast({
        title: "Migration successful",
        description: "The artifact has been successfully migrated to APM.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ARTIFACTS] });
    },
    onError: (error) => {
      toast({
        title: "Migration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Mutation for migrating all pending artifacts
  const migrateAllMutation = useMutation({
    mutationFn: async (credentials: { clientId: string, clientSecret: string }) => {
      return api.migrateAllPending(credentials);
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((r: any) => r.success).length;
      toast({
        title: "Migration batch completed",
        description: `Successfully migrated ${successCount} artifacts.`,
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ARTIFACTS] });
    },
    onError: (error) => {
      toast({
        title: "Batch migration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle form submission for saving credentials and deploying
  const onSubmit = (values: z.infer<typeof apmCredentialsSchema>) => {
    // Save APM credentials config
    saveConfigMutation.mutate({
      key: 'apm_credentials',
      value: {
        clientId: values.clientId,
        clientSecret: values.clientSecret
      }
    });

    // If artifacts are selected, migrate them
    if (selectedArtifactIds.length > 0) {
      for (const id of selectedArtifactIds) {
        migrateArtifactMutation.mutate({
          id,
          credentials: {
            clientId: values.clientId,
            clientSecret: values.clientSecret
          }
        });
      }
      setSelectedArtifactIds([]);
    } else if (pendingArtifacts && pendingArtifacts.length > 0) {
      // If no artifacts are selected but there are pending artifacts, ask for confirmation
      if (confirm(`Do you want to migrate all ${pendingArtifacts.length} pending artifacts?`)) {
        migrateAllMutation.mutate({
          clientId: values.clientId,
          clientSecret: values.clientSecret
        });
      }
    } else {
      toast({
        title: "No artifacts to migrate",
        description: "There are no pending artifacts ready for migration.",
        variant: "destructive",
      });
    }
  };

  // Handle migrate single artifact
  const handleMigrateArtifact = (id: number) => {
    const credentials = {
      clientId: form.getValues('clientId'),
      clientSecret: form.getValues('clientSecret')
    };

    if (!credentials.clientId || !credentials.clientSecret) {
      toast({
        title: "Missing credentials",
        description: "Please enter your APM client ID and secret.",
        variant: "destructive",
      });
      return;
    }

    migrateArtifactMutation.mutate({ id, credentials });
  };

  // Handle migrate selected artifacts
  const handleMigrateSelected = () => {
    if (selectedArtifactIds.length === 0) {
      toast({
        title: "No artifacts selected",
        description: "Please select at least one artifact to migrate.",
        variant: "destructive",
      });
      return;
    }

    const credentials = {
      clientId: form.getValues('clientId'),
      clientSecret: form.getValues('clientSecret')
    };

    if (!credentials.clientId || !credentials.clientSecret) {
      toast({
        title: "Missing credentials",
        description: "Please enter your APM client ID and secret.",
        variant: "destructive",
      });
      return;
    }

    for (const id of selectedArtifactIds) {
      migrateArtifactMutation.mutate({ id, credentials });
    }
    setSelectedArtifactIds([]);
  };

  // Handle migrate all artifacts
  const handleMigrateAll = () => {
    const credentials = {
      clientId: form.getValues('clientId'),
      clientSecret: form.getValues('clientSecret')
    };

    if (!credentials.clientId || !credentials.clientSecret) {
      toast({
        title: "Missing credentials",
        description: "Please enter your APM client ID and secret.",
        variant: "destructive",
      });
      return;
    }

    migrateAllMutation.mutate(credentials);
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
    if (pendingArtifacts && pendingArtifacts.length > 0) {
      setSelectedArtifactIds(pendingArtifacts.map((a: any) => a.id));
    }
  };

  // Handle deselect all artifacts
  const deselectAllArtifacts = () => {
    setSelectedArtifactIds([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-neutral-800 mb-2">Deploy to APM</h2>
        <p className="text-neutral-600">Migrate transformed artifacts to Anypoint Partner Manager</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>APM Credentials</CardTitle>
          <CardDescription>
            Enter your Anypoint Platform credentials to connect to APM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="apm-credentials-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your APM client ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your Anypoint Platform client ID with APM access
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Secret</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="•••••••••" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your Anypoint Platform client secret
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            form="apm-credentials-form"
            className="flex items-center"
          >
            <span className="material-icons text-sm mr-1">save</span>
            Save Credentials
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Artifacts Ready for Migration</CardTitle>
              <CardDescription>
                Select artifacts to migrate to Anypoint Partner Manager
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={selectAllArtifacts}
                disabled={isLoadingArtifacts || !pendingArtifacts || pendingArtifacts.length === 0}
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
          ) : pendingArtifacts && pendingArtifacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      <input 
                        type="checkbox" 
                        checked={selectedArtifactIds.length === pendingArtifacts.length}
                        onChange={e => e.target.checked ? selectAllArtifacts() : deselectAllArtifacts()}
                        className="rounded text-primary focus:ring-primary"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Modified</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {pendingArtifacts.map((artifact: any) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {new Date(artifact.lastModified).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleMigrateArtifact(artifact.id)}
                          disabled={migrateArtifactMutation.isPending}
                          className="flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">
                            {migrateArtifactMutation.isPending ? "hourglass_empty" : "cloud_upload"}
                          </span>
                          Migrate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-neutral-600 py-8">
              No artifacts ready for migration. Transform and review artifacts first.
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
              onClick={handleMigrateSelected}
              disabled={migrateArtifactMutation.isPending || selectedArtifactIds.length === 0}
              className="flex items-center"
            >
              <span className="material-icons text-sm mr-1">cloud_upload</span>
              Migrate Selected
            </Button>
            <Button 
              onClick={handleMigrateAll}
              disabled={migrateAllMutation.isPending || !pendingArtifacts || pendingArtifacts.length === 0}
              className="flex items-center"
            >
              <span className="material-icons text-sm mr-1">
                {migrateAllMutation.isPending ? "hourglass_empty" : "publish"}
              </span>
              {migrateAllMutation.isPending ? "Migrating..." : "Migrate All"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Migration Process</CardTitle>
          <CardDescription>
            How artifacts are migrated to Anypoint Partner Manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-neutral-50 p-4 rounded-lg space-y-4">
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-full mr-3">
                <span className="material-icons">looks_one</span>
              </div>
              <div>
                <h3 className="font-medium">Authenticate with APM</h3>
                <p className="text-sm text-neutral-600">
                  The migration tool obtains an OAuth token using your client credentials to authenticate with the APM API.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-full mr-3">
                <span className="material-icons">looks_two</span>
              </div>
              <div>
                <h3 className="font-medium">Map to APM Format</h3>
                <p className="text-sm text-neutral-600">
                  Transformed artifacts are mapped to APM's API format, ensuring compatibility with the target system.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-full mr-3">
                <span className="material-icons">looks_3</span>
              </div>
              <div>
                <h3 className="font-medium">Create Resources in APM</h3>
                <p className="text-sm text-neutral-600">
                  The tool calls APM's REST APIs to create trading partners, certificates, endpoints, and other resources.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-full mr-3">
                <span className="material-icons">looks_4</span>
              </div>
              <div>
                <h3 className="font-medium">Maintain References</h3>
                <p className="text-sm text-neutral-600">
                  Relationships between artifacts are preserved during migration, ensuring proper connectivity in APM.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
