import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { LocalTime } from "@/components/admin/overlay";
import { Card, EmptyState } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { listActivity } from "@/lib/team/store";

export const metadata: Metadata = { title: "Activity" };

const LIMIT = 200;

/** Who changed what in the admin, newest first. */
export default async function TeamActivityPage() {
  await requireAccess("team");
  const activity = await listActivity(LIMIT);

  return (
    <Card
      title="Activity"
      description={`Every change made in the admin. The latest ${LIMIT} are shown.`}
      bodyClassName="p-0 sm:p-0"
    >
      {activity.length === 0 ? (
        <EmptyState icon={<ScrollText className="size-5" />} title="Nothing yet">
          Changes made in the admin appear here.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                <th className="px-4 py-2.5 sm:px-5">When</th>
                <th className="px-3 py-2.5">Who</th>
                <th className="px-3 py-2.5">What</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {activity.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <td className="px-4 py-2.5 whitespace-nowrap text-zinc-500 sm:px-5">
                    <LocalTime iso={entry.at} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-semibold text-zinc-900" title={entry.actorEmail}>
                      {entry.actorName}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-700">{entry.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
