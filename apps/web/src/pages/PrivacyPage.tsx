import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Terminal, ArrowLeft, Shield, Mail, Trash2 } from "lucide-react";

export default function PrivacyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-primary/30">
      {/* Header Navigation */}
      <header className="border-b border-border/80 bg-bg-main/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-text-main">Career OS</span>
          </div>

          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="h-8 px-3 text-xs font-semibold text-text-muted hover:text-text-main flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="space-y-3 border-b border-border/60 pb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Privacy Policy</h1>
          <p className="text-xs text-text-dim">Last updated: July 21, 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-text-muted leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-text-main">1. Overview</h2>
            <p>
              Career OS ("we", "our", or "the application") is a personal career operating system built for software engineering students and developers. We respect your privacy and are committed to protecting the information you share with us.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-text-main">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1.5 text-xs">
              <li><strong className="text-text-main">Account Data:</strong> Name, email address, and authentication credentials (or Google OAuth profile info).</li>
              <li><strong className="text-text-main">Career Data:</strong> Applications, job placements, hackathons, assessment dates, interview schedules, skills, and daily routine notes entered by you.</li>
              <li><strong className="text-text-main">AI Extraction Inputs:</strong> Opportunity specifications or text snippets provided by you for AI-assisted parsing.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-text-main">3. How Your Information Is Used</h2>
            <p>
              Your data is strictly used to provide, store, and organize your personal career tracking features. We do not sell your personal data, nor do we share your career pipeline details with recruiters or third-party advertisers.
            </p>
          </section>

          <section className="space-y-2 border-t border-border/60 pt-6">
            <div className="flex items-center gap-2 text-text-main font-semibold text-base">
              <Trash2 className="w-4 h-4 text-primary" />
              <h2>4. Account & Data Deletion Process</h2>
            </div>
            <p>
              You retain full control over your career data. If you wish to delete your account and remove all associated data permanently from our database, you can do so at any time:
            </p>
            <div className="p-4 rounded-lg bg-bg-card border border-border space-y-2 text-xs">
              <div className="font-semibold text-text-main">How to Request Full Data Erasure:</div>
              <p>
                Send an email from your registered account email to{" "}
                <a href="mailto:rohithgowdak18@gmail.com" className="text-primary underline font-medium">
                  rohithgowdak18@gmail.com
                </a>{" "}
                with the subject line <code className="bg-bg-elevated px-1 py-0.5 rounded text-[11px]">"Data Deletion Request - [Your Registered Email]"</code>.
              </p>
              <p className="text-text-dim text-[11px]">
                Upon receiving your request, all your account records, applications, placements, and saved data will be purged from our production database within 7 business days.
              </p>
            </div>
          </section>

          <section className="space-y-2 border-t border-border/60 pt-6">
            <h2 className="text-base font-semibold text-text-main">5. Contact Information</h2>
            <p>
              If you have any questions regarding this Privacy Policy or your data, please contact:
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-text-main">
              <Mail className="w-4 h-4 text-primary" />
              <span>Rohith Gowda K — </span>
              <a href="mailto:rohithgowdak18@gmail.com" className="text-primary underline">
                rohithgowdak18@gmail.com
              </a>
            </div>
          </section>
        </div>

        <footer className="pt-8 border-t border-border/60 flex justify-between items-center text-xs text-text-dim">
          <span>© 2026 Career OS. All rights reserved.</span>
          <button onClick={() => setLocation("/")} className="text-primary hover:underline font-medium cursor-pointer">
            Return to Home
          </button>
        </footer>
      </main>
    </div>
  );
}
