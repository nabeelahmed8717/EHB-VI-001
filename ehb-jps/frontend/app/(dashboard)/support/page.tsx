'use client';

import { HelpCircle, Mail, ExternalLink } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I get my profile verified?',
    a: 'Create a profile, fill in your details, then click "Submit for SQ". PSS will review your profile and assign an SQ level within 24–48 hours.',
  },
  {
    q: 'Can I have multiple profiles?',
    a: 'Yes. You can have one profile per role type — Worker, Employer, Freelancer, Trainer, and Recruiter.',
  },
  {
    q: 'What does "Resubmit Required" mean?',
    a: 'PSS reviewed your profile but needs additional information or corrections. Update your profile details and resubmit.',
  },
  {
    q: 'What is an SQ Level?',
    a: 'SQ (Service Quality) Levels are assigned by PSS after verification. Higher levels indicate greater trust and unlock more features across EHB platforms.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Account deletion is managed through EHB Main. You can delete individual profiles from the profile detail page while they are in Draft or Rejected status.',
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Support</h2>
        <p className="text-sm text-gray-500 mt-0.5">Frequently asked questions and contact info.</p>
      </div>

      {/* FAQs */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-card divide-y divide-gray-50">
        <div className="px-6 py-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Frequently Asked Questions</h3>
        </div>
        {FAQS.map((faq, i) => (
          <div key={i} className="px-6 py-4 space-y-1.5">
            <p className="text-sm font-medium text-gray-800">{faq.q}</p>
            <p className="text-sm text-gray-500">{faq.a}</p>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-card divide-y divide-gray-50">
        <div className="px-6 py-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-gray-600">
            For issues not covered here, reach out to EHB support.
          </p>
          <a
            href="mailto:support@ehb.com"
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:underline"
          >
            support@ehb.com
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
