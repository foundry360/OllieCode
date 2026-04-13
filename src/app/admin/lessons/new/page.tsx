import Link from "next/link";
import { LessonStatusStepper } from "@/app/admin/lessons/lesson-status-stepper";
import { NewLessonForm } from "@/app/admin/lessons/new/new-lesson-form";

export default function AdminNewLessonPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-[#6b9e1f]">
          <Link href="/admin/lessons" className="hover:underline">
            ← Lessons
          </Link>
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-slate-900">
          New lesson
        </h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Progress
        </p>
        <div className="mt-4 max-w-2xl">
          <LessonStatusStepper currentStep={1} />
        </div>
      </div>

      <NewLessonForm />
    </div>
  );
}
