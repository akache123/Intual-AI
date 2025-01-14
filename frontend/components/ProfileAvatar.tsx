import React from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FiUser, FiLogIn, FiUserPlus, FiLogOut } from 'react-icons/fi';
import { useRouter } from 'next/router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ProfileAvatar = ({ isVisible = true }: { isVisible?: boolean }) => {

  const { isSignedIn, user } = useUser();

  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const handleSignIn = () => {
    router.push('/sign-in');
  };

  const handleSignUp = () => {
    router.push('/sign-up');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 right-0 z-10 p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="w-12 h-12 cursor-pointer">
            {isSignedIn && user?.firstName ? (
              <AvatarFallback className="text-lg">{user.firstName[0]}</AvatarFallback>
            ) : (
              <AvatarFallback className="text-lg">
                <FiUser size={36} />
              </AvatarFallback>
            )}
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isSignedIn ? (
            <>
              <DropdownMenuItem onClick={handleSignIn}>
                <FiLogIn className="mr-2 h-4 w-4" />
                <span>Sign In</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignUp}>
                <FiUserPlus className="mr-2 h-4 w-4" />
                <span>Sign Up</span>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={handleSignOut}>
              <FiLogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileAvatar;
