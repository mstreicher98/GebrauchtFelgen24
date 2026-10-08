import type { Metadata } from "next";
import { ChatShell } from "@/components/chat-list";
import { listConversations } from "@/lib/conversations";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Nachrichten", robots: { index: false } };

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser("/nachrichten");
  const conversations = await listConversations(me.id);
  return (
    <ChatShell conversations={conversations} meId={me.id}>
      {children}
    </ChatShell>
  );
}
