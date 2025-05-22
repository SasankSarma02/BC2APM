import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Help() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-neutral-800 mb-2">Help & Documentation</h2>
        <p className="text-neutral-600">Learn how to use the BusinessConnect Migration Accelerator</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Overview of the BC Migration Accelerator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            The BusinessConnect Migration Accelerator is a tool designed to simplify and accelerate the migration of artifacts from TIBCO BusinessConnect to Anypoint Partner Manager. The tool provides a streamlined workflow for extracting, transforming, reviewing, and deploying artifacts.
          </p>
          <p className="mb-4">
            The migration process consists of four main steps:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-full mr-3">
                  <span className="material-icons">looks_one</span>
                </div>
                <h3 className="font-medium">Extract</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Export artifacts from BusinessConnect using the CLI or REST API.
              </p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-full mr-3">
                  <span className="material-icons">looks_two</span>
                </div>
                <h3 className="font-medium">Transform</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Convert BusinessConnect XML artifacts to JSON format compatible with APM.
              </p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-full mr-3">
                  <span className="material-icons">looks_3</span>
                </div>
                <h3 className="font-medium">Review</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Review and approve the transformed artifacts before migration.
              </p>
            </div>
            <div className="bg-neutral-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-full mr-3">
                  <span className="material-icons">looks_4</span>
                </div>
                <h3 className="font-medium">Deploy</h3>
              </div>
              <p className="text-sm text-neutral-600">
                Migrate approved artifacts to Anypoint Partner Manager.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Common questions about the migration process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What artifacts can be migrated?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-neutral-600 mb-2">
                  The migration tool supports the following BusinessConnect artifact types:
                </p>
                <ul className="list-disc list-inside text-sm text-neutral-600 ml-4 space-y-1">
                  <li>Trading Partners</li>
                  <li>Channels</li>
                  <li>Certificates</li>
                  <li>Maps</li>
                  <li>Endpoints</li>
                  <li>Schemas</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>How does the extraction process work?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-neutral-600 mb-2">
                  The tool offers two extraction methods:
                </p>
                <ul className="list-disc list-inside text-sm text-neutral-600 ml-4 space-y-1">
                  <li>
                    <strong>CLI Extraction:</strong> Uses the BusinessConnect CLI command <code className="bg-neutral-100 px-1 py-0.5 rounded">bcengine -exportConfigRepo</code> to export all configuration artifacts into a CSX file (a ZIP archive containing XML files). This method provides 100% coverage of configuration artifacts.
                  </li>
                  <li>
                    <strong>REST API Extraction:</strong> Uses the BusinessConnect REST API to extract trading partners and related artifacts. This method is useful for delta changes after a full export.
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>What transformation happens to the artifacts?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-neutral-600 mb-2">
                  The transformation process converts BusinessConnect XML artifacts into a canonical JSON model that is compatible with Anypoint Partner Manager. The transformation includes:
                </p>
                <ul className="list-disc list-inside text-sm text-neutral-600 ml-4 space-y-1">
                  <li>Converting XML structure to JSON format</li>
                  <li>Mapping BC-specific fields to APM-compatible fields</li>
                  <li>Preserving relationships between artifacts</li>
                  <li>Standardizing identifiers and references</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>What credentials are required?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-neutral-600 mb-2">
                  You need two sets of credentials:
                </p>
                <ul className="list-disc list-inside text-sm text-neutral-600 ml-4 space-y-1">
                  <li>
                    <strong>BusinessConnect credentials:</strong> Username and password with access to the BC REST API (only needed for REST API extraction)
                  </li>
                  <li>
                    <strong>Anypoint Platform credentials:</strong> Client ID and Client Secret with permission to access APM APIs
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>How are migration errors handled?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-neutral-600 mb-2">
                  When a migration error occurs:
                </p>
                <ul className="list-disc list-inside text-sm text-neutral-600 ml-4 space-y-1">
                  <li>The error is logged with details about the failure</li>
                  <li>The artifact is marked with an "error" status</li>
                  <li>You can view the error details in the History section</li>
                  <li>You can fix the issues and retry the migration</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>Can I migrate artifacts in a specific order?</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-neutral-600">
                  Yes, you can select specific artifacts to migrate in the Deploy section. The tool will maintain references between artifacts during migration. For example, if you migrate a trading partner that references endpoints, those endpoints should be migrated either before or together with the trading partner.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
          <CardDescription>
            Common issues and their solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">CLI Extraction Fails</h3>
              <p className="text-sm text-neutral-600 mb-2">
                If the CLI extraction fails, check the following:
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-600 ml-4">
                <li>Verify the TIBCO_HOME path is correct in the Configuration section</li>
                <li>Ensure the bcengine executable has proper permissions</li>
                <li>Check if there is enough disk space for the exported files</li>
                <li>Verify the user running the migration tool has access to the BC installation</li>
              </ul>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">REST API Connection Issues</h3>
              <p className="text-sm text-neutral-600 mb-2">
                If connecting to the BC REST API fails:
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-600 ml-4">
                <li>Verify the BusinessConnect server is running</li>
                <li>Check that the username and password are correct</li>
                <li>Ensure the port 9000 is accessible (default BC REST API port)</li>
                <li>Check if any firewalls or network policies are blocking access</li>
              </ul>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">APM Authentication Errors</h3>
              <p className="text-sm text-neutral-600 mb-2">
                If authentication with Anypoint Platform fails:
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-600 ml-4">
                <li>Verify the Client ID and Client Secret are correct</li>
                <li>Ensure the client credentials have APM access permissions</li>
                <li>Check if the Anypoint Platform is accessible from your network</li>
                <li>If using a proxy, ensure it's properly configured</li>
              </ul>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Migration Errors</h3>
              <p className="text-sm text-neutral-600 mb-2">
                If artifacts fail to migrate to APM:
              </p>
              <ul className="list-disc list-inside text-sm text-neutral-600 ml-4">
                <li>Check the error message in the artifact's history</li>
                <li>Verify that referenced artifacts have been migrated first</li>
                <li>Ensure the transformed data is valid and complete</li>
                <li>Try transforming the artifact again before migration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>
            Links to helpful documentation and resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-neutral-200 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="material-icons text-primary mr-2">menu_book</span>
                BusinessConnect Documentation
              </h3>
              <p className="text-sm text-neutral-600 mb-2">
                Official TIBCO BusinessConnect documentation, including CLI and REST API references.
              </p>
              <a href="https://docs.tibco.com/products/tibco-businessconnect" target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center">
                Visit Documentation
                <span className="material-icons text-sm ml-1">open_in_new</span>
              </a>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="material-icons text-primary mr-2">menu_book</span>
                Anypoint Partner Manager Documentation
              </h3>
              <p className="text-sm text-neutral-600 mb-2">
                Official MuleSoft documentation for Anypoint Partner Manager.
              </p>
              <a href="https://docs.mulesoft.com/partner-manager/" target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center">
                Visit Documentation
                <span className="material-icons text-sm ml-1">open_in_new</span>
              </a>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="material-icons text-primary mr-2">support_agent</span>
                TIBCO Support
              </h3>
              <p className="text-sm text-neutral-600 mb-2">
                Access TIBCO support for BusinessConnect issues.
              </p>
              <a href="https://support.tibco.com" target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center">
                Contact Support
                <span className="material-icons text-sm ml-1">open_in_new</span>
              </a>
            </div>
            
            <div className="border border-neutral-200 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="material-icons text-primary mr-2">support_agent</span>
                MuleSoft Support
              </h3>
              <p className="text-sm text-neutral-600 mb-2">
                Access MuleSoft support for APM issues.
              </p>
              <a href="https://help.mulesoft.com" target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline flex items-center">
                Contact Support
                <span className="material-icons text-sm ml-1">open_in_new</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Get help with the migration accelerator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-neutral-50 p-6 rounded-lg text-center">
            <h3 className="font-medium text-lg mb-4">Need Additional Assistance?</h3>
            <p className="text-neutral-600 mb-4">
              If you're experiencing issues with the migration tool or need help with your migration project, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
              <a href="mailto:support@example.com" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <span className="material-icons text-sm mr-2">email</span>
                Email Support
              </a>
              <a href="tel:+1-555-123-4567" className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <span className="material-icons text-sm mr-2">phone</span>
                Call Support
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
