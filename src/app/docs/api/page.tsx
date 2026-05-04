import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "API Documentation | NaijaTransfer",
  description: "NaijaTransfer public API for developers. Upload files, manage transfers, and integrate file sharing into your products.",
};

const BASE = "https://naijatransfer.com";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/transfers",
    description: "Create a new transfer",
    body: `{
  "senderEmail": "you@example.com",
  "recipientEmails": ["recipient@example.com"],
  "message": "Here are the files",
  "expiryDays": 7,
  "downloadLimit": 50
}`,
    response: `{
  "data": {
    "id": "clx...",
    "shortCode": "zJdAPV4v6a",
    "tusEndpoint": "/api/upload/tus",
    "downloadUrl": "${BASE}/d/zJdAPV4v6a",
    "expiresAt": "2026-04-06T10:00:00Z"
  }
}`,
  },
  {
    method: "POST",
    path: "/api/upload/file",
    description: "Upload a file to a transfer (multipart/form-data)",
    body: `FormData:
  transferId: "clx..."
  file: (binary)`,
    response: `{
  "data": {
    "fileId": "abc123",
    "name": "document.pdf",
    "size": 5242880,
    "storageKey": "transfers/clx.../abc123/document.pdf"
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/transfers",
    description: "List your transfers",
    body: null,
    response: `{
  "data": {
    "transfers": [...],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/transfers/:id",
    description: "Get transfer details",
    body: null,
    response: `{
  "data": {
    "id": "clx...",
    "shortCode": "zJdAPV4v6a",
    "status": "ACTIVE",
    "downloadCount": 5,
    "totalSizeBytes": 15728640,
    "files": [...]
  }
}`,
  },
  {
    method: "DELETE",
    path: "/api/v1/transfers/:id",
    description: "Delete a transfer and all its files",
    body: null,
    response: `{ "data": { "deleted": true } }`,
  },
];

export default function ApiDocsPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-h1 sm:text-display font-bold mb-3">API Documentation</h1>
          <p className="text-body text-[var(--text-secondary)] max-w-2xl">
            Integrate NaijaTransfer into your applications. Upload files, create transfers, and manage downloads programmatically.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-h2 font-bold mb-4">Quick Start</h2>
          <Card padding="lg" elevation="sm">
            <div className="space-y-4">
              <div>
                <h3 className="text-body font-semibold mb-2">1. Get an API key</h3>
                <p className="text-body-sm text-[var(--text-secondary)]">
                  Sign in to your <a href="/dashboard" className="text-nigerian-green hover:underline">dashboard</a> and create an API key under Settings.
                </p>
              </div>
              <div>
                <h3 className="text-body font-semibold mb-2">2. Authenticate</h3>
                <p className="text-body-sm text-[var(--text-secondary)] mb-2">Include your API key in the Authorization header:</p>
                <CodeBlock code={`Authorization: Bearer ntk_your_api_key_here`} />
              </div>
              <div>
                <h3 className="text-body font-semibold mb-2">3. Create a transfer</h3>
                <CodeBlock code={`curl -X POST ${BASE}/api/v1/transfers \\
  -H "Authorization: Bearer ntk_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"expiryDays": 7, "downloadLimit": 50}'`} />
              </div>
              <div>
                <h3 className="text-body font-semibold mb-2">4. Upload files</h3>
                <CodeBlock code={`curl -X POST "${BASE}/api/upload/file?transferId=YOUR_TRANSFER_ID" \\
  -H "Authorization: Bearer ntk_your_api_key" \\
  -H "Content-Type: application/pdf" \\
  -H "X-File-Name: myfile.pdf" \\
  -H "X-File-Size: $(stat -f%z ./myfile.pdf)" \\
  --data-binary @./myfile.pdf`} />
              </div>
            </div>
          </Card>
        </section>

        {/* Authentication */}
        <section className="mb-12">
          <h2 className="text-h2 font-bold mb-4">Authentication</h2>
          <p className="text-body text-[var(--text-secondary)] mb-4">
            All API v1 endpoints require an API key. Pass it as a Bearer token:
          </p>
          <CodeBlock code={`fetch("${BASE}/api/v1/transfers", {
  headers: {
    "Authorization": "Bearer ntk_your_api_key",
    "Content-Type": "application/json"
  }
})`} />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Card padding="sm" elevation="sm">
              <p className="text-body-sm font-semibold">Free</p>
              <p className="text-caption-style text-[var(--text-muted)]">1,000 requests/month</p>
            </Card>
            <Card padding="sm" elevation="sm">
              <p className="text-body-sm font-semibold text-nigerian-green">Pro</p>
              <p className="text-caption-style text-[var(--text-muted)]">50,000 requests/month</p>
            </Card>
            <Card padding="sm" elevation="sm">
              <p className="text-body-sm font-semibold text-gold-600">Business</p>
              <p className="text-caption-style text-[var(--text-muted)]">Unlimited</p>
            </Card>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-h2 font-bold mb-6">Endpoints</h2>
          <div className="space-y-6">
            {endpoints.map((ep, i) => (
              <Card key={i} padding="lg" elevation="sm">
                <div className="flex items-center gap-3 mb-3 overflow-x-auto">
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    ep.method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : ep.method === "POST" ? "bg-nigerian-green/10 text-nigerian-green"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {ep.method}
                  </span>
                  <code className="text-body-sm font-mono whitespace-nowrap">{ep.path}</code>
                </div>
                <p className="text-body-sm text-[var(--text-secondary)] mb-3">{ep.description}</p>

                {ep.body && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Request</p>
                    <CodeBlock code={ep.body} />
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Response</p>
                  <CodeBlock code={ep.response} />
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Error Codes */}
        <section className="mb-12">
          <h2 className="text-h2 font-bold mb-4">Error Codes</h2>
          <Card padding="lg" elevation="sm">
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-2 pr-4 font-semibold whitespace-nowrap">Code</th>
                    <th className="text-left py-2 pr-4 font-semibold whitespace-nowrap">HTTP</th>
                    <th className="text-left py-2 font-semibold whitespace-nowrap">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--text-secondary)]">
                  {[
                    ["UNAUTHORIZED", "401", "Missing or invalid API key"],
                    ["VALIDATION_ERROR", "400", "Invalid request body"],
                    ["NOT_FOUND", "404", "Transfer not found"],
                    ["DAILY_LIMIT_REACHED", "429", "Daily transfer limit exceeded"],
                    ["UPLOAD_FAILED", "500", "File upload error"],
                    ["INTERNAL_ERROR", "500", "Server error"],
                  ].map(([code, http, desc]) => (
                    <tr key={code} className="border-b border-[var(--border-color)]">
                      <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap">{code}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{http}</td>
                      <td className="py-2">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* JavaScript Example */}
        <section className="mb-12">
          <h2 className="text-h2 font-bold mb-4">JavaScript Example</h2>
          <CodeBlock code={`// Create a transfer and upload a file
const API_KEY = "ntk_your_api_key";
const BASE_URL = "${BASE}";

// Step 1: Create transfer
const transfer = await fetch(\`\${BASE_URL}/api/v1/transfers\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    expiryDays: 7,
    downloadLimit: 100,
  }),
}).then(r => r.json());

console.log("Download URL:", transfer.data.downloadUrl);

// Step 2: Upload file — stream the body, don't wrap in FormData.
const file = fileInput.files[0];
await fetch(\`\${BASE_URL}/api/upload/file?transferId=\${transfer.data.id}\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": file.type || "application/octet-stream",
    "X-File-Name": encodeURIComponent(file.name),
    "X-File-Size": String(file.size),
  },
  body: file,
  duplex: "half",
});

console.log("File uploaded!");`} />
        </section>

        {/* Rate Limits */}
        <section>
          <h2 className="text-h2 font-bold mb-4">Rate Limits</h2>
          <p className="text-body text-[var(--text-secondary)] mb-4">
            API requests are rate-limited per API key. If you exceed the limit, you&apos;ll receive a <code className="text-xs bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">429</code> response.
            Upgrade your plan for higher limits.
          </p>
          <Card padding="md" elevation="sm">
            <p className="text-body-sm text-[var(--text-secondary)]">
              Need higher limits or a custom integration?{" "}
              <a href="/contact" className="text-nigerian-green hover:underline font-medium">Contact us</a>
            </p>
          </Card>
        </section>
      </div>
    </PageLayout>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-charcoal-800 text-green-100 text-xs font-mono p-4 rounded-xl overflow-x-auto leading-relaxed">
      <code>{code}</code>
    </pre>
  );
}
