import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@clerk/nextjs';
import { getUserPermission } from '@/utils/getUserPermission';
import { useProject } from '@/context/ProjectContext';

const withPermission = (WrappedComponent: any, restrictedPermissions: number[]) => {
  function HOC(props: any) {
    const { getToken } = useAuth();
    const { selectedProject } = useProject();
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState<number | null>(null);
    const router = useRouter();

    useEffect(() => {
      const checkPermissions = async () => {
        if (!selectedProject) return;

        const token = await getToken();

        // Check if the token is null before proceeding
        if (!token) {
          console.error('Token not found');
          return;
        }

        const userId = 'get from token'; // Extract userId from token

        try {
          const userPermission = await getUserPermission(userId, selectedProject.id, token);

          if (restrictedPermissions.includes(userPermission)) {
            router.push('/dashboard'); // Redirect if unauthorized
          } else {
            setPermission(userPermission);
            setLoading(false); // Allow rendering if authorized
          }
        } catch (error) {
          console.error('Error fetching permissions');
        }
      };

      checkPermissions();
    }, [selectedProject, getToken, router]);

    if (loading) {
      return <p>Loading...</p>;
    }

    return <WrappedComponent {...props} permission={permission} />;
  }

  HOC.displayName = `WithPermission(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return HOC;
};

export default withPermission;
