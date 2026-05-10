import { PageWrapper } from "@/components/layout/PageWrapper";

const Refund = () => {
  return (
    <PageWrapper>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2 text-center">Refund Policy</h1>
        <p className="text-sm text-muted-foreground text-center mb-10">Last updated: May 10, 2026</p>

        <div className="space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">1. A Digital, Personalized Product</h2>
            <p>
              Each YourFairyTale.ai storybook is a one-of-a-kind digital product, custom-generated from the photo and
              details you submit. Because of this, we cannot offer refunds for change-of-mind once your storybook PDF
              has been delivered.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">2. Our 7-Day Quality Guarantee</h2>
            <p>
              If something went wrong with your order, we’ll make it right. Within <strong>7 days</strong> of delivery,
              you can request a free re-generation or a full refund if:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>your PDF failed to download or is corrupted;</li>
              <li>the personalization details (name, pet, city, etc.) are incorrect due to our error;</li>
              <li>the illustrations contain a major defect (e.g., missing pages, garbled text); or</li>
              <li>your order was never delivered.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">3. What Isn’t Covered</h2>
            <p>We can’t offer refunds for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>artistic preferences (e.g., wishing the AI had drawn a different hairstyle);</li>
              <li>typos or details that you submitted incorrectly during personalization;</li>
              <li>requests made more than 7 days after delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">4. How to Request a Refund</h2>
            <p>
              Email{" "}
              <a className="text-primary underline" href="mailto:support@yourfairytale.ai">
                support@yourfairytale.ai
              </a>{" "}
              from the address used to place the order. Include your order ID and a short description of the issue
              (screenshots help). We’ll reply within 2 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">5. Processing Time</h2>
            <p>
              Approved refunds are issued to the original payment method and typically appear within
              <strong> 5–10 business days</strong>, depending on your bank or card provider.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mb-3">6. Partial Refunds</h2>
            <p>
              In the rare case of a partial defect that we can’t fix to your satisfaction, we may offer a partial
              refund at our discretion.
            </p>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Refund;