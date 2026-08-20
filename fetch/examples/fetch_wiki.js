fetch('https://en.wikipedia.org/api/rest_v1/page/summary/JavaScript')
  .then(response => response.json())
  .then(data => {
    console.log('Title:', data.title);
    console.log('Extract:', data.extract);
  });

// Run this with Node.js or in a browser environment that supports the Fetch API. The code fetches a summary of the Wikipedia page for "JavaScript" and logs the title and extract to the console.