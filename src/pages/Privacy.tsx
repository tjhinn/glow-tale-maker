import { PageWrapper } from "@/components/layout/PageWrapper";

const Privacy = () => {
  return (
    <PageWrapper>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 text-center">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground text-center mb-10">Last updated: May 10, 2026</p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">1. Who We Are</h2>
            <p>
              ArtBookMagic (“we”, “us”) creates personalized AI-illustrated storybooks for children. Protecting
              your family’s privacy is fundamental to our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account & order:</strong> your email address and order details.</li>
              <li><strong>Personalization details:</strong> the child’s first name, gender, pet type and name, favorite color, and city.</li>
              <li><strong>Photo:</strong> a single photo of the child you upload to be turned into the storybook hero.</li>
              <li><strong>Payment data:</strong> handled directly by our payment processor (LemonSqueezy). We never see or store full card details.</li>
              <li><strong>Technical data:</strong> basic logs (IP address, browser, timestamps) for security and debugging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To generate and deliver your personalized storybook.</li>
              <li>To process your payment and send order confirmations.</li>
              <li>To respond to support inquiries.</li>
              <li>To prevent abuse and keep the Service safe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">4. AI Processing</h2>
            <p>
              Photos and personalization details are sent to our AI provider strictly to generate the storybook
              illustrations. We do not permit your data to be used for training third-party AI models.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">5. Data Retention</h2>
            <p>
              Uploaded photos are stored only as long as necessary to fulfill your order and provide post-purchase
              support. Order records (without the original photo) may be kept for accounting and legal purposes. You
              can request deletion at any time — see Section 8.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">6. Children’s Privacy</h2>
            <p>
              Our Service is intended to be purchased by parents and legal guardians, not children. We do not
              knowingly collect data directly from children. By submitting information about a child, you confirm
              that you are their parent or guardian and consent to our processing of that information solely to
              create their storybook.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">7. Sharing With Third Parties</h2>
            <p>We share data only with the service providers needed to run the Service:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>LemonSqueezy</strong> — payment processing.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
              <li><strong>Lovable Cloud</strong> — secure hosting, database, and storage.</li>
              <li><strong>AI providers</strong> — generating illustrations from your photo.</li>
            </ul>
            <p className="mt-2">We never sell your data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">8. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any time by emailing{" "}
              <a className="text-primary underline" href="mailto:support@artbookmagic.com">
                support@artbookmagic.com
              </a>. Depending on where you live, you may have additional rights under GDPR, CCPA, or other privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">9. Security</h2>
            <p>
              We use industry-standard safeguards (encryption in transit, access controls, signed URLs for file
              access). No method of transmission or storage is 100% secure, but we work hard to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">10. International Transfers</h2>
            <p>
              Our service providers may process data outside your country. Where applicable, we rely on standard
              contractual clauses or equivalent safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The “Last updated” date above will reflect the
              most recent change.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">12. Contact</h2>
            <p>
              For privacy questions or requests, email{" "}
              <a className="text-primary underline" href="mailto:support@artbookmagic.com">
                support@artbookmagic.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Privacy;