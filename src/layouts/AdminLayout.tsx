
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  
  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-10">CMS Admin</h1>
        <nav className="flex flex-col gap-4 flex-1">
          <a href="/" className="hover:text-blue-400">Dashboard</a>
          <a href="/projects" className="hover:text-blue-400">Projects</a>
          <a href="/blogs" className="hover:text-blue-400">Blogs</a>
          <a href="/messages" className="hover:text-blue-400">Messages</a>
          <a href="/media" className="hover:text-blue-400">Media Library</a>
        </nav>
        <button onClick={logout} className="mt-auto py-2 bg-red-600 rounded">Logout</button>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
