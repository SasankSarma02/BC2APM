import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/lib/api';
import { API_ENDPOINTS } from '@shared/schema';

// Component to display migration history for a single artifact
const ArtifactHistory = () => {
  const params = useParams();
  const { toast } = useToast();
  const artifactId = params.id ? parseInt(params.id) : undefined;
  
  const { data: artifact, isLoading: isLoadingArtifact } = useQuery({
    queryKey: [API_ENDPOINTS.ARTIFACT(artifactId || 0)],
    queryFn: () => artifactId ? api.getArtifact(artifactId) : Promise.reject('No artifact ID provided'),
    enabled: !!artifactId,
  });

  const { data: migrations, isLoading: isLoadingMigrations } = useQuery({
    queryKey: [API_ENDPOINTS.MIGRATIONS, 'artifact', artifactId],
    queryFn: () => artifactId ? api.getMigrationsForArtifact(artifactId) : Promise.reject('No artifact ID provided'),
    enabled: !!artifactId,
  });

  if (isLoadingArtifact || isLoadingMigrations) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-neutral-600">Loading history...</p>
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-neutral-600 mb-4">Artifact not found.</p>
        <Button asChild>
          <Link href="/history">Back to History</Link>
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium text-neutral-800 mb-2">Artifact History</h2>
          <p className="text-neutral-600">Migration history for {artifact.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/history">
            <span className="material-icons text-sm mr-1">arrow_back</span>
            Back to History
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
          {migrations && migrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">APM Response</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Error Message</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {migrations.map((migration: any) => (
                    <tr key={migration.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{migration.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatDate(migration.timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={migration.status === 'success' ? 'success' : 'error'}>
                          {migration.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {migration.apmResponse ? (
                          <details className="cursor-pointer">
                            <summary className="text-primary">View Response</summary>
                            <pre className="text-xs mt-2 p-2 bg-neutral-50 rounded overflow-auto max-h-32">
                              {JSON.stringify(migration.apmResponse, null, 2)}
                            </pre>
                          </details>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                        {migration.errorMessage || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-neutral-600 py-4">No migration attempts found for this artifact.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Artifact Timeline</CardTitle>
          <CardDescription>
            Lifecycle of the artifact from extraction to migration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative pl-8 py-2">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-neutral-200"></div>
            
            <div className="relative mb-6">
              <div className="absolute -left-8 mt-1 h-4 w-4 rounded-full bg-primary"></div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <h3 className="font-medium text-neutral-900">Extracted</h3>
                <p className="text-sm text-neutral-600">{formatDate(artifact.createdAt)}</p>
                <p className="text-sm text-neutral-600">Original ID: {artifact.originalId}</p>
              </div>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute -left-8 mt-1 h-4 w-4 rounded-full bg-primary"></div>
              <div className="bg-neutral-50 p-3 rounded-lg">
                <h3 className="font-medium text-neutral-900">Transformed</h3>
                <p className="text-sm text-neutral-600">{formatDate(artifact.lastModified)}</p>
                <p className="text-sm text-neutral-600">Converted from XML to JSON format</p>
              </div>
            </div>
            
            {migrations && migrations.length > 0 && (
              migrations.map((migration: any, index: number) => (
                <div key={migration.id} className="relative mb-6">
                  <div className={`absolute -left-8 mt-1 h-4 w-4 rounded-full ${migration.status === 'success' ? 'bg-success' : 'bg-error'}`}></div>
                  <div className="bg-neutral-50 p-3 rounded-lg">
                    <h3 className="font-medium text-neutral-900">
                      Migration Attempt {index + 1} - {migration.status === 'success' ? 'Success' : 'Failed'}
                    </h3>
                    <p className="text-sm text-neutral-600">{formatDate(migration.timestamp)}</p>
                    {migration.status === 'success' ? (
                      <p className="text-sm text-success">Successfully migrated to APM</p>
                    ) : (
                      <p className="text-sm text-error">Error: {migration.errorMessage}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {artifact.status === 'migrated' && (
              <div className="relative">
                <div className="absolute -left-8 mt-1 h-4 w-4 rounded-full bg-success"></div>
                <div className="bg-neutral-50 p-3 rounded-lg">
                  <h3 className="font-medium text-neutral-900">Currently Active in APM</h3>
                  <p className="text-sm text-neutral-600">APM ID: {artifact.apmId}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main history component
export default function History() {
  const params = useParams();
  const id = params.id;
  
  // If an ID is provided, show the single artifact history
  if (id) {
    return <ArtifactHistory />;
  }

  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  
  // Get all extractions
  const { data: extractions, isLoading: isLoadingExtractions } = useQuery({
    queryKey: [API_ENDPOINTS.EXTRACTIONS],
    queryFn: api.getExtractions,
  });

  // Get all migrations
  const { data: migrations, isLoading: isLoadingMigrations } = useQuery({
    queryKey: [API_ENDPOINTS.MIGRATIONS],
    queryFn: api.getMigrations,
  });

  // Get all artifacts
  const { data: artifacts, isLoading: isLoadingArtifacts } = useQuery({
    queryKey: [API_ENDPOINTS.ARTIFACTS],
    queryFn: api.getArtifacts,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-neutral-800 mb-2">Migration History</h2>
        <p className="text-neutral-600">View history of extractions, transformations, and migrations</p>
      </div>

      <Tabs defaultValue={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All Activities</TabsTrigger>
          <TabsTrigger value="extractions">Extractions</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Extractions</CardTitle>
              <CardDescription>
                History of BC artifact extraction jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExtractions ? (
                <p className="text-center text-neutral-600 py-4">Loading extractions...</p>
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
                      {extractions.slice(0, 5).map((extraction: any) => (
                        <tr key={extraction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.method}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              extraction.status === 'completed' ? 'success' :
                              extraction.status === 'in_progress' ? 'warning' :
                              'error'
                            }>
                              {extraction.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.artifactCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatDate(extraction.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-neutral-600 py-4">No extractions found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Migrations</CardTitle>
              <CardDescription>
                History of artifact migrations to APM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMigrations ? (
                <p className="text-center text-neutral-600 py-4">Loading migrations...</p>
              ) : migrations && migrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Artifact ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Timestamp</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Error</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {migrations.slice(0, 5).map((migration: any) => (
                        <tr key={migration.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{migration.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            <Link href={`/history/artifact/${migration.artifactId}`}>
                              <a className="text-primary hover:underline">{migration.artifactId}</a>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={migration.status === 'success' ? 'success' : 'error'}>
                              {migration.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatDate(migration.timestamp)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {migration.errorMessage ? migration.errorMessage.substring(0, 50) + '...' : 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-neutral-600 py-4">No migrations found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extractions">
          <Card>
            <CardHeader>
              <CardTitle>Extraction History</CardTitle>
              <CardDescription>
                Complete history of BC artifact extraction jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingExtractions ? (
                <p className="text-center text-neutral-600 py-4">Loading extractions...</p>
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {extractions.map((extraction: any) => (
                        <tr key={extraction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.method}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              extraction.status === 'completed' ? 'success' :
                              extraction.status === 'in_progress' ? 'warning' :
                              'error'
                            }>
                              {extraction.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{extraction.artifactCount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatDate(extraction.timestamp)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {extraction.metadata ? (
                              <details className="cursor-pointer">
                                <summary className="text-primary">View Details</summary>
                                <pre className="text-xs mt-2 p-2 bg-neutral-50 rounded overflow-auto max-h-32">
                                  {JSON.stringify(extraction.metadata, null, 2)}
                                </pre>
                              </details>
                            ) : 'No details'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-neutral-600 py-4">No extractions found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrations">
          <Card>
            <CardHeader>
              <CardTitle>Migration History</CardTitle>
              <CardDescription>
                Complete history of artifact migrations to APM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMigrations ? (
                <p className="text-center text-neutral-600 py-4">Loading migrations...</p>
              ) : migrations && migrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Artifact ID</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Timestamp</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">APM Response</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Error</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {migrations.map((migration: any) => (
                        <tr key={migration.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{migration.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            <Link href={`/history/artifact/${migration.artifactId}`}>
                              <a className="text-primary hover:underline">{migration.artifactId}</a>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={migration.status === 'success' ? 'success' : 'error'}>
                              {migration.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatDate(migration.timestamp)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {migration.apmResponse ? (
                              <details className="cursor-pointer">
                                <summary className="text-primary">View Response</summary>
                                <pre className="text-xs mt-2 p-2 bg-neutral-50 rounded overflow-auto max-h-32">
                                  {JSON.stringify(migration.apmResponse, null, 2)}
                                </pre>
                              </details>
                            ) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                            {migration.errorMessage || 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-neutral-600 py-4">No migrations found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artifacts">
          <Card>
            <CardHeader>
              <CardTitle>Artifact History</CardTitle>
              <CardDescription>
                All artifacts and their migration status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingArtifacts ? (
                <p className="text-center text-neutral-600 py-4">Loading artifacts...</p>
              ) : artifacts && artifacts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{artifact.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{artifact.name}</td>
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
                              {artifact.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{formatDate(artifact.lastModified)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/history/artifact/${artifact.id}`}>
                                <span className="material-icons text-sm mr-1">history</span>
                                History
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-neutral-600 py-4">No artifacts found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
