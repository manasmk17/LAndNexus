import { useParams } from "wouter";
import { EditJobForm } from "@/components/job/edit-job-form";

export default function EditJobPage() {
  const params = useParams() as { id: string };
  const jobId = parseInt(params.id);

  if (isNaN(jobId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Job ID</h1>
          <p className="text-muted-foreground">The job posting ID provided is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EditJobForm jobId={jobId} />
    </div>
  );
}