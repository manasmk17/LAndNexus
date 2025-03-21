import Hero from "@/components/home/hero";
import HowItWorks from "@/components/home/how-it-works";
import FeaturedProfessionals from "@/components/home/featured-professionals";
import FeaturedJobs from "@/components/home/featured-jobs";
import ResourceHub from "@/components/home/resource-hub";
import Testimonials from "@/components/home/testimonials";
import Pricing from "@/components/home/pricing";
import CTA from "@/components/home/cta";
import { useState } from 'react';

// Placeholder for EditableContent component -  This needs a proper implementation using a library like react-grid-layout
const EditableContent = ({ isEditing, content, onSave }) => {
  if (!isEditing) {
    return (
      <div>
        <Hero />
        <HowItWorks />
        <FeaturedProfessionals />
        <FeaturedJobs />
        <ResourceHub />
        <Testimonials />
        <Pricing />
        <CTA />
      </div>
    );
  }
  return (
    <div>
      {/* Placeholder for editable content */}
      <p>Editable content here.  (Implementation needed using react-grid-layout or similar)</p>
      <button onClick={onSave}>Save Changes</button>
    </div>
  );
};

export default function Home() {
  const [isEditing, setIsEditing] = useState(false);
  const user = { userType: 'admin' }; // Placeholder user data.  Should be replaced with actual user authentication
  const pageContent = {}; // Placeholder for page content. Needs proper data structure for editing.
  const handleSave = () => {
    // Placeholder for save functionality.  Needs actual implementation to save changes.
    console.log('Saving changes...');
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {user?.userType === 'admin' && (
        <button
          className="mb-4 bg-primary text-white px-4 py-2 rounded"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Content'}
        </button>
      )}
      <EditableContent
        isEditing={isEditing}
        content={pageContent}
        onSave={handleSave}
      />
    </div>
  );
}