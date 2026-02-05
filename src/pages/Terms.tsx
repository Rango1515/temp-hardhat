 import { Link } from "react-router-dom";
 import { ArrowLeft, HardHat } from "lucide-react";
 
 export default function Terms() {
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
 
         <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
         
         <div className="prose prose-invert max-w-none space-y-6">
           <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
             <p className="text-muted-foreground">
               By accessing and using the Hardhat Hosting services, you agree to be bound by these Terms of Service. 
               If you do not agree with any part of these terms, you may not use our services.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">2. Services Provided</h2>
             <p className="text-muted-foreground">
               Hardhat Hosting provides web hosting, website design, and related digital services for contractors 
               and small businesses. Our services include but are not limited to website development, hosting, 
               and VoIP calling platform access.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold text-destructive">3. Payment Terms & Refund Policy</h2>
             <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
               <p className="text-foreground font-medium mb-2">IMPORTANT: ALL PURCHASES ARE FINAL AND NON-REFUNDABLE</p>
               <p className="text-muted-foreground">
                 All payments made for Hardhat Hosting services are final. We do not offer refunds for any services 
                 rendered, including but not limited to hosting fees, design services, or subscription charges.
               </p>
             </div>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold text-destructive">4. Chargeback Policy</h2>
             <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 space-y-3">
               <p className="text-foreground font-medium">By using our services, you agree to the following:</p>
               <ul className="list-disc list-inside text-muted-foreground space-y-2">
                 <li>
                   <strong>Immediate Account Suspension:</strong> Any chargeback or payment dispute initiated against 
                   Hardhat Hosting will result in immediate suspension of your account and all associated services.
                 </li>
                 <li>
                   <strong>Fee Recovery:</strong> You will be responsible for all fees associated with chargebacks, 
                   including but not limited to bank fees, processing fees, and administrative costs.
                 </li>
                 <li>
                   <strong>Fraudulent Chargebacks:</strong> Initiating a fraudulent or unwarranted chargeback 
                   constitutes a breach of this agreement. We reserve the right to pursue all available legal 
                   remedies to recover losses.
                 </li>
                 <li>
                   <strong>Collections:</strong> Unpaid balances resulting from chargebacks may be sent to 
                   collections agencies and reported to credit bureaus.
                 </li>
               </ul>
             </div>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">5. Account Responsibilities</h2>
             <p className="text-muted-foreground">
               You are responsible for maintaining the confidentiality of your account credentials and for all 
               activities that occur under your account. You must immediately notify us of any unauthorized use.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">6. Acceptable Use</h2>
             <p className="text-muted-foreground">
               You agree not to use our services for any unlawful purpose or in any way that could damage, 
               disable, or impair our services. Prohibited activities include but are not limited to spamming, 
               harassment, and distribution of malware.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">7. Termination</h2>
             <p className="text-muted-foreground">
               We reserve the right to terminate or suspend your account at any time for violations of these 
               terms or for any other reason at our sole discretion. Upon termination, you will not be entitled 
               to any refund of fees paid.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
             <p className="text-muted-foreground">
               Hardhat Hosting shall not be liable for any indirect, incidental, special, consequential, or 
               punitive damages resulting from your use of or inability to use our services.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">9. Changes to Terms</h2>
             <p className="text-muted-foreground">
               We reserve the right to modify these terms at any time. Continued use of our services after 
               changes constitutes acceptance of the modified terms.
             </p>
           </section>
 
           <section className="space-y-4">
             <h2 className="text-xl font-semibold">10. Contact Information</h2>
             <p className="text-muted-foreground">
               For questions about these Terms of Service, please contact us at{" "}
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