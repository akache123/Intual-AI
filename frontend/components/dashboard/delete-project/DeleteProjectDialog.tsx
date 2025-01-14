import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@clerk/nextjs';
import crypto from 'crypto';

interface DeleteProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectId: string;
  projectName: string;
  onDeleteSuccess: () => void;
}

const generateRandomCode = (length = 10) => {
  return crypto.randomBytes(length).toString('base64').substring(0, length).replace(/[^a-zA-Z0-9]/g, ''); // Generate alphanumeric code
};

const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({ isOpen, onOpenChange, projectId, projectName, onDeleteSuccess }) => {
  const { getToken } = useAuth();
  const [deleteProjectName, setDeleteProjectName] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a new confirmation code whenever the dialog opens
  useEffect(() => {
    if (isOpen) {
      setGeneratedCode(generateRandomCode());
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (deleteProjectName !== projectName || confirmationCode !== generatedCode) {
      setError('Please ensure the project name and the confirmation code match.');
      return;
    }

    // Show confirmation alert before proceeding with delete
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the project "${projectName}"? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return; // If user cancels, exit the function
    }

    setLoading(true);
    try {
      const token = await getToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiBaseUrl}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        onDeleteSuccess();
        onOpenChange(false);
      } else {
        setError('Failed to delete the project.');
      }
    } catch (error) {
      console.error('Delete error');
      setError('An error occurred while trying to delete the project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Project Deletion</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <p>To confirm deletion, please type the project name &quot;{projectName}&quot; and the following code:</p>
          <p className="font-bold text-red-500">{generatedCode}</p>

          <Input
            value={deleteProjectName}
            onChange={(e) => setDeleteProjectName(e.target.value)}
            placeholder="Project name"
          />

          <Input
            value={confirmationCode}
            onChange={(e) => setConfirmationCode(e.target.value)}
            placeholder="Confirmation code"
          />

          {error && <p className="text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={handleDelete}>
            {loading ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProjectDialog;
