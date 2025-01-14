# /pages README

This project uses Next.js with Clerk for authentication and theming support. Below is a brief explanation of the files in the `pages` directory.

## /pages Directory

- **_app.tsx**
  - Sets up global styles, authentication with Clerk, and theme toggling with `next-themes`.
  - Includes components like `ProfileAvatar` and `ModeToggle`.

- **_document.tsx**
  - Defines the HTML structure with `Head`, `Main`, and `NextScript` components to ensure proper rendering and script execution.

- **dashboard.tsx**
  - Displays the dashboard interface.
  - Includes the `SelectProject` component for project selection.

- **index.tsx**
  - Serves as the landing page with a simple heading.

- **sign-in Directory**
  - Contains the sign-in page using the `SignIn` component from Clerk for user authentication.

- **sign-up Directory**
  - Contains the sign-up page using the `SignUp` component from Clerk for user registration.
