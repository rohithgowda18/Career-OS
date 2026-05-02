import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api/userApi";
import { toast } from "sonner";
import { Loader2, User, Mail, School, Github, Linkedin, Globe, MapPin, Sparkles } from "lucide-react";

export default function ApplicationProfileForm() {
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
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update profile"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        {/* Left Column: Summary */}
        <div className="lg:w-1/3 space-y-6">
          <div className="card-premium p-10 text-center flex flex-col items-center bg-bg-card/40">
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-[2.5rem] bg-bg-elevated border border-border flex items-center justify-center shadow-2xl transition-transform hover:rotate-3 duration-500">
                <User className="w-14 h-14 text-primary" />
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-2xl bg-primary border border-white/20 flex items-center justify-center shadow-xl shadow-primary/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-text-main tracking-tight">Identity Settings</h2>
            <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mt-2 opacity-60">Personal Core Data</p>
          </div>

          <div className="card-premium p-6 space-y-5 bg-bg-card/20">
            <div className="flex items-center gap-4 text-text-muted group">
              <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center group-hover:border-primary/40 transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold truncate tracking-tight">{profile?.email || "No email linked"}</span>
            </div>
            <div className="flex items-center gap-4 text-text-muted group">
              <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center group-hover:border-primary/40 transition-colors">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold tracking-tight">{formData.location || "Location undefined"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Form */}
        <div className="lg:flex-1">
          <form onSubmit={handleSubmit} className="card-premium p-8 md:p-12 space-y-10 bg-bg-card/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <Label htmlFor="college" className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 flex items-center gap-2">
                  <School className="w-3.5 h-3.5" /> Institution
                </Label>
                <Input
                  id="college"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="University Name"
                  className="input-premium h-12 text-sm font-semibold"
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Residency
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                  className="input-premium h-12 text-sm font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="skills" className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">Professional Capabilities</Label>
              <Textarea
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="e.g. Full-stack Architecture, React Native, AWS Deployment..."
                className="input-premium min-h-[140px] resize-none text-sm font-semibold leading-relaxed"
              />
              <p className="text-[10px] text-text-muted italic opacity-40">These keywords power your smart profile and future application matching.</p>
            </div>

            <div className="space-y-8 pt-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-main border-b border-border/50 pb-3">Digital Fingerprint</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <Label htmlFor="github" className="text-[10px] font-black text-text-muted opacity-60 flex items-center gap-2">
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </Label>
                  <Input
                    id="github"
                    value={formData.githubUrl}
                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                    placeholder="github.com/identity"
                    className="input-premium h-12 text-sm font-semibold"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="linkedin" className="text-[10px] font-black text-text-muted opacity-60 flex items-center gap-2">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="linkedin.com/in/identity"
                    className="input-premium h-12 text-sm font-semibold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2.5">
                  <Label htmlFor="portfolio" className="text-[10px] font-black text-text-muted opacity-60 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Personal Domain
                  </Label>
                  <Input
                    id="portfolio"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    placeholder="https://identity.com"
                    className="input-premium h-12 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold h-12 px-8 rounded-lg transition-all"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Commit Changes
              </Button>
            </div>

            {/* Flat Style Bookmarklet Section */}
            <div className="pt-10 mt-10 border-t border-[#27272a]">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa] mb-4">Tools</h4>
              <div className="p-6 rounded-xl bg-[#0f0f10] border border-[#27272a] flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                   <h5 className="text-sm font-bold text-[#e4e4e7] mb-1">Save Event Bookmarklet</h5>
                   <p className="text-xs text-[#a1a1aa] leading-relaxed">
                     Drag the button to your bookmarks bar. Use it on any site to instantly import event details.
                   </p>
                </div>
                <a 
                  href={`javascript:(function(){try{var d=document,w=window,l=w.location,t=d.title,u=l.href,date='',loc='',desc='';if(l.hostname.includes('unstop.com')){t=d.querySelector('h1')?.innerText||t;var text=d.body.innerText;var dm=text.match(/-->\\s*(\\d{1,2}\\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+(\\d{4}|\\d{2}))/i);if(dm){date=dm[1];}else{var matches=text.match(/\\d{1,2}\\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\s+(\\d{4}|\\d{2})/gi);if(matches)date=matches[0];}var ks=['remote','online','india','bangalore','delhi','mumbai'];var tl=text.toLowerCase();for(var k of ks){if(tl.includes(k)){loc=k.charAt(0).toUpperCase()+k.slice(1);break;}}}var p=new URLSearchParams({title:t,url:u,date:date,location:loc,description:desc});w.open('${window.location.origin}/add?'+p.toString(),'_blank');}catch(e){w.open('${window.location.origin}/add?url='+encodeURIComponent(l.href),'_blank');}})();`}
                  className="px-6 py-3 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold rounded-lg transition-all whitespace-nowrap"
                  onClick={(e) => e.preventDefault()}
                >
                  Save to EventTracker
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
