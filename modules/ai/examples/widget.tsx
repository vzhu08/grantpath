'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';

const resultSchema = z.object({
  text: z.string().max(32_000),
  mode: z.enum(['fixture', 'live']),
  provider: z.string().max(100),
  model: z.string().max(200),
  costUsd: z.number().nonnegative().nullable(),
  limits: z.object({ liveCallsRemaining: z.number().int().min(0).max(3) }),
});
type Result = z.infer<typeof resultSchema>;

/** Browser-only example. Mount the matching server route at the same-origin endpoint. */
export function AIProcessingWidget({ endpoint = '/api/kit/ai' }: { endpoint?: string } = {}) {
  const id = useId();
  const [text, setText] = useState(
    'We want to help teammates choose one useful idea and build a working demo together.',
  );
  const [mode, setMode] = useState<'fixture' | 'live'>('fixture');
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Ready to try a fixed sample without provider usage.');
  const active = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (active.current || !text.trim() || (mode === 'live' && !confirmed)) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError('');
    setResult(null);
    setStatus(mode === 'fixture' ? 'Loading fixture preview…' : 'Requesting a live summary…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text, mode, confirmUsage: mode === 'live' && confirmed }),
        signal: controller.signal,
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const failure = z
          .object({ error: z.object({ message: z.string().max(500) }) })
          .safeParse(data);
        throw new Error(
          failure.success ? failure.data.error.message : 'The request failed. Try again.',
        );
      }
      const parsed = resultSchema.safeParse(data);
      if (!parsed.success) throw new Error('The server returned an invalid result. Try again.');
      if (active.current !== controller) return;
      setResult(parsed.data);
      setStatus(parsed.data.mode === 'fixture' ? 'Fixture preview ready.' : 'Live summary ready.');
    } catch (failure) {
      if (active.current !== controller || controller.signal.aborted) return;
      setError(failure instanceof Error ? failure.message : 'The request failed. Try again.');
      setStatus('The request did not complete.');
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(false);
        setConfirmed(false);
      }
    }
  }

  function cancel() {
    active.current?.abort();
    active.current = null;
    setPending(false);
    setConfirmed(false);
    setStatus(
      mode === 'live'
        ? 'Cancellation requested. Provider usage already started may still be billable.'
        : 'Fixture request cancelled.',
    );
  }

  return (
    <section className="workbench" aria-labelledby={`${id}-title`}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">OPTIONAL AI PROCESSING</p>
          <h2 id={`${id}-title`}>Give your idea a little clarity.</h2>
        </div>
        <span className="badge">
          {mode === 'fixture' ? 'Fixture · no provider usage' : 'Live · provider usage'}
        </span>
      </div>
      <form onSubmit={run}>
        <div className="editor-grid">
          <div>
            <label htmlFor={`${id}-mode`}>Processing mode</label>
            <select
              id={`${id}-mode`}
              value={mode}
              disabled={pending}
              onChange={(event) => {
                setMode(event.target.value as 'fixture' | 'live');
                setConfirmed(false);
                setResult(null);
                setError('');
                setStatus('Ready. Choose a mode and submit your input.');
              }}
            >
              <option value="fixture">Fixture — fixed sample, no external call</option>
              <option value="live">Live — summarize with the configured provider</option>
            </select>
            <p id={`${id}-help`}>
              {mode === 'fixture'
                ? 'This fixed sample demonstrates the interface. It does not analyze your text.'
                : 'Your text goes to the configured AI provider. Live mode must also be enabled on this local server. Cost depends on the provider and model.'}
            </p>
            <label htmlFor={`${id}-text`}>Your idea</label>
            <textarea
              id={`${id}-text`}
              value={text}
              maxLength={2_000}
              rows={6}
              disabled={pending}
              required
              aria-describedby={`${id}-help ${id}-count`}
              onChange={(event) => {
                setText(event.target.value);
                setConfirmed(false);
                setResult(null);
              }}
            />
            {mode === 'live' && (
              <label style={{ display: 'flex', alignItems: 'start', gap: 10, marginTop: 16 }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  disabled={pending}
                  style={{ width: 'auto' }}
                  onChange={(event) => setConfirmed(event.target.checked)}
                />
                I agree to send this text to the configured AI provider and approve any usage
                charges for this request.
              </label>
            )}
            <div className="editor-bottom" style={{ flexWrap: 'wrap' }}>
              <span id={`${id}-count`}>{text.length.toLocaleString()} / 2,000 characters</span>
              <button
                type="submit"
                disabled={pending || !text.trim() || (mode === 'live' && !confirmed)}
              >
                {pending ? 'Working…' : mode === 'fixture' ? 'Try fixture' : 'Summarize live'}
              </button>
              {pending && (
                <button type="button" className="secondary" onClick={cancel}>
                  Cancel
                </button>
              )}
            </div>
          </div>
          <div className="result" aria-live="polite" aria-busy={pending}>
            <p className="eyebrow">THE RESULT</p>
            {result ? (
              <>
                <span className="badge">
                  {result.mode === 'fixture' ? 'Fixture result' : 'Live result'}
                </span>
                <p className="output-text">
                  {result.text || 'The provider returned no text. Try a shorter input.'}
                </p>
                <p>
                  {result.provider} · {result.model}
                </p>
                <small>
                  {result.mode === 'fixture' ? 'No provider usage.' : 'Cost estimate unavailable.'}{' '}
                  {result.limits.liveCallsRemaining} live attempts remain in this server process.
                </small>
              </>
            ) : (
              <p className="empty">
                {pending ? 'Waiting for a result…' : 'Your result will appear here.'}
              </p>
            )}
          </div>
        </div>
        <p role="status">{status}</p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
      <small>
        Local example limits: 2,000 input characters, 128 output tokens, 15 seconds per generation,
        one active request and three live attempts per server process. Failed and cancelled live
        attempts count.
      </small>
    </section>
  );
}
