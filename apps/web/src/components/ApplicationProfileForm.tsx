import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api/userApi";
import { toast } from "sonner";
import { 
  Loader2, 
  User, 
  Mail, 
  School, 
  Github, 
  Linkedin, 
  Globe, 
  MapPin, 
  Sliders, 
  ShieldAlert 
} from "lucide-react";

export default function ApplicationProfileForm() {
  const { currentTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", "profile"],
    queryFn: userApi.getProfile,
  });

  const [formData, setFormData] = useState({
    college: "",
    skills: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    location: "",
    emailAlerts: true,
    weeklyDigest: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        college: profile.college || "",
        skills: profile.skills || "",
        githubUrl: profile.githubUrl || "",
        linkedinUrl: profile.linkedinUrl || "",
        portfolioUrl: profile.portfolioUrl || "",
        location: profile.location || "",
        emailAlerts: profile.emailAlerts !== undefined ? profile.emailAlerts : true,
        weeklyDigest: profile.weeklyDigest !== undefined ? profile.weeklyDigest : false,
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      toast.success("Settings saved successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update profile settings"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: Navigation Quick Menu / Summary */}
        <div className="w-full lg:w-[280px] space-y-4 shrink-0">
          <div className="bg-bg-card border border-border rounded-xl p-5 text-center flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-bg-elevated border border-border flex items-center justify-center shadow-inner">
                <User className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h2 className="text-sm font-semibold text-text-main tracking-tight">Account Settings</h2>
            <p className="text-[10px] text-text-dim uppercase tracking-wider mt-1">{profile?.email}</p>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3.5 text-xs text-text-muted">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-text-dim" />
              <span className="truncate">{profile?.email || "No email linked"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-text-dim" />
              <span>{formData.location || "Location undefined"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Grouped Settings Form */}
        <div className="flex-1 w-full">
          <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-xl p-6 md:p-8 space-y-8">
            
            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim border-b border-border/40 pb-2 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[11px] font-semibold text-text-muted">Email Address</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-bg-elevated/40 border-border text-text-dim h-10 text-xs font-medium cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-[11px] font-semibold text-text-muted">Residency / Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                    className="bg-bg-elevated border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Education */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim border-b border-border/40 pb-2 flex items-center gap-2">
                <School className="w-3.5 h-3.5" /> Academic Information
              </h3>
              <div className="space-y-1.5">
                <Label htmlFor="college" className="text-[11px] font-semibold text-text-muted">Institution Name</Label>
                <Input
                  id="college"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="e.g. Stanford University"
                  className="bg-bg-elevated border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
                />
              </div>
            </div>

            {/* Section 3: Skills */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim border-b border-border/40 pb-2">Skills & Capabilities</h3>
              <div className="space-y-1.5">
                <Label htmlFor="skills" className="text-[11px] font-semibold text-text-muted">Professional Keywords</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="React, TypeScript, Spring Boot, Data Structures, Machine Learning..."
                  className="bg-bg-elevated border-border text-text-main min-h-[100px] text-xs font-semibold leading-relaxed focus:border-primary/65 resize-none"
                />
                <p className="text-[10px] text-text-dim/60 italic">Separate items with commas to optimize keyword extractions.</p>
              </div>
            </div>

            {/* Section 4: Digital Fingerprints (Links) */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim border-b border-border/40 pb-2 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Professional Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="github" className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-text-dim" /> GitHub URL
                  </Label>
                  <Input
                    id="github"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                    className="bg-bg-elevated border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin" className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-text-dim" /> LinkedIn URL
                  </Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                    className="bg-bg-elevated border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="portfolio" className="text-[11px] font-semibold text-text-muted flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-text-dim" /> Portfolio Website
                  </Label>
                  <Input
                    id="portfolio"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    placeholder="https://mywebsite.com"
                    className="bg-bg-elevated border-border text-text-main h-10 text-xs font-semibold focus:border-primary/65"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Preferences */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim border-b border-border/40 pb-2 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" /> Workspace Preferences
              </h3>
              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-muted">
                  <input
                    type="checkbox"
                    checked={formData.emailAlerts}
                    onChange={(e) => setFormData({ ...formData, emailAlerts: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-bg-elevated text-primary focus:ring-primary/20 accent-primary"
                  />
                  <span>Enable instant email notifications on status transitions</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-muted">
                  <input
                    type="checkbox"
                    checked={formData.weeklyDigest}
                    onChange={(e) => setFormData({ ...formData, weeklyDigest: e.target.checked })}
                    className="w-4 h-4 rounded border-border bg-bg-elevated text-primary focus:ring-primary/20 accent-primary"
                  />
                  <span>Send weekly digest summary of upcoming calendar deadlines</span>
                </label>
              </div>
            </div>

            {/* Section 6: Appearance (Theme Settings)
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim border-b border-border/40 pb-2 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" /> Appearance Settings
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {[
                  { id: "glass", name: "Glass (VisionOS)", previewBg: "bg-gradient-to-br from-indigo-200 to-rose-200", accent: "bg-violet-600" },
                  { id: "cyberpunk", name: "Cyberpunk", previewBg: "bg-[#04040a]", accent: "bg-cyan-400" },
                  { id: "brutalist", name: "Neo Brutalist", previewBg: "bg-[#eae6e1]", accent: "bg-black" },
                  { id: "terminal", name: "Retro Terminal", previewBg: "bg-black", accent: "bg-[#00ff00]" },
                  { id: "claymorphism", name: "Claymorphism", previewBg: "bg-sky-100", accent: "bg-pink-400" }
                ].map((t) => {
                  const isSelected = currentTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer",
                        isSelected 
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                          : "border-border hover:bg-bg-elevated/40"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border border-border shadow-sm", t.previewBg)}>
                        <div className={cn("w-4 h-4 rounded-full", t.accent)} />
                      </div>
                      <span className="text-[11px] font-bold text-text-main leading-tight">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div> */}

            {/* Submit Action */}
            <div className="pt-4 border-t border-border/60 flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-primary hover:bg-primary-hover text-white font-semibold h-9.5 px-6 rounded-lg transition-all"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </div>

            {/* Bookmarklet Tool Block */}
            <div className="pt-6 border-t border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-dim mb-3">Utility Tools</h4>
              <div className="p-4.5 rounded-lg bg-bg-elevated/20 border border-border flex flex-col md:flex-row items-center gap-5">
                <div className="flex-1 space-y-1">
                  <h5 className="text-xs font-bold text-text-main">Save Event Bookmarklet</h5>
                  <p className="text-[11px] text-text-dim leading-relaxed">
                    Drag this button to your bookmarks bar. Click it on portal listings (like Unstop) to automatically capture event listings.
                  </p>
                </div>
                <a 
                  href={`javascript:(function(){try{var d=document,w=window,l=w.location,t=d.title,u=l.href,date='',loc='',desc='';if(l.hostname.includes('unstop.com')){t=d.querySelector('h1')?.innerText||t;var text=d.body.innerText;var dm=text.match(/-->\\s*(\\d{1,2}\\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+(\\d{4}|\\d{2}))/i);if(dm){date=dm[1];}else{var matches=text.match(/\\d{1,2}\\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+(\\d{4}|\\d{2})/gi);if(matches)date=matches[0];}var ks=['remote','online','india','bangalore','delhi','mumbai'];var tl=text.toLowerCase();for(var k of ks){if(tl.includes(k)){loc=k.charAt(0).toUpperCase()+k.slice(1);break;}}}var p=new URLSearchParams({title:t,url:u,date:date,location:loc,description:desc});w.open('${window.location.origin}/add?'+p.toString(),'_blank');}catch(e){w.open('${window.location.origin}/add?url='+encodeURIComponent(l.href),'_blank');}})();`}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap shrink-0"
                  onClick={(e) => e.preventDefault()}
                >
                  Save to Career OS
                </a>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
