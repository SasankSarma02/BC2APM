import { useState } from 'react';

type HeaderProps = {
  toggleMobileMenu: () => void;
};

export default function Header({ toggleMobileMenu }: HeaderProps) {
  const [notificationsCount] = useState(0);

  return (
    <header className="flex-shrink-0 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center md:hidden">
          <button 
            type="button" 
            onClick={toggleMobileMenu}
            className="text-neutral-500 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="material-icons">menu</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <h1 className="text-xl font-medium text-primary md:hidden">BC Migration Tool</h1>
          </div>
          <div className="ml-4 flex items-center md:ml-6">
            <button type="button" className="p-1 rounded-full text-neutral-500 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary">
              <span className="material-icons">
                {notificationsCount > 0 ? 'notifications_active' : 'notifications'}
              </span>
            </button>
            <button type="button" className="ml-3 p-1 rounded-full text-neutral-500 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary">
              <span className="material-icons">help_outline</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
