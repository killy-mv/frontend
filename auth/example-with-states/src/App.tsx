import { useState } from 'react'

function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  // One state at a time wins, and the order of these checks IS the priority.
  // loading is checked first: while we don't know yet, we never render the
  // logged-out screen. That is the whole point of having a loading state.
  if (loading) {
    return (
      <>
        <h1>Loading...</h1>
        <p>Asking the server who you are.</p>
        <button onClick={
          () => {
            setLoggedIn(true);
            setLoading(false);
          }
        }>Log in</button>
      </>
    )
  }

  if (error) {
    return (
      <>
        <h1>Something went wrong</h1>
        <p>We could not check your session.</p>
        <button onClick={() => {
          setError(false);
          setLoading(true);
        }}>Try again</button>
      </>
    )
  }

  if (loggedIn) {
    return (
      <>
        <h1>Welcome back</h1>
        <p>You are logged in.</p>
        <button onClick={() => setLoggedIn(false)}>Log out</button>
      </>
    )
  }

  // Nothing is true: the server said "no session". This is the anonymous state.
  return (
    <>
      <h1>You are logged out</h1>
      <p>Flip a state to see the other screens.</p>
      <button onClick={() => setLoading(true)}>Show loading</button>
      <button onClick={() => setError(true)}>Show error</button>
      <button onClick={() => setLoggedIn(true)}>Log in</button>
      <p>Note: This is a contrived example. 
        In a real app, you would not have buttons to flip the state. 
        You would log in using username and password and 
        if you entered correct credentials, the state will change automatically.</p>
      <p>The idea is when user have not logged in, 
        we will show the logged-out page, 
        redirect user to login page,
        or show user the logging page. 
        That is the whole point of auth in frontend.</p>
    </>
  )
}

export default App
