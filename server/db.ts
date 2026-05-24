import fs from 'fs';
import path from 'path';

// Define the file-based database path
const DB_FILE = path.join(process.cwd(), 'server-db.json');

// Interface declarations matching MongoDB schemas
export interface User {
  _id: string;
  name: string;
  email: string;
  passwordHash: string; // bcryptjs or simple hashing
  role: 'admin' | 'manager' | 'bda';
  avatar?: string;
  phone?: string;
  department?: string;
  quota: { monthly: number; quarterly: number };
  refreshToken?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  type: 'note' | 'stage_change' | 'assignment' | 'email' | 'call' | 'meeting' | 'rfq' | 'deal' | 'system';
  description: string;
  metadata?: any;
  lead?: string; // Lead ID
  client?: string; // Client ID
  deal?: string; // Deal ID
  performedBy: string; // User ID
  createdAt: string;
}

export interface Lead {
  _id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  designation?: string;
  industry?: string;
  city?: string;
  state?: string;
  country?: string;
  leadSource: 'cold_call' | 'email' | 'referral' | 'trade_show' | 'website' | 'linkedin' | 'other';
  stage: 'new' | 'contacted' | 'qualified' | 'rfq_sent' | 'sample_trial' | 'negotiation' | 'po_received' | 'closed_won' | 'closed_lost';
  priority: 'hot' | 'warm' | 'cold';
  score: number; // 0-100
  estimatedValue: number;
  currency: string;
  moq: number;
  productInterest: string[];
  assignedTo: string; // User ID
  nextFollowUp?: string; // Date ISO
  lostReason?: string;
  tags: string[];
  notes?: string;
  activities: string[]; // Activity IDs
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  _id: string;
  companyName: string;
  gstin?: string;
  pan?: string;
  type: 'oem' | 'distributor' | 'direct' | 'government';
  industry?: string;
  website?: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    designation: string;
  };
  contacts: Array<{
    name: string;
    email: string;
    phone: string;
    designation: string;
    isPrimary?: boolean;
  }>;
  accountManager: string; // User ID
  totalRevenue: number;
  creditLimit: number;
  paymentTerms: string;
  status: 'active' | 'inactive' | 'on_hold';
  documents: Array<{
    name: string;
    url: string;
    uploadedAt: string;
  }>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  _id: string;
  dealName: string;
  client?: string; // Client ID
  lead?: string; // Lead ID
  stage: 'proposal' | 'negotiation' | 'contract' | 'closed_won' | 'closed_lost';
  value: number;
  currency: string;
  moq: number;
  leadTime: number; // production lead time in days
  probability: number; // 0-100
  expectedCloseDate: string;
  actualCloseDate?: string;
  products: Array<{
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  assignedTo: string; // User ID
  competitors: string[];
  winReason?: string;
  lostReason?: string;
  approvedBy?: string; // User ID
  isRecurring: boolean;
  recurringValue?: number;
  capacityLinked: boolean;
  notes?: string;
  attachments: Array<{ name: string; url: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface RFQ {
  _id: string;
  rfqNumber: string; // Auto-generated
  title: string;
  client?: string; // Client ID
  lead?: string; // Lead ID
  items: Array<{
    description: string;
    sku: string;
    quantity: number;
    unit: string;
    targetPrice?: number;
    offeredPrice?: number;
    leadTime?: number; // days
    moq?: number;
  }>;
  version: number;
  status: 'draft' | 'sent' | 'under_review' | 'revised' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  terms?: string;
  internalNotes?: string;
  assignedTo: string; // User ID
  approvedBy?: string; // User ID
  sentAt?: string;
  responseReceivedAt?: string;
  attachments: Array<{ name: string; url: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  _id: string;
  type: 'email' | 'call' | 'meeting' | 'whatsapp' | 'visit';
  direction: 'inbound' | 'outbound';
  subject: string;
  body: string;
  summary?: string;
  lead?: string; // Lead ID
  client?: string; // Client ID
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  duration?: number; // minutes for calls
  outcome: 'positive' | 'neutral' | 'negative' | 'no_answer';
  nextAction?: string;
  nextActionDate?: string;
  attachments?: Array<{ name: string; url: string }>;
  loggedBy: string; // User ID
  scheduledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  basePrice: number;
  currency: string;
  moq: number;
  unit: string;
  leadTime: number; // production lead time in days
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Full DB State Structure
export interface DBState {
  users: User[];
  leads: Lead[];
  clients: Client[];
  deals: Deal[];
  rfqs: RFQ[];
  communications: Communication[];
  activities: Activity[];
  products: Product[];
}

// Helper to generate IDs
export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
}

// In-Memory state loaded from / written to disk
let db: DBState = {
  users: [],
  leads: [],
  clients: [],
  deals: [],
  rfqs: [],
  communications: [],
  activities: [],
  products: []
};

// Sync database to disk
export function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save DB state to disk:', error);
  }
}

// Load database from disk
export function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
    } else {
      console.log('No database file found. Generating seed data...');
      seedDatabase();
    }
  } catch (error) {
    console.error('Failed to load DB state, recreating container state:', error);
    seedDatabase();
  }
}

