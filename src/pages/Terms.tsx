import React, { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, FileText } from 'lucide-react';
import { KinomaLogo } from '../components/ui/KinomaLogo';
import { updateSEO } from '../lib/seo';

const SECTIONS = [
  {
    title: 'Agreement to These Terms',
    body: [
      'Welcome to Kinoma. By accessing or using the Kinoma website, applications, or related services, you agree to these Terms of Service. If you do not agree with these terms, please do not use Kinoma.',
      'These terms apply to your use of the service and to any features made available through Kinoma from time to time.'
    ]
  },
  {
    title: 'Use of the Service',
    body: [
      'Kinoma is provided for personal, lawful use. You agree to use the service in accordance with applicable laws and these terms.',
      'You must not attempt to interfere with the operation of Kinoma, bypass access controls, abuse automated systems, or use the service to distribute malicious code or unlawful material.'
    ]
  },
  {
    title: 'Accounts',
    body: [
      'Some features may require an account. You are responsible for keeping your account information accurate and for protecting credentials associated with your account.',
      'If you believe your account has been accessed without authorization, you should take reasonable steps to secure it and contact Kinoma through the available support channel.'
    ]
  },
  {
    title: 'Content and Third-Party Services',
    body: [
      'Kinoma may display information, artwork, metadata, links, or playback functionality supplied by or connected to third-party services. Third-party services may have their own terms, privacy policies, availability, and content rules.',
      'Kinoma does not grant ownership of third-party content to users. Your use of a third-party service may be subject to that provider’s separate terms.'
    ]
  },
  {
    title: 'Intellectual Property',
    body: [
      'The Kinoma name, interface, branding, original graphics, software, and other Kinoma-created materials are protected by applicable intellectual-property laws.',
      'Except where expressly permitted, you may not copy, modify, redistribute, reverse engineer, or create derivative works from Kinoma’s proprietary materials.'
    ]
  },
  {
    title: 'Availability and Changes',
    body: [
      'Kinoma may add, change, suspend, or remove features at any time. Service availability can also depend on network conditions and third-party services.',
      'We may update these Terms when the service or applicable requirements change. The updated version becomes effective when published on this page unless a different effective date is stated.'
    ]
  },
  {
    title: 'Disclaimers',
    body: [
      'Kinoma is provided on an as-available basis. We do not guarantee that every feature, title, stream, metadata record, or external service will always be available, accurate, complete, or uninterrupted.',
      'To the extent permitted by applicable law, Kinoma disclaims warranties that are not expressly stated in these terms.'
    ]
  },
  {
    title: 'Limitation of Liability',
    body: [
      'To the extent permitted by applicable law, Kinoma and its operators will not be responsible for indirect, incidental, special, consequential, or similar losses arising from your use of, or inability to use, the service.',
      'Nothing in these terms limits liability where applicable law does not permit that limitation.'
    ]
  },
  {
    title: 'Privacy',
    body: [
      'Your use of Kinoma may also be subject to our privacy practices. Information about how personal information is handled should be read together with the applicable privacy notice provided by Kinoma.'
    ]
  },
  {
    title: 'Contact and Questions',
    body: [
      'If you have a question about these Terms of Service or need to report a service issue, use the contact method made available by Kinoma.'
    ]
  }
];

export function Terms() {
  useEffect(() => {
    updateSEO({
      title: 'Terms of Service',
      description: 'Read the Kinoma Terms of Service and usage guidelines.',
      canonicalUrl: window.location.origin + '/terms',
      type: 'website',
      image: '/icon.svg',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Kinoma Terms of Service',
        url: window.location.origin + '/terms',
        description: 'Kinoma Terms of Service and usage guidelines.'
      }
    });
  }, []);

  return (
    <div className="kinoma-terms">
      <header className="kinoma-terms__header">
        <Link href="/home" aria-label="Back to Kinoma home" className="kinoma-terms__brand">
          <KinomaLogo size="md" variant="full" />
        </Link>
        <Link href="/home" className="kinoma-terms__back">
          <ArrowLeft className="h-4 w-4" />
          Back to Kinoma
        </Link>
      </header>

      <main className="kinoma-terms__main">
        <div className="kinoma-terms__intro">
          <div className="kinoma-terms__icon" aria-hidden="true">
            <FileText className="h-5 w-5" />
          </div>
          <p>LEGAL</p>
          <h1>Terms of Service</h1>
          <span>These terms explain the basic rules for using Kinoma.</span>
        </div>

        <article className="kinoma-terms__document">
          {SECTIONS.map((section, index) => (
            <section key={section.title} className="kinoma-terms__section">
              <div className="kinoma-terms__number">0{index + 1}</div>
              <div>
                <h2>{section.title}</h2>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </article>
      </main>

      <footer className="kinoma-terms__footer">
        <KinomaLogo size="sm" variant="full" />
        <span>Kinoma Terms of Service</span>
        <Link href="/home">Home</Link>
      </footer>
    </div>
  );
}
