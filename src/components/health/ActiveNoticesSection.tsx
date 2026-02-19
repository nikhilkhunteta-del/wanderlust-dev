import { HealthNotice } from "@/types/healthData";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActiveNoticesSectionProps {
  notices: HealthNotice[];
}

export const ActiveNoticesSection = ({ notices }: ActiveNoticesSectionProps) => {
  if (notices.length === 0) return null;

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold">Active Notices</h3>
      <div className="space-y-3">
        {notices.map((notice, index) => (
          <Card key={index} className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{notice.title}</h4>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {notice.source}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notice.summary}</p>
                  <div className="flex items-center justify-between">
                    <a
                      href={notice.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View official notice
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {notice.date && (
                      <span className="text-xs text-muted-foreground/60">{notice.date}</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
