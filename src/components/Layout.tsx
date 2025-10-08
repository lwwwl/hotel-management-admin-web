import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import React from "react";

const Layout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
            {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
