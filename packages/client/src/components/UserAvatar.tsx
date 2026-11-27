import React, { useEffect, useState } from 'react';
import { User } from '../types.js';

interface UserAvatarProps {
  user?: Pick<User, 'photoUrl' | 'firstName' | 'lastName' | 'username'> | null;
  sizeClass?: string;
  roundedClass?: string;
  textClass?: string;
}

function getInitials(user?: Pick<User, 'firstName' | 'lastName' | 'username'> | null): string {
  const first = user?.firstName?.trim().charAt(0) || '';
  const last = user?.lastName?.trim().charAt(0) || '';
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  const handle = user?.username?.trim().charAt(0) || '';
  return handle ? handle.toUpperCase() : 'U';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  sizeClass = 'w-10 h-10',
  roundedClass = 'rounded-xl',
  textClass = 'text-sm',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [user?.photoUrl]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Contributor';

  if (user?.photoUrl && !imgFailed) {
    return (
      <img
        src={user.photoUrl}
        alt={displayName}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${sizeClass} ${roundedClass} object-cover bg-[#191C24] border border-white/[0.1] shrink-0`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${sizeClass} ${roundedClass} bg-[#191C24] border border-white/[0.1] flex items-center justify-center font-semibold text-zinc-100 shrink-0 ${textClass}`}
    >
      {getInitials(user)}
    </div>
  );
};
