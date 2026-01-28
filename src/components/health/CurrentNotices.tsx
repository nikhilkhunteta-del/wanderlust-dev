import { HealthNotice } from "@/types/healthNotices";
import { ExternalLink, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CurrentNoticesProps {
  notices: HealthNotice[];
}

export const CurrentNotices = ({ notices }: CurrentNoticesProps) => {
  if (notices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Current Official Notices</h3>
      <div className="space-y-3">
        {notices.map((notice, index) => (
          <Card key={index} className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{notice.title}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                      {notice.source}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notice.summary}</p>
                  <a
                    href={notice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                  >
                    View official notice
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
