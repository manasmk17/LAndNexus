import { useLocation, Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    parent?: string;
  };
}

const breadcrumbConfig: BreadcrumbConfig = {
  "/": { label: "Home" },
  "/professionals": { label: "Professionals", parent: "/" },
  "/jobs": { label: "Jobs", parent: "/" },
  "/resources": { label: "Resources", parent: "/" },
  "/forum": { label: "Forum", parent: "/" },
  "/messages": { label: "Messages", parent: "/" },
  "/admin": { label: "Admin", parent: "/" },
  "/admin/dashboard": { label: "Dashboard", parent: "/admin" },
  "/admin/users": { label: "Users", parent: "/admin" },
  "/admin/content": { label: "Content", parent: "/admin" },
  "/professional-dashboard": { label: "Dashboard", parent: "/" },
  "/company-dashboard": { label: "Dashboard", parent: "/" },
  "/edit-profile": { label: "Edit Profile", parent: "/" },
  "/create-resource": { label: "Create Resource", parent: "/resources" },
  "/post-job": { label: "Post Job", parent: "/jobs" },
  "/checkout": { label: "Checkout", parent: "/" },
  "/subscribe": { label: "Subscribe", parent: "/" },
  "/book-consultation": { label: "Book Consultation", parent: "/professionals" },
  "/career-recommendations": { label: "Career Recommendations", parent: "/" },
};

function generateBreadcrumbs(pathname: string): Array<{ label: string; href?: string }> {
  const breadcrumbs: Array<{ label: string; href?: string }> = [];
  
  let currentPath = pathname;
  
  if (pathname.startsWith("/jobs/") && pathname !== "/jobs") {
    breadcrumbs.push({ label: "Home", href: "/" });
    breadcrumbs.push({ label: "Jobs", href: "/jobs" });
    breadcrumbs.push({ label: "Job Details" });
    return breadcrumbs;
  }
  
  if (pathname.startsWith("/professionals/") && pathname !== "/professionals") {
    breadcrumbs.push({ label: "Home", href: "/" });
    breadcrumbs.push({ label: "Professionals", href: "/professionals" });
    breadcrumbs.push({ label: "Profile" });
    return breadcrumbs;
  }
  
  if (pathname.startsWith("/resources/") && pathname !== "/resources") {
    breadcrumbs.push({ label: "Home", href: "/" });
    breadcrumbs.push({ label: "Resources", href: "/resources" });
    breadcrumbs.push({ label: "Resource Details" });
    return breadcrumbs;
  }

  const config = breadcrumbConfig[currentPath];
  if (!config) {
    return [{ label: "Home", href: "/" }];
  }

  function buildTrail(path: string): void {
    const config = breadcrumbConfig[path];
    if (config?.parent) {
      buildTrail(config.parent);
    }
    breadcrumbs.push({
      label: config?.label || "Unknown",
      href: path === pathname ? undefined : path
    });
  }

  buildTrail(currentPath);
  return breadcrumbs;
}

export function BreadcrumbNavigation() {
  const [location] = useLocation();
  const breadcrumbs = generateBreadcrumbs(location);

  if (breadcrumbs.length <= 1 || location === "/") {
    return null;
  }

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index}>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}