// Highly realistic manufacturing seed data
function seedDatabase() {
  const users: User[] = [
    {
      _id: 'usr_admin',
      name: 'Anand Sharma',
      email: 'admin@factory.com',
      passwordHash: 'admin123', // Clean, robust mock auth strings
      role: 'admin',
      phone: '+91 98765 43210',
      department: 'Executive Operations',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      quota: { monthly: 8000000, quarterly: 24000000 },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'usr_manager',
      name: 'Meera Nair',
      email: 'manager@factory.com',
      passwordHash: 'manager123',
      role: 'manager',
      phone: '+91 98765 43211',
      department: 'Corporate Sales',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      quota: { monthly: 5000000, quarterly: 15000000 },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'usr_bda_1',
      name: 'Abhishek Roy',
      email: 'bda@factory.com',
      passwordHash: 'bda123',
      role: 'bda',
      phone: '+91 98765 43212',
      department: 'Industrial Accounts',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      quota: { monthly: 3000000, quarterly: 9000000 },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'usr_bda_2',
      name: 'Priyanka Patel',
      email: 'bda2@factory.com',
      passwordHash: 'bda123',
      role: 'bda',
      phone: '+91 98765 43213',
      department: 'Distribution Channel',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      quota: { monthly: 2500000, quarterly: 7500000 },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const products: Product[] = [
    {
      _id: 'prod_1',
      name: 'Precision Steel Gears',
      sku: 'PSG-102',
      category: 'Power Transmission',
      description: 'CNC machined steel spur and helical gears for industrial machinery.',
      basePrice: 3800,
      currency: 'INR',
      moq: 200,
      unit: 'pieces',
      leadTime: 14,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'prod_2',
      name: 'Automotive Alternators',
      sku: 'AGA-505',
      category: 'Electrical Components',
      description: 'High-output 12V alternators designed for heavy duty commercial fleets.',
      basePrice: 8500,
      currency: 'INR',
      moq: 50,
      unit: 'pieces',
      leadTime: 21,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'prod_3',
      name: 'Heavy Duty Hydraulic Cylinders',
      sku: 'HDC-982',
      category: 'Fluid Power',
      description: 'Double-acting hydraulic cylinders with customized stroke lengths up to 2m.',
      basePrice: 28000,
      currency: 'INR',
      moq: 10,
      unit: 'pieces',
      leadTime: 30,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'prod_4',
      name: 'Custom Molded Gaskets',
      sku: 'CMG-240',
      category: 'Sealing Solutions',
      description: 'EPDM and nitrile rubber gasket matrices with superior thermal resilience.',
      basePrice: 65,
      currency: 'INR',
      moq: 5000,
      unit: 'pieces',
      leadTime: 7,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'prod_5',
      name: 'High-Tensile Titanium Fasteners',
      sku: 'HTF-011',
      category: 'Hardware',
      description: 'Grade 5 titanium socket head cap screws for aerospace and defense.',
      basePrice: 180,
      currency: 'INR',
      moq: 2000,
      unit: 'pieces',
      leadTime: 10,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const clients: Client[] = [
    {
      _id: 'cli_1',
      companyName: 'Tata Motors Ltd.',
      gstin: '27AACCT4104P1Z4',
      pan: 'AACCT4104P',
      type: 'oem',
      industry: 'Automotive',
      website: 'www.tatamotors.com',
      billingAddress: {
        street: 'Bombay House, 24 Homi Mody Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      primaryContact: {
        name: 'Sanjeev Deshmukh',
        email: 'sanjeev.d@tatamotors.com',
        phone: '+91 22 6665 8282',
        designation: 'Head of Sourcing'
      },
      contacts: [
        {
          name: 'Sanjeev Deshmukh',
          email: 'sanjeev.d@tatamotors.com',
          phone: '+91 22 6665 8282',
          designation: 'Head of Sourcing',
          isPrimary: true
        },
        {
          name: 'Anjali Sharma',
          email: 'anjali.s@tatamotors.com',
          phone: '+91 22 6665 8283',
          designation: 'Procurement Specialist'
        }
      ],
      accountManager: 'usr_bda_1',
      totalRevenue: 15400000,
      creditLimit: 5000000,
      paymentTerms: 'Net 60',
      status: 'active',
      documents: [
        { name: 'Credit Application.pdf', url: '#', uploadedAt: new Date().toISOString() },
        { name: 'GST Register Copy.pdf', url: '#', uploadedAt: new Date().toISOString() }
      ],
      tags: ['Key Account', 'OEM'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'cli_2',
      companyName: 'Mahindra Logistics Ltd.',
      gstin: '27AABCM2810H2Z3',
      pan: 'AABCM2810H',
      type: 'direct',
      industry: 'Logistics',
      website: 'www.mahindralogistics.com',
      billingAddress: {
        street: 'Mahindra Towers, P.K. Kurne Chowk, Worli',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018',
        country: 'India'
      },
      primaryContact: {
        name: 'Rupesh Chawla',
        email: 'chawla.rupesh@mahindra.com',
        phone: '+91 22 2490 1441',
        designation: 'Director Technical Purchasing'
      },
      contacts: [
        {
          name: 'Rupesh Chawla',
          email: 'chawla.rupesh@mahindra.com',
          phone: '+91 22 2490 1441',
          designation: 'Director Technical Purchasing',
          isPrimary: true
        }
      ],
      accountManager: 'usr_bda_1',
      totalRevenue: 6400000,
      creditLimit: 3000000,
      paymentTerms: 'Net 45',
      status: 'active',
      documents: [],
      tags: ['Loyal Partner'],
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'cli_3',
      companyName: 'L&T Heavy Engineering Ltd.',
      gstin: '24AAACL1101B1Z9',
      pan: 'AAACL1101B',
      type: 'government',
      industry: 'Defense & Aerospace',
      website: 'www.lnthe.com',
      billingAddress: {
        street: 'Hazira Manufacturing Complex, Surat-Hazira Road',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '394510',
        country: 'India'
      },
      primaryContact: {
        name: 'Vikramaditya Shah',
        email: 'vshah@lnthe.com',
        phone: '+91 261 280 5000',
        designation: 'VP Material Procurement'
      },
      contacts: [
        {
          name: 'Vikramaditya Shah',
          email: 'vshah@lnthe.com',
          phone: '+91 261 280 5000',
          designation: 'VP Material Procurement',
          isPrimary: true
        }
      ],
      accountManager: 'usr_bda_2',
      totalRevenue: 28200000,
      creditLimit: 12000000,
      paymentTerms: 'Net 90',
      status: 'active',
      documents: [{ name: 'L&T Vendor Certificate.pdf', url: '#', uploadedAt: new Date().toISOString() }],
      tags: ['Defense Grade', 'High Revenue'],
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'cli_4',
      companyName: 'Murugappa Engineering Distributors',
      gstin: '33AAACM5204C1ZN',
      pan: 'AAACM5204C',
      type: 'distributor',
      industry: 'Industrial Supply',
      website: 'www.murugappa.com',
      billingAddress: {
        street: 'Dare House, 2 NSC Bose Road',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        country: 'India'
      },
      primaryContact: {
        name: 'Garth Venkat',
        email: 'venkatg@murugappa.com',
        phone: '+91 44 2530 8122',
        designation: 'Partner Relations manager'
      },
      contacts: [
        {
          name: 'Garth Venkat',
          email: 'venkatg@murugappa.com',
          phone: '+91 44 2530 8122',
          designation: 'Partner Relations manager',
          isPrimary: true
        }
      ],
      accountManager: 'usr_bda_2',
      totalRevenue: 12400000,
      creditLimit: 8000000,
      paymentTerms: 'Net 30',
      status: 'active',
      documents: [],
      tags: ['Tier-1 Distributor'],
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const leads: Lead[] = [
    {
      _id: 'lead_1',
      companyName: 'Bharat Earth Movers Ltd.',
      contactName: 'Raghavan Iyer',
      contactEmail: 'r.iyer@beml.co.in',
      contactPhone: '+91 80 2296 3111',
      designation: 'GM Sourcing & Design',
      industry: 'Heavy Machinery',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      leadSource: 'trade_show',
      stage: 'new',
      priority: 'hot',
      score: 88,
      estimatedValue: 4500000,
      currency: 'INR',
      moq: 150,
      productInterest: ['PSG-102', 'HDC-982'],
      assignedTo: 'usr_bda_1',
      nextFollowUp: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      tags: ['Heavy Engineering', 'PSU'],
      notes: 'Met at IMTEX 2026. Highly interested in our heavy duty hydraulic cylinders and high precision spur gears. Scheduled an online technical presentation.',
      activities: [],
      createdBy: 'usr_manager',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_2',
      companyName: 'Escorts Kubota Agri Machinery',
      contactName: 'Devendra Singh',
      contactEmail: 'devendra.singh@escorts.co.in',
      contactPhone: '+91 129 256 1000',
      designation: 'Director - Supply Chain',
      industry: 'Agriculture Equipment',
      city: 'Faridabad',
      state: 'Haryana',
      country: 'India',
      leadSource: 'cold_call',
      stage: 'contacted',
      priority: 'warm',
      score: 72,
      estimatedValue: 2800000,
      currency: 'INR',
      moq: 500,
      productInterest: ['PSG-102', 'CMG-240'],
      assignedTo: 'usr_bda_1',
      nextFollowUp: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['Tractors', 'Mass Production'],
      notes: 'Cold called and established contact. Shared current gears product catalog. They are looking to qualify a secondary local vendor with solid machining capacity.',
      activities: [],
      createdBy: 'usr_bda_1',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_3',
      companyName: 'Ashok Leyland Defense Systems',
      contactName: 'Commodore R.K. Swaminathan (Retd.)',
      contactEmail: 'swami.rk@ashokleyland.com',
      contactPhone: '+91 44 2220 1000',
      designation: 'CEO / Business Head',
      industry: 'Defense & Aerospace',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      leadSource: 'referral',
      stage: 'qualified',
      priority: 'hot',
      score: 94,
      estimatedValue: 7200000,
      currency: 'INR',
      moq: 100,
      productInterest: ['HDC-982', 'HTF-011'],
      assignedTo: 'usr_bda_2',
      nextFollowUp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['Defense Vehicles', 'Strategic'],
      notes: 'Referral from a vendor network. They require Grade-5 titanium bolts and large customized hydraulic cylinders. Standard quality audits of our plant will be required.',
      activities: [],
      createdBy: 'usr_manager',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_4',
      companyName: 'Godrej Process Equipment',
      contactName: 'Nikhil Merchant',
      contactEmail: 'nmerchant@godrej.com',
      contactPhone: '+91 22 6796 5656',
      designation: 'DGM Purchasing',
      industry: 'Chemical Process Plants',
      city: 'Vikhroli, Mumbai',
      state: 'Maharashtra',
      country: 'India',
      leadSource: 'website',
      stage: 'rfq_sent',
      priority: 'hot',
      score: 85,
      estimatedValue: 5600000,
      currency: 'INR',
      moq: 30,
      productInterest: ['HDC-982'],
      assignedTo: 'usr_bda_1',
      nextFollowUp: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['Piping', 'Valves'],
      notes: 'Inbound RFQ submitted via our engineering website. High priority. Sent quote for HDC-982. Undergoing design vetting.',
      activities: [],
      createdBy: 'usr_bda_1',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_5',
      companyName: 'Gabriel India Ltd.',
      contactName: 'Karan Mehra',
      contactEmail: 'kmehra@gabriel.co.in',
      contactPhone: '+91 2135 610 000',
      designation: 'Principal Specialist Suspension',
      industry: 'Auto Ancillary',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      leadSource: 'linkedin',
      stage: 'sample_trial',
      priority: 'warm',
      score: 80,
      estimatedValue: 3400000,
      currency: 'INR',
      moq: 1000,
      productInterest: ['CMG-240'],
      assignedTo: 'usr_bda_2',
      nextFollowUp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['Suspension', 'DAMPERS'],
      notes: 'Initial connection on LinkedIn. Shared rubber seal prototypes. Physical samples shipped for standard testing and stress test profiling.',
      activities: [],
      createdBy: 'usr_bda_2',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_6',
      companyName: 'Lohia Corp Ltd.',
      contactName: 'Vikas Lohar',
      contactEmail: 'vikas.l@lohiacorp.com',
      contactPhone: '+91 512 259 3100',
      designation: 'Lead Procurement Manager',
      industry: 'Textile Machinery',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      country: 'India',
      leadSource: 'email',
      stage: 'negotiation',
      priority: 'hot',
      score: 90,
      estimatedValue: 4800000,
      currency: 'INR',
      moq: 400,
      productInterest: ['PSG-102'],
      assignedTo: 'usr_bda_1',
      nextFollowUp: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['Woven Sacks', 'Machining'],
      notes: 'Negotiations ongoing regarding unit discount. Our base is INR 3800, they are demanding INR 3400 for a commitment of 1,200 pieces.',
      activities: [],
      createdBy: 'usr_bda_1',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_7',
      companyName: 'Lucas TVS Ltd.',
      contactName: 'S. Chandrasekhar',
      contactEmail: 's.chandra@lucas-tvs.co.in',
      contactPhone: '+91 44 2625 8201',
      designation: 'Purchasing Admin Lead',
      industry: 'Electrical Equipment',
      city: 'Padi, Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      leadSource: 'trade_show',
      stage: 'po_received',
      priority: 'hot',
      score: 98,
      estimatedValue: 6200000,
      currency: 'INR',
      moq: 100,
      productInterest: ['AGA-505'],
      assignedTo: 'usr_bda_2',
      nextFollowUp: undefined,
      tags: ['Electrical', 'Tier-1'],
      notes: 'PO copy received for 750 alternator units. Transitioning accounts over to Customer Success and ERP.',
      activities: [],
      createdBy: 'usr_bda_2',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_8',
      companyName: 'Wipro Infrastructure Engineering Corp',
      contactName: 'Pranav Saxena',
      contactEmail: 'p.saxena@wipro.com',
      contactPhone: '+91 80 2505 6000',
      designation: 'Head Procurement',
      industry: 'Hydraulics',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      leadSource: 'referral',
      stage: 'closed_won',
      priority: 'hot',
      score: 100,
      estimatedValue: 12400000,
      currency: 'INR',
      moq: 50,
      productInterest: ['HDC-982'],
      assignedTo: 'usr_bda_1',
      nextFollowUp: undefined,
      tags: ['Win', 'Completed'],
      notes: 'Converted to Client actively. Massive deal closed. PO received and fully processed.',
      activities: [],
      createdBy: 'usr_bda_1',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_9',
      companyName: 'Action Construction Equipment (ACE)',
      contactName: 'Manish Tyagi',
      contactEmail: 'mtyagi@ace-cranes.com',
      contactPhone: '+91 129 230 1100',
      designation: 'AGM Raw Material Sourcing',
      industry: 'Heavy Cranes',
      city: 'Faridabad',
      state: 'Haryana',
      country: 'India',
      leadSource: 'cold_call',
      stage: 'closed_lost',
      priority: 'cold',
      score: 25,
      estimatedValue: 1800000,
      currency: 'INR',
      moq: 100,
      productInterest: ['PSG-102'],
      assignedTo: 'usr_bda_2',
      nextFollowUp: undefined,
      lostReason: 'uncompetitive pricing on gears compared to local casting houses',
      tags: ['Lost', 'Price Sensitive'],
      notes: 'Lead lost because they required pricing below our basic manufacturing cost limits. Local gray-iron casting suppliers quoted 40% cheaper.',
      activities: [],
      createdBy: 'usr_bda_2',
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'lead_10',
      companyName: 'Caterpillar India',
      contactName: 'Brian Davis',
      contactEmail: 'davis_brian@cat.com',
      contactPhone: '+91 44 2715 2000',
      designation: 'Regional Sourcing Manager Asia',
      industry: 'Construction Equipment',
      city: 'Thiruvallur',
      state: 'Tamil Nadu',
      country: 'India',
      leadSource: 'linkedin',
      stage: 'new',
      priority: 'hot',
      score: 91,
      estimatedValue: 6800000,
      currency: 'INR',
      moq: 100,
      productInterest: ['HDC-982', 'PSG-102'],
      assignedTo: 'usr_bda_2',
      nextFollowUp: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['Global Client', 'Premium'],
      notes: 'Outreached on LinkedIn. Brian accepted. Interested in specialized cylinder shafts and hard-chromed gear assemblies.',
      activities: [],
      createdBy: 'usr_bda_2',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const deals: Deal[] = [
    {
      _id: 'deal_1',
      dealName: 'L&T Defense Cylinder Pipeline',
      client: 'cli_3',
      lead: 'lead_3',
      stage: 'negotiation',
      value: 11200000,
      currency: 'INR',
      moq: 10,
      leadTime: 30,
      probability: 60,
      expectedCloseDate: '2026-07-15',
      products: [
        { productId: 'prod_3', name: 'Heavy Duty Hydraulic Cylinders', sku: 'HDC-982', quantity: 400, unitPrice: 28000 }
      ],
      assignedTo: 'usr_bda_2',
      competitors: ['Wipro Hydraulics', 'Dauter Fluid Power'],
      isRecurring: false,
      capacityLinked: true,
      notes: 'Detailed design spec sheets submitted. Capacity has been conditionally blocked in our production shop assembly group-B.',
      attachments: [],
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'deal_2',
      dealName: 'Tata Motors Alternator Supply Order',
      client: 'cli_1',
      stage: 'closed_won',
      value: 8500000,
      currency: 'INR',
      moq: 100,
      leadTime: 21,
      probability: 100,
      expectedCloseDate: '2026-05-10',
      actualCloseDate: '2026-05-12',
      products: [
        { productId: 'prod_2', name: 'Automotive Alternators', sku: 'AGA-505', quantity: 1000, unitPrice: 8500 }
      ],
      assignedTo: 'usr_bda_1',
      competitors: ['Denso Corp', 'Bosch India'],
      winReason: 'Shorter lead time (21 days vs 42 days for Denso) and physical sample test approval.',
      isRecurring: true,
      recurringValue: 8500000,
      capacityLinked: false,
      notes: 'Annual supply rate agreement locked in. Scheduled to pull shipments monthly starting late June.',
      attachments: [],
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'deal_3',
      dealName: 'Murugappa Gasket Consignment',
      client: 'cli_4',
      stage: 'proposal',
      value: 650000,
      currency: 'INR',
      moq: 5000,
      leadTime: 7,
      probability: 40,
      expectedCloseDate: '2026-06-30',
      products: [
        { productId: 'prod_4', name: 'Custom Molded Gaskets', sku: 'CMG-240', quantity: 10000, unitPrice: 65 }
      ],
      assignedTo: 'usr_bda_2',
      competitors: [],
      isRecurring: false,
      capacityLinked: false,
      notes: 'RFQ pricing sent. Distributor is verifying current dealer stock positions and will confirm catalog uptake.',
      attachments: [],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const rfqs: RFQ[] = [
    {
      _id: 'rfq_1',
      rfqNumber: 'RFQ-2026-001',
      title: 'HDC-982 Procurement for L&T Defense',
      client: 'cli_3',
      lead: 'lead_3',
      items: [
        { description: 'Double acting high length stroke cylinder', sku: 'HDC-982', quantity: 400, unit: 'pieces', targetPrice: 26000, offeredPrice: 28000, leadTime: 30, moq: 10 }
      ],
      version: 1,
      status: 'under_review',
      validUntil: '2026-07-01',
      terms: '90 days interest-free commercial credit, pricing inclusive of Surat delivery logistics.',
      internalNotes: 'Defense engineering margin is very high. Do not discount below INR 26,500.',
      assignedTo: 'usr_bda_2',
      sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'rfq_2',
      rfqNumber: 'RFQ-2026-002',
      title: 'Tata Motors Monthly Consignment Alternate',
      client: 'cli_1',
      items: [
        { description: 'Automotive alternators commercial specs', sku: 'AGA-505', quantity: 1000, unit: 'pieces', targetPrice: 8800, offeredPrice: 8500, leadTime: 21, moq: 100 }
      ],
      version: 2,
      status: 'accepted',
      validUntil: '2026-05-31',
      terms: 'Net 60 payment terms, EXW factory pricing.',
      assignedTo: 'usr_bda_1',
      sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      responseReceivedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'rfq_3',
      rfqNumber: 'RFQ-2026-003',
      title: 'Gears Supply Inquiry Lohia Corp',
      lead: 'lead_6',
      items: [
        { description: 'CNC spur steel mechanical gear elements', sku: 'PSG-102', quantity: 1200, unit: 'pieces', targetPrice: 3400, offeredPrice: 3800, leadTime: 14, moq: 200 }
      ],
      version: 1,
      status: 'sent',
      validUntil: '2026-06-25',
      terms: 'EXW dispatch with Net 30 payment terms.',
      internalNotes: 'Offered price is standard catalog. Client requested 10% volume discount.',
      assignedTo: 'usr_bda_1',
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const communications: Communication[] = [
    {
      _id: 'comm_1',
      type: 'call',
      direction: 'outbound',
      subject: 'IMTEX trade show lead follow up',
      body: 'I called Raghavan regarding hydraulic cylinders. He informed that the design committee is meeting this Thursday to finalize cylinder shaft specs.',
      summary: 'Call to discuss specs. Design team meets this Thursday.',
      lead: 'lead_1',
      contactName: 'Raghavan Iyer',
      contactPhone: '+91 80 2296 3111',
      duration: 8,
      outcome: 'positive',
      nextAction: 'Email the ISO certifications and material certificates for HDC-982.',
      nextActionDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      attachments: [],
      loggedBy: 'usr_bda_1',
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'comm_2',
      type: 'meeting',
      direction: 'outbound',
      subject: 'In-person Plant Visit and Technical Vetting',
      body: 'Hosted Tata Motors quality inspector team at our gear stamping and CNC setup. Inspector was highly satisfied with the calibrated heat treatment cycle charts.',
      summary: 'Plant audit with Tata Motors inspection squad passed cleanly with high marks.',
      client: 'cli_1',
      contactName: 'Sanjeev Deshmukh',
      duration: 120,
      outcome: 'positive',
      loggedBy: 'usr_bda_1',
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'comm_3',
      type: 'email',
      direction: 'outbound',
      subject: 'Escorts Kubota gear catalog dispatch',
      body: 'Shared detailed dimensional specs and standard load curves of PSG-102 gears. Offered to jump on a quick Zoom call to answer torque curve questions.',
      summary: 'Emailed technical dimensional spec PDFs for gear interest list.',
      lead: 'lead_2',
      contactName: 'Devendra Singh',
      contactEmail: 'devendra.singh@escorts.co.in',
      outcome: 'neutral',
      loggedBy: 'usr_bda_1',
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const activities: Activity[] = [
    {
      _id: generateId(),
      type: 'system',
      description: 'System database initialized with mock manufacturing seed dataset.',
      performedBy: 'usr_admin',
      createdAt: new Date().toISOString()
    },
    {
      _id: generateId(),
      type: 'stage_change',
      description: 'Lead stage changed from "Qualified" to "RFQ Sent".',
      lead: 'lead_4',
      performedBy: 'usr_bda_1',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: generateId(),
      type: 'rfq',
      description: 'Created RFQ-2026-003 for gears inquiry Lohia Corp.',
      lead: 'lead_6',
      performedBy: 'usr_bda_1',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Connect Lead activities Array back to the matching activity IDs
  leads.forEach(l => {
    l.activities = activities.filter(a => a.lead === l._id).map(a => a._id);
  });

  db = {
    users,
    products,
    clients,
    leads,
    deals,
    rfqs,
    communications,
    activities
  };

  saveDB();
}

// Data exposure methods modeled like MongoDB Query APIs
export const DB = {
  getUsers: () => { loadDB(); return db.users; },
  getProducts: () => { loadDB(); return db.products; },
  getClients: () => { loadDB(); return db.clients; },
  getLeads: () => { loadDB(); return db.leads; },
  getDeals: () => { loadDB(); return db.deals; },
  getRfqs: () => { loadDB(); return db.rfqs; },
  getCommunications: () => { loadDB(); return db.communications; },
  getActivities: () => { loadDB(); return db.activities; },

  user: {
    find: () => { loadDB(); return db.users; },
    findById: (id: string) => { loadDB(); return db.users.find(u => u._id === id); },
    findByEmail: (email: string) => { loadDB(); return db.users.find(u => u.email === email); },
    create: (data: Partial<User>) => {
      loadDB();
      const user: User = {
        _id: generateId(),
        name: data.name || '',
        email: data.email || '',
        passwordHash: data.passwordHash || 'password123',
        role: data.role || 'bda',
        phone: data.phone,
        department: data.department,
        quota: data.quota || { monthly: 2000000, quarterly: 6000000 },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };
      db.users.push(user);
      saveDB();
      return user;
    },
    update: (id: string, data: Partial<User>) => {
      loadDB();
      const idx = db.users.findIndex(u => u._id === id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...data, updatedAt: new Date().toISOString() };
        saveDB();
        return db.users[idx];
      }
      return null;
    },
    delete: (id: string) => {
      loadDB();
      const idx = db.users.findIndex(u => u._id === id);
      if (idx !== -1) {
        db.users.splice(idx, 1);
        saveDB();
        return true;
      }
      return false;
    }
  },

  lead: {
    find: () => { loadDB(); return db.leads; },
    findById: (id: string) => { loadDB(); return db.leads.find(l => l._id === id); },
    create: (data: Partial<Lead>) => {
      loadDB();
      const lead: Lead = {
        _id: 'lead_' + generateId().split('_')[1],
        companyName: data.companyName || '',
        contactName: data.contactName || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        designation: data.designation,
        industry: data.industry,
        city: data.city,
        state: data.state,
        country: data.country || 'India',
        leadSource: data.leadSource || 'linkedin',
        stage: data.stage || 'new',
        priority: data.priority || 'warm',
        score: data.score !== undefined ? data.score : 50,
        estimatedValue: data.estimatedValue || 0,
        currency: data.currency || 'INR',
        moq: data.moq || 100,
        productInterest: data.productInterest || [],
        assignedTo: data.assignedTo || 'usr_bda_1',
        nextFollowUp: data.nextFollowUp,
        lostReason: data.lostReason,
        tags: data.tags || [],
        notes: data.notes,
        activities: [],
        createdBy: data.createdBy || 'usr_manager',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.leads.push(lead);
      saveDB();
      return lead;
    },
    update: (id: string, data: Partial<Lead>) => {
      loadDB();
      const idx = db.leads.findIndex(l => l._id === id);
      if (idx !== -1) {
        db.leads[idx] = { ...db.leads[idx], ...data, updatedAt: new Date().toISOString() };
        saveDB();
        return db.leads[idx];
      }
      return null;
    },
    delete: (id: string) => {
      loadDB();
      const idx = db.leads.findIndex(l => l._id === id);
      if (idx !== -1) {
        db.leads.splice(idx, 1);
        saveDB();
        return true;
      }
      return false;
    }
  },

  client: {
    find: () => { loadDB(); return db.clients; },
    findById: (id: string) => { loadDB(); return db.clients.find(c => c._id === id); },
    create: (data: Partial<Client>) => {
      loadDB();
      const client: Client = {
        _id: 'cli_' + generateId().split('_')[1],
        companyName: data.companyName || '',
        gstin: data.gstin,
        pan: data.pan,
        type: data.type || 'direct',
        industry: data.industry,
        website: data.website,
        billingAddress: data.billingAddress || { street: '', city: '', state: '', pincode: '', country: 'India' },
        primaryContact: data.primaryContact || { name: '', email: '', phone: '', designation: '' },
        contacts: data.contacts || [],
        accountManager: data.accountManager || 'usr_bda_1',
        totalRevenue: data.totalRevenue || 0,
        creditLimit: data.creditLimit || 1000000,
        paymentTerms: data.paymentTerms || 'Net 30',
        status: data.status || 'active',
        documents: data.documents || [],
        tags: data.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.clients.push(client);
      saveDB();
      return client;
    },
    update: (id: string, data: Partial<Client>) => {
      loadDB();
      const idx = db.clients.findIndex(c => c._id === id);
      if (idx !== -1) {
        db.clients[idx] = { ...db.clients[idx], ...data, updatedAt: new Date().toISOString() };
        saveDB();
        return db.clients[idx];
      }
      return null;
    },
    delete: (id: string) => {
      loadDB();
      const idx = db.clients.findIndex(c => c._id === id);
      if (idx !== -1) {
        db.clients.splice(idx, 1);
        saveDB();
        return true;
      }
      return false;
    }
  },

  deal: {
    find: () => { loadDB(); return db.deals; },
    findById: (id: string) => { loadDB(); return db.deals.find(d => d._id === id); },
    create: (data: Partial<Deal>) => {
      loadDB();
      const deal: Deal = {
        _id: 'deal_' + generateId().split('_')[1],
        dealName: data.dealName || '',
        client: data.client,
        lead: data.lead,
        stage: data.stage || 'proposal',
        value: data.value || 0,
        currency: data.currency || 'INR',
        moq: data.moq || 100,
        leadTime: data.leadTime || 14,
        probability: data.probability || 20,
        expectedCloseDate: data.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        products: data.products || [],
        assignedTo: data.assignedTo || 'usr_bda_1',
        competitors: data.competitors || [],
        winReason: data.winReason,
        lostReason: data.lostReason,
        isRecurring: data.isRecurring || false,
        recurringValue: data.recurringValue,
        capacityLinked: data.capacityLinked || false,
        notes: data.notes,
        attachments: data.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.deals.push(deal);
      saveDB();
      return deal;
    },
    update: (id: string, data: Partial<Deal>) => {
      loadDB();
      const idx = db.deals.findIndex(d => d._id === id);
      if (idx !== -1) {
        db.deals[idx] = { ...db.deals[idx], ...data, updatedAt: new Date().toISOString() };
        saveDB();
        return db.deals[idx];
      }
      return null;
    },
    delete: (id: string) => {
      loadDB();
      const idx = db.deals.findIndex(d => d._id === id);
      if (idx !== -1) {
        db.deals.splice(idx, 1);
        saveDB();
        return true;
      }
      return false;
    }
  },

  rfq: {
    find: () => { loadDB(); return db.rfqs; },
    findById: (id: string) => { loadDB(); return db.rfqs.find(r => r._id === id); },
    create: (data: Partial<RFQ>) => {
      loadDB();
      // Generate unique rfqNumber
      const rfqNum = 'RFQ-2026-' + String(db.rfqs.length + 1).padStart(3, '0');
      const rfq: RFQ = {
        _id: 'rfq_' + generateId().split('_')[1],
        rfqNumber: rfqNum,
        title: data.title || 'Product Sourcing Quote',
        client: data.client,
        lead: data.lead,
        items: data.items || [],
        version: data.version || 1,
        status: data.status || 'draft',
        validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        terms: data.terms,
        internalNotes: data.internalNotes,
        assignedTo: data.assignedTo || 'usr_bda_1',
        approvedBy: data.approvedBy,
        sentAt: data.sentAt,
        attachments: data.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.rfqs.push(rfq);
      saveDB();
      return rfq;
    },
    update: (id: string, data: Partial<RFQ>) => {
      loadDB();
      const idx = db.rfqs.findIndex(r => r._id === id);
      if (idx !== -1) {
        db.rfqs[idx] = { ...db.rfqs[idx], ...data, updatedAt: new Date().toISOString() };
        saveDB();
        return db.rfqs[idx];
      }
      return null;
    },
    delete: (id: string) => {
      loadDB();
      const idx = db.rfqs.findIndex(r => r._id === id);
      if (idx !== -1) {
        db.rfqs.splice(idx, 1);
        saveDB();
        return true;
      }
      return false;
    }
  },

  communication: {
    find: () => { loadDB(); return db.communications; },
    findById: (id: string) => { loadDB(); return db.communications.find(c => c._id === id); },
    create: (data: Partial<Communication>) => {
      loadDB();
      const comm: Communication = {
        _id: 'comm_' + generateId().split('_')[1],
        type: data.type || 'call',
        direction: data.direction || 'outbound',
        subject: data.subject || '',
        body: data.body || '',
        summary: data.summary,
        lead: data.lead,
        client: data.client,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        duration: data.duration,
        outcome: data.outcome || 'neutral',
        nextAction: data.nextAction,
        nextActionDate: data.nextActionDate,
        attachments: data.attachments || [],
        loggedBy: data.loggedBy || 'usr_bda_1',
        scheduledAt: data.scheduledAt,
        completedAt: data.completedAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.communications.push(comm);
      saveDB();
      return comm;
    },
    update: (id: string, data: Partial<Communication>) => {
      loadDB();
      const idx = db.communications.findIndex(c => c._id === id);
      if (idx !== -1) {
        db.communications[idx] = { ...db.communications[idx], ...data, updatedAt: new Date().toISOString() };
        saveDB();
        return db.communications[idx];
      }
      return null;
    },
    delete: (id: string) => {
      loadDB();
      const idx = db.communications.findIndex(c => c._id === id);
      if (idx !== -1) {
        db.communications.splice(idx, 1);
        saveDB();
        return true;
      }
      return false;
    }
  },

  activity: {
    find: () => { loadDB(); return db.activities; },
    create: (data: Partial<Activity>) => {
      loadDB();
      const activity: Activity = {
        _id: generateId(),
        type: data.type || 'note',
        description: data.description || '',
        metadata: data.metadata,
        lead: data.lead,
        client: data.client,
        deal: data.deal,
        performedBy: data.performedBy || 'usr_bda_1',
        createdAt: new Date().toISOString()
      };
      db.activities.push(activity);

      // Append activity reference to Lead if it exists
      if (activity.lead) {
        const leadIdx = db.leads.findIndex(l => l._id === activity.lead);
        if (leadIdx !== -1) {
          if (!db.leads[leadIdx].activities) db.leads[leadIdx].activities = [];
          db.leads[leadIdx].activities.unshift(activity._id);
        }
      }

      saveDB();
      return activity;
    }
  },

  product: {
    find: () => { loadDB(); return db.products; },
    findById: (id: string) => { loadDB(); return db.products.find(p => p._id === id); },
    create: (data: Partial<Product>) => {
      loadDB();
      const product: Product = {
        _id: 'prod_' + generateId().split('_')[1],
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        description: data.description || '',
        basePrice: data.basePrice || 0,
        currency: data.currency || 'INR',
        moq: data.moq || 1,
        unit: data.unit || 'pieces',
        leadTime: data.leadTime || 14,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.products.push(product);
      saveDB();
      return product;
    },
    update: (id: string, data: Partial<Product>) => {
      loadDB();
      const idx = db.products.findIndex(p => p._id === id);
      if (idx !== -1) {
        db.products[idx] = { ...db.products[idx], ...data, updatedAt: new Date().toISOString() };
        saveDB();
        return db.products[idx];
      }
      return null;
    },
    delete: (id: string) => {
      loadDB();
      const idx = db.products.findIndex(p => p._id === id);
      if (idx !== -1) {
        db.products.splice(idx, 1);
        saveDB();
        return true;
      }
      return false;
    }
  }
};

// Auto initialize on load
loadDB();
