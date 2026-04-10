import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, Trophy, Users, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [, navigate] = useLocation();

  const profileQuery = trpc.profile.getByUsername.useQuery(
    { username: username || "" },
    { enabled: !!username }
  );

  const statsQuery = trpc.profile.getStats.useQuery(
    { username: username || "" },
    { enabled: !!username }
  );

  const applicationsQuery = trpc.profile.getApplications.useQuery(
    { username: username || "" },
    { enabled: !!username }
  );

  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">No username provided</p>
          <Button onClick={() => navigate("/")}> Go Back</Button>
        </div>
      </div>
    );
  }

  if (profileQuery.isLoading || statsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">The user profile you're looking for doesn't exist or is private.</p>
          <Button onClick={() => navigate("/")}> Go Back</Button>
        </div>
      </div>
    );
  }

  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const applications = applicationsQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full border-4 border-accent object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center">
                  <span className="text-3xl font-bold text-accent">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {profile.username}
              </h1>
              {profile.bio && (
                <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
                  {profile.bio}
                </p>
              )}

              {/* Social Links */}
              <div className="flex gap-3 flex-wrap">
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border hover:border-accent transition-colors"
                  >
                    Website <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a
                    href={profile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border hover:border-accent transition-colors"
                  >
                    LinkedIn <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {profile.twitterHandle && (
                  <a
                    href={`https://twitter.com/${profile.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border hover:border-accent transition-colors"
                  >
                    @{profile.twitterHandle} <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Applications */}
            <Card className="card-elevated p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Applications
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalApplications}
                  </p>
                </div>
                <Target className="w-8 h-8 text-accent/50" />
              </div>
            </Card>

            {/* Acceptance Rate */}
            <Card className="card-elevated p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Acceptance Rate
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.acceptanceRate}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent/50" />
              </div>
            </Card>

            {/* Accepted */}
            <Card className="card-elevated p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Accepted
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.acceptedCount}
                  </p>
                </div>
                <Trophy className="w-8 h-8 text-accent/50" />
              </div>
            </Card>

            {/* Under Review */}
            <Card className="card-elevated p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Under Review
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.underReviewCount}
                  </p>
                </div>
                <Users className="w-8 h-8 text-accent/50" />
              </div>
            </Card>
          </div>

          {/* Event Type Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {stats.eventTypeBreakdown.hackathons}
              </p>
              <p className="text-sm text-muted-foreground">Hackathons</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {stats.eventTypeBreakdown.conferences}
              </p>
              <p className="text-sm text-muted-foreground">Conferences</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {stats.eventTypeBreakdown.workshops}
              </p>
              <p className="text-sm text-muted-foreground">Workshops</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {stats.eventTypeBreakdown.other}
              </p>
              <p className="text-sm text-muted-foreground">Other</p>
            </Card>
          </div>
        </div>
      )}

      {/* Applications Portfolio */}
      {applications && applications.length > 0 && (
        <div className="container mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {profile.showAcceptedOnly ? "Accepted Applications" : "Application Portfolio"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app: any) => (
              <Card key={app.id} className="card-elevated p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground flex-1">
                    {app.url ? (
                      <a
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent transition-colors inline-flex items-center gap-2"
                      >
                        {app.eventName}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      app.eventName
                    )}
                  </h3>
                </div>

                <div className="flex gap-2 mb-3">
                  <Badge variant="outline">{app.eventType}</Badge>
                  <Badge
                    variant={
                      app.status === "Accepted"
                        ? "default"
                        : app.status === "Rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {app.status}
                  </Badge>
                </div>

                {app.notes && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {app.notes}
                  </p>
                )}

                {app.deadline && (
                  <p className="text-xs text-muted-foreground">
                    Deadline: {new Date(app.deadline).toLocaleDateString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {applications && applications.length === 0 && (
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">
            No applications to display yet.
          </p>
        </div>
      )}
    </div>
  );
}
