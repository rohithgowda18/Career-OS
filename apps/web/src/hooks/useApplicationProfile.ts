import { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profileApi";
import { toast } from 'sonner';

interface ApplicationProfileData {
  college?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skills?: string;
  location?: string;
}

export function useApplicationProfile() {
  const [profile, setProfile] = useState<ApplicationProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch profile
  const getProfileQuery = useQuery({ queryKey: ['applicationProfile'], queryFn: profileApi.me });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: profileApi.upsertApplicationProfile,
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

    if (profile.college) lines.push(`College: ${profile.college}`);
    if (profile.location) lines.push(`Location: ${profile.location}`);
    if (profile.githubUrl) lines.push(`GitHub: ${profile.githubUrl}`);
    if (profile.linkedinUrl) lines.push(`LinkedIn: ${profile.linkedinUrl}`);
    if (profile.portfolioUrl) lines.push(`Portfolio: ${profile.portfolioUrl}`);
    if (profile.skills) lines.push(`Skills: ${profile.skills}`);

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
