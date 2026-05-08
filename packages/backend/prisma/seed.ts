import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Created admin user:', admin.username);

  // Create test user
  const userPasswordHash = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'user@example.com',
      passwordHash: userPasswordHash,
      role: 'USER',
      isActive: true,
    },
  });
  console.log('Created test user:', user.username);

  // Create Pryro company knowledge base entries
  const knowledgeEntries = [
    {
      category: 'Company Overview',
      keywords: ['pryro', 'about', 'company', 'what is pryro', 'who are you', 'history'],
      response:
        'Pryro is a complete ERP (Enterprise Resource Planning) solution with AI-powered insights. Founded in 2020, Pryro was born from a vision to solve fragmented business systems. Our experienced entrepreneur founders understood the pain of juggling multiple platforms for ERP, HRM, CRM, accounting, and project management. Today, Pryro is trusted by 64,000+ businesses across 5 continents, from startups to enterprises.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Founders & Team',
      keywords: ['founder', 'founders', 'team', 'who founded', 'ceo', 'leadership', 'management', 'who started'],
      response:
        'Pryro was founded in 2020 by experienced entrepreneurs who understood the challenges of managing fragmented business systems. While specific founder names are not publicly listed, the founding team consists of seasoned business leaders with deep expertise in ERP, technology, and enterprise solutions. For more information about our leadership team, contact us at support@pryro.com or visit pryro.com/about.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Products & Services',
      keywords: ['products', 'services', 'features', 'what do you offer', 'erp', 'platform', 'solutions'],
      response:
        'Pryro offers: 1) Financial Management Suite - Complete accounting, invoicing, proposals, quotations, and financial reporting. 2) Inventory Management - Real-time stock control across multiple locations. 3) HR & Payroll System - Employee management, attendance, payroll processing. 4) Project Management - Plan, organize, and collaborate on projects. 5) CRM (Customer Relationship Management) - Lead management, pipeline tracking, sales analytics. All powered by AI automation.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'CRM & Sales',
      keywords: ['crm', 'customer relationship', 'sales', 'pipeline', 'leads', 'deals', 'customers', 'client management'],
      response:
        'Pryro CRM gives sales teams complete control over relationships, pipelines, and revenue growth. Features include: Contact Management, Pipeline Management, Sales Analytics, Email Integration (Gmail, Outlook), Call Tracking, Live Chat Support, Revenue Forecasting, and Workflow Automation. Trusted by 5,000+ sales & customer success teams. Businesses report 40% more deals closed with Pryro.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Pricing',
      keywords: ['price', 'pricing', 'cost', 'plans', 'how much', 'subscription', 'payment', 'trial', 'free'],
      response:
        'Pryro offers three plans:\n\n1) Free ($0/mo per user) — Unlimited projects, 2 limited users, Time tracking, CRM, 100 limited invoices.\n\n2) Pro ($29/mo per user) — Everything in Free plus: Invoices & payments, Expense tracking, HR/CRM/POS, AI reports, Income tracking, Scheduling, Priority Support, Custom data import, Advanced onboarding, HubSpot integration, Timesheets.\n\n3) Enterprise (Flexible) — For teams, custom pricing.\n\nSign up free at pryro.com.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Financial Management',
      keywords: ['finance', 'accounting', 'invoice', 'invoicing', 'payment', 'revenue', 'expenses', 'cash flow', 'financial', 'bookkeeping'],
      response:
        'Pryro\'s Financial Management Suite provides complete accounting, invoicing, proposals, quotations, and financial reporting. Track income, expenses, and cash flow in real-time. Create detailed invoices, track payments, and monitor your business finances all in one place. Millions of financial entries processed monthly with significant cost reduction for businesses.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Inventory Management',
      keywords: ['inventory', 'stock', 'warehouse', 'supply chain', 'suppliers', 'products', 'logistics'],
      response:
        'Pryro\'s Inventory Management system offers real-time stock control. Track stock levels, manage suppliers, and optimize your supply chain across multiple locations with real-time updates. Perfect for businesses that need to manage physical products efficiently across warehouses and locations.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'HR & Payroll',
      keywords: ['hr', 'human resources', 'payroll', 'employees', 'staff', 'attendance', 'benefits', 'workforce', 'hiring'],
      response:
        'Pryro\'s HR & Payroll System simplifies workforce management. Manage employees, track attendance, process payroll, and administer benefits all in one unified platform. Streamline your HR operations and ensure accurate, timely payroll processing. Complete HRM solution integrated with the ERP platform.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Project Management',
      keywords: ['project', 'projects', 'tasks', 'collaboration', 'team', 'workflow', 'organize', 'planning'],
      response:
        'Pryro\'s Project Management tools help you keep every project moving forward. Plan, organize, and collaborate on your work all in one place. Track progress, manage resources, set project budgets, and achieve your business goals with real-time analytics. No more spreadsheets and DMs - everything in one clean system.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Technology & Features',
      keywords: ['ai', 'automation', 'technology', 'features', 'analytics', 'insights', 'intelligent', 'integration'],
      response:
        'Pryro is powered by AI and intelligent automation. Our platform automates workflows, provides real-time analytics, and delivers business intelligence at the speed your company demands. Work seamlessly across all devices - desktop, tablet, and mobile. Stay in sync from anywhere. Integrates with Gmail, Outlook, and popular business tools.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Global Reach',
      keywords: ['global', 'worldwide', 'international', 'countries', 'locations', 'where', 'continents'],
      response:
        'Pryro serves businesses worldwide across 5 continents. We empower 64,000+ enterprises, startups, and NGOs globally with intelligent ERP solutions. Our platform is used by leading businesses in multiple countries, providing localized support and global scalability.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Benefits & Performance',
      keywords: ['benefits', 'advantages', 'why pryro', 'performance', 'results', 'efficiency', 'roi', 'success'],
      response:
        'Pryro delivers: 1) Significant cost reduction with average savings for businesses. 2) Millions of financial entries processed monthly. 3) 40% more deals closed for sales teams. 4) Seamless experience across all devices. 5) Complete business process optimization. 6) Real-time insights and analytics. 7) Unified platform - no more duct-tape solutions. Trusted by 64,000+ businesses worldwide.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Support & Contact',
      keywords: ['support', 'help', 'contact', 'assistance', 'customer service', 'email', 'reach', 'get in touch', 'phone', 'number', 'call', 'address', 'office', 'location'],
      response:
        'Contact Pryro directly:\n\n📧 Sales: sales@pryro.com\n📧 Support: support@pryro.com\n📞 Phone: +250 788 715 075\n🕐 Hours: 24/7 am - 0:00pm EST\n🏢 Office: 1 KN 78 Nyarugenge Street, Kigali, Rwanda\n🌐 Website: https://pryro.com\n\nFor sales inquiries, email sales@pryro.com. For technical support, email support@pryro.com or call +250 788 715 075.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Getting Started',
      keywords: ['start', 'begin', 'signup', 'register', 'trial', 'demo', 'how to start', 'onboarding'],
      response:
        'Getting started with Pryro is easy! 1) Visit pryro.com and sign up for FREE Basic plan. 2) Import your data (contacts, finances, inventory). 3) Invite your team members. 4) We provide onboarding training and support for smooth adoption. 5) Start with one module (Finance, CRM, HR, or Projects) and expand as needed. Free trial available for Premium and Enterprise plans.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Security & Compliance',
      keywords: ['security', 'secure', 'data protection', 'privacy', 'gdpr', 'compliance', 'encryption', 'safe'],
      response:
        'Pryro takes security seriously. We use enterprise-grade encryption and comply with GDPR and SOC 2 standards. Your business data, customer information, and financial records are protected with the highest security measures. All data is encrypted at rest and in transit. Regular security audits ensure your information stays safe.',
      priority: 1,
      createdBy: admin.id,
    },
    {
      category: 'Customer Success Stories',
      keywords: ['testimonials', 'reviews', 'success stories', 'case studies', 'customers', 'clients', 'who uses'],
      response:
        'Pryro is trusted by 64,000+ businesses worldwide — from startups and NGOs to large enterprises across 5 continents. Customers consistently report transformative results: streamlined operations, 40% more deals closed with the CRM, significant cost reductions, and a unified platform that replaces multiple disconnected tools. Visit pryro.com to read customer stories and see how businesses are growing with Pryro.',
      priority: 1,
      createdBy: admin.id,
    },
  ];

  // Clear existing knowledge entries and re-seed with fresh data
  await prisma.knowledgeEntry.deleteMany({});
  await prisma.knowledgeEntry.createMany({ data: knowledgeEntries });
  console.log(`Created ${knowledgeEntries.length} knowledge base entries`);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
