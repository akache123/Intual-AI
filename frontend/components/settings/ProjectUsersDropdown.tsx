import React, { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { IoMdArrowDropdown } from "react-icons/io";
import { MdDeleteOutline } from "react-icons/md";
import { useAuth, useUser } from '@clerk/nextjs';
import { PermissionCheckComponent } from "@/components/PermissionCheck";
import InviteDialog from "@/components/settings/InviteDialog";

interface ProjectUsersDropdownProps {
  projectId: string;
}

const ProjectUsersDropdown: React.FC<ProjectUsersDropdownProps> = ({ projectId }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [members, setMembers] = useState<any[]>([]);
  const [currentUserPermission, setCurrentUserPermission] = useState<number | null>(null);

  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const token = await getToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const response = await fetch(`${apiBaseUrl}/projects/${projectId}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setMembers(data);

          const currentUser = data.find((member: any) => member.id === user?.id);
          setCurrentUserPermission(currentUser?.permission ?? null);
        } else {
          console.error('Failed to fetch project members');
        }
      } catch (error) {
        console.error('Error fetching project members:', error);
      }
    };

    if (projectId) {
      fetchProjectMembers();
    }
  }, [projectId, getToken, user]);

  const sortedMembers = React.useMemo(() => {
    const currentUser = members.find((member: any) => member.id === user?.id);
    const owners = members.filter((member: any) => member.permission === 0 && member.id !== user?.id);
    const others = members.filter((member: any) => member.permission !== 0 && member.id !== user?.id);

    return [
      ...(currentUser ? [currentUser] : []),
      ...owners,
      ...others
    ];
  }, [members, user]);

  const getPermissionLabel = (permission: number) => {
    switch (permission) {
      case 0:
        return "Owner";
      case 1:
        return "Can Edit";
      case 2:
        return "Can View";
      default:
        return "Unknown";
    }
  };

  const handlePermissionChange = async (memberId: string, newPermission: number) => {
    try {
      const token = await getToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiBaseUrl}/projects/${projectId}/members/${memberId}/permission`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission: newPermission }),
      });

      if (!response.ok) {
        console.error('Failed to update permission');
      } else {
        setMembers(members.map(member => member.id === memberId ? { ...member, permission: newPermission } : member));
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const token = await getToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiBaseUrl}/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to delete member');
      } else {
        setMembers(members.filter((member) => member.id !== memberId));
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const canEditMember = (currentUserPermission: number | null, memberId: string, memberPermission: number) => {
    if (memberId === user?.id) {
      return false;
    }
    if (currentUserPermission === 0) {
      return true;
    } else if (currentUserPermission === 1 && memberPermission === 2) {
      return true;
    }
    return false;
  };

  const canDeleteMember = (currentUserPermission: number | null, memberId: string) => {
    return currentUserPermission === 0 && memberId !== user?.id;
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-between py-2 px-3 border rounded">
          <span>Users</span>
          <IoMdArrowDropdown />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          style={{ maxHeight: '500px', maxWidth: '400px', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <div className="flex justify-end">
            <InviteDialog
              projectId={projectId}
              currentUserPermission={currentUserPermission}
            />
          </div>
          {sortedMembers.length > 0 ? (
            sortedMembers.map((member) => (
              <div key={member.id} className="flex justify-between items-center p-2">
                <div className="mr-4 truncate" style={{ maxWidth: '150px' }}>
                  <span className="block text-ellipsis whitespace-nowrap overflow-hidden">{member.name}</span>
                  <span className="text-sm italic text-gray-500 ml-2 block text-ellipsis whitespace-nowrap overflow-hidden">
                    {member.email} {member.id === user?.id ? "(You)" : ""}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {canEditMember(currentUserPermission, member.id, member.permission) ? (
                    <PermissionCheckComponent allowedPermissions={[0, 1]}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="flex items-center justify-between border px-2 py-1 rounded"
                        >
                          <span>{getPermissionLabel(member.permission)}</span>
                          <IoMdArrowDropdown className="ml-2" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handlePermissionChange(member.id, 1)}>
                            Can Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePermissionChange(member.id, 2)}>
                            Can View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </PermissionCheckComponent>
                  ) : (
                    <span className="border px-2 py-1 rounded bg-accent cursor-not-allowed flex items-center">
                      {getPermissionLabel(member.permission)}
                    </span>
                  )}
                  {canDeleteMember(currentUserPermission, member.id) && (
                    <MdDeleteOutline
                      className="text-red-500 cursor-pointer"
                      onClick={() => handleDeleteMember(member.id)}
                      title="Delete member"
                    />
                  )}
                </div>
              </div>
            ))
          ) : (
            <DropdownMenuItem>No members found</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProjectUsersDropdown;
