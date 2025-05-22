import { useState, useEffect } from 'react';
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

// Schema for BusinessConnect configuration
const bcConfigSchema = z.object({
  bcHome: z.string().min(1, 'BC Home path is required')
});

// Schema for BusinessConnect credentials
const bcCredentialsSchema = z.object({
  bcHome: z.string().min(1, 'BC Home path is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

// Schema for APM credentials
const apmCredentialsSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required')
});

export default function Configuration() {
  const [activeTab, setActiveTab] = useState('bc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get configurations
  const { data: bcHomeConfig } = useQuery({
    queryKey: [API_ENDPOINTS.CONFIGURATION('bc_home')],
    queryFn: () => api.getConfiguration('bc_home'),
  });

  const { data: bcCredentialsConfig } = useQuery({
    queryKey: [API_ENDPOINTS.CONFIGURATION('bc_credentials')],
    queryFn: () => api.getConfiguration('bc_credentials'),
  });

  const { data: apmCredentialsConfig } = useQuery({
    queryKey: [API_ENDPOINTS.CONFIGURATION('apm_credentials')],
    queryFn: () => api.getConfiguration('apm_credentials'),
  });

  // Forms for different configurations
  const bcConfigForm = useForm<z.infer<typeof bcConfigSchema>>({
    resolver: zodResolver(bcConfigSchema),
    defaultValues: {
      bcHome: bcHomeConfig?.value?.path || ''
    }
  });

  const bcCredentialsForm = useForm<z.infer<typeof bcCredentialsSchema>>({
    resolver: zodResolver(bcCredentialsSchema),
    defaultValues: {
      bcHome: bcCredentialsConfig?.value?.bcHome || '',
      username: bcCredentialsConfig?.value?.username || '',
      password: bcCredentialsConfig?.value?.password || ''
    }
  });

  const apmCredentialsForm = useForm<z.infer<typeof apmCredentialsSchema>>({
    resolver: zodResolver(apmCredentialsSchema),
    defaultValues: {
      clientId: apmCredentialsConfig?.value?.clientId || '',
      clientSecret: apmCredentialsConfig?.value?.clientSecret || ''
    }
  });

  // Update form values when configs load
  useEffect(() => {
    if (bcHomeConfig?.value?.path) {
      bcConfigForm.setValue('bcHome', bcHomeConfig.value.path);
    }
    
    if (bcCredentialsConfig?.value) {
      bcCredentialsForm.setValue('bcHome', bcCredentialsConfig.value.bcHome || '');
      bcCredentialsForm.setValue('username', bcCredentialsConfig.value.username || '');
      bcCredentialsForm.setValue('password', bcCredentialsConfig.value.password || '');
    }
    
    if (apmCredentialsConfig?.value) {
      apmCredentialsForm.setValue('clientId', apmCredentialsConfig.value.clientId || '');
      apmCredentialsForm.setValue('clientSecret', apmCredentialsConfig.value.clientSecret || '');
    }
  }, [bcHomeConfig, bcCredentialsConfig, apmCredentialsConfig]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: any }) => {
      return api.setConfiguration(key, value);
    },
    onSuccess: () => {
      toast({
        title: "Configuration saved",
        description: "Your settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CONFIGURATIONS] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save configuration",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Handle BC config form submission
  const onBcConfigSubmit = (values: z.infer<typeof bcConfigSchema>) => {
    saveConfigMutation.mutate({
      key: 'bc_home',
      value: { path: values.bcHome }
    });
  };

  // Handle BC credentials form submission
  const onBcCredentialsSubmit = (values: z.infer<typeof bcCredentialsSchema>) => {
    saveConfigMutation.mutate({
      key: 'bc_credentials',
      value: {
        bcHome: values.bcHome,
        username: values.username,
        password: values.password
      }
    });
  };

  // Handle APM credentials form submission
  const onApmCredentialsSubmit = (values: z.infer<typeof apmCredentialsSchema>) => {
    saveConfigMutation.mutate({
      key: 'apm_credentials',
      value: {
        clientId: values.clientId,
        clientSecret: values.clientSecret
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-neutral-800 mb-2">Configuration</h2>
        <p className="text-neutral-600">Configure connection settings for BC and APM</p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="bc">BusinessConnect</TabsTrigger>
          <TabsTrigger value="credentials">BC Credentials</TabsTrigger>
          <TabsTrigger value="apm">APM Credentials</TabsTrigger>
        </TabsList>

        <TabsContent value="bc" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>BusinessConnect Configuration</CardTitle>
              <CardDescription>
                Configure the path to your BusinessConnect installation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...bcConfigForm}>
                <form id="bc-config-form" onSubmit={bcConfigForm.handleSubmit(onBcConfigSubmit)} className="space-y-4">
                  <FormField
                    control={bcConfigForm.control}
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
                form="bc-config-form"
                disabled={saveConfigMutation.isPending && activeTab === 'bc'}
                className="flex items-center"
              >
                <span className="material-icons text-sm mr-1">save</span>
                {saveConfigMutation.isPending && activeTab === 'bc' ? "Saving..." : "Save Configuration"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>BusinessConnect Credentials</CardTitle>
              <CardDescription>
                Configure credentials for accessing the BC REST API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...bcCredentialsForm}>
                <form id="bc-credentials-form" onSubmit={bcCredentialsForm.handleSubmit(onBcCredentialsSubmit)} className="space-y-4">
                  <FormField
                    control={bcCredentialsForm.control}
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
                      control={bcCredentialsForm.control}
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
                      control={bcCredentialsForm.control}
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
                form="bc-credentials-form"
                disabled={saveConfigMutation.isPending && activeTab === 'credentials'}
                className="flex items-center"
              >
                <span className="material-icons text-sm mr-1">save</span>
                {saveConfigMutation.isPending && activeTab === 'credentials' ? "Saving..." : "Save Credentials"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="apm" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Anypoint Partner Manager Credentials</CardTitle>
              <CardDescription>
                Configure credentials for connecting to Anypoint Platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...apmCredentialsForm}>
                <form id="apm-credentials-form" onSubmit={apmCredentialsForm.handleSubmit(onApmCredentialsSubmit)} className="space-y-4">
                  <FormField
                    control={apmCredentialsForm.control}
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
                    control={apmCredentialsForm.control}
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
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                form="apm-credentials-form"
                disabled={saveConfigMutation.isPending && activeTab === 'apm'}
                className="flex items-center"
              >
                <span className="material-icons text-sm mr-1">save</span>
                {saveConfigMutation.isPending && activeTab === 'apm' ? "Saving..." : "Save APM Credentials"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Configuration</CardTitle>
          <CardDescription>
            Advanced settings for the migration process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="temp-dir">Temporary Directory</Label>
              <Input 
                id="temp-dir" 
                placeholder="/tmp/bc-migration" 
                className="mt-1 mb-2"
                value="./temp_extract"
                disabled
              />
              <p className="text-sm text-neutral-500">
                Directory used for temporary files during extraction
              </p>
            </div>
            
            <div>
              <Label htmlFor="git-path">Git Repository Path</Label>
              <Input 
                id="git-path" 
                placeholder="./data/git" 
                className="mt-1 mb-2"
                value="./data/git"
                disabled
              />
              <p className="text-sm text-neutral-500">
                Directory for versioning artifacts using Git
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
