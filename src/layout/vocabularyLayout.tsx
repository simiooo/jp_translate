import { Outlet } from "react-router";
import VocabularySidebar from "~/components/VocabularySidebar";

export default function VocabularyLayout() {
  return (
    <div className="flex h-full">
      <VocabularySidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}