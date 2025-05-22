import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as api from '@/lib/api';
import { API_ENDPOINTS } from '@shared/schema';

// Form schema for CLI extraction
const cliExtractionSchema = z.object({
  bcHome: z.string().min(1, 'BC Home path is required')
});

// Form schema for REST extraction
const restExtractionSchema = z.object({
  bcHome: z.string().min(1, 'BC Home path is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export default function Extract() {
  const [activeTab, setActiveTab] = useState('cli');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get configurations for pre-filling forms
  const { data: bcHomeConfig } = useQuery({
    queryKey: [API_ENDPOINTS.CONFIGURATION('bc_home')],
    queryFn: () => api.getConfiguration('bc_home'),
  });

  const { data: bcCredentialsConfig } = useQuery({
    queryKey: [API_ENDPOINTS.CONFIGURATION('bc_credentials')],
    queryFn: () => api.getConfiguration('bc_credentials'),
  });

  // Get recent extractions
  const { data: extractions, isLoading: isLoadingExtractions } = useQuery({
    queryKey: [API_ENDPOINTS.EXTRACTIONS],
    queryFn: api.getExtractions,
  });

  // Form for CLI extraction
  const cliForm = useForm<z.infer<typeof cliExtractionSchema>>({
    resolver: zodResolver(cliExtractionSchema),
    defaultValues: {
      bcHome: bcHomeConfig?.value?.path || ''
    }
  });

  // Form for REST extraction
  const restForm = useForm<z.infer<typeof restExtractionSchema>>({
    resolver: zodResolver(restExtractionSchema),
    defaultValues: {
      bcHome: bcCredentialsConfig?.value?.bcHome || '',
      username: bcCredentialsConfig?.value?.username || '',
      password: bcCredentialsConfig?.value?.password || ''
    }
  });

  // Update form values when configs load
  // Use React's useEffect to properly watch for config changes
  React.useEffect(() => {
    if (bcHomeConfig?.value?.path) {
      cliForm.setValue('bcHome', bcHomeConfig.value.path);
    }
  }, [bcHomeConfig, cliForm]);
  
  React.useEffect(() => {
    if (bcCredentialsConfig?.value) {
      restForm.setValue('bcHome', bcCredentialsConfig.value.bcHome || '');
      restForm.setValue('username', bcCredentialsConfig.value.username || '');
      restForm.setValue('password', bcCredentialsConfig.value.password || '');
    }
  }, [bcCredentialsConfig, restForm]);

  // Mutation for extraction
  const extractMutation = useMutation({
    mutationFn: async (data: { method: 'cli' | 'rest' | 'both', bcHome: string, credentials?: { username: string, password: string } }) => {
      return api.runExtraction(data.method, data.bcHome, data.credentials);
    },
    onSuccess: () => {
      toast({
        title: "Extraction started",
        description: "The extraction process has been initiated.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.EXTRACTIONS] });
    },
    onError: (error) => {
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
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

  // Handle CLI extraction form submission
  const onCliSubmit = (values: z.infer<typeof cliExtractionSchema>) => {
    // Save BC home config
    saveConfigMutation.mutate({
      key: 'bc_home',
      value: { path: values.bcHome }
    });

    // Run extraction
    extractMutation.mutate({
      method: 'cli',
      bcHome: values.bcHome
    });
  };

  // Handle REST extraction form submission
  const onRestSubmit = (values: z.infer<typeof restExtractionSchema>) => {
    // Save BC credentials config
    saveConfigMutation.mutate({
      key: 'bc_credentials',
      value: {
        bcHome: values.bcHome,
        username: values.username,
        password: values.password
      }
    });

    // Run extraction
    extractMutation.mutate({
      method: 'rest',
      bcHome: values.bcHome,
      credentials: {
        username: values.username,
        password: values.password
      }
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-neutral-800 mb-2">Extract Artifacts</h2>
        <p className="text-neutral-600">Export artifacts from BusinessConnect for migration</p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cli">CLI Export</TabsTrigger>
          <TabsTrigger value="rest">REST API</TabsTrigger>
        </TabsList>

        <TabsContent value="cli" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>CLI Extraction</CardTitle>
              <CardDescription>
                Use the BusinessConnect CLI to export all configuration artifacts at once.
                This method provides 100% coverage of configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...cliForm}>
                <form id="cli-form" onSubmit={cliForm.handleSubmit(onCliSubmit)} className="space-y-4">
                  <FormField
                    control={cliForm.control}
                    name="bcHome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TIBCO_HOME Directory</FormLabel>
                        <FormControl>
                          <Input placeholder="/opt/tibco" {...field} />
                        </FormControl>
                        <FormDescription>
                          The root directory where BusinessConnect is installed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                form="cli-form"
                disabled={extractMutation.isPending}
                className="flex items-center"
              >
                <span className="material-icons text-sm mr-1">
                  {extractMutation.isPending && activeTab === 'cli' ? "hourglass_empty" : "download"}
                </span>
                {extractMutation.isPending && activeTab === 'cli' ? "Extracting..." : "Run Extraction"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="rest" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>REST API Extraction</CardTitle>
              <CardDescription>
                Use the BusinessConnect REST API to extract trading partners and related artifacts.
                Useful for delta changes after a full export.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...restForm}>
                <form id="rest-form" onSubmit={restForm.handleSubmit(onRestSubmit)} className="space-y-4">
                  <FormField
                    control={restForm.control}
                    name="bcHome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TIBCO_HOME Directory</FormLabel>
                        <FormControl>
                          <Input placeholder="/opt/tibco" {...field} />
                        </FormControl>
                        <FormDescription>
                          The root directory where BusinessConnect is installed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={restForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="admin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={restForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="•••••••••" {...field} />
                          </FormControl>
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
                form="rest-form"
                disabled={extractMutation.isPending}
                className="flex items-center"
              >
                <span className="material-icons text-sm mr-1">
                  {extractMutation.isPending && activeTab === 'rest' ? "hourglass_empty" : "sync"}
                </span>
                {extractMutation.isPending && activeTab === 'rest' ? "Extracting..." : "Run REST Extraction"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Extractions</CardTitle>
          <CardDescription>
            History of extraction jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingExtractions ? (
            <p className="text-center text-neutral-600">Loading extraction history...</p>
          ) : extractions && extractions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Method</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Artifacts</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {extractions.map((extraction: any) => (
                    <tr key={extraction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.method}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          extraction.status === 'completed' ? 'bg-success bg-opacity-10 text-success' :
                          extraction.status === 'in_progress' ? 'bg-warning bg-opacity-10 text-warning' :
                          'bg-error bg-opacity-10 text-error'
                        }`}>
                          {extraction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.artifactCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatDate(extraction.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-neutral-600">No extractions have been run yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
