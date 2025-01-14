import React, { useState, useEffect } from 'react';
import Layout from '@/components/sidebar/Layout';
import { useAuth } from '@clerk/nextjs';

const Dashboard = () => {
  const { getToken } = useAuth();
  const [isUserAdded, setIsUserAdded] = useState(false);

  useEffect(() => {
    const addUserToDatabase = async () => {
      try {
        if (isUserAdded) return;

        const token = await getToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const response = await fetch(`${apiBaseUrl}/users/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok || response.status === 409) {
          setIsUserAdded(true);
        }
      } catch (error) {
        console.error('Failed to add user');
      }
    };

    addUserToDatabase();
  }, [getToken, isUserAdded]);


  return (
    <Layout>
      <div>
        <h1 className="text-xl font-bold">Welcome to your dashboard!</h1>
      </div>
    </Layout>
  );
};

export default Dashboard;
