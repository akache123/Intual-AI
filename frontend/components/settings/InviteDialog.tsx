import React, { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@clerk/nextjs';

interface InviteDialogProps {
  projectId: string;
  currentUserPermission: number | null;
}

const InviteDialog: React.FC<InviteDialogProps> = ({ projectId, currentUserPermission }) => {
  const { getToken } = useAuth();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canInvite = currentUserPermission === 0 || currentUserPermission === 1;

  const handleInvite = async () => {
    if (!canInvite) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await getToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const inviteResponse = await fetch(`${apiBaseUrl}/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          permission,
        }),
      });

      if (!inviteResponse.ok) {
        throw new Error("Failed to send invite and email.");
      }

      // Set success message and clear input
      setSuccess("User invited and email sent successfully!");
      setEmail("");
    } catch (error: any) {
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 10000);  // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className='mb-2' disabled={!canInvite}>+ Invite</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a User</DialogTitle>
        </DialogHeader>
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-500">{success}</div>}
        <div className="my-4">
          <label htmlFor="email" className="block mb-2">Email</label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter user's email"
            required
            disabled={loading}
          />
        </div>
        <div className="my-4">
          <label htmlFor="permission" className="block mb-2">Permission</label>
          <select
            id="permission"
            value={permission}
            onChange={(e) => setPermission(Number(e.target.value))}
            disabled={loading}
            className="block w-full p-2 border rounded"
          >
            {currentUserPermission === 0 && (
              <option value={1}>Can Edit</option>
            )}
            <option value={2}>Can View</option>
          </select>
        </div>
        <DialogFooter>
          <Button onClick={handleInvite} disabled={loading || !email}>
            {loading ? "Inviting..." : "Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog;
