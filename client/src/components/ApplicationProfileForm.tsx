import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useApplicationProfile } from '@/hooks/useApplicationProfile';

export default function ApplicationProfileForm() {
  const { profile, loading, saveProfile, updateProfileMutation } = useApplicationProfile();
  const [formData, setFormData] = useState({
    fullName: '',
    college: '',
    degree: '',
    graduationYear: new Date().getFullYear(),
    githubUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    skills: '',
    shortBio: '',
  });

  // Load profile data on mount
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        college: profile.college || '',
        degree: profile.degree || '',
        graduationYear: profile.graduationYear || new Date().getFullYear(),
        githubUrl: profile.githubUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        resumeUrl: profile.resumeUrl || '',
        skills: profile.skills || '',
        shortBio: profile.shortBio || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    await saveProfile(formData);
  };

  const hasChanges = profile && (
    profile.fullName !== formData.fullName ||
    profile.college !== formData.college ||
    profile.degree !== formData.degree ||
    profile.graduationYear !== formData.graduationYear ||
    profile.githubUrl !== formData.githubUrl ||
    profile.portfolioUrl !== formData.portfolioUrl ||
    profile.resumeUrl !== formData.resumeUrl ||
    profile.skills !== formData.skills ||
    profile.shortBio !== formData.shortBio
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Application Profile</h3>
        <p className="text-sm text-muted-foreground">
          Set up your profile once, then autofill it in any new application form
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Your full name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        {/* College */}
        <div className="space-y-2">
          <Label htmlFor="college">College/University</Label>
          <Input
            id="college"
            placeholder="e.g., MIT, Stanford, etc."
            value={formData.college}
            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
          />
        </div>

        {/* Degree */}
        <div className="space-y-2">
          <Label htmlFor="degree">Degree</Label>
          <Input
            id="degree"
            placeholder="e.g., B.S. in Computer Science"
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
          />
        </div>

        {/* Graduation Year */}
        <div className="space-y-2">
          <Label htmlFor="graduationYear">Graduation Year</Label>
          <Input
            id="graduationYear"
            type="number"
            placeholder="2025"
            value={formData.graduationYear || ''}
            onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) || 0 })}
          />
        </div>

        {/* GitHub URL */}
        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub Profile</Label>
          <Input
            id="githubUrl"
            placeholder="https://github.com/username"
            value={formData.githubUrl}
            onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
          />
        </div>

        {/* Portfolio URL */}
        <div className="space-y-2">
          <Label htmlFor="portfolioUrl">Portfolio Website</Label>
          <Input
            id="portfolioUrl"
            placeholder="https://yourportfolio.com"
            value={formData.portfolioUrl}
            onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
          />
        </div>

        {/* Resume URL */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="resumeUrl">Resume/CV Link</Label>
          <Input
            id="resumeUrl"
            placeholder="https://drive.google.com/file/d/..."
            value={formData.resumeUrl}
            onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
          />
        </div>

        {/* Skills */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="skills">Skills (comma separated)</Label>
          <Input
            id="skills"
            placeholder="React, TypeScript, Python, Machine Learning, etc."
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
        </div>

        {/* Short Bio */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="shortBio">Short Bio</Label>
          <Textarea
            id="shortBio"
            placeholder="A brief bio about yourself (2-3 sentences)"
            value={formData.shortBio}
            onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={loading || !hasChanges}
        >
          {loading && updateProfileMutation.isPending && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
        </Button>
        {!hasChanges && profile && (
          <p className="text-xs text-muted-foreground self-center">
            ✓ Profile saved
          </p>
        )}
      </div>

      {/* Preview */}
      {(formData.fullName || formData.college || formData.skills) && (
        <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
          <h4 className="text-sm font-semibold mb-3">Preview (as it will appear in notes)</h4>
          <div className="text-xs space-y-1 font-mono text-muted-foreground">
            <p>---</p>
            <p>Applicant Info:</p>
            {formData.fullName && <p>Name: {formData.fullName}</p>}
            {formData.college && <p>College: {formData.college}</p>}
            {formData.degree && <p>Degree: {formData.degree}</p>}
            {formData.graduationYear && <p>Graduation Year: {formData.graduationYear}</p>}
            {formData.githubUrl && <p>GitHub: {formData.githubUrl}</p>}
            {formData.portfolioUrl && <p>Portfolio: {formData.portfolioUrl}</p>}
            {formData.resumeUrl && <p>Resume: {formData.resumeUrl}</p>}
            {formData.skills && <p>Skills: {formData.skills}</p>}
            {formData.shortBio && <p>Bio: {formData.shortBio}</p>}
            <p>-----------------------</p>
          </div>
        </div>
      )}
    </div>
  );
}
