import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Sheet, SheetContent } from '@/components/ui/sheet';

type LayoutProps = {
  children: ReactNode;
  currentPath: string;
};

export default function Layout({ children, currentPath }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar currentPath={currentPath} />

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 sm:max-w-sm">
          <Sidebar currentPath={currentPath} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation */}
        <Header toggleMobileMenu={toggleMobileMenu} />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
