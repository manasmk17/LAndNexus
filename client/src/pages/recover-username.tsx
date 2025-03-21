import RecoverUsernameForm from "@/components/auth/recover-username-form";

export default function RecoverUsernamePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <RecoverUsernameForm />
      </div>
    </div>
  );
}