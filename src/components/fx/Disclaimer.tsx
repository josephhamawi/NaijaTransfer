export default function Disclaimer() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 text-body-sm text-amber-900 dark:text-amber-200 space-y-2">
      <p>
        <strong className="font-semibold">Indicative rates only.</strong>{" "}
        Numbers shown are aggregated for information from publicly reported Bureau de Change quotes. They are not a dealing rate, not a quote, and not financial advice.
      </p>
      <p>
        NaijaTransfer does not trade foreign currency, set rates, or facilitate transactions. We aggregate publicly reported information. Actual rates vary by dealer, location, amount, and time of day.
      </p>
      <p>
        For official rates and policy updates, refer to the Central Bank of Nigeria at{" "}
        <a
          href="https://www.cbn.gov.ng"
          rel="noopener noreferrer external"
          target="_blank"
          className="underline"
        >
          cbn.gov.ng
        </a>
        . Always confirm with a licensed BDC (registered with{" "}
        <a
          href="https://abcon.org.ng"
          rel="noopener noreferrer external"
          target="_blank"
          className="underline"
        >
          ABCON
        </a>
        ) or your bank before transacting.
      </p>
    </div>
  );
}
