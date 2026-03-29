import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const metadata: Metadata = {
  title: "Contact — NigeriaTransfer",
  description: "Get in touch with the NigeriaTransfer team.",
};

export default function ContactPage() {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-display font-bold mb-3 text-center">Contact Us</h1>
        <p className="text-body text-[var(--text-secondary)] text-center mb-8">
          Have a question, partnership inquiry, or feedback? We&apos;d love to hear from you.
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card padding="md" elevation="sm" className="text-center">
            <h3 className="text-body font-semibold mb-1">Email</h3>
            <a href="mailto:hello@nigeriatransfer.com" className="text-nigerian-green hover:underline text-body-sm">hello@nigeriatransfer.com</a>
          </Card>
          <Card padding="md" elevation="sm" className="text-center">
            <h3 className="text-body font-semibold mb-1">WhatsApp</h3>
            <a href="https://wa.me/2348000000000" className="text-nigerian-green hover:underline text-body-sm">Chat with us</a>
          </Card>
        </div>

        <Card padding="lg" elevation="md">
          <h2 className="text-h3 font-bold mb-4">Send a message</h2>
          <form className="space-y-4">
            <Input label="Name" placeholder="Your name" />
            <Input label="Email" type="email" placeholder="you@example.com" />
            <div>
              <label className="block text-body-sm font-medium mb-1">Message</label>
              <textarea className="w-full min-h-[120px] rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2 text-body-sm focus:border-nigerian-green focus:ring-2 focus:ring-nigerian-green/20 focus:outline-none" placeholder="How can we help?" />
            </div>
            <Button variant="primary" size="lg" fullWidth>Send Message</Button>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
}
