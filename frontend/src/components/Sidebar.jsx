import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import { getFilteredRoutes } from '../navigationConfig';

export const Sidebar = () => {
  const { user } = useAuth();
  const userRole = user?.roles?.[0] || 'trader';

  const navItems = useMemo(() => getFilteredRoutes(userRole), [userRole]);

  return (
    <aside className="w-64 bg-white min-h-screen border-r border-gray-200 shadow-sm p-6">
      <nav className="space-y-6">
        {navItems.map((item) => (
          <div key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
            {item.items && (
              <div className="mt-2 space-y-1 pl-4">
                {item.items.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                        isActive 
                          ? 'text-blue-700 font-semibold' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};
