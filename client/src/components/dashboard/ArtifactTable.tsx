import { useState } from 'react';
import { Link } from 'wouter';
import { Artifact } from '@shared/schema';

type ArtifactTableProps = {
  artifacts: Artifact[];
  isLoading: boolean;
};

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const StatusBadge = ({ status }: { status: string }) => {
  let bgColor = '';
  let textColor = '';
  
  switch (status) {
    case 'migrated':
      bgColor = 'bg-success bg-opacity-10';
      textColor = 'text-success';
      break;
    case 'pending':
      bgColor = 'bg-warning bg-opacity-10';
      textColor = 'text-warning';
      break;
    case 'error':
      bgColor = 'bg-error bg-opacity-10';
      textColor = 'text-error';
      break;
    default:
      bgColor = 'bg-neutral-200';
      textColor = 'text-neutral-700';
  }
  
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function ArtifactTable({ artifacts, isLoading }: ArtifactTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const itemsPerPage = 5;
  
  // Filter artifacts
  const filteredArtifacts = artifacts.filter(artifact => 
    artifact.name.toLowerCase().includes(filter.toLowerCase()) ||
    artifact.type.toLowerCase().includes(filter.toLowerCase()) ||
    artifact.status.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredArtifacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArtifacts = filteredArtifacts.slice(startIndex, startIndex + itemsPerPage);
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-neutral-900">Current Migration</h3>
          <div className="flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter artifacts..."
                value={filter}
                onChange={handleFilterChange}
                className="px-3 py-1.5 border border-neutral-300 text-sm rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400">
                <span className="material-icons text-sm">search</span>
              </span>
            </div>
            <button 
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={() => window.location.reload()}
            >
              <span className="material-icons text-sm mr-1">refresh</span> Refresh
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                    Loading artifacts...
                  </td>
                </tr>
              ) : paginatedArtifacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                    No artifacts found. Start by extracting data from BusinessConnect.
                  </td>
                </tr>
              ) : (
                paginatedArtifacts.map((artifact) => (
                  <tr key={artifact.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-neutral-900">{artifact.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">
                        {artifact.type.charAt(0).toUpperCase() + artifact.type.slice(1).replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={artifact.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">
                      {formatDate(artifact.lastModified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {artifact.status === 'pending' ? (
                        <Link href={`/review/${artifact.id}`}>
                          <a className="text-primary hover:text-primary-dark mr-3">Review</a>
                        </Link>
                      ) : artifact.status === 'error' ? (
                        <Link href={`/review/${artifact.id}`}>
                          <a className="text-primary hover:text-primary-dark mr-3">Fix</a>
                        </Link>
                      ) : (
                        <Link href={`/review/${artifact.id}`}>
                          <a className="text-primary hover:text-primary-dark mr-3">View</a>
                        </Link>
                      )}
                      <Link href={`/history/artifact/${artifact.id}`}>
                        <a className="text-neutral-600 hover:text-neutral-900">History</a>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-neutral-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">
              {Math.min(startIndex + itemsPerPage, filteredArtifacts.length)}
            </span> of <span className="font-medium">{filteredArtifacts.length}</span> results
          </div>
          <nav className="flex items-center space-x-2">
            <button 
              className="inline-flex items-center px-2 py-1 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button 
              className="inline-flex items-center px-2 py-1 border border-neutral-300 rounded-md text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
