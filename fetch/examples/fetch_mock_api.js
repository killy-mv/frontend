fetch ('https://jsonplaceholder.typicode.com/posts/1')
  .then(response => response.json())
  .then(data => {
    console.log('Post ID:', data.id);
    console.log('Title:', data.title);
    console.log('Body:', data.body);
  });

// Run this with Node.js or in a browser environment that supports the Fetch API. The code fetches a post from the JSONPlaceholder API and logs the post ID, title, and body to the console.