import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function App() {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Without this the browser does a full page reload on submit.
    event.preventDefault()

    const trimmed = value.trim()
    if (!trimmed) return

    setSubmitted(trimmed)
    setValue('')
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Echo</h1>
          <p className="text-sm text-muted-foreground">
            Type something
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <Input
            id="message"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Type something..."
            autoComplete="off"
          />
          <Button type="submit" disabled={value.trim() === ''}>
            Submit
          </Button>
        </form>

        {submitted === null ? (
          <p className="text-sm text-muted-foreground">Nothing submitted yet.</p>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
            <p className="text-xs font-medium text-muted-foreground">
              You submitted
            </p>
            <p className="mt-1 break-words">{submitted}</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default App
