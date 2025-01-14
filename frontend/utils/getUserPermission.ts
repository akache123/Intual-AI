export const getUserPermission = async (userId: string, projectId: string, token: string) => {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    const response = await fetch(`${apiBaseUrl}/projects/${projectId}/permissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.permission;
    } else {
      console.error('Failed to fetch user permission');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user permission:');
    return null;
  }
};
