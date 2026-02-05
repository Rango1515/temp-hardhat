 import { Link } from "react-router-dom";
 import { ArrowLeft, HardHat } from "lucide-react";
 
 export default function Privacy() {
   return (
     <div className="min-h-screen bg-background">
       <header className="border-b border-border">
         <div className="container mx-auto px-4 py-4">
           <Link to="/" className="flex items-center gap-2 group">
             <div className="bg-primary p-2 rounded-lg">
               <HardHat className="w-5 h-5 text-primary-foreground" />
             </div>
             <span className="font-display text-lg text-foreground">HARDHAT HOSTING</span>
           </Link>
         </div>
       </header>
 
       <main className="container mx-auto px-4 py-12 max-w-3xl">
         <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
           <ArrowLeft className="w-4 h-4" />
           Back to Home
         </Link>
 
         <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
         
         <div className="prose prose-invert max-w-none space-y-6">
           <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">1. Information We Collect</h2>
             <p className="text-muted-foreground">
               We collect information you provide directly to us, including:
             </p>
             <ul className="list-disc list-inside text-muted-foreground space-y-1">
               <li>Name and contact information (email, phone number)</li>
               <li>Account credentials</li>
               <li>Payment information</li>
               <li>Business information</li>
               <li>Communications with us</li>
             </ul>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
             <p className="text-muted-foreground">
               We use the information we collect to:
             </p>
             <ul className="list-disc list-inside text-muted-foreground space-y-1">
               <li>Provide, maintain, and improve our services</li>
               <li>Process transactions and send related information</li>
               <li>Send technical notices, updates, and support messages</li>
               <li>Respond to your comments and questions</li>
               <li>Protect against fraudulent or illegal activity</li>
             </ul>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">3. Information Sharing</h2>
             <p className="text-muted-foreground">
               We do not sell, trade, or rent your personal information to third parties. We may share 
               information with service providers who assist in our operations, or when required by law.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">4. Data Security</h2>
             <p className="text-muted-foreground">
               We implement appropriate technical and organizational measures to protect your personal 
               information against unauthorized access, alteration, disclosure, or destruction.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">5. Call Recording Disclosure</h2>
             <p className="text-muted-foreground">
               If you use our VoIP services, please be aware that calls may be recorded for quality 
               assurance and training purposes. By using our calling platform, you consent to such recordings.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">6. Cookies and Tracking</h2>
             <p className="text-muted-foreground">
               We use cookies and similar tracking technologies to track activity on our services and 
               hold certain information. You can instruct your browser to refuse all cookies or to indicate 
               when a cookie is being sent.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">7. Your Rights</h2>
             <p className="text-muted-foreground">
               You have the right to access, correct, or delete your personal information. To exercise 
               these rights, please contact us at the email address below.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">8. Children's Privacy</h2>
             <p className="text-muted-foreground">
               Our services are not directed to individuals under 18. We do not knowingly collect 
               personal information from children.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
             <p className="text-muted-foreground">
               We may update this Privacy Policy from time to time. We will notify you of any changes 
               by posting the new policy on this page.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">10. Contact Us</h2>
             <p className="text-muted-foreground">
               If you have questions about this Privacy Policy, please contact us at{" "}
               <a href="mailto:admin@hardhathosting.work" className="text-primary hover:underline">
                 admin@hardhathosting.work
               </a>
             </p>
           </section>
         </div>
       </main>
     </div>
   );
 }