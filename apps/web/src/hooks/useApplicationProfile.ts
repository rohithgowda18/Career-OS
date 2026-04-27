import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ApplicationProfileData {
  fullName?: string;
  college?: string;
  degree?: string;
  graduationYear?: number;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  skills?: string;
  shortBio?: string;
}

export function useApplicationProfile() {
  const [profile, setProfile] = useState<ApplicationProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch profile
  const getProfileQuery = trpc.applicationProfile.get.useQuery();

  // Update profile mutation
  const updateProfileMutation = trpc.applicationProfile.upsert.useMutation({
    onSuccess: (data) => {
      setProfile(data as any);
      toast.success('Profile saved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });

  // Load profile on mount
  useEffect(() => {
    if (getProfileQuery.data) {
      setProfile(getProfileQuery.data as any);
    }
  }, [getProfileQuery.data]);

  const formatProfileForNotes = (): string => {
    if (!profile) return '';

    const lines: string[] = ['', '---', 'Applicant Info:'];

    if (profile.fullName) lines.push(`Name: ${profile.fullName}`);
    if (profile.college) lines.push(`College: ${profile.college}`);
    if (profile.degree) lines.push(`Degree: ${profile.degree}`);
    if (profile.graduationYear) lines.push(`Graduation Year: ${profile.graduationYear}`);
    if (profile.githubUrl) lines.push(`GitHub: ${profile.githubUrl}`);
    if (profile.portfolioUrl) lines.push(`Portfolio: ${profile.portfolioUrl}`);
    if (profile.resumeUrl) lines.push(`Resume: ${profile.resumeUrl}`);
    if (profile.skills) lines.push(`Skills: ${profile.skills}`);
    if (profile.shortBio) lines.push(`Bio: ${profile.shortBio}`);

    lines.push('-----------------------', '');

    return lines.join('\n');
  };

  const saveProfile = async (data: ApplicationProfileData) => {
    setLoading(true);
    try {
      await updateProfileMutation.mutateAsync(data);
    } finally {
      setLoading(false);
    }
  };

  const hasProfile = !!profile && Object.values(profile).some(v => v !== null && v !== undefined && v !== '');

  return {
    profile,
    loading: loading || getProfileQuery.isLoading,
    hasProfile,
    saveProfile,
    formatProfileForNotes,
    updateProfileMutation,
    refetch: getProfileQuery.refetch,
  };
}
