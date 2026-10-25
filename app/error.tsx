"use client";
export default function ErrorBoundary({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="hero" role="alert">
      <h1>Let’s try that again.</h1>
      <p>
        The page could not finish loading. Your saved work has not been changed.
      </p>
      <button onClick={reset}>Retry</button>
    </section>
  );
}
