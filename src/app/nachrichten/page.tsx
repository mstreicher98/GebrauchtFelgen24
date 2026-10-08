import { MessageCircle } from "lucide-react";
import { PushOptIn } from "@/components/push-opt-in";

export default function MessagesIndex() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <MessageCircle className="h-12 w-12 text-faint" />
      <p className="mt-4 text-muted">Wähle links eine Unterhaltung aus.</p>
      <div className="mt-6 max-w-sm">
        <PushOptIn />
      </div>
    </div>
  );
}
