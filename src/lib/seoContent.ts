export interface SeoPageData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeading: string;
  heroSubheading: string;
  introText: string;
  features: { title: string; description: string }[];
  whyUs: string[];
  ctaText: string;
  faqItems: { question: string; answer: string }[];
}

export const seoPages: Record<string, SeoPageData> = {
  "electrician-website-design": {
    slug: "electrician-website-design",
    title: "Electrician Website Design",
    metaTitle: "Electrician Website Design | Get More Electrical Jobs Online",
    metaDescription: "Professional website design for electricians starting at $300. Mobile-friendly, SEO-optimized sites that generate leads for your electrical business in the Inland Empire.",
    heroHeading: "Electrician Website Design That Generates Leads",
    heroSubheading: "Get a professional website built specifically for your electrical contracting business",
    introText: "In today's digital world, homeowners and businesses search online first when they need an electrician. Without a professional website, you're losing jobs to competitors who show up in Google searches. Hardhat Hosting specializes in building fast, mobile-friendly websites for electricians that rank well in local search results and convert visitors into paying customers.",
    features: [
      { title: "Service Area Pages", description: "Dedicated pages for each city you serve, helping you rank in local searches across the Inland Empire." },
      { title: "Emergency Service Callout", description: "Prominent 24/7 emergency contact buttons so urgent customers can reach you instantly." },
      { title: "License & Insurance Display", description: "Build trust by prominently showcasing your contractor license number and insurance coverage." },
      { title: "Online Quote Requests", description: "Easy-to-use contact forms that capture job details so you can provide accurate estimates." },
    ],
    whyUs: [
      "Websites designed specifically for electrical contractors",
      "Mobile-optimized so customers can call you from their phone",
      "Local SEO targeting cities across the Inland Empire",
      "Fast loading speeds for better Google rankings",
      "Starting at just $300 with $25/mo hosting",
    ],
    ctaText: "Get Your Electrician Website Today",
    faqItems: [
      { question: "How much does an electrician website cost?", answer: "Our Standard Landing Page starts at $300, perfect for most electrical contractors. Advanced multi-page websites with service area pages start at $500." },
      { question: "Can you help my electrical business show up on Google?", answer: "Yes! Every website we build includes on-page SEO optimization, Google Business Profile setup guidance, and local keyword targeting for your service areas." },
      { question: "How long does it take to build an electrician website?", answer: "Most Standard Landing Pages are ready in 3-5 business days. Multi-page websites typically take 1-2 weeks." },
    ],
  },
  "plumber-website-design": {
    slug: "plumber-website-design",
    title: "Plumber Website Design",
    metaTitle: "Plumber Website Design | Professional Plumbing Websites",
    metaDescription: "Affordable website design for plumbers starting at $300. Mobile-ready, SEO-optimized websites that help plumbing companies get more service calls in Rancho Cucamonga & the Inland Empire.",
    heroHeading: "Professional Plumber Website Design",
    heroSubheading: "Turn online searches into service calls with a website built for plumbers",
    introText: "When a pipe bursts or a drain clogs, people grab their phone and search for a plumber nearby. If your plumbing business doesn't have a professional website, you're invisible to these potential customers. Hardhat Hosting builds plumber websites that rank in local search results, showcase your services, and make it easy for customers to call you right from their phone.",
    features: [
      { title: "Click-to-Call Buttons", description: "One-tap calling on mobile devices so emergency plumbing customers can reach you instantly." },
      { title: "Service Listings", description: "Organized pages for drain cleaning, water heater repair, repiping, and every service you offer." },
      { title: "Before & After Gallery", description: "Showcase your best work with photo galleries that build trust and demonstrate quality." },
      { title: "Review Integration", description: "Display your Google reviews and testimonials prominently to build credibility." },
    ],
    whyUs: [
      "Designed specifically for plumbing companies",
      "Emergency service buttons for urgent calls",
      "Local SEO for Rancho Cucamonga & Inland Empire",
      "Fast mobile experience for on-the-go customers",
      "Affordable pricing starting at $300",
    ],
    ctaText: "Build Your Plumbing Website",
    faqItems: [
      { question: "Do plumbers really need a website?", answer: "Absolutely. Over 80% of consumers search online before hiring a plumber. Without a website, you're losing business to competitors who have one." },
      { question: "Will my plumber website work on phones?", answer: "Yes! All our websites are fully mobile-responsive. Since most plumbing searches happen on smartphones, this is critical for converting visitors into calls." },
      { question: "Can you add online booking to my plumber website?", answer: "Yes, we can integrate appointment scheduling and online quote request forms on our Advanced ($500) and Custom ($1,500) plans." },
    ],
  },
  "roofing-website-design": {
    slug: "roofing-website-design",
    title: "Roofing Website Design",
    metaTitle: "Roofing Company Website Design | Get More Roofing Leads",
    metaDescription: "Website design for roofing companies starting at $300. SEO-optimized roofing websites that generate leads and build trust with homeowners in Rancho Cucamonga & the Inland Empire.",
    heroHeading: "Roofing Company Website Design",
    heroSubheading: "Professional websites that help roofing contractors win more jobs",
    introText: "Homeowners researching roof repairs or replacements want to see a professional, trustworthy online presence before they call. A well-designed roofing website showcases your work, displays your certifications, and makes it easy for potential customers to request a free inspection. Hardhat Hosting creates roofing websites optimized for local search that generate consistent leads.",
    features: [
      { title: "Free Inspection CTA", description: "Prominent calls-to-action for free roof inspections that drive lead generation." },
      { title: "Certification Badges", description: "Display GAF, Owens Corning, and other manufacturer certifications to build trust." },
      { title: "Storm Damage Pages", description: "Seasonal landing pages for storm damage that capture emergency roofing leads." },
      { title: "Financing Information", description: "Clear financing options and insurance claim assistance information for homeowners." },
    ],
    whyUs: [
      "Built specifically for roofing contractors",
      "Showcase warranties, certifications & licenses",
      "Storm damage & emergency repair pages",
      "Photo galleries of completed roofing projects",
      "Local SEO targeting homeowners in your area",
    ],
    ctaText: "Get Your Roofing Website",
    faqItems: [
      { question: "What should a roofing website include?", answer: "A great roofing website needs service pages, a project gallery, certifications, customer reviews, a free inspection CTA, and clear contact information. We include all of these." },
      { question: "How do I get my roofing company on Google?", answer: "We optimize your website for local search terms like 'roofing company near me' and help you set up Google Business Profile for map visibility." },
      { question: "Can my roofing website handle insurance claim leads?", answer: "Yes! We can create dedicated pages for insurance claim assistance and storm damage repairs on Advanced and Custom plans." },
    ],
  },
  "hvac-website-design": {
    slug: "hvac-website-design",
    title: "HVAC Website Design",
    metaTitle: "HVAC Website Design | AC & Heating Contractor Websites",
    metaDescription: "Professional HVAC website design starting at $300. Mobile-friendly websites for AC repair, heating, and HVAC companies in Rancho Cucamonga & the Inland Empire.",
    heroHeading: "HVAC Contractor Website Design",
    heroSubheading: "Websites that keep your phone ringing with AC and heating service calls",
    introText: "When the AC breaks down in a Rancho Cucamonga summer, homeowners need an HVAC contractor fast. They search on their phones and call the first professional-looking company they find. Hardhat Hosting builds HVAC websites that load fast, rank in local search, and convert visitors into service calls year-round.",
    features: [
      { title: "Seasonal Promotions", description: "Easy-to-update seasonal offers for AC tune-ups in summer and heating maintenance in winter." },
      { title: "Emergency Service Page", description: "24/7 emergency HVAC repair page with prominent click-to-call functionality." },
      { title: "Energy Efficiency Content", description: "Educational content about energy-efficient systems that attracts homeowners researching upgrades." },
      { title: "Service Area Coverage", description: "Pages for each city you serve to dominate local search results." },
    ],
    whyUs: [
      "Designed for HVAC and climate control companies",
      "Seasonal content strategy for year-round leads",
      "Emergency service call-to-action buttons",
      "Energy rebate and financing information pages",
      "Local SEO for the Inland Empire region",
    ],
    ctaText: "Build Your HVAC Website",
    faqItems: [
      { question: "How can a website help my HVAC business?", answer: "A professional website helps you appear in 'AC repair near me' searches, builds trust with homeowners, and provides 24/7 lead generation through contact forms and click-to-call buttons." },
      { question: "Do you include maintenance plan information?", answer: "Yes! We can create dedicated pages for your maintenance plans, seasonal tune-up offers, and service agreements on Advanced and Custom plans." },
      { question: "Can I update seasonal promotions myself?", answer: "On our Custom plan, we provide easy content management. On Standard and Advanced plans, we handle updates for you at no extra charge for minor changes." },
    ],
  },
  "landscaping-website-design": {
    slug: "landscaping-website-design",
    title: "Landscaping Website Design",
    metaTitle: "Landscaping Website Design | Lawn Care & Garden Websites",
    metaDescription: "Beautiful website design for landscaping companies starting at $300. Showcase your outdoor projects with stunning photo galleries. Serving landscapers in Rancho Cucamonga & the Inland Empire.",
    heroHeading: "Landscaping Website Design",
    heroSubheading: "Stunning websites that showcase your outdoor transformations",
    introText: "Your landscaping work speaks for itself - but only if people can see it. A professional website with beautiful project galleries, clear service descriptions, and easy contact options helps landscaping companies attract higher-value clients. Hardhat Hosting creates visually stunning websites for landscapers that highlight your best work and generate consistent leads.",
    features: [
      { title: "Project Galleries", description: "Stunning before-and-after photo galleries that showcase your landscaping transformations." },
      { title: "Service Categories", description: "Organized pages for hardscaping, softscaping, irrigation, maintenance, and design services." },
      { title: "Seasonal Content", description: "Year-round content strategy with seasonal landscaping tips that drive organic traffic." },
      { title: "Design Consultation CTA", description: "Free design consultation forms that capture qualified leads for larger projects." },
    ],
    whyUs: [
      "Visually stunning designs that match your work quality",
      "Photo galleries optimized for fast loading",
      "SEO targeting 'landscaping near me' searches",
      "Seasonal content for year-round lead generation",
      "Affordable pricing from $300",
    ],
    ctaText: "Get Your Landscaping Website",
    faqItems: [
      { question: "How do I showcase my landscaping work online?", answer: "We create beautiful before-and-after photo galleries organized by project type. High-quality images of your work are the #1 converter for landscaping websites." },
      { question: "Can my landscaping website rank in Google?", answer: "Yes! We optimize for local landscaping search terms and help you target specific cities and neighborhoods in the Inland Empire." },
      { question: "Do you build websites for lawn care companies too?", answer: "Absolutely! We build websites for all outdoor services including lawn care, tree trimming, hardscaping, irrigation, and full-service landscaping companies." },
    ],
  },
  "contractor-website-design": {
    slug: "contractor-website-design",
    title: "Contractor Website Design",
    metaTitle: "Contractor Website Design | General Contractor Websites",
    metaDescription: "Professional website design for general contractors starting at $300. Mobile-friendly, SEO-optimized websites that win more bids and generate leads in Rancho Cucamonga & the Inland Empire.",
    heroHeading: "General Contractor Website Design",
    heroSubheading: "Professional websites that help contractors win more bids and grow their business",
    introText: "As a general contractor, your website is often the first impression potential clients have of your business. A professional, well-organized website showcases your past projects, highlights your capabilities, and provides the credibility needed to win larger contracts. Hardhat Hosting specializes in contractor websites that are built to generate leads and establish authority.",
    features: [
      { title: "Project Portfolio", description: "Showcase completed residential and commercial projects with detailed case studies." },
      { title: "Bid Request Forms", description: "Professional bid request and estimate forms that capture project details upfront." },
      { title: "License & Bond Display", description: "Prominently display your contractor license, bonding, and insurance information." },
      { title: "Subcontractor Pages", description: "Dedicated pages for each trade and specialty you offer." },
    ],
    whyUs: [
      "Built by a team that understands the construction industry",
      "Project portfolio pages with detailed case studies",
      "Bid request and estimate forms",
      "License, bond, and insurance information display",
      "Local SEO targeting construction-related searches",
    ],
    ctaText: "Build Your Contractor Website",
    faqItems: [
      { question: "Why do general contractors need a website?", answer: "Property owners, real estate developers, and homeowners all research contractors online before hiring. A professional website with project examples and credentials helps you win more bids." },
      { question: "Can you build a website for a commercial contractor?", answer: "Yes! We build websites for residential, commercial, and industrial contractors. Our Advanced and Custom plans include multi-page sites with detailed project portfolios." },
      { question: "How do contractor websites generate leads?", answer: "Through local SEO (appearing in 'contractor near me' searches), bid request forms, and prominently displayed contact information including click-to-call buttons." },
    ],
  },
  "salon-website-design": {
    slug: "salon-website-design",
    title: "Salon Website Design",
    metaTitle: "Salon Website Design | Hair & Beauty Salon Websites",
    metaDescription: "Beautiful website design for hair salons, barbershops, and beauty studios starting at $300. Online booking, service menus, and gallery features. Serving the Inland Empire.",
    heroHeading: "Salon & Beauty Website Design",
    heroSubheading: "Gorgeous websites that reflect your salon's style and attract new clients",
    introText: "Your salon is all about aesthetics - your website should be too. A beautifully designed salon website showcases your team's talent, displays your service menu, and makes it effortless for clients to book appointments. Hardhat Hosting creates salon websites that are as stylish as your work, optimized for mobile, and designed to fill your appointment book.",
    features: [
      { title: "Service Menu Display", description: "Elegant, easy-to-read service menus with pricing that help clients choose before they call." },
      { title: "Stylist Profiles", description: "Individual stylist profiles with photos and specialties to help clients find their perfect match." },
      { title: "Instagram Integration", description: "Showcase your latest work by integrating your Instagram feed directly on your website." },
      { title: "Online Booking", description: "Easy appointment booking integration so clients can schedule 24/7." },
    ],
    whyUs: [
      "Visually stunning designs that match your brand",
      "Service menu and pricing display",
      "Stylist profiles and team pages",
      "Social media integration",
      "Mobile-optimized for on-the-go booking",
    ],
    ctaText: "Get Your Salon Website",
    faqItems: [
      { question: "Can I show my salon prices on the website?", answer: "Absolutely! We create beautiful, organized service menus that display your services and pricing in an easy-to-read format." },
      { question: "Do you integrate online booking for salons?", answer: "Yes! We can integrate popular booking platforms or add contact-based booking forms on all our plans." },
      { question: "Can my salon website show my Instagram work?", answer: "Yes! On Advanced and Custom plans, we integrate your Instagram feed so your latest work is always displayed on your website." },
    ],
  },
  "web-design-rancho-cucamonga": {
    slug: "web-design-rancho-cucamonga",
    title: "Web Design Rancho Cucamonga",
    metaTitle: "Web Design Rancho Cucamonga CA | Affordable Local Websites",
    metaDescription: "Local web design in Rancho Cucamonga, CA. Professional websites for contractors and small businesses starting at $300. Fast turnaround, personal service, and ongoing support.",
    heroHeading: "Web Design in Rancho Cucamonga, CA",
    heroSubheading: "Your local partner for professional, affordable website design",
    introText: "Looking for a web designer in Rancho Cucamonga? Hardhat Hosting is a local web design company that understands the Inland Empire market. We build professional, mobile-friendly websites for contractors, small businesses, salons, and service companies throughout Rancho Cucamonga, Fontana, Ontario, Upland, and surrounding cities. Unlike big agencies, we offer personal service, fast turnaround, and prices that work for small businesses.",
    features: [
      { title: "Local Market Knowledge", description: "We understand the Rancho Cucamonga and Inland Empire market and optimize your site for local customers." },
      { title: "Personal Service", description: "Work directly with your designer - no call centers, no ticket systems, just real people." },
      { title: "Fast Turnaround", description: "Most websites are ready in 3-5 business days. We respect your time and deadlines." },
      { title: "Ongoing Support", description: "Local support for updates, changes, and technical issues whenever you need help." },
    ],
    whyUs: [
      "Locally owned and operated in Rancho Cucamonga",
      "Serving the entire Inland Empire region",
      "Personal, one-on-one service",
      "Affordable pricing for small businesses",
      "Fast 3-5 day turnaround for standard sites",
    ],
    ctaText: "Get a Website Quote Today",
    faqItems: [
      { question: "Where is Hardhat Hosting located?", answer: "We're based in Rancho Cucamonga, CA and serve businesses throughout the Inland Empire including Fontana, Ontario, Upland, Claremont, Pomona, Corona, and Riverside." },
      { question: "How much does a website cost in Rancho Cucamonga?", answer: "Our Standard Landing Page starts at $300 with $25/month hosting. Advanced multi-page websites start at $500, and fully custom sites start at $1,500." },
      { question: "Do you meet with clients in person?", answer: "Yes! We're happy to meet locally in Rancho Cucamonga or anywhere in the Inland Empire. We also work remotely via phone and video call for your convenience." },
    ],
  },
  "web-design-inland-empire": {
    slug: "web-design-inland-empire",
    title: "Web Design Inland Empire",
    metaTitle: "Web Design Inland Empire CA | Affordable Small Business Websites",
    metaDescription: "Affordable web design for small businesses across the Inland Empire. Serving Rancho Cucamonga, Fontana, Ontario, Riverside, Corona & more. Professional websites from $300.",
    heroHeading: "Inland Empire Web Design & Hosting",
    heroSubheading: "Affordable, professional websites for businesses across San Bernardino & Riverside counties",
    introText: "The Inland Empire is one of the fastest-growing regions in California, and local businesses need a strong online presence to compete. Hardhat Hosting provides affordable, professional website design and hosting for small businesses, contractors, and service companies throughout the Inland Empire. From Rancho Cucamonga to Riverside, Ontario to Corona - we help IE businesses get online and get found.",
    features: [
      { title: "IE-Wide Service", description: "We serve businesses across the entire Inland Empire from San Bernardino to Riverside County." },
      { title: "Local SEO Focus", description: "We optimize your website for local searches specific to your city and service area." },
      { title: "Small Business Pricing", description: "Pricing designed for IE small businesses - professional quality without big-agency costs." },
      { title: "Multi-City Targeting", description: "Target multiple cities across the IE with dedicated service area pages." },
    ],
    whyUs: [
      "Serving all Inland Empire cities",
      "Local SEO for San Bernardino & Riverside counties",
      "Small business-friendly pricing from $300",
      "Understanding of the IE market and demographics",
      "Bilingual support available",
    ],
    ctaText: "Start Your IE Website Project",
    faqItems: [
      { question: "What cities in the Inland Empire do you serve?", answer: "We serve the entire Inland Empire including Rancho Cucamonga, Fontana, Ontario, Upland, Claremont, Pomona, Corona, Riverside, San Bernardino, Redlands, Moreno Valley, Temecula, and more." },
      { question: "Why choose a local IE web designer?", answer: "A local web designer understands the Inland Empire market, your customer base, and local competition. We provide personal service and can meet in person when needed." },
      { question: "Do you offer Spanish-language websites?", answer: "Yes! We can build bilingual websites to help you reach the IE's diverse community. This is available on our Advanced and Custom plans." },
    ],
  },
};

export const getAllSeoSlugs = () => Object.keys(seoPages);
