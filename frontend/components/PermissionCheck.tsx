// components/PermissionCheck.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useProject } from '@/context/ProjectContext';
import { getUserPermission } from '@/utils/getUserPermission';

interface PermissionCheckProps {
  allowedPermissions: number[];
  children: React.ReactNode;
}

const PermissionCheck: React.FC<PermissionCheckProps> = ({ allowedPermissions, children }) => {
  const { getToken } = useAuth();
  const { selectedProject } = useProject();
  const router = useRouter();
  const [permission, setPermission] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!selectedProject) return;

      const token = await getToken();
      if (!token) {
        console.error('No token found');
        return;
      }

      const userPermission = await getUserPermission('userId_from_token', selectedProject.id, token);
      setPermission(userPermission);
      setLoading(false);

      // If user permission is not in allowed permissions, redirect to dashboard
      if (userPermission !== null && !allowedPermissions.includes(userPermission)) {
        router.push('/dashboard');
      }
    };

    checkPermissions();
  }, [selectedProject, getToken, allowedPermissions, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (permission === null) {
    return <p>Access Denied</p>;
  }

  // Render the component only if permission is allowed
  return <>{allowedPermissions.includes(permission) && children}</>;
};

// Component-level permission check without redirect
const PermissionCheckComponent: React.FC<PermissionCheckProps> = ({ allowedPermissions, children }) => {
  const { getToken } = useAuth();
  const { selectedProject } = useProject();
  const [permission, setPermission] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!selectedProject) return;

      const token = await getToken();
      if (!token) {
        console.error('No token found');
        return;
      }

      const userPermission = await getUserPermission('userId_from_token', selectedProject.id, token);
      setPermission(userPermission);
      setLoading(false);
    };

    checkPermissions();
  }, [selectedProject, getToken, allowedPermissions]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (permission === null) {
    return null; // If permission is null, don't render anything
  }

  // Conditionally render children without redirecting
  return <>{allowedPermissions.includes(permission) ? children : null}</>;
};

export { PermissionCheck, PermissionCheckComponent };
