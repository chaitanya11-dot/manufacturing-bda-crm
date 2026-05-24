export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'bda';
  avatar?: string;
  phone?: string;
  department?: string;
  quota: { monthly: number; quarterly: number };
  isActive: boolean;
}

export interface Activity {
  _id: string;
  type: 'note' | 'stage_change' | 'assignment' | 'email' | 'call' | 'meeting' | 'rfq' | 'deal' | 'system';
  description: string;
  metadata?: any;
  lead?: string;
  client?: string;
  deal?: string;
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
  score: number;
  estimatedValue: number;
  currency: string;
  moq: number;
  productInterest: string[];
  assignedTo: string; // User ID
  nextFollowUp?: string; // Date ISO
  lostReason?: string;
  tags: string[];
  notes?: string;
  activities: string[];
  createdBy: string;
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
  probability: number;
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
  rfqNumber: string;
  title: string;
  client?: string;
  lead?: string;
  items: Array<{
    description: string;
    sku: string;
    quantity: number;
    unit: string;
    targetPrice?: number;
    offeredPrice?: number;
    leadTime?: number;
    moq?: number;
  }>;
  version: number;
  status: 'draft' | 'sent' | 'under_review' | 'revised' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  terms?: string;
  internalNotes?: string;
  assignedTo: string;
  approvedBy?: string;
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
  lead?: string;
  client?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  duration?: number;
  outcome: 'positive' | 'neutral' | 'negative' | 'no_answer';
  nextAction?: string;
  nextActionDate?: string;
  attachments?: Array<{ name: string; url: string }>;
  loggedBy: string; // User ID
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
  leadTime: number;
  isActive: boolean;
}